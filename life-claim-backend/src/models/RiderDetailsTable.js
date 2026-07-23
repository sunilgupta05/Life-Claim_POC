const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const RiderDetailsTable = sequelize.define(
  "RiderDetailsTable",
  {
    CLAIM_ID: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },

    CREATED_BY: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CREATED_ON: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    MODIFIED_BY: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    MODIFIED_ON: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    }, // to store the rider details fetched from mams main api life asia
    RIDER_CODE: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    RIDER_SA: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    RIDER_RCD: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    RIDER_TERM: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    RIDER_STATUS: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    RIDER_CESSATION_DATE: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    DECISION_ASSESSOR: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    DECISION_REASON_ASSESSOR: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    DECISION_SYSTEM: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    DECISION_REASON_SYSTEM: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    tableName: "rider_details_table", // Match the table name in the database
    timestamps: false,
    freezeTableName: true, // Prevent Sequelize from pluralizing the table name
  }
);

module.exports = RiderDetailsTable;
