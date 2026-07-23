const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const DoctorDetails = sequelize.define('DoctorDetails', {
  DOCTOR_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // false for null but getting error
  },
  CLAIM_ID: {
    type: DataTypes.STRING(200),
    allowNull: false,
    primaryKey: true, 
  },
  CATEGORY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  DOCTOR_NAME: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  REG_NO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  QUALIFICATION: {
    type: DataTypes.STRING(400),
    allowNull: true,
  },
  DT_OF_FIRST_CONSUL: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  CREATED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  CREATED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MODIFIED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  CAUSE_OF_DEATH: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  SEQUENCE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  ADDRESS_ID: {
    type: DataTypes.STRING(400),
    allowNull: true,
  },
  OTHER_QUALIFICATION: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  MILESTONE: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  INSTANCE_NO: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  DOC_SIGN: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  HOSPITAL_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'doctor_details', // Match the table name in the database
  timestamps: false, // Disable automatic timestamp management
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = DoctorDetails;
