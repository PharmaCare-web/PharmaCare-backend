// Authentication controller
// Handles user registration, login, logout, and current user info

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { sendVerificationEmail } = require('../utils/emailService');

// Register new user
const register = async (req, res, next) => {
  try {
    const { full_name, email, password, role_id, branch_id } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM user WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role_id and branch_id exist
    const [roles] = await pool.execute('SELECT role_id FROM role WHERE role_id = ?', [role_id]);
    if (roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role_id'
      });
    }

    const [branches] = await pool.execute('SELECT branch_id FROM branch WHERE branch_id = ?', [branch_id]);
    if (branches.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch_id'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    // Insert new user with verification code
    // Try with verification fields first, fallback to basic insert if columns don't exist
    let result;
    try {
      [result] = await pool.execute(
        'INSERT INTO user (full_name, email, password, role_id, branch_id, verification_code, verification_code_expires, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [full_name, email, hashedPassword, role_id, branch_id, verificationCode, expirationTime, false]
      );
    } catch (insertError) {
      // If verification columns don't exist, insert without them
      if (insertError.code && insertError.code.startsWith('ER_BAD_FIELD')) {
        console.warn('Verification columns not found, registering without email verification');
        [result] = await pool.execute(
          'INSERT INTO user (full_name, email, password, role_id, branch_id) VALUES (?, ?, ?, ?, ?)',
          [full_name, email, hashedPassword, role_id, branch_id]
        );
      } else {
        throw insertError;
      }
    }

    // Get the created user with role and branch info
    // Try to include is_email_verified, but handle if column doesn't exist
    let users;
    try {
      [users] = await pool.execute(
        `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, u.created_at, 
                u.is_email_verified, r.role_name, b.branch_name 
         FROM user u 
         LEFT JOIN role r ON u.role_id = r.role_id 
         LEFT JOIN branch b ON u.branch_id = b.branch_id 
         WHERE u.user_id = ?`,
        [result.insertId]
      );
    } catch (selectError) {
      // If is_email_verified column doesn't exist, select without it
      if (selectError.code && selectError.code.startsWith('ER_BAD_FIELD')) {
        [users] = await pool.execute(
          `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, u.created_at, 
                  r.role_name, b.branch_name 
           FROM user u 
           LEFT JOIN role r ON u.role_id = r.role_id 
           LEFT JOIN branch b ON u.branch_id = b.branch_id 
           WHERE u.user_id = ?`,
          [result.insertId]
        );
      } else {
        throw selectError;
      }
    }

    const newUser = users[0];

    // Check if verification columns exist (by checking if is_email_verified was selected)
    const hasVerificationColumns = newUser.hasOwnProperty('is_email_verified');
    let emailSent = false;
    let registrationMessage = 'User registered successfully.';

    // Send verification email (only if verification columns exist and SMTP is configured)
    if (result.insertId && hasVerificationColumns) {
      try {
        // Only try to send email if SMTP is configured
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          await sendVerificationEmail(email, verificationCode, full_name);
          console.log(`✅ Verification code sent to ${email}`);
          emailSent = true;
          registrationMessage = 'User registered successfully. Please check your email for verification code.';
        } else {
          console.warn('⚠️  SMTP not configured - skipping email verification');
          console.warn('   Set SMTP_USER and SMTP_PASS in .env to enable email verification');
          registrationMessage = 'User registered successfully. Email verification is not configured.';
        }
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError.message);
        registrationMessage = 'User registered successfully. Failed to send verification email.';
        // Don't fail registration if email fails
      }
    }

    // Remove password and verification code from response
    const { password: _, verification_code: __, verification_code_expires: ___, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: registrationMessage,
      user: userWithoutPassword,
      requiresVerification: hasVerificationColumns && emailSent
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email with role and branch info
    const [users] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.password, u.role_id, u.branch_id, 
              u.is_active, u.is_email_verified, u.created_at, r.role_name, b.branch_name 
       FROM user u 
       LEFT JOIN role r ON u.role_id = r.role_id 
       LEFT JOIN branch b ON u.branch_id = b.branch_id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check if user is active
    if (user.is_active === false || user.is_active === 0) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified (only if is_email_verified column exists)
    if (user.is_email_verified !== undefined && user.is_email_verified !== null && !user.is_email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your email for the verification code.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, roleId: user.role_id, branchId: user.branch_id },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last login (wrap in try-catch to prevent errors if column doesn't exist)
    try {
      await pool.execute(
        'UPDATE user SET last_login = NOW() WHERE user_id = ?',
        [user.user_id]
      );
    } catch (updateError) {
      // Log but don't fail login if last_login update fails
      // Only log if it's a column error, ignore silently otherwise
      if (updateError.code && updateError.code.startsWith('ER_BAD_FIELD')) {
        // Column doesn't exist - this is fine, just don't log every time
        // console.warn('last_login column not found - this is optional');
      }
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// Get current user (protected route)
const getMe = async (req, res, next) => {
  try {
    // User is attached to req by auth middleware
    // Fetch fresh user data with role and branch info
    const [users] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, 
              u.is_active, u.created_at, u.last_login,
              r.role_name, b.branch_name, b.location 
       FROM user u 
       LEFT JOIN role r ON u.role_id = r.role_id 
       LEFT JOIN branch b ON u.branch_id = b.branch_id 
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    next(error);
  }
};

// Verify email with code
const verifyEmail = async (req, res, next) => {
  try {
    const { email, verification_code } = req.body;

    if (!email || !verification_code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Find user by email and verification code
    const [users] = await pool.execute(
      `SELECT user_id, email, verification_code, verification_code_expires, is_email_verified 
       FROM user 
       WHERE email = ? AND verification_code = ?`,
      [email, verification_code]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code or email'
      });
    }

    const user = users[0];

    // Check if already verified
    if (user.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check if verification code has expired
    const now = new Date();
    const expirationTime = new Date(user.verification_code_expires);

    if (now > expirationTime) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Verify the email
    await pool.execute(
      `UPDATE user 
       SET is_email_verified = TRUE, 
           verification_code = NULL, 
           verification_code_expires = NULL 
       WHERE user_id = ?`,
      [user.user_id]
    );

    // Get updated user with role and branch info
    const [updatedUsers] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, 
              u.is_email_verified, r.role_name, b.branch_name 
       FROM user u 
       LEFT JOIN role r ON u.role_id = r.role_id 
       LEFT JOIN branch b ON u.branch_id = b.branch_id 
       WHERE u.user_id = ?`,
      [user.user_id]
    );

    const verifiedUser = updatedUsers[0];

    // Generate JWT token for verified user
    const token = jwt.sign(
      { 
        userId: verifiedUser.user_id, 
        email: verifiedUser.email, 
        roleId: verifiedUser.role_id, 
        branchId: verifiedUser.branch_id 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = verifiedUser;

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Verify email error:', error);
    next(error);
  }
};

// Resend verification code
const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const [users] = await pool.execute(
      'SELECT user_id, email, full_name, is_email_verified FROM user WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Check if already verified
    if (user.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update verification code in database
    await pool.execute(
      'UPDATE user SET verification_code = ?, verification_code_expires = ? WHERE user_id = ?',
      [verificationCode, expirationTime, user.user_id]
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode, user.full_name);
      res.json({
        success: true,
        message: 'Verification code sent to your email'
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    next(error);
  }
};

// Logout user
const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // You can implement token blacklisting here if needed
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
  resendVerificationCode
};
