// Manager Staff Management Controller
// Allows managers to create and manage staff (Pharmacist, Cashier) for their branch

const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Create new staff member (Pharmacist or Cashier)
const createStaff = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;
    const managerUserId = req.users.user_id;

    if (!managerBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Manager must belong to a branch'
      });
    }

    const { full_name, email, role_ids, temporary_password } = req.body;

    // Validate required fields
    if (!full_name || !email || !role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'full_name, email, and role_ids (array) are required'
      });
    }

    // Validate roles (must be Pharmacist or Cashier)
    const [validRoles] = await pool.execute(
      `SELECT role_id, role_name FROM role 
       WHERE role_name IN ('Pharmacist', 'Cashier') 
       AND role_id IN (${role_ids.map(() => '?').join(',')})`,
      role_ids
    );

    if (validRoles.length !== role_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role_ids. Only Pharmacist (3) and Cashier (4) roles are allowed for staff'
      });
    }

    // Check if email already exists
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

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    // Generate a placeholder password (will be replaced after email verification)
    // This is required because password is NOT NULL in the database
    const placeholderPassword = 'PLACEHOLDER_' + Date.now();
    const saltRounds = 10;
    const hashedPlaceholderPassword = await bcrypt.hash(placeholderPassword, saltRounds);

    // Use first role_id for the users table (for backward compatibility)
    // Multiple roles will be handled separately if needed
    const primaryRoleId = role_ids[0];

    // Create users account as INACTIVE and NOT email verified
    // Account will be activated after manager verifies the email code
    const [result] = await pool.execute(
      `INSERT INTO users (
        full_name, email, password, role_id, branch_id, 
        is_active, is_email_verified, verification_code, verification_code_expires,
        is_temporary_password, must_change_password, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING user_id`,
      [
        full_name,
        email,
        hashedPlaceholderPassword,  // Placeholder, will be replaced after verification
        primaryRoleId,
        managerBranchId,
        false,  // INACTIVE until email is verified
        false,  // Email not verified yet
        verificationCode,
        expirationTime,
        true,   // Will be temporary password
        true,   // Must change password on first login
        managerUserId  // Created by this manager
      ]
    );

    const newUserId = result.length > 0 ? (result[0].user_id || result[0].id) : null;
    if (!newUserId) {
      throw new Error('Failed to create users record');
    }

    // Send verification code email to staff member (Pharmacist/Cashier)
    let emailSent = false;
    let emailError = null;
    
    if (process.env.BREVO_API_KEY) {
      try {
        console.log(`📧 Attempting to send verification email to ${email} (${full_name})...`);
        await sendVerificationEmail(email, verificationCode, full_name);
        emailSent = true;
        console.log(`✅ Verification code sent successfully to ${email}`);
      } catch (err) {
        emailError = err;
        console.error('❌ Failed to send verification email:', err.message);
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          response: err.response?.body || err.body
        });
        // Don't fail the request if email fails - code is still generated
      }
    } else {
      console.warn('⚠️  BREVO_API_KEY not configured - verification email will not be sent');
      console.warn('   Set BREVO_API_KEY in .env to enable email sending');
    }

    // Get created users info
    const [newUser] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, 
              u.is_active, u.is_email_verified, r.role_name, b.branch_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [newUserId]
    );

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Staff member account created. Verification code sent to email.'
        : process.env.BREVO_API_KEY
          ? 'Staff member account created. Verification code generated but email failed to send.'
          : 'Staff member account created. Verification code generated (email not configured).',
      data: {
        users: newUser[0],
        verificationCode: emailSent ? undefined : verificationCode,  // Only return if email not sent
        emailSent: emailSent,
        emailError: emailError && process.env.NODE_ENV === 'development' ? emailError.message : undefined,
        note: emailSent 
          ? 'Verification code sent to staff email. Staff member should provide the code to you for verification.'
          : 'Verification code generated. Send it to the staff member and verify using the verification endpoint.'
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    next(error);
  }
};

