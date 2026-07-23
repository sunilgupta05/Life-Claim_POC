// backend/dataAccess/userDao.js

const pool = require('../config/dbConfig');
const User = require('../models/User');

const getUserByUsername = async (username) => {
  const data = await User.findOne({ where: { username: username} });
  return  data;
};

const getUserById = async (userid) => {
  const [rows] = await pool.execute('SELECT id, username, roles, current_session_id FROM users WHERE id = ?', [userid]);
  return rows.length > 0 ? rows[0] : null;
};


const getUsers = () => {
  return User.findAll();
};

const createUser = (user) => {
  return User.create(user);
};

const updateUser = (userId, user) => {

  return User.update(user, {
    where: { id: userId },
    individualHooks: true,
  },

);
};

const setCurrentSessionIdByUserId = async (userId, sessionId) => {
  await pool.execute('UPDATE users SET current_session_id = ? WHERE id = ?', [sessionId, userId]);
};

const setCurrentSessionIdByUsername = async (username, sessionId) => {
  await pool.execute('UPDATE users SET current_session_id = ? WHERE username = ?', [sessionId, username]);
};

const deleteUser = (userId) => {
  return User.destroy({
    where: { id: userId }
  });
};

module.exports = {
  getUserByUsername, getUserById, 
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  setCurrentSessionIdByUserId,
  setCurrentSessionIdByUsername
};
