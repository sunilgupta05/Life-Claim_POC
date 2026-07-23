const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const AgentRepudiationHistory = sequelize.define('AgentRepudiationHistory', {
  POLICY_NO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  POLICY_STATUS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  FLAG: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  SEQ_NO: {
    type: DataTypes.STRING(200),
    allowNull: false,
    autoIncrement:true,
    defaultValue:"1"
  },
  CLAIM_ID: {
    type: DataTypes.STRING(200),
    allowNull: false,
    primaryKey: true,//have to set this as pk else it creates its own id as pk
  },
  AGENT_TYPE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  AGENT_CODE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  CREATED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  CREATED_ON: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Default to the current timestamp
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MODIFIED_ON: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Default to the current timestamp
    onUpdate: DataTypes.NOW, // Update timestamp on modification
  },
}, {
  tableName: 'agent_repudiation_history', // Match the table name in the database
  timestamps: false, // Disable automatic timestamps
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = AgentRepudiationHistory;