// Get all staff members for manager's branch
const getStaffMembers = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;

    if (!managerBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Manager must belong to a branch'
      });
    }

    const [staff] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.role_id,
         u.is_active,
         u.is_temporary_password,
         u.must_change_password,
         u.created_at,
         u.last_login,
         r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.branch_id = ?
       AND r.role_name IN ('Pharmacist', 'Cashier')
       ORDER BY u.created_at DESC`,
      [managerBranchId]
    );

    res.json({
      success: true,
      data: staff,
      count: staff.length,
      message: 'Staff members retrieved successfully'
    });
  } catch (error) {
    console.error('Get staff members error:', error);
    next(error);
  }
};

// Update staff member (activate/deactivate, change role)
const updateStaff = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;
    const { user_id } = req.params;
    const { is_active, role_id } = req.body;

    // Verify staff belongs to manager's branch
    const [staff] = await pool.execute(
      `SELECT u.user_id, u.branch_id, r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ?
       AND u.branch_id = ?
       AND r.role_name IN ('Pharmacist', 'Cashier')`,
      [user_id, managerBranchId]
    );

    if (staff.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in your branch'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (role_id !== undefined) {
      // Validate role is Pharmacist or Cashier
      const [validRole] = await pool.execute(
        `SELECT role_id FROM role 
         WHERE role_id = ? 
         AND role_name IN ('Pharmacist', 'Cashier')`,
        [role_id]
      );

      if (validRole.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role_id. Only Pharmacist and Cashier roles are allowed'
        });
      }

      updates.push('role_id = ?');
      values.push(role_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(user_id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    // Get updated users
    const [updatedUser] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, u.is_active, 
              r.role_name, b.branch_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [user_id]
    );

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('Update staff error:', error);
    next(error);
  }
};

// Remove/Delete staff member
const removeStaff = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;
    const { user_id } = req.params;

    // Verify staff belongs to manager's branch
    const [staff] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.branch_id, r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ?
       AND u.branch_id = ?
       AND r.role_name IN ('Pharmacist', 'Cashier')`,
      [user_id, managerBranchId]
    );

    if (staff.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in your branch'
      });
    }

    // Deactivate instead of delete (soft delete)
    await pool.execute(
      'UPDATE users SET is_active = FALSE WHERE user_id = ?',
      [user_id]
    );

    res.json({
      success: true,
      message: 'Staff member removed (deactivated) successfully',
      data: {
        user_id: user_id,
        full_name: staff[0].full_name,
        email: staff[0].email
      }
    });
  } catch (error) {
    console.error('Remove staff error:', error);
    next(error);
  }
};

// Reset staff password (generate new temporary password)
const resetStaffPassword = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;
    const { user_id } = req.params;

    // Verify staff belongs to manager's branch
    const [staff] = await pool.execute(
      `SELECT u.user_id, u.email, u.full_name, u.branch_id, r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ?
       AND u.branch_id = ?
       AND r.role_name IN ('Pharmacist', 'Cashier')`,
      [user_id, managerBranchId]
    );

    if (staff.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in your branch'
      });
    }

    // Generate new temporary password
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = uppercase + lowercase + numbers;
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    const temporaryPassword = password.split('').sort(() => Math.random() - 0.5).join('');

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

    // Update password
    await pool.execute(
      `UPDATE users 
       SET password = ?, 
           is_temporary_password = TRUE, 
           must_change_password = TRUE
       WHERE user_id = ?`,
      [hashedPassword, user_id]
    );

    // Send email if configured
    let emailSent = false;
    if (process.env.BREVO_API_KEY) {
      try {
        await sendPasswordResetEmail(staff[0].email, temporaryPassword, staff[0].full_name);
        emailSent = true;
        console.log(`✅ New temporary password sent to ${staff[0].email}`);
      } catch (emailError) {
        console.error('Failed to send email:', emailError.message);
      }
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        temporaryPassword: emailSent ? undefined : temporaryPassword,  // Only return if email not sent
        emailSent: emailSent
      }
    });
  } catch (error) {
    console.error('Reset staff password error:', error);
    next(error);
  }
};

