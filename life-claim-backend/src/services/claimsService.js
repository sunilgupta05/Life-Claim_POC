const db = require("../config/dbConfig")
const LifeAssuredDetail = require('../models/LifeAssuredDetail');
const notificationQueueService = require('../services/notificationQueueService');
const DB_SCHEMA = process.env.DB_DATABASE || 'life_claim';

exports.getClaimByUsername = async (username) => {
    try {
        const query = `
          SELECT
            c.CLAIM_NUMBER,
            c.CLAIM_ID,
            c.POLICY_ID,
            c.CLAIM_TYPE,
            c.CLAIM_STATUS,
            c.INITIMATION_DATE,
            c.CREATED_BY,
            c.CREATED_AT,
            c.MODIFIED_BY,
            c.MODIFIED_AT,
            c.status,
            c.role,
            c.ASSIGNED_TO,
            c.ASSESSMENT_USERNAME,
            c.APPROVER_USERNAME,
            COALESCE(cd.CURRENT_SA, cd.ORIGINAL_SA, 0) AS amount,
            cd.CURRENT_SA,
            cd.ORIGINAL_SA,
            COALESCE(
              NULLIF(TRIM(clm.claimant_name), ''),
              NULLIF(TRIM(la.NAME), '')
            ) AS claimant_name
          FROM ${DB_SCHEMA}.claims c
          LEFT JOIN ${DB_SCHEMA}.contact_details cd
            ON cd.CLAIM_ID = CAST(c.CLAIM_ID AS CHAR)
          LEFT JOIN (
            SELECT CLAIM_ID, MIN(NULLIF(TRIM(NAME), '')) AS claimant_name
            FROM ${DB_SCHEMA}.claimant_details
            GROUP BY CLAIM_ID
          ) clm ON clm.CLAIM_ID = CAST(c.CLAIM_ID AS CHAR)
          LEFT JOIN ${DB_SCHEMA}.life_assured_details la
            ON la.CLAIM_ID = CAST(c.CLAIM_ID AS CHAR)
          WHERE c.ASSIGNED_TO = ?
             OR c.MODIFIED_BY = ?
             OR c.ASSESSMENT_USERNAME = ?
             OR c.APPROVER_USERNAME = ?
             OR c.CREATED_BY = ?
          ORDER BY COALESCE(c.MODIFIED_AT, c.CREATED_AT) DESC
        `
        const [rows] = await db.execute(query, [username, username, username, username, username])
        return rows
    } catch (error) {
        console.log(error)
    }
}


exports.unassignClaim = async (claimNumber) => {
    try {
        const query = `UPDATE ${DB_SCHEMA}.claims SET ASSIGNED_TO=NULL WHERE CLAIM_NUMBER=?`
        const [rows] = await db.execute(query, [claimNumber])
        return rows
    } catch (error) {
        console.log(error)
    }
}


exports.changeStatus = async (claimNumber, status, username, role = null) => {
    try {
        let query = `UPDATE ${DB_SCHEMA}.claims SET status=?, MODIFIED_BY=?, MODIFIED_AT=NOW()`;
        const params = [status, username];

        if (role === 'Assessor') {
            query += ', ASSESSMENT_USERNAME=?';
            params.push(username);
        } else if (role === 'Verifier') {
            query += ', APPROVER_USERNAME=?';
            params.push(username);
        }

        query += ' WHERE CLAIM_NUMBER=?';
        params.push(claimNumber);

        const [rows] = await db.execute(query, params);

        // Trigger assignment notifications when status changes to the appropriate states.
        try {
            const [claimRows] = await db.execute(
                `SELECT CLAIM_ID FROM ${DB_SCHEMA}.claims WHERE CLAIM_NUMBER = ?`,
                [claimNumber]
            );

            if (claimRows.length > 0) {
                const claimId = claimRows[0].CLAIM_ID;
                const lifeAssured = await LifeAssuredDetail.findOne({ where: { CLAIM_ID: String(claimId) } });

                if (lifeAssured) {
                    const mobileNo = lifeAssured.MOBILE_NO1 || lifeAssured.MOBILE_NO2 || lifeAssured.MOBILE_ID1;
                    const email = lifeAssured.EMAIL_ID1 || lifeAssured.EMAIL_ID || lifeAssured.EMAIL || null;

                    if (role === 'Assessor' && status === 'Pending Assessor Action') {
                        console.log(
                            'claimsService >> claim_assigned_to_assessor',
                            'claimNumber',
                            claimNumber,
                            'email',
                            email,
                            'mobileNo',
                            mobileNo
                        );
                        await notificationQueueService.enqueueAssessorAssignmentNotification({
                            claimId: claimNumber,
                            email,
                            mobileNo,
                        });
                    } else if (role === 'Verifier' && status === 'Pending Verifier Allocation') {
                        console.log(
                            'claimsService >> claim_assigned_to_verifier',
                            'claimNumber',
                            claimNumber,
                            'email',
                            email,
                            'mobileNo',
                            mobileNo
                        );
                        await notificationQueueService.enqueueVerifierAssignmentNotification({
                            claimId: claimNumber,
                            email,
                            mobileNo,
                        });
                    }
                }
            }
        } catch (notifyErr) {
            console.error(
                'claimsService >> Error enqueueing assignment notification:',
                notifyErr?.message || notifyErr
            );
        }

        return rows;
    } catch (error) {
        console.log(error);
    }
}

exports.changeRole = async (claimNumber, role) => {
    try {
        const query = `UPDATE ${DB_SCHEMA}.claims SET role=? WHERE CLAIM_NUMBER=?`
        const [rows] = await db.execute(query, [role, claimNumber])
        return rows
    } catch (error) {
        console.log(error)
    }
}