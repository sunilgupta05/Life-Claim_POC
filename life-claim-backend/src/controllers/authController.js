// backend/controllers/authController.js

const authService = require('../services/authService');

const login = async (req, res) => {
  console.info(req.body);
  const { username, password } = req.body;

  try {
    const result = await authService.loginUser(username, password);
    res.json(result);
  } catch (error) {
    console.error(`Login error for user ${username}: ${error.message}`);
    const status = error.status || 401;
    res.status(status).json({ 
      message: error.message,
      lockout: error.lockout || false,
      remainingMs: error.remainingMs || 0
    });
  }
};

module.exports = {
  login,
};
