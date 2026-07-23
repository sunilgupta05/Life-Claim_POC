const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const CapsEmailCommMaster = sequelize.define('CapsEmailCommMaster', {
  // Define the table's columns and their types
  ID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  CLAIMSTATUS: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  LEVEL: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  SUBJECT: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  BODY: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  }
}, {
  // Optional: Additional model options
  tableName: 'caps_email_comm_master', // Specifies the table name
  timestamps: false // Disable timestamps if not needed
});

module.exports = CapsEmailCommMaster;