// Verify staff email with verification code and activate account
const verifyStaffCode = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;
    const { user_id, email, verification_code } = req.body;

    // Accept either user_id OR email (for convenience)
    if (!verification_code) {
      return res.status(400).json({
        success: false,
        message: 'verification_code is required. Also provide either user_id or email.'
      });
    }

    if (!user_id && !email) {
      return res.status(400).json({
        success: false,
        message: 'Either user_id or email is required along with verification_code'
      });
    }

    // Build query based on whether user_id or email is provided
    let query;
    let params;

    if (user_id) {
      // Verify staff belongs to manager's branch using user_id
      query = `SELECT u.user_id, u.email, u.full_name, u.branch_id, u.verification_code, 
                      u.verification_code_expires, u.is_email_verified, r.role_name
               FROM users u
               LEFT JOIN role r ON u.role_id = r.role_id
               WHERE u.user_id = ?
               AND u.branch_id = ?
               AND r.role_name IN ('Pharmacist', 'Cashier')`;
      params = [user_id, managerBranchId];
    } else {
      // Verify staff belongs to manager's branch using email
      query = `SELECT u.user_id, u.email, u.full_name, u.branch_id, u.verification_code, 
                      u.verification_code_expires, u.is_email_verified, r.role_name
               FROM users u
               LEFT JOIN role r ON u.role_id = r.role_id
               WHERE u.email = ?
               AND u.branch_id = ?
               AND r.role_name IN ('Pharmacist', 'Cashier')`;
      params = [email, managerBranchId];
    }

    const [staff] = await pool.execute(query, params);

    if (staff.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in your branch'
      });
    }

    const staffMember = staff[0];

    // Check if already verified
    if (staffMember.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check verification code
    if (!staffMember.verification_code || staffMember.verification_code !== verification_code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if verification code has expired
    const now = new Date();
    const expirationTime = new Date(staffMember.verification_code_expires);

    if (now > expirationTime) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please create a new staff account or request a new code.'
      });
    }

    // Generate secure temporary password (12 characters)
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = uppercase + lowercase + numbers;
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    const temporaryPassword = password.split('').sort(() => Math.random() - 0.5).join('');

    // Hash temporary password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

    // Update users: verify email, activate account, set temporary password
    // For staff accounts (Pharmacist/Cashier), activate immediately - NO admin approval needed
    const [updateResult] = await pool.execute(
      `UPDATE users 
       SET is_email_verified = TRUE,
           verification_code = NULL,
           verification_code_expires = NULL,
           password = ?,
           is_active = TRUE,
           is_temporary_password = TRUE,
           must_change_password = TRUE
       WHERE user_id = ?`,
      [hashedPassword, user_id]
    );

    // Log activation for debugging
    console.log(`✅ Staff account activated: user_id=${user_id}, email=${staffMember.email}, rows_affected=${updateResult.affectedRows}`);
    
    // Verify the update worked
    if (updateResult.affectedRows === 0) {
      console.error(`❌ Failed to activate staff account: user_id=${user_id}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to activate account. Please try again.'
      });
    }

    // Send temporary password email to staff member
    let emailSent = false;
    if (process.env.BREVO_API_KEY) {
      try {
        await sendPasswordResetEmail(staffMember.email, temporaryPassword, staffMember.full_name);
        emailSent = true;
        console.log(`✅ Temporary password sent to ${staffMember.email}`);
      } catch (emailError) {
        console.error('Failed to send temporary password email:', emailError.message);
      }
    }

    // Get updated users info and verify activation
    const [updatedUser] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, 
              u.is_active, u.is_email_verified, u.is_temporary_password, 
              u.must_change_password, r.role_name, b.branch_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [user_id]
    );

    if (updatedUser.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve updated users information'
      });
    }

    const usersData = updatedUser[0];
    
    // Verify account is actually activated
    const isActive = usersData.is_active === 1 || usersData.is_active === true;
    const isEmailVerified = usersData.is_email_verified === 1 || usersData.is_email_verified === true;
    
    if (!isActive || !isEmailVerified) {
      console.error(`❌ Account activation failed: user_id=${user_id}, is_active=${usersData.is_active}, is_email_verified=${usersData.is_email_verified}`);
      return res.status(500).json({
        success: false,
        message: 'Account activation failed. Please try again or contact support.'
      });
    }

    console.log(`✅ Staff account successfully activated and verified: user_id=${user_id}, email=${usersData.email}, is_active=${usersData.is_active}`);

    res.json({
      success: true,
      message: 'Email verified successfully. Staff account activated automatically (no admin approval needed).',
      data: {
        users: usersData,
        temporaryPassword: emailSent ? undefined : temporaryPassword,  // Only return if email not sent
        emailSent: emailSent,
        accountStatus: {
          is_active: isActive,
          is_email_verified: isEmailVerified,
          can_login: true
        },
        note: emailSent
          ? 'Temporary password sent to staff email. Staff member can now login and must change password on first login.'
          : 'Temporary password generated. Send it to the staff member manually. Staff member can now login and must change password on first login.'
      }
    });
  } catch (error) {
    console.error('Verify staff code error:', error);
    next(error);
  }
};

// Create new manager account (created by existing manager, but requires admin activation)
const createManager = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;
    const managerUserId = req.users.user_id;

    if (!managerBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Manager must belong to a branch'
      });
    }

    const { full_name, email, password, branch_id } = req.body;

    // Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'full_name, email, and password are required'
      });
    }

    // Get Manager role_id
    const [managerRole] = await pool.execute(
      "SELECT role_id FROM role WHERE role_name = 'Manager'"
    );

    if (managerRole.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Manager role not found in database'
      });
    }

    const roleId = managerRole[0].role_id;

    // Check if email already exists
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

    // Determine branch_id - use provided branch_id or manager's branch
    let finalBranchId = branch_id || managerBranchId;

    // If different branch_id provided, verify it exists
    if (branch_id && branch_id !== managerBranchId) {
      const [branchCheck] = await pool.execute(
        'SELECT branch_id FROM branch WHERE branch_id = ?',
        [branch_id]
      );

      if (branchCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create manager account as INACTIVE and NOT email verified
    // Account will need admin activation (different from staff accounts)
    const [result] = await pool.execute(
      `INSERT INTO users (
        full_name, email, password, role_id, branch_id, 
        is_active, is_email_verified, verification_code, verification_code_expires,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING user_id`,
      [
        full_name,
        email,
        hashedPassword,
        roleId,
        finalBranchId,
        false,  // INACTIVE - requires admin activation
        false,  // Email not verified yet
        verificationCode,
        expirationTime,
        managerUserId  // Created by this manager
      ]
    );

    const newUserId = result.length > 0 ? (result[0].user_id || result[0].id) : null;
    if (!newUserId) {
      throw new Error('Failed to create user record');
    }

    // Send verification code email (optional - for email verification)
    let emailSent = false;
    let emailError = null;
    
    if (process.env.BREVO_API_KEY) {
      try {
        const { sendVerificationEmail } = require('../utils/emailService');
        console.log(`📧 Attempting to send verification email to ${email} (${full_name})...`);
        await sendVerificationEmail(email, verificationCode, full_name);
        emailSent = true;
        console.log(`✅ Verification code sent successfully to ${email}`);
      } catch (err) {
        emailError = err;
        console.error('❌ Failed to send verification email:', err.message);
      }
    } else {
      console.warn('⚠️  BREVO_API_KEY not configured - verification email will not be sent');
    }

    // Get created manager info
    const [newManager] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, u.branch_id, 
              u.is_active, u.is_email_verified, r.role_name, b.branch_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [newUserId]
    );

    res.status(201).json({
      success: true,
      message: 'Manager account created successfully. Account is pending admin activation.',
      data: {
        user: newManager[0],
        verificationCode: emailSent ? undefined : verificationCode,  // Only return if email not sent
        emailSent: emailSent,
        accountStatus: {
          is_active: false,
          is_email_verified: false,
          requires_admin_activation: true,
          note: 'This manager account must be activated by an admin before it can be used.'
        },
        nextSteps: [
          '1. Manager should verify email (optional)',
          '2. Admin must activate the account using: PUT /api/admin/managers/:id/activate',
          '3. After activation, manager can login'
        ]
      }
    });
  } catch (error) {
    console.error('Create manager error:', error);
    next(error);
  }
};

module.exports = {
  createStaff,
  getStaffMembers,
  updateStaff,
  removeStaff,
  resetStaffPassword,
  verifyStaffCode,
  createManager
};

