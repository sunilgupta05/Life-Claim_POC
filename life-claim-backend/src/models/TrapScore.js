const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path based on your setup

const TrapScore = sequelize.define('trap_score', {
  CLAIM_ID: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  TRAP_ID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  TRAP_SCORE_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  ASSESSOR_NAME: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ASSESSOR_ID: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  TRAP_REMARKS: {
    type: DataTypes.STRING(10000),
    allowNull: true
  },
  TRAP_SCORE: {
    type: DataTypes.DOUBLE,
    allowNull: true
  }
}, {
  tableName: 'trap_score', // Explicitly set the table name
  timestamps: false // Disable automatic timestamp fields
});

module.exports = TrapScore;