import { Router } from 'express';
import { signup, login, refreshToken, logout, logoutAll, getProfile, updateUsernameHandler, updateEmailHandler, updatePasswordHandler } from '../controllers/auth.controller.js';
import { validateSignup, validateLogin } from '../middleware/validation.middleware.js';
import { signupLimiter, loginLimiter } from '../middleware/rateLimit.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Debug route to verify router is mounted
router.get('/test', (_req, res) => {
  res.json({ message: 'Auth router is working' });
});

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
router.post('/signup', signupLimiter, validateSignup, signup);

/**
 * @route POST /api/auth/login
 * @desc Login user and create session
 * @access Public
 */
router.post('/login', loginLimiter, validateLogin, login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token cookie
 * @access Public (requires refresh token cookie)
 */
router.post('/refresh', refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate session
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route POST /api/auth/logout-all
 * @desc Logout user from all devices
 * @access Private (requires authentication)
 */
router.post('/logout-all', authenticateToken, logoutAll);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private (requires authentication)
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route PUT /api/auth/username
 * @desc Update current user's username
 * @access Private
 */
router.put('/username', authenticateToken, updateUsernameHandler);

/**
 * @route PUT /api/auth/email
 * @desc Update current user's email
 * @access Private
 */
router.put('/email', authenticateToken, updateEmailHandler);

/**
 * @route PUT /api/auth/password
 * @desc Update current user's password
 * @access Private
 */
router.put('/password', authenticateToken, updatePasswordHandler);

export default router;
