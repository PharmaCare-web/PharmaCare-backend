// Authentication routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../utils/validation');
const authMiddleware = require('../middleware/auth');

// Get available auth endpoints (helpful route)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication endpoints',
    endpoints: {
      register: {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register a new user',
        body: {
          full_name: 'string (required)',
          email: 'string (required)',
          password: 'string (required, min 6 chars)',
          role_id: 'number (required, 1-4)',
          branch_id: 'number (required for pharmacy roles: 2,3,4; omit for Admin: 1)'
        },
        note: 'Admin (role_id=1) is a system role and does not require branch_id. Pharmacy roles (Manager=2, Pharmacist=3, Cashier=4) require branch_id.'
      },
      login: {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login user',
        body: {
          email: 'string (required)',
          password: 'string (required)'
        }
      },
      verifyEmail: {
        method: 'POST',
        path: '/api/auth/verify-email',
        description: 'Verify email with verification code',
        body: {
          email: 'string (required)',
          verification_code: 'string (required, 6 digits)'
        }
      },
      resendVerification: {
        method: 'POST',
        path: '/api/auth/resend-verification',
        description: 'Resend verification code to email',
        body: {
          email: 'string (required)'
        }
      },
      forgotPassword: {
        method: 'POST',
        path: '/api/auth/forgot-password',
        description: 'Request password reset - sends temporary password via email',
        body: {
          email: 'string (required)'
        }
      },
      me: {
        method: 'GET',
        path: '/api/auth/me',
        description: 'Get current user (protected)',
        headers: {
          Authorization: 'Bearer <token> (required)'
        }
      },
      logout: {
        method: 'POST',
        path: '/api/auth/logout',
        description: 'Logout user (protected)',
        headers: {
          Authorization: 'Bearer <token> (required)'
        }
      },
      changePassword: {
        method: 'POST',
        path: '/api/auth/change-password',
        description: 'Change user password (protected)',
        headers: {
          Authorization: 'Bearer <token> (required)'
        },
        body: {
          current_password: 'string (required)',
          new_password: 'string (required, min 6 chars)'
        }
      }
    },
    roles: {
      system: {
        1: 'Admin (System role - does not belong to any branch)'
      },
      pharmacy: {
        2: 'Manager (Branch-level management)',
        3: 'Pharmacist (Stock management)',
        4: 'Cashier (Sales transactions)'
      },
      note: 'Admin is not a pharmacy role. Only Manager, Pharmacist, and Cashier are pharmacy roles that belong to a branch.'
    }
  });
});

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationCode);
router.post('/forgot-password', authController.forgotPassword);

// Protected routes - require authentication
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;

