// src/services/userService.js
const userDao = require('../dataAccess/userDao');



exports.getUserByUsername = (username) => {
  
  return userDao.getUserByUsername(username);
};

exports.getUsers = () => {
  return userDao.getUsers();
};

exports.createUser = (user) => {
  return userDao.createUser(user);
};

exports.updateUser = (userId, user) => {
  return userDao.updateUser(userId, user);
};

exports.deleteUser = (userId) => {
  return userDao.deleteUser(userId);
};
