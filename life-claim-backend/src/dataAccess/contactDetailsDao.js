// const pool = require('../config/dbConfig');
// const ContactDetails = require('../models/ContactDetail');

// class contactDetailsDao {

//     async createContactDetails(contactDetails, transaction) {
//         try {
//             const transformedData = this.mapDTOToSequelize(contactDetails);
//             console.log("Transformed  :   ", transformedData);
//             const createContactResult = await ContactDetails.create(transformedData, { transaction });
//             console.log("Output:  ", this.mapSequelizeToDTO(createContactResult));
//             return this.mapSequelizeToDTO(createContactResult);
//         }
//         catch (err) {
//             throw new Error(`Error creating Contact Details: ${err.message}`);
//         }
//     }

//     mapSequelizeToDTO(contactDetails) {
//         return {
//             suspiciousDetails: contactDetails.SUSPICIOUS_DETAILS,
//             appno: contactDetails.APP_NO,
//             policyno: contactDetails.POLICY_NO,
//             productname: contactDetails.PRODUCT_NAME,
//             productcode: contactDetails.PRODUCT_CODE,
//             cdfdate: contactDetails.CDF_DATE,
//             telno: contactDetails.TEL_NO,
//             policyage: contactDetails.POLICY_AGE,
//             mobilenochange: contactDetails.MOBILE_NO_CHANGE,
//             emailidchange: contactDetails.EMAIL_ID_CHANGE,
//             policyage1: contactDetails.POLICY_AGE1,
//             ekitprinted: contactDetails.EKIT_PRINTED,
//             ekitdate: contactDetails.EKIT_DATE,
//             namechangedecl: contactDetails.NAME_CHANGE_DECL,
//             knowntolifeasr: contactDetails.KNOWN_TO_LIFE_ASR,
//             propdate: contactDetails.PROP_DATE,
//             reln: contactDetails.RELN,
//             outstandingloansched: contactDetails.OUTSTANDING_LOAN_SCHED,
//             issuedate: contactDetails.ISSUE_DATE,
//             claimsrupidiate: contactDetails.CLAIMS_RUPIDIATE,
//             outstandningloannoc: contactDetails.OUTSTANDING_LOAN_NO_C,
//             paidtodate: contactDetails.PAID_TO_DATE,
//             rcd: contactDetails.RCD,
//             riskdate: contactDetails.RISK_DATE,
//             premfreq: contactDetails.PREM_FREQ,
//             term: contactDetails.TERM,
//             premstatus: contactDetails.PREM_STATUS,
//             prempaidyrs: contactDetails.PREM_PAID_YRS,
//             firstpremdep: contactDetails.FIRST_PREM_DEP,
//             totalprempaid: contactDetails.TOTAL_PREM_PAID,
//             originalsa: contactDetails.ORIGINAL_SA,
//             currentsa: contactDetails.CURRENT_SA,
//             avialablesa: contactDetails.AVAILABLE_SA,
//             actualvalue: contactDetails.ACTUAL_VALUE,
//             estimatedvalue: contactDetails.ESTIMATED_VALUE,
//             maturityvalue: contactDetails.MATURITY_VALUE,
//             guarfund: contactDetails.GUAR_FUND,
//             claimstatus: contactDetails.CLAIM_STATUS,
//             cashvalue: contactDetails.CASH_VALUE,
//             custindicator: contactDetails.CUST_INDICATOR,
//             excessprem: contactDetails.EXCESS_PREM,
//             finpost: contactDetails.FIN_POST,
//             outstandingloan: contactDetails.OUTSTANDING_LOAN,
//             advisorcode: contactDetails.ADVISOR_CODE,
//             medicaldate: contactDetails.MEDICAL_DATE,
//             medtrig: contactDetails.MED_TRIG,
//             malpracticecode: contactDetails.MALPRACTICE_CODE,
//             advcate: contactDetails.ADVOCATE,
//             advisorstatus: contactDetails.ADVISOR_STATUS,
//             assignment: contactDetails.ASSIGNMENT,
//             saleschannel: contactDetails.SALES_CHANNEL,
//             umcode: contactDetails.UM_CODE,
//             uwdec: contactDetails.UW_DEC,
//             uwdecdate: contactDetails.UW_DEC_DATE,
//             resxrt: contactDetails.RES_XRT,
//             medcode: contactDetails.MED_CODE,
//             indcode: contactDetails.IND_CODE,
//             inddesc: contactDetails.IND_DESC,
//             agenttype: contactDetails.AGENT_TYPE,
//             agenttypedesc: contactDetails.AGENT_TYPE_DESC,
//             statcode: contactDetails.STAT_CODE,
//             basecomponent: contactDetails.BASE_COMPONENT
//         };
//     }

