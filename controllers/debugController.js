// Debug Controller - For troubleshooting account issues
// NOTE: Remove or secure this in production

const pool = require('../config/database');

// Check account status by email (for debugging)
const checkAccountStatus = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const [userss] = await pool.execute(
      `SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.is_active,
        u.is_email_verified,
        u.is_temporary_password,
        u.must_change_password,
        u.verification_code,
        u.verification_code_expires,
        r.role_name,
        b.branch_name,
        u.created_at
      FROM users u
      LEFT JOIN role r ON u.role_id = r.role_id
      LEFT JOIN branch b ON u.branch_id = b.branch_id
      WHERE u.email = ?`,
      [email]
    );

    if (userss.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found with this email'
      });
    }

    const users = userss[0];

    // Remove sensitive data
    const { verification_code, ...safeUser } = users;

    res.json({
      success: true,
      message: 'Account status retrieved',
      data: {
        ...safeUser,
        hasVerificationCode: !!users.verification_code,
        verificationCodeExpired: users.verification_code_expires 
          ? new Date(users.verification_code_expires) < new Date() 
          : null,
        canLogin: users.is_active === 1 && users.is_email_verified === 1,
        issues: [
          users.is_active === 0 ? 'Account is not active' : null,
          users.is_email_verified === 0 ? 'Email is not verified' : null,
          users.verification_code && new Date(users.verification_code_expires) < new Date() ? 'Verification code has expired' : null,
          users.is_temporary_password === 1 ? 'Using temporary password - must change on first login' : null
        ].filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Check account status error:', error);
    next(error);
  }
};

module.exports = {
  checkAccountStatus
};

