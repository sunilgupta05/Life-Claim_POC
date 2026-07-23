// src/controllers/userController.js
const userService = require('../services/userService');
const logger = require('../config/logConfig');

const sanitizeUserForResponse = (user) => {
  if (!user) return user;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete plain.password;
  return plain;
};

exports.getUserByUsername = async (req, res, next) =>{

  const username = req.params.id;
  try {
    const user = await userService.getUserByUsername(username);
    res.json(sanitizeUserForResponse(user));
  } catch (error) {
    logger.error(`Cannot GET users || MSG : ${error}`);
    next(error);
  }

}

exports.getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    const safeUsers = Array.isArray(users)
      ? users.map((u) => sanitizeUserForResponse(u))
      : [];
    res.json(safeUsers);
  } catch (error) {
    logger.error(`Cannot GET users || MSG : ${error}`);
    next(error);
  }
};

exports.createUser = async (req, res, next) => {

  try {
    const userTemp = {
      username :req.body.id,
      first_Name:req.body.firstName,
      last_Name:req.body.lastName,
      email:req.body.email,
      phoneNumber:req.body.phoneNumber,
      created_By :req.body.createdBy,
      password:req.body.password,
      roles:req.body.roles,
    }

    const createdUser = await userService.createUser(userTemp);
    logger.info(`User Created Sucessfully with username : ${createdUser.username}`);
    res.status(201).json({"userid" :createdUser.id});
  } catch (error) {
    logger.error(`User Not Created ERROR MSG : ${error}`);
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updatedUser = req.body;
    console.info("User Id: ",userId);
    console.info("User Body: ", updatedUser);

    // This is for status Update ie. Active and Inactive & UPDATE Profile
    await userService.updateUser(userId, updatedUser);
    logger.info(`User Status Updated with userID : ${userId}`);
    res.json({"msg":"updated"})
  
  } catch (error) {
    logger.error(`Error in updating userData | ERROR MSG : ${error}`);
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    await userService.deleteUser(userId);
    logger.info(`User deleted with userID : ${userId}`);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error in deleting userData | ERROR MSG : ${error}`);
    next(error);
  }
};
