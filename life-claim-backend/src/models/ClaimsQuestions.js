const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ClaimQuestions = sequelize.define('ClaimQuestions', {
  CLAIM_ID: {
    type: DataTypes.STRING(200),
    primaryKey: true,
    allowNull: false,
  },
  QUESTION0: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION1: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION2: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION3: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION4: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION5: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION6: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION7: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION8: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION9: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION10: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION11: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION12: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION13: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION14: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION15: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION16: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION17: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION18: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION19: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION20: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION21: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION22: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION23: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION24: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION25: { type: DataTypes.STRING(3), allowNull: true },
  QUESTION26: { type: DataTypes.STRING(3), allowNull: true },
  CREATED_BY: { type: DataTypes.STRING(255), allowNull: true },
  MODIFIED_BY: { type: DataTypes.STRING(255), allowNull: true },
  CREATED_AT: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  MODIFIED_AT: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW },
}, {
  tableName: 'claim_questions',
  timestamps: false, // Manually managing timestamps
});

module.exports = ClaimQuestions;