//     mapDTOToSequelize(dto) {
//         return {
//             SUSPICIOUS_DETAILS: dto.suspiciousDetails,
//             APP_NO: dto.appno,
//             POLICY_NO: dto.policyno,
//             PRODUCT_NAME: dto.productname,
//             PRODUCT_CODE: dto.productcode,
//             CDF_DATE: dto.cdfdate,
//             TEL_NO: dto.telno,
//             POLICY_AGE: dto.policyage,
//             MOBILE_NO_CHANGE: dto.mobilenochange,
//             EMAIL_ID_CHANGE: dto.emailidchange,
//             POLICY_AGE1: dto.policyage1,
//             EKIT_PRINTED: dto.ekitprinted,
//             EKIT_DATE: dto.ekitdate,
//             NAME_CHANGE_DECL: dto.namechangedecl,
//             KNOWN_TO_LIFE_ASR: dto.knowntolifeasr,
//             PROP_DATE: dto.propdate,
//             RELN: dto.reln,
//             OUTSTANDING_LOAN_SCHED: dto.outstandingloansched,
//             ISSUE_DATE: dto.issuedate,
//             CLAIMS_RUPIDIATE: dto.claimsrupidiate,
//             OUTSTANDING_LOAN_NO_C: dto.outstandningloannoc,
//             PAID_TO_DATE: dto.paidtodate,
//             RCD: dto.rcd,
//             RISK_DATE: dto.riskdate,
//             PREM_FREQ: dto.premfreq,
//             TERM: dto.term,
//             PREM_STATUS: dto.premstatus,
//             PREM_PAID_YRS: dto.prempaidyrs,
//             FIRST_PREM_DEP: dto.firstpremdep,
//             TOTAL_PREM_PAID: dto.totalprempaid,
//             ORIGINAL_SA: dto.originalsa,
//             CURRENT_SA: dto.currentsa,
//             AVAILABLE_SA: dto.avialablesa,
//             ACTUAL_VALUE: dto.actualvalue,
//             ESTIMATED_VALUE: dto.estimatedvalue,
//             MATURITY_VALUE: dto.maturityvalue,
//             GUAR_FUND: dto.guarfund,
//             CLAIM_STATUS: dto.claimstatus,
//             CASH_VALUE: dto.cashvalue,
//             CUST_INDICATOR: dto.custindicator,
//             EXCESS_PREM: dto.excessprem,
//             FIN_POST: dto.finpost,
//             OUTSTANDING_LOAN: dto.outstandingloan,
//             ADVISOR_CODE: dto.advisorcode,
//             MEDICAL_DATE: dto.medicaldate,
//             MED_TRIG: dto.medtrig,
//             MALPRACTICE_CODE: dto.malpracticecode,
//             ADVOCATE: dto.advocate,
//             ADVISOR_STATUS: dto.advisorstatus,
//             ASSIGNMENT: dto.assignment,
//             SALES_CHANNEL: dto.saleschannel,
//             UM_CODE: dto.umcode,
//             UW_DEC: dto.uwdec,
//             UW_DEC_DATE: dto.uwdecdate,
//             RES_XRT: dto.resxrt,
//             MED_CODE: dto.medcode,
//             IND_CODE: dto.indcode,
//             IND_DESC: dto.inddesc,
//             AGENT_TYPE: dto.agenttype,
//             AGENT_TYPE_DESC: dto.agenttypedesc,
//             STAT_CODE: dto.statcode,
//             BASE_COMPONENT: dto.basecomponent
//         };
//     }
// }

// module.exports = new contactDetailsDao();
