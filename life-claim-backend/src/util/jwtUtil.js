// backend/util/jwtUtil.js

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';
const JWT_ALGORITHM = 'HS256';

const sign = (payload) => {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });
};

const verify = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY, { algorithms: [JWT_ALGORITHM] });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token expired:', error);
      throw new Error('Token expired');
    }
    console.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
};

module.exports = {
  sign,
  verify,
};
