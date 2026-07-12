// Manager Staff Management Controller
// Allows managers to create and manage staff (Pharmacist, Cashier) for their branch

const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { sendVerificationEmailSafe, sendPasswordResetEmailSafe } = require('../utils/emailService');

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

    // Send verification code email to staff member
    const emailResult = await sendVerificationEmailSafe(email, verificationCode, full_name);
    const emailSent = emailResult.sent;

    if (emailSent) {
      console.log(`✅ Verification code sent to ${email}`);
    } else {
      console.warn(`⚠️ Verification email not sent to ${email}: ${emailResult.error}`);
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

    const responseMessage = emailSent
      ? 'Staff member created. Verification code sent to their email.'
      : 'Staff member created, but the verification email could not be sent. Use the code shown below to verify the staff member.';

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        users: newUser[0],
        verificationCode: emailSent ? undefined : verificationCode,
        emailSent,
        emailError: emailSent ? undefined : emailResult.error,
        note: emailSent
          ? 'Ask the staff member for the verification code they received, then verify them using Verify Staff.'
          : 'Share this verification code with the staff member, then use Verify Staff to activate their account.'
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
         u.is_email_verified,
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

    const emailResult = await sendPasswordResetEmailSafe(
      staff[0].email,
      temporaryPassword,
      staff[0].full_name
    );
    const emailSent = emailResult.sent;

    if (!emailSent) {
      console.warn(`⚠️ Password reset email not sent to ${staff[0].email}: ${emailResult.error}`);
    }

    res.json({
      success: true,
      message: emailSent
        ? 'Password reset successfully. New temporary password sent to staff email.'
        : 'Password reset successfully, but email could not be sent. Share the temporary password manually.',
      data: {
        temporaryPassword: emailSent ? undefined : temporaryPassword,
        emailSent,
        emailError: emailSent ? undefined : emailResult.error,
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

    const staffUserId = staffMember.user_id;

    // Update users: verify email, activate account, set temporary password
    // For staff accounts (Pharmacist/Cashier), activate immediately - NO admin approval needed
    await pool.execute(
      `UPDATE users 
       SET is_email_verified = TRUE,
           verification_code = NULL,
           verification_code_expires = NULL,
           password = ?,
           is_active = TRUE,
           is_temporary_password = TRUE,
           must_change_password = TRUE
       WHERE user_id = ?`,
      [hashedPassword, staffUserId]
    );

    console.log(`✅ Staff account activated: user_id=${staffUserId}, email=${staffMember.email}`);

    const emailResult = await sendPasswordResetEmailSafe(
      staffMember.email,
      temporaryPassword,
      staffMember.full_name
    );
    const emailSent = emailResult.sent;

    if (!emailSent) {
      console.warn(`⚠️ Temporary password email not sent to ${staffMember.email}: ${emailResult.error}`);
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
      [staffUserId]
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
      console.error(`❌ Account activation failed: user_id=${staffUserId}, is_active=${usersData.is_active}, is_email_verified=${usersData.is_email_verified}`);
      return res.status(500).json({
        success: false,
        message: 'Account activation failed. Please try again or contact support.'
      });
    }

    console.log(`✅ Staff account successfully activated and verified: user_id=${staffUserId}, email=${usersData.email}, is_active=${usersData.is_active}`);

    res.json({
      success: true,
      message: emailSent
        ? 'Staff verified and activated. Temporary password sent to their email.'
        : 'Staff verified and activated, but the password email could not be sent. Share the temporary password manually.',
      data: {
        users: usersData,
        temporaryPassword: emailSent ? undefined : temporaryPassword,
        emailSent,
        emailError: emailSent ? undefined : emailResult.error,
        accountStatus: {
          is_active: isActive,
          is_email_verified: isEmailVerified,
          can_login: true
        },
        note: emailSent
          ? 'Staff member can now log in and must change their password on first login.'
          : 'Share the temporary password with the staff member so they can log in and change it.'
      }
    });
  } catch (error) {
    console.error('Verify staff code error:', error);
    next(error);
  }
};

// Resend verification code to staff member
const resendStaffVerification = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;
    const { user_id } = req.params;

    const [staff] = await pool.execute(
      `SELECT u.user_id, u.email, u.full_name, u.is_email_verified, u.is_active
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

    const staffMember = staff[0];

    if (staffMember.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Staff email is already verified'
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    await pool.execute(
      'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE user_id = ?',
      [verificationCode, expirationTime, staffMember.user_id]
    );

    const emailResult = await sendVerificationEmailSafe(
      staffMember.email,
      verificationCode,
      staffMember.full_name
    );

    res.json({
      success: true,
      message: emailResult.sent
        ? 'Verification code resent to staff email.'
        : 'New verification code generated, but email could not be sent. Share the code manually.',
      data: {
        verificationCode: emailResult.sent ? undefined : verificationCode,
        emailSent: emailResult.sent,
        emailError: emailResult.sent ? undefined : emailResult.error,
      }
    });
  } catch (error) {
    console.error('Resend staff verification error:', error);
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
  resendStaffVerification
};

