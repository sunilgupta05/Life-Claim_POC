// roleDao.js (dataAccess/roleDao.js)

const Role = require("../models/Role");

const getAllRoles = async () => {
  console.log("breakpoint ::");
  return Role.findAll({
    attributes: ["id", "role_name"],
  });
};

const getRoleById = async (roleId) => {
  return Role.findByPk(roleId);
};

const createRole = async (roleName) => {
  try {
    const role = await Role.create({ role_name: roleName.role_name });
    return role;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error; // Rethrow the error after logging it
  }
};

const updateRole = async (roleId, roleName) => {
  return Role.update({ role_name: roleName }, { where: { id: roleId } });
};

const deleteRole = async (roleId) => {
  return Role.destroy({ where: { id: roleId } });
};

// Other CRUD operations for roles can be added similarly
module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
