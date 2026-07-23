const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const HospitalDetails = sequelize.define('HospitalDetails', {
  EVENT_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // true for now else getting error on this
  },
  CLAIM_ID: {
    type: DataTypes.STRING(200),
    allowNull: false,
    primaryKey: true,
  },
  HOSPITAL_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  DT_OF_ADMN: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  DT_OF_DISCHARGE: {
    type: DataTypes.DATEONLY,
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
  ADDRESS_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  NAME: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  DIAGNOSIS_DT: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  OTHER_HOSPITAL_NAME: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  CATEGORY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  SEQUENCE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MILESTONE: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  NATURE_OF_ILLNESS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  OTH_ILLNESS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  INSTANCE_NO: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'hospital_details', // Match the table name in the database
  timestamps: false, // Disable automatic timestamps
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = HospitalDetails;
