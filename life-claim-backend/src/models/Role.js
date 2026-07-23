// Role.js (models/Role.js)

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
 
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  role_description:{
    type: DataTypes.STRING(255),
    allowNull: true,
  }
},{
  timestamps:false
});
 
module.exports = Role;