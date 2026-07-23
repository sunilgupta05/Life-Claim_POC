const express = require('express');
const userService = require('../services/authService');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/keycloak');
const selfOrAdminUserRead = require('../middleware/selfOrAdminUserRead');
const { legacyLoginLimiter } = require('../middleware/rateLimiters');
const {
  validateLegacyLoginBody,
  validateCreateUserBody,
  validateUpdateUserBody,
} = require('../middleware/requestValidation');
//const roleController = require('../controllers/roleController');

const router = express.Router();

const loginCookieOptions = () => {
  const useHttps = process.env.USE_HTTPS === 'true';
  // Ensure Secure is set automatically on HTTPS, without breaking local HTTP workflows.
  const secure = process.env.NODE_ENV === 'production' ? true : (useHttps ? true : 'auto');
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 3600000,
    path: '/api',
  };
};

router.post('/login', legacyLoginLimiter, validateLegacyLoginBody, async (req, res, next) => {
  try {
    const { username, password, captchaToken } = req.body;
    const result = await userService.loginUser(username, password, captchaToken, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    // 🚀 Set HttpOnly cookie for JWT (optional; frontend uses Authorization header)
    res.cookie('token', result.token, loginCookieOptions());

    res.json(result);
  } catch (error) {
    console.error('[Login Error]', error.message);
    const status = error.status || 401;
    res.status(status).json({ 
      message: error.message || 'Login failed',
      lockout: error.lockout || false,
      remainingMs: error.remainingMs || 0
    });
  }
});

router.post('/logout', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await userService.logoutUser(req.user.userId);
    // Clear JWT cookie using the same attributes as when it was set
    res.clearCookie('token', loginCookieOptions());
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Logout failed' });
  }
});

router.post('/logout-on-close', authMiddleware.authenticate, async (req, res) => {
  try {
    const token = (req.cookies && req.cookies.token) || req.headers.authorization?.split(' ')[1] || null;
    await userService.scheduleLogoutOnCloseByToken(token);
    return res.status(204).send();
  } catch (error) {
    return res.status(204).send();
  }
});


router.get('/user/:id', protect(), selfOrAdminUserRead, userController.getUserByUsername);
router.get('/user', authMiddleware.authenticate, authorize('superuser', 'super user'), userController.getUsers);
router.post('/user', authMiddleware.authenticate, authorize('superuser', 'super user'), validateCreateUserBody, userController.createUser);
router.put('/user/:id', authMiddleware.authenticate, authorize('superuser', 'super user'), validateUpdateUserBody, userController.updateUser);
router.delete('/user/:id', authMiddleware.authenticate, authorize('superuser', 'super user'), userController.deleteUser);

// router.get('/roles', authMiddleware.authenticate, roleController.getAllRoles);
// router.post('/addrole', authMiddleware.authenticate, roleController.createRole);




module.exports = router;
