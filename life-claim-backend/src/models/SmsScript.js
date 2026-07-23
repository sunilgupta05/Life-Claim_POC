const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const SmsScript = sequelize.define('SmsScript', {
    SERIAL_NO: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    CLAIM_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    SMS_CODE: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    SMS_TEXT: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    },
    MOBILE_NUMBER: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    TRIGGERED_BY: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    TRIGGERED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    NOT_SEND_REASON: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    SEND_FLAG: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    CREATED_ON: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    MODIFIED_ON: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW,
    },
    WHATSAPP_SEND_FLAG: {
        type: DataTypes.STRING(200),
        allowNull: true,
        defaultValue: null,
    },
    RETRIGGER: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    ECAMP_DELIVERY_STATUS: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    ECAMP_TRANS_ID: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    SMS_CAMPAIGN_NAME: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    MODIFIED_BY: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    CREATED_BY: {
        type: DataTypes.STRING(200),
        allowNull: true,
    }
}, {
    tableName: 'sms_script',
    timestamps: false,
});

module.exports = SmsScript;
