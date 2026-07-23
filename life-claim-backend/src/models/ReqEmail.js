const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ReqEmail = sequelize.define('ReqEmail', {
  SERIAL_NO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  CLAIM_ID: {
    type: DataTypes.STRING(200),
    allowNull: false,
    primaryKey: true,
  },
  LETTER_CODE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  LETTER_PATH: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  TRIGGER_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  TRIGGER_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  NOT_SEND_REASON: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  SEND_FLAG: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  DISPATCH_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  STATUS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  EMAIL_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  BILL_NO: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  REQUIREMENT_PUSH_FLAG: {
    type: DataTypes.STRING(200),
    defaultValue: 'N',
    allowNull: true,
  },
  CTM_STATUS: {
    type: DataTypes.STRING(200),
    defaultValue: 'No',
    allowNull: true,
  },
  POD: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  FILENET_ID: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  CREATED_ON: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Default to the current timestamp
  },
  CREATED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MODIFIED_ON: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Default to the current timestamp
    onUpdate: DataTypes.NOW, // Update timestamp on modification
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  SFTP_UPLOAD_STATUS: {
    type: DataTypes.STRING(4000),
    allowNull: true,
  },
}, {
  tableName: 'letters_and_emails', // The table name in your database
  timestamps: false, // If you're not using Sequelize's automatic timestamps
  freezeTableName: true,
});

module.exports = ReqEmail;
