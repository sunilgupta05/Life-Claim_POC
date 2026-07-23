// roleController.js (controllers/roleController.js)

const roleService = require('../services/roleService');
const logger = require('../config/logConfig');

const getAllRoles = async (req, res, next) => {
  
  try {
    const roles = await roleService.getAllRoles();
    const rolesData = res.json(roles);
    //logger.info(`Roles Fetched Sucessfully`);
  } catch (error) {
    logger.error(`Error in fetching roles | ERROR MSG : ${error}`);
    next(error);
  }
};

const getRoleById = async (req, res, next) => {
  const roleId = req.params.id;
  try {
    const role = await roleService.getRoleById(roleId);
    logger.info(`Role Fetched with ID ${roleId} Sucessfully`);
    res.json(role);
  } catch (error) {
    logger.error(`Error in getting role by ID | ERROR MSG : ${error}`);
    next(error);
  }
};

const createRole = async (req, res, next) => {
  const roleName  = req.body.rolename;
  const roleDes = req.body.roleDescription

  const roleInfo = {
    id:null,
    role_name:roleName,
    role_description:roleDes
  }

  console.log(roleInfo); // check 2
  try {
    const newRole = await roleService.createRole(roleInfo);
    logger.info(`[ ${roleName} ] Role created Sucessfully`);

    res.status(201).json({"id":newRole.id});
  } catch (error) {
    logger.error(`Error in creating role [ ${roleName} ]  | ERROR MSG : ${error}`);
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  const roleId = req.params.id;
  const { roleName } = req.body;
  try {
    await roleService.updateRole(roleId, roleName);
    logger.info(`Role with ID ${roleId} Updated Sucessfully`);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error in updating Role with ID ${roleId} | ERROR MSG : ${error}`);
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  const roleId = req.params.id;
  try {
    await roleService.deleteRole(roleId);
    logger.info(`Role with ID ${roleId} deleted Sucessfully`);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error in deleting Role with ID ${roleId} | ERROR MSG : ${error}`);
    next(error);
  }
};

// Other controller methods for roles can be added similarly
module.exports = {
    getAllRoles, getRoleById, 
    createRole,
    updateRole,
    deleteRole,
    
  };