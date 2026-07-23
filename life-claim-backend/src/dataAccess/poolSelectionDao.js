const db = require('../config/dbConfig'); // Assuming you already have dbConfig set up
const claimsService = require('../services/claimsService')
const StatusHistory = require('../models/StatusHistory');

const getPoolDataInDB = async (selectedPool) => {
  const query = 'select CLAIM_NUMBER,POLICY_ID,STATUS,ROLE,CREATED_AT,CREATED_BY from claims_poc.claims where role=? and ASSIGNED_TO is null';
  const [rows] = await db.execute(query, [selectedPool]);
  //console.log('DB query result:', rows); // Log the query result
  return rows;
};

const updateAssignedUserInDB = async (claimNumber, LoggedUser, role) => {
  const query = ' update claims_poc.claims set ASSIGNED_TO=? where CLAIM_NUMBER=? and  ASSIGNED_TO is null';
  const [rows] = await db.execute(query, [LoggedUser, claimNumber]);
  const status = {
    "CLAIM_NUMBER": claimNumber,
    "POLICY_NUMBER": "1234",
    "MODIFIED_BY": LoggedUser,
    // "CREATED_BY": LoggedUser,
    // "CREATED_AT": currentTime,
    "STATUS": role==='Assessor' ? "Pending Assessor Action" : "Pending Verifier Action"
  }

  // console.log(role)
  const status_change = await claimsService.changeStatus(claimNumber, status.STATUS, LoggedUser);
  const status_history = await StatusHistory.create(status)
  // console.log(rows)
  return rows;
};

module.exports = {
  getPoolDataInDB,
  updateAssignedUserInDB
};