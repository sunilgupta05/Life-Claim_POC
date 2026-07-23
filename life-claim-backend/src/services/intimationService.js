const IntimationDetail = require('../models/IntimationDetail');
const PayeeDetail = require('../models/PayeeDetail');

const createIntimation = async (intimationData) => {
  return await IntimationDetail.create(intimationData);
};

const createPayee = async (payeeData) => {
  return await PayeeDetail.create(payeeData);
};

module.exports = { createIntimation, createPayee };
