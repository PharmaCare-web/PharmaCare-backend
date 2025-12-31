// Authentication controller
// Handles users registration, login, logout, and current users info

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Register new users
// NOTE: Only Managers can register. Admin is hard-coded. Pharmacist/Cashier are created by Manager.
const register = async (req, res, next) => {
  try {
    const { full_name, email, password, role_id, branch_id, branch_name, location } = req.body;

    // Check if users already exists
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role_id exists
    const [roles] = await pool.execute('SELECT role_id, role_name FROM role WHERE role_id = ?', [role_id]);
    if (roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role_id'
      });
    }

    const role = roles[0];
    const isManager = role.role_name === 'Manager';

    // ONLY Managers can register through this endpoint
    // Admin is hard-coded in database
    // Pharmacist/Cashier are created by Manager via /api/manager/staff
    if (!isManager) {
      return res.status(403).json({
        success: false,
        message: 'Only Managers can register. Admin accounts are pre-configured. Pharmacist and Cashier accounts are created by Managers.'
      });
    }

    let finalBranchId = null;

    // Manager can create new branch OR join existing branch
    if (branch_name) {
      // Manager is creating a new branch
      // branch_id is NOT required when creating a new branch
      if (branch_id) {
        return res.status(400).json({
          success: false,
          message: 'Do not provide branch_id when creating a new branch. Only provide branch_name and location.'
        });
      }

      if (!location) {
        return res.status(400).json({
          success: false,
          message: 'location is required when creating a new branch'
        });
      }

      // Get default pharmacy_id (first pharmacy)
      const [pharmacies] = await pool.execute('SELECT pharmacy_id FROM pharmacy LIMIT 1');
      if (pharmacies.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No pharmacy found. Please create a pharmacy first.'
        });
      }
      const pharmacy_id = pharmacies[0].pharmacy_id;

      // Check if branch name already exists
      const [existingBranches] = await pool.execute(
        'SELECT branch_id FROM branch WHERE branch_name = ?',
        [branch_name]
      );

      if (existingBranches.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Branch with this name already exists. Please use an existing branch (provide branch_id) or choose a different name.'
        });
      }

      // Create new branch (created_by will be set after users is created)
      const [branchResult] = await pool.execute(
        'INSERT INTO branch (pharmacy_id, branch_name, location) VALUES (?, ?, ?) RETURNING *',
        [pharmacy_id, branch_name, location]
      );
      if (branchResult.length > 0) {
        finalBranchId = branchResult[0].branch_id || branchResult[0].id;
      }
    } else if (branch_id) {
      // Manager is joining an existing branch as a second/third manager
      // branch_id IS REQUIRED when joining an existing branch
      if (branch_name) {
        return res.status(400).json({
          success: false,
          message: 'Do not provide branch_name when joining an existing branch. Only provide branch_id.'
        });
      }

      // Validate that the branch exists
      const [branches] = await pool.execute(
        'SELECT branch_id, branch_name FROM branch WHERE branch_id = ?',
        [branch_id]
      );
      
      if (branches.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Branch with ID ${branch_id} not found. Please provide a valid branch_id.`
        });
      }

      // Branch exists - allow multiple managers per branch
      finalBranchId = branch_id;
      console.log(`✅ Manager joining existing branch: branch_id=${branch_id}, branch_name=${branches[0].branch_name}`);
    } else {
      // Neither branch_name nor branch_id provided
      return res.status(400).json({
        success: false,
        message: 'Manager registration requires either: (1) branch_name + location to create a new branch, OR (2) branch_id to join an existing branch as a second/third manager.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    // Managers are created as INACTIVE (pending admin activation)
    const isActive = false;

    // Insert new manager users
    // Manager is inactive until admin activates
    let createdUserId = null;
    try {
      const [inserted] = await pool.execute(
        `INSERT INTO users (
          full_name, email, password, role_id, branch_id, 
          is_active, verification_code, verification_code_expires, is_email_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING user_id`,
        [full_name, email, hashedPassword, role_id, finalBranchId, isActive, verificationCode, expirationTime, false]
      );
      if (inserted.length > 0) {
        createdUserId = inserted[0].user_id;
      }
    } catch (insertError) {
      // If verification columns don't exist, insert without them
      if (insertError.code && insertError.code.startsWith('ER_BAD_FIELD')) {
        console.warn('Verification columns not found, registering without email verification');
        const [insertedFallback] = await pool.execute(
          'INSERT INTO users (full_name, email, password, role_id, branch_id, is_active) VALUES (?, ?, ?, ?, ?, ?) RETURNING user_id',
          [full_name, email, hashedPassword, role_id, finalBranchId, isActive]
        );
        if (insertedFallback.length > 0) {
          createdUserId = insertedFallback[0].user_id;
        }
      } else {
        throw insertError;
      }
    }

    // Update branch.created_by if this manager created the branch
    if (branch_name && finalBranchId && createdUserId) {
      try {
        await pool.execute(
          'UPDATE branch SET created_by = ? WHERE branch_id = ?',
          [createdUserId, finalBranchId]
        );
      } catch (updateError) {
        // Log but don't fail registration if created_by column doesn't exist
        console.warn('Could not update branch.created_by:', updateError.message);
      }
    }

    // Get the created users with role and branch info
    // Try to include is_email_verified, but handle if column doesn't exist
    let userss;
    try {
      [userss] = await pool.execute(
        `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, u.created_at, 
                u.is_email_verified, r.role_name, b.branch_name 
         FROM users u 
         LEFT JOIN role r ON u.role_id = r.role_id 
         LEFT JOIN branch b ON u.branch_id = b.branch_id 
         WHERE u.user_id = ?`,
        [createdUserId]
      );
    } catch (selectError) {
      // If is_email_verified column doesn't exist, select without it
      if ((selectError.code && selectError.code.startsWith('ER_BAD_FIELD')) || selectError.code === '42703') {
        [userss] = await pool.execute(
          `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, u.created_at, 
                  r.role_name, b.branch_name 
           FROM users u 
           LEFT JOIN role r ON u.role_id = r.role_id 
           LEFT JOIN branch b ON u.branch_id = b.branch_id 
           WHERE u.user_id = ?`,
          [createdUserId]
        );
      } else {
        throw selectError;
      }
    }

    const newUser = userss[0];

    // Check if verification columns exist (by checking if is_email_verified was selected)
    const hasVerificationColumns = newUser.hasOwnProperty('is_email_verified');
    let emailSent = false;
    let registrationMessage = 'User registered successfully.';

    // Send verification email (only if verification columns exist and SMTP is configured)
    if (createdUserId && hasVerificationColumns) {
      try {
        // Only try to send email if SMTP is configured
        if (process.env.BREVO_API_KEY) {
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
    const { password: _, verification_code: __, verification_code_expires: ___, ...usersWithoutPassword } = newUser;

    // Custom message for managers based on whether they created a branch or joined one
    let finalMessage = 'Manager account created successfully. Your account is pending admin activation. You will be notified once your account is activated.';
    
    if (branch_name) {
      finalMessage = 'Manager account created successfully. New branch created. Your account is pending admin activation. You will be notified once your account is activated.';
    } else if (branch_id) {
      finalMessage = 'Manager account created successfully. You have joined an existing branch as a manager. Your account is pending admin activation. You will be notified once your account is activated.';
    }

    res.status(201).json({
      success: true,
      message: finalMessage,
      users: usersWithoutPassword,
      requiresVerification: hasVerificationColumns && emailSent,
      requiresActivation: true,
      isActive: false,
      branchAction: branch_name ? 'created' : 'joined'
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

// Login users
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

    // Find users by email with role and branch info
    const [userss] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.password, u.role_id, u.branch_id, 
              u.is_active, u.is_email_verified, u.must_change_password, 
              u.is_temporary_password, u.created_at, r.role_name, b.branch_name 
       FROM users u 
       LEFT JOIN role r ON u.role_id = r.role_id 
       LEFT JOIN branch b ON u.branch_id = b.branch_id 
       WHERE u.email = ?`,
      [email]
    );

    if (userss.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const users = userss[0];

    // Debug logging
    console.log(`Login attempt: email=${email}, is_active=${users.is_active}, role_name=${users.role_name}, is_email_verified=${users.is_email_verified}`);

    // Check if users is active - different messages for different roles
    // MySQL returns BOOLEAN as 0/1, so check both
    const isActive = users.is_active === true || users.is_active === 1 || users.is_active === '1';
    
    if (!isActive) {
      // Staff accounts (Pharmacist/Cashier) are activated automatically after email verification
      // Only Managers need admin activation
      const roleName = users.role_name || '';
      
      if (roleName === 'Manager') {
        return res.status(401).json({
          success: false,
          message: 'Account is pending admin activation. Please contact administrator.'
        });
      } else if (roleName === 'Pharmacist' || roleName === 'Cashier') {
        // Check if email is verified
        const isEmailVerified = users.is_email_verified === true || users.is_email_verified === 1 || users.is_email_verified === '1';
        
        if (!isEmailVerified) {
          return res.status(401).json({
            success: false,
            message: 'Account not activated yet. Please verify your email first. Contact your manager if you need help.'
          });
        } else {
          return res.status(401).json({
            success: false,
            message: 'Account is not active. Please contact your manager to activate your account.'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact administrator.'
        });
      }
    }

    // Verify password
    if (!users.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, users.password);

    if (!isPasswordValid) {
      // Provide more helpful error message based on account status
      let errorMessage = 'Invalid email or password';
      
      // If account is not email verified, suggest verification
      if (users.is_email_verified === false || users.is_email_verified === 0) {
        if (users.role_name === 'Pharmacist' || users.role_name === 'Cashier') {
          errorMessage = 'Account not verified yet. Please contact your manager to verify your email with the verification code.';
        } else {
          errorMessage = 'Invalid email or password. If you just registered, please verify your email first.';
        }
      } else if (users.is_temporary_password === true || users.is_temporary_password === 1) {
        // If using temporary password, provide more specific message
        errorMessage = 'Invalid temporary password. Please check the email sent to you for the correct temporary password, or contact your manager.';
      }
      
      return res.status(401).json({
        success: false,
        message: errorMessage
      });
    }

    // Check if email is verified - different handling for different roles
    // Admin and Manager: email verification is optional/separate from activation
    // Pharmacist/Cashier: email verification is required (handled by manager)
    if (users.is_email_verified !== undefined && users.is_email_verified !== null) {
      const isEmailVerified = users.is_email_verified === true || users.is_email_verified === 1 || users.is_email_verified === '1';
      const roleName = users.role_name || '';
      
      // For Pharmacist and Cashier, email must be verified (manager verifies it)
      if (!isEmailVerified && (roleName === 'Pharmacist' || roleName === 'Cashier')) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in. Contact your manager to verify your email with the verification code.'
        });
      }
      // For Admin and Manager, email verification is less strict (can login if active)
      // This check is already handled above in the isActive check
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: users.user_id, email: users.email, roleId: users.role_id, branchId: users.branch_id },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last login (wrap in try-catch to prevent errors if column doesn't exist)
    try {
      await pool.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
        [users.user_id]
      );
    } catch (updateError) {
      // Log but don't fail login if last_login update fails
      // Only log if it's a column error, ignore silently otherwise
      if (updateError.code && updateError.code.startsWith('ER_BAD_FIELD')) {
        // Column doesn't exist - this is fine, just don't log every time
        // console.warn('last_login column not found - this is optional');
      }
    }

    // Check if users must change password
    const mustChangePassword = users.must_change_password === true || users.must_change_password === 1 || 
                               users.is_temporary_password === true || users.is_temporary_password === 1;

    // Remove password from response
    const { password: _, ...usersWithoutPassword } = users;

    return res.json({
      success: true,
      message: mustChangePassword 
        ? 'Login successful. Please change your password.'
        : 'Login successful',
      token,
      users: usersWithoutPassword,
      mustChangePassword: mustChangePassword
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// Get current users (protected route)
const getMe = async (req, res, next) => {
  try {
    // User is attached to req by auth middleware
    // Fetch fresh users data with role and branch info
    const [userss] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, 
              u.is_active, u.created_at, u.last_login,
              r.role_name, b.branch_name, b.location 
       FROM users u 
       LEFT JOIN role r ON u.role_id = r.role_id 
       LEFT JOIN branch b ON u.branch_id = b.branch_id 
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );

    if (userss.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const users = userss[0];
    
    res.json({
      success: true,
      users: users
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

    // Find users by email and verification code
    const [userss] = await pool.execute(
      `SELECT user_id, email, verification_code, verification_code_expires, is_email_verified 
       FROM users 
       WHERE email = ? AND verification_code = ?`,
      [email, verification_code]
    );

    if (userss.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code or email'
      });
    }

    const users = userss[0];

    // Check if already verified
    if (users.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check if verification code has expired
    const now = new Date();
    const expirationTime = new Date(users.verification_code_expires);

    if (now > expirationTime) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Verify the email
    await pool.execute(
      `UPDATE users 
       SET is_email_verified = TRUE, 
           verification_code = NULL, 
           verification_code_expires = NULL 
       WHERE user_id = ?`,
      [users.user_id]
    );

    // Get updated users with role and branch info
    const [updatedUsers] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, 
              u.is_email_verified, r.role_name, b.branch_name 
       FROM users u 
       LEFT JOIN role r ON u.role_id = r.role_id 
       LEFT JOIN branch b ON u.branch_id = b.branch_id 
       WHERE u.user_id = ?`,
      [users.user_id]
    );

    const verifiedUser = updatedUsers[0];

    // Generate JWT token for verified users
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
    const { password: _, ...usersWithoutPassword } = verifiedUser;

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      users: usersWithoutPassword
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

    // Find users by email
    const [userss] = await pool.execute(
      'SELECT user_id, email, full_name, is_email_verified FROM users WHERE email = ?',
      [email]
    );

    if (userss.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const users = userss[0];

    // Check if already verified
    if (users.is_email_verified) {
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
      'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE user_id = ?',
      [verificationCode, expirationTime, users.user_id]
    );

    // Send verification email (only if SMTP is configured)
    if (process.env.BREVO_API_KEY) {
      try {
        await sendVerificationEmail(email, verificationCode, users.full_name);
        console.log(`✅ Verification code resent to ${email}`);
        res.json({
          success: true,
          message: 'Verification code sent to your email'
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Still return success but with a warning if email fails
        // The code is still saved in the database
        res.json({
          success: true,
          message: 'Verification code generated, but email could not be sent. Please check SMTP configuration.',
          verification_code: verificationCode, // Only for development/testing
          warning: 'Email service is not properly configured'
        });
      }
    } else {
      // SMTP not configured - return the code directly (for development/testing)
      console.warn('⚠️  SMTP not configured - returning verification code in response');
      res.json({
        success: true,
        message: 'Verification code generated. Email service is not configured.',
        verification_code: verificationCode, // Only for development/testing
        warning: 'Email service is not configured. Set SMTP_USER and SMTP_PASS in .env to enable email sending.'
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    next(error);
  }
};

// Forgot password - send temporary password via email
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find users by email
    const [userss] = await pool.execute(
      'SELECT user_id, email, full_name, is_active FROM users WHERE email = ?',
      [email]
    );

    if (userss.length === 0) {
      // Don't reveal if email exists for security reasons
      return res.json({
        success: true,
        message: 'If the email exists, a temporary password has been sent to your email address.'
      });
    }

    const users = userss[0];

    // Check if users is active
    if (users.is_active === false || users.is_active === 0) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Generate a secure temporary password (12 characters: uppercase, lowercase, numbers)
    const generateTemporaryPassword = () => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const allChars = uppercase + lowercase + numbers;
      
      let password = '';
      // Ensure at least one of each type
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      
      // Fill the rest randomly
      for (let i = password.length; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    // Check if SMTP is configured before proceeding
    if (!process.env.BREVO_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact administrator.',
        error: 'SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in .env file.'
      });
    }

    const temporaryPassword = generateTemporaryPassword();

    // Hash the temporary password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

    // Send password reset email first (before changing password)
    // This ensures we don't change the password if email fails
    try {
      await sendPasswordResetEmail(email, temporaryPassword, users.full_name);
      console.log(`✅ Password reset email sent to ${email}`);
      
      // Only update password after email is successfully sent
      await pool.execute(
        'UPDATE users SET password = ? WHERE user_id = ?',
        [hashedPassword, users.user_id]
      );
      
      res.json({
        success: true,
        message: 'A temporary password has been sent to your email address. Please check your inbox and log in with the temporary password.'
      });
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode
      });
      
      // Provide more detailed error information for debugging
      let errorMessage = 'Failed to send password reset email. Please try again later or contact support.';
      let errorDetails = null;
      
      // Check for common SMTP errors
      if (emailError.message.includes('Invalid login')) {
        errorMessage = 'SMTP authentication failed. Please check your email credentials.';
        errorDetails = 'The email usersname or password (app password) is incorrect.';
      } else if (emailError.message.includes('Connection timeout') || emailError.message.includes('ECONNREFUSED')) {
        errorMessage = 'Could not connect to email server. Please check your SMTP settings.';
        errorDetails = 'Unable to reach the SMTP server. Check SMTP_HOST and SMTP_PORT in .env file.';
      } else if (emailError.message.includes('SMTP credentials not configured')) {
        errorMessage = 'Email service is not configured.';
        errorDetails = 'SMTP_USER and SMTP_PASS must be set in .env file.';
      } else if (emailError.code === 'EAUTH') {
        errorMessage = 'Email authentication failed.';
        errorDetails = 'Please verify your SMTP_USER and SMTP_PASS (use app password for Gmail).';
      } else if (emailError.code === 'ETIMEDOUT' || emailError.code === 'ECONNREFUSED') {
        errorMessage = 'Email server connection failed.';
        errorDetails = 'Check your internet connection and SMTP server settings.';
      }
      
      // Don't change password if email fails
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: errorDetails || emailError.message,
        debug: process.env.NODE_ENV === 'development' ? {
          code: emailError.code,
          command: emailError.command,
          responseCode: emailError.responseCode
        } : undefined
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
};

// Change password - for userss to change their own password
const changePassword = async (req, res, next) => {
  try {
    const usersId = req.user.user_id; // From auth middleware
    const { current_password, new_password } = req.body;

    // Validate input
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'current_password and new_password are required'
      });
    }

    // Validate new password length
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current users with password
    const [userss] = await pool.execute(
      'SELECT user_id, password, is_temporary_password, must_change_password FROM users WHERE user_id = ?',
      [usersId]
    );

    if (userss.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const users = userss[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, users.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(new_password, users.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password and clear temporary password flags
    await pool.execute(
      `UPDATE users 
       SET password = ?,
           is_temporary_password = 0,
           must_change_password = 0,
           password_changed_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [hashedNewPassword, usersId]
    );

    // Get updated users info
    const [updatedUsers] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, 
              u.is_temporary_password, u.must_change_password, r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [usersId]
    );

    console.log(`✅ Password changed successfully for user_id=${usersId}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        users: updatedUsers[0]
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    next(error);
  }
};

// Logout users
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
  resendVerificationCode,
  forgotPassword,
  changePassword
};

