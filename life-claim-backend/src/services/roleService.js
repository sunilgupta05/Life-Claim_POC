// roleService.js (services/roleService.js)

const roleDao = require('../dataAccess/roleDao');

const getAllRoles = async () => {
  return roleDao.getAllRoles();
};

const getRoleById = async (roleId) => {
  return roleDao.getRoleById(roleId);
};

const createRole = async (roleName) => {
  return roleDao.createRole(roleName);
};

const updateRole = async (roleId, roleName) => {
  return roleDao.updateRole(roleId, roleName);
};

const deleteRole = async (roleId) => {
  return roleDao.deleteRole(roleId);
};

// Other service methods for roles can be added here
module.exports = {
    getAllRoles, getRoleById, 
    createRole,
    updateRole,
    deleteRole,
    
  };