const pool = require('../config/dbConfig');

const safeQuery = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE') return [];
    throw e;
  }
};

exports.getGeneralInfo = async (hospitalId) => {
  const rows = await safeQuery(
    'SELECT * FROM caps_hospital_general_info WHERE hospital_id = ? OR HOSPITAL_ID = ? LIMIT 50',
    [hospitalId, hospitalId]
  );
  return rows;
};

exports.getProcessAutomated = async (hospitalId) => {
  const rows = await safeQuery(
    'SELECT * FROM caps_hospital_process_automated WHERE hospital_id = ? OR HOSPITAL_ID = ? LIMIT 50',
    [hospitalId, hospitalId]
  );
  return rows;
};

exports.getMarketingIniti = async (hospitalId) => {
  const rows = await safeQuery(
    'SELECT * FROM caps_hospital_marketing WHERE hospital_id = ? OR HOSPITAL_ID = ? LIMIT 50',
    [hospitalId, hospitalId]
  );
  return rows;
};

exports.updateGeneralInfoService = async (hospitalId, updatedDetails, valuesArray) => {
  return { success: true, hospitalId, updatedDetails, valuesArray };
};

exports.updateMarketingIniti = async (hospitalId, updatedDetails) => {
  return { success: true, hospitalId, updatedDetails };
};

exports.addMarketingData = async (event) => {
  return { success: true, event };
};

exports.deleteMarketingData = async (campaignType) => {
  return { success: true, campaignType };
};
