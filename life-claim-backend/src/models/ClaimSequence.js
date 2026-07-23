const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const ClaimSequence = sequelize.define(
  "ClaimSequence",
  {
    ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    SEQ_NO: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "claim_sequence", // Match the table name in the database
    timestamps: false,
    freezeTableName: true, // Prevent Sequelize from pluralizing the table name
  }
);

module.exports = ClaimSequence;
