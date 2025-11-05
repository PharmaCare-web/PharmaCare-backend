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
          branch_id: 'number (required)'
        }
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
      }
    },
    roles: {
      1: 'Admin',
      2: 'Manager',
      3: 'Pharmacist',
      4: 'Cashier'
    }
  });
});

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationCode);

// Protected routes - require authentication
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;

