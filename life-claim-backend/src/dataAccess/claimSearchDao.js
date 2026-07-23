const db = require('../config/dbConfig'); // Assuming you already have dbConfig set up
const StatusHistory = require('../models/StatusHistory');
const claimsService = require('../services/claimsService');
const LifeAssuredDetail = require('../models/LifeAssuredDetail');
const notificationQueueService = require('../services/notificationQueueService');


const claimSearchInDB = async (claimNumber) => {
  const query = 'SELECT * FROM claims_poc.claims WHERE CLAIM_NUMBER = ?';
  const [rows] = await db.execute(query, [claimNumber]);
  //   console.log('DB query result:', rows); // Log the query result
  return rows.length ? rows[0] : null;
};

const editAssessor = async (assessor, claimNumber, username) => {
  try {
    console.log(assessor)
    const decisionVal = String(assessor.DECISION || assessor.decision || '').toLowerCase();
    const remarksVal = assessor.REMARKS || assessor.remarks || '';
    const claimRow = await claimSearchInDB(claimNumber);
    const policyNumber = claimRow?.POLICY_ID || claimRow?.POLICY_NUMBER || '';
    let role = ""
    let status = {}

    if (decisionVal === 'accept') {
      role = "Verifier"
      status = {
        "CLAIM_NUMBER": claimNumber,
        "POLICY_NUMBER": policyNumber,
        "MODIFIED_BY": username,
        "STATUS": "Pending Verifier Allocation",
        "DECISION": decisionVal,
        "REMARKS": remarksVal
      }
      await claimsService.unassignClaim(claimNumber);
    } else if (decisionVal === 'reject') {
      role = "Payout Rejected"
      status = {
        "CLAIM_NUMBER": claimNumber,
        "POLICY_NUMBER": policyNumber,
        "MODIFIED_BY": username,
        "STATUS": "Payout Rejected",
        "DECISION": decisionVal,
        "REMARKS": remarksVal
      }
      await claimsService.unassignClaim(claimNumber);
    } else {
      role = "Assessor"
      status = {
        "CLAIM_NUMBER": claimNumber,
        "POLICY_NUMBER": policyNumber,
        "MODIFIED_BY": username,
        "STATUS": "Pending Assessor Action",
        "DECISION": decisionVal,
        "REMARKS": remarksVal
      }
    }

    const status_change = await claimsService.changeStatus(claimNumber, status.STATUS, username, 'Assessor');
    const role_change = await claimsService.changeRole(claimNumber, role);
    const status_history = await StatusHistory.create(status)
    // claimNo not available in decision_accessor hence fetch claim_id
    const [claimRows] = await db.execute(
      'SELECT CLAIM_ID FROM claims WHERE CLAIM_NUMBER = ?',
      [claimNumber]
    );

    if (claimRows.length === 0) {
      throw new Error(`No claim found with claimNumber: ${claimNumber}`);
    }

    const claimId = claimRows[0].CLAIM_ID;

    // 🚀 Enqueue Assessor decision notification (RabbitMQ)
    try {
      const lifeAssured = await LifeAssuredDetail.findOne({ where: { CLAIM_ID: String(claimId) } });
      if (lifeAssured) {
        const mobileNo =
          lifeAssured.MOBILE_NO1 || lifeAssured.MOBILE_NO || lifeAssured.MOBILE_NO2 || lifeAssured.MOBILE_ID1;
        const email = lifeAssured.EMAIL_ID1 || lifeAssured.EMAIL_ID || lifeAssured.EMAIL || null;

        await notificationQueueService.enqueueAssessorDecisionNotification({
          claimId: claimNumber,
          email,
          mobileNo,
          decision: assessor.DECISION,
        });
      }
    } catch (notifyErr) {
      console.error(
        'NotificationQueue >> Error enqueueing assessor decision notification:',
        notifyErr?.message || notifyErr
      );
    }

    const fields = Object.keys(assessor);
    const values = Object.values(assessor);

    const setClause = fields.map((field) => `${field} = ?`).join(', ');

    // Add claimId to the values array for the WHERE clause
    values.push(claimId);

    if (setClause) {
      // if setClause empty then it gives warning so if is applied
      const updateQuery = `UPDATE decision_accessor SET ${setClause} WHERE CLAIM_ID = ?`;

      const [updateRows] = await db.execute(updateQuery, values);
      return decisionVal;

    } else {
      throw new Error('No fields to update');
    }

  } catch (error) {
    console.error('Error in editAssessor:', error.message);
    throw error;
  }
};
const editVerifier = async (verifierSnake, claimNumberSnake, username) => {
  try {

    let status = {}
    let role = "";
    console.log(verifierSnake)
    if (verifierSnake.STATUS == 'fail') {
      status = {
        "CLAIM_NUMBER": claimNumberSnake,
        "POLICY_NUMBER": "03591765",
        "MODIFIED_BY": username,
        // "STATUS": "Pending Assessor Allocation",
        "STATUS":"Verifier Rejected",
        "DECISION": verifierSnake.STATUS,
        "REMARKS": verifierSnake.REMARKS
      }

      role = 'Assessor'
    } else {
      status = {
        "CLAIM_NUMBER": claimNumberSnake,
        "POLICY_NUMBER": "03591765",
        "MODIFIED_BY": username,
        "STATUS": "Payout Completed",
        "DECISION": verifierSnake.STATUS,
        "REMARKS": verifierSnake.REMARKS
      }

      role = 'Payout Completed'
    }

    const status_change = await claimsService.changeStatus(claimNumberSnake, status.STATUS, username, 'Verifier');
    const unassigned = await claimsService.unassignClaim(claimNumberSnake);

    const role_change = await claimsService.changeRole(claimNumberSnake, role);

    const status_history = await StatusHistory.create(status)
    console.log(claimNumberSnake)

    // 🚀 Enqueue WhatsApp Notification for Payout Completed (RabbitMQ)
    if (status.STATUS === "Payout Completed") {
      try {
        const [claimRows] = await db.execute(
          'SELECT CLAIM_ID FROM claims WHERE CLAIM_NUMBER = ?',
          [claimNumberSnake]
        );
        
        if (claimRows.length > 0) {
          const claimId = claimRows[0].CLAIM_ID;
          const lifeAssured = await LifeAssuredDetail.findOne({ where: { CLAIM_ID: String(claimId) } });
          
          if (lifeAssured) {
            const mobileNo = lifeAssured.MOBILE_NO1 || lifeAssured.MOBILE_NO2 || lifeAssured.MOBILE_ID1;
            const customerName = lifeAssured.NAME;
            const approvedAmount = parseFloat(verifierSnake.TOTAL_NON_RISK_AMOUNT || 0) + parseFloat(verifierSnake.TOTAL_RISK_SA || 0);
            
            if (mobileNo && customerName) {
              console.log(
                `NotificationQueue >> Enqueueing payout completed WhatsApp notification for ${customerName} (${mobileNo})`
              );
              notificationQueueService.enqueueWhatsAppPayoutCompleted(
                mobileNo,
                customerName,
                claimNumberSnake,
                approvedAmount.toFixed(2)
              );
            } else {
              console.warn('NotificationQueue >> Payout notification skipped: Mobile number or Name missing', {
                mobileNo,
                customerName,
              });
            }
          }
        }
      } catch (err) {
        console.error(
          'NotificationQueue >> Error enqueueing payout completed notification:',
          err.message || err
        );
      }
    }

    const [claimRows] = await db.execute(
      'SELECT CLAIM_ID FROM claims WHERE CLAIM_NUMBER = ?',
      [claimNumberSnake]
    );

    if (claimRows.length === 0) {
      throw new Error(`No claim found with claimNumber: ${claimNumberSnake}`);
    }

    const claimId = claimRows[0].CLAIM_ID;

    // 🚀 Enqueue Verifier decision notification (RabbitMQ)
    try {
      const [claimRows2] = await db.execute(
        'SELECT CLAIM_ID FROM claims WHERE CLAIM_NUMBER = ?',
        [claimNumberSnake]
      );

      if (claimRows2.length > 0) {
        const claimId2 = claimRows2[0].CLAIM_ID;
        const lifeAssured2 = await LifeAssuredDetail.findOne({ where: { CLAIM_ID: String(claimId2) } });

        if (lifeAssured2) {
          const mobileNo2 = lifeAssured2.MOBILE_NO1 || lifeAssured2.MOBILE_NO2 || lifeAssured2.MOBILE_ID1;
          const email2 = lifeAssured2.EMAIL_ID1 || lifeAssured2.EMAIL_ID || lifeAssured2.EMAIL || null;

          await notificationQueueService.enqueueVerifierDecisionNotification({
            claimId: claimNumberSnake,
            email: email2,
            mobileNo: mobileNo2,
            decision: verifierSnake.STATUS,
          });
        }
      }
    } catch (notifyErr) {
      console.error(
        'NotificationQueue >> Error enqueueing verifier decision notification:',
        notifyErr?.message || notifyErr
      );
    }

    const fields = Object.keys(verifierSnake);
    const values = Object.values(verifierSnake);

    const setClause = fields.map((field) => `${field} = ?`).join(', ');

    // Add claimId to the values array for the WHERE clause
    values.push(claimId);

    if (setClause) {
      // if setClause empty then it gives warning so if is applied
      const updateQuery = `UPDATE decision_verification_and_summary SET ${setClause} WHERE CLAIM_ID = ?`;

      const [updateRows] = await db.execute(updateQuery, values);
      return verifierSnake.STATUS;

    } else {
      throw new Error('No fields to update');
    }

  } catch (error) {
    console.error('Error in editVerifier:', error.message);
    throw error;
  }
};

module.exports = {
  claimSearchInDB, editAssessor, editVerifier
};
