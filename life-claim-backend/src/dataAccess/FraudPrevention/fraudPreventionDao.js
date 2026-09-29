const logger = require('../../util/logger');
const db = require('../../config/dbConfig');

// VAPT: scoped to the caller's own claim — the controller already extracted
// claimNumber for this purpose, but it was silently dropped here, which let any
// operational-role user pull every claim's bank account number system-wide.
const claimantBankdetailsCheck = async (claimNumber) => {
    try {
        const result = await db.query(
            `select c.claim_id, es.acc_no, es.bank_name, es.agent_code,  es.agent_name, c.claim_number, c.policy_id,  c.status
             from eagle_screen es
             inner join claims c on c.claim_id = es.claim_id
             where es.bank_name not in ('ICICI Bank', 'ICICI', 'ASPHIRE', 'DHFL')
               and c.claim_number = ?`,
            [claimNumber]
        );
        logger.info('DataAccess >> FraudPrevention >> fraudPreventionDao.js >> result :>', result);
        return result[0];
    } catch (error) {
        //throw new Error('Database error >> claimantBankdetailsCheck : ' + error.message);
        return `Error in DataAccess >> FraudPrevention >> fraudPreventionDao.js >> claimantBankdetailsCheck : ${error.message}`;
    }
};

// VAPT: same fix — claimNumber was already being passed by the controller and ignored.
const agentTrendCheck = async (source, agentType, claimNumber) => {
    try {
        agentType = 'AG';
        const result = await db.query(
            `select cd.advisorCode, cd.advisorName, cd.policyNumber, m.bond_Type, ar.agent_type, m.status
             from claims m
             inner join contractdetails cd on cd.policynumber=m.policy_id
             inner join agentrepudiation ar on ar.policy_no = m.policy_id
             where m.source = ? and ar.agent_type = ? and m.claim_number = ?`,
            [source, agentType, claimNumber]
        );
        return result[0];
    } catch (error) {
        return `Error in DataAccess >> FraudPrevention >> fraudPreventionDao.js >> agentTrendCheck : ${error.message}`;
    }
};

const mobileNumberCheck = async (la_number) => {
    try {
        const la_num1 = la_number.LA_number1;
        const la_num2 = la_number.LA_number2;
        const ruleFourResult = await db.query('select c.claim_number, c.policy_id, es.agent_Name, es.Agent_Code, c.role, c.status from eagle_screen es inner join claims c on c.claim_id = es.claim_id inner join life_assured_details la ON c.claim_id = la.claim_id where mobile_No1 = ? or mobile_no2= ?', [la_num1, la_num2]);
        return ruleFourResult[0];
    } catch (e) {
        return `Error in DataAccess >> FraudPrevention >> fraudPreventionDao.js >> mobileNumberCheck : ${e.message}`;
    }
}

const addRuleRemarksDetails = async (feedback, claimNumber, role, username) => {
    logger.info('DataAccess >> FraudPrevention >> fraudPreventionDao.js >> addRuleRemarksDetails >> feedback <:>', feedback, 'feedback.length : >', feedback.length);
    const skippedRules = [];
    try {
        if (!feedback || Object.keys(feedback).length === 0) {
            logger.info('Feedback is empty.');
            return skippedRules;
        }
        for (const [ruleKey, ruleData] of Object.entries(feedback)) {   
            const hasValidData = Object.values(ruleData).some(value => {
                if (typeof value === 'string') {
                    return value.trim() !== '';
                }
                return value !== null && value !== undefined;
            });

            if (hasValidData) {
                const ruleNumber = ruleKey.replace(/[^\d]/g, '');

                const statusKey = `status${ruleNumber}`;
                const remarksKey = `remarks${ruleNumber}`;

                const status = ruleData[statusKey] || ruleData.decision || '';
                const remark = ruleData[remarksKey] || ruleData.remark || '';

                
                const sql = 'INSERT INTO caps_eagle_rule_details (claim_id, ruleCode, user_id, user_role, decision, remark) VALUES (?, ?, ?, ?, ?, ?)';
                try {

                    await db.query(sql, [ claimNumber, ruleNumber, username, role, status, remark]);
                    logger.info(`Inserted  ${ruleKey}: claimNumber = ${claimNumber} ruleNumber = ${ruleNumber} username =  ${username} role = ${role} status = ${status}, remarks = ${remark}`);
                } catch (err) {
                    logger.error(`Failed to insert ${ruleKey}`, err);
                    return {sucess: false, message: ` Error : ${err}` };
                }
            } else {
                skippedRules.push(ruleKey);
                logger.info(`Skipped ${ruleKey} (no valid data)`);
            }
        }

        if (skippedRules.length > 0 && skippedRules.length === Object.keys(feedback).length) {
            return { success: false, message: 'No valid rule feedback to save', skippedRules };
        }
        return { success: true, message: 'Rules Added successfully', skippedRules };
    } catch (e) {
        return `Error in DataAccess >> FraudPrevention >> fraudPreventionDao.js >> addRuleRemarksDetails : ${e.message}`;
    }
}

const getEagleRuleRemarksDetails = async (claimNumber) => {
    try{
        const result = await db.query('select * from caps_eagle_rule_details where claim_id = ?', [claimNumber]);
        return result[0];
    }catch(e){
        return `Error in DataAccess >> FraudPrevention >> fraudPreventionDao.js >> getEagleRuleRemarksDetails : ${e.message}`;
    }
}

const updateCapsEagleRuleDetails = async (updatedFeedback) => {

    logger.info('dataAccess >> FraudPrevention >> fraudPreventionDao.js >> updateCapsEagleRuleDetails >updatedFeedback  >:<', updatedFeedback);
    try{
        if (!updatedFeedback || Object.keys(updatedFeedback).length === 0) {
            logger.info('UpdatedFeedback is empty.');
            return { success: false, message: 'No data to update' };
        }

        for (const [ruleKey, ruleData] of Object.entries(updatedFeedback)) {
            const claimId = ruleData.claim_id;
            const ruleCode = ruleData.ruleCode;
            const decision = ruleData.decision;
            const remark = ruleData.remark;

            if (claimId && ruleCode) {
                const sql = `UPDATE caps_eagle_rule_details 
                           SET decision = ?, remark = ? 
                           WHERE claim_id = ? AND ruleCode = ?`;
                
                try {
                    await db.query(sql, [decision, remark, claimId, ruleCode]);
                    logger.info(`Updated rule ${ruleCode} for claim ${claimId}: decision = ${decision}, remark = ${remark}`);
                } catch (err) {
                    logger.error(`Failed to update rule ${ruleCode} for claim ${claimId}`, err);
                    return { success: false, message: `Error updating rule ${ruleCode}: ${err.message}` };
                }
            } else {
                logger.info(`Skipped ${ruleKey} (missing claim_id or ruleCode)`);
            }
        }

        return { success: true, message: 'Rules updated successfully' };

    }catch(e){
        return { success: false, message: `Error in updateCapsEagleRuleDetails: ${e.message}` }; 
    }
}





module.exports = { claimantBankdetailsCheck, agentTrendCheck, mobileNumberCheck, addRuleRemarksDetails, getEagleRuleRemarksDetails, updateCapsEagleRuleDetails }; 