const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');


const WitnessDetails = sequelize.define('WitnessDetails', {
  POLICY_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  CLAIM_ID: {
    type: DataTypes.STRING(200),
    allowNull: false,
    primaryKey: true,
  },
  NAME: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  REL_LA: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  SEQUENCE: {
    type: DataTypes.STRING(200),
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
  CATEGORY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  ADDRESS_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  OTHER_RELATIONSHIP: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MILESTONE: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  SIGNATURE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  INSTANCE_NO: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'witness_details',
  timestamps: false,
  freezeTableName: true,
});

module.exports = WitnessDetails;
