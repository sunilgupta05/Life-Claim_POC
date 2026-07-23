const db = require("../config/dbConfig");
const moment = require("moment");


const generateSystemDecision = async (obj) => {
  try {

      const uuid22 = crypto.randomUUID()
      let decDetailObj = {}
      if (decDetailObj == null) {
          //start transaction
          // query for CAPS_DECISION_DETAILS

          // DML2 STATE
          //  execute
      }

      // BRE.properties, "ipru.bre.getdetailsforLapsedRule"
      //"ipru.bre.getEventDetails"
      let eventObj = {}
      //"ipru.bre.getRiderSumAssured"
      let riderObj = {}
      //"ipru.bre.getTotalAtRisk"
      let totalAtRiskObj = {}
      //"ipru.bre.getQuestionAnswer"
      let quesAnsObj = {}
      //"getReqStatus"
      let reqStatusObj = {}
      //"getOthInsuCount"
      let getOthInsuObj = {}
      //"getRiderPresent"
      let getRiderPresentObj = {}
      //"getPayeeAndClaimaintCount"
      let getPayeeAndClaimaintObj = {}
      //"getTrapScore"
      let getTrapScoreObj = {}
      let typeOfClaim = null
      let subTypeOfClaim = null

      if (eventObj != null) {
          typeOfClaim = eventObj?.typeOfClaim != null ? eventObj.typeOfClaim : "NA";
          subTypeOfClaim = eventObj?.subTypeOfClaim != null ? eventObj.subTypeOfClaim : "NA";
      } else {
          return "Cause of claim details is Empty"
      }

      if (obj !== null) {

          const transId = crypto.randomUUID();
          let policyStatusOnDOD = obj.policyStatusOnDOD || "IF";
          let agentCategory = obj.agentCategory || "";
          let hniFlag = obj.hniFlag || "";
          let claimType = obj.claimType || "NA";
          let productTypeData = getPortfolioByClaimId(parseInt(claimId));
          let productType = obj.productType;;
          let premiumPaidYear = obj.premiumPaidYear;
          let productCode = obj.productCode;
          let source = obj.source || "";
          let occupationCode = obj.occupationCode || "";
          let annualIncome = obj.annualIncome;
          let trapScore = getTrapScoreObj.TRAPSCORE;
          let diffOfDODandRCD = obj.diffOfDODandRCD;
          let ratedSA = obj.ratedSA;
          let portfolio = obj.portfolio || "";
          let portfolioSubType = obj.portfolioSubType || "";
          let dateOfDeath = null;

          if (claimType !== "NA") {
              dateOfDeath = claimType.toLowerCase() === "Death" ? obj.DATE_OF_DEATH : obj.DATE_OF_DISABILITY;
          } else {
              return "Claim Type is Empty!";
          }

          let issueanceDateinString = obj.ISSUE_DATE;
          let paidToDateinString = obj.PAID_TO_DATE;
          let rcdinString = obj.RCD;
          let riskCommDateinString = obj.RISKCOMMENCEMENTDATE;

          const tempRiskCommDate = "2007-07-01";
          const tempIssueanceDate = "2006-01-01";
          const tempIssueDate = "2012-04-09";

          let compareToRiskCommDate = moment(tempRiskCommDate, "YYYY-MM-DD").toDate();
          let compareToIssuanceDate = moment(tempIssueanceDate, "YYYY-MM-DD").toDate();
          let compareIssueDate = moment(tempIssueDate, "YYYY-MM-DD").toDate();

          let dateOfDeathinDate = moment(dateOfDeath, "YYYY-MM-DD").toDate();

          let issueanceDate = moment(issueanceDateinString, "YYYY-MM-DD").toDate();
          let paidToDate = moment(paidToDateinString, "YYYY-MM-DD").toDate();
          let rcd = moment(rcdinString, "YYYY-MM-DD").toDate();
          let riskCommDate = moment(riskCommDateinString, "YYYY-MM-DD").toDate();
          let sourcingChannel = obj.SOURCINGCHANNEL || "";
          let decision = "NA";
          let reason = "";
          let remark = "";
          let calculatedFields = "";
          let payeeAndClaimaintMatchCount = getPayeeAndClaimCountObj.COUNT; //doubt
          let amountPayble = 0.0;
          let guaranteedFundValueinDouble = obj.GUARANTEED_FUND;
          let fundValue = obj.FUND_VALUE;
          let invesmentFundinDouble = obj.INVESTMENT_FUND;
          let availableSumAssuredinDouble = obj.AVAILABLE_SA;
          let totalPremiumPaid = obj.TOTALPREMIUMPAID;
          let cc0Opted = obj.CC_OPTED;
          let policyAge = obj.POLICY_AGE;
          let productSA = obj.PRODUCTSUMASSURED;
          let saIncreaseFlag = obj.SA_INCREASED_FLAG;
          let premiuminDouble = obj.PREMIUM;
          let reqStatus = reqStatusObj.COUNT; //doubt
          let othInsuCount = getOthInsuObj.COUNT; //doubt
          let reinstatementDate = obj.REINSTATEMENT_DATE;
          let policyStatus = obj.POLICY_STATUS;
          let reinstatementPeriod = 0;
          let ageAtEvent = obj.AGEATEVENT;
          let outstandingLoan = obj.OUTSTANDINGLOANAMOUNT;
          let partialWithdrawnAmount = obj.PARTIALWITHDRAWALAMOUNT;
          let diffOfDodAndIssueDate = obj.DIFFOFDODANDISSUEDATE;
          let policyAgeInDays = policyAge * 365;
          let guaranteedAdditioninDouble = obj.GUARANTEEDADDITIONS;
          let revisonaryBonusinDouble = obj.REVISIONARYBONUS;
          let interimBonusinDouble = obj.INTERIMBONUS;
          let outstandingPremiuminDouble = obj.OUTSTANDINGPREMIUM;
          let excessPremiuminDouble = obj.EXCESSPREMIUM;
          let quesAnsCount = quesAnsObj.COUNT;
          let premFreq = obj.PREMFREQ;
          let numOfDaysBtwCreamAndDod = obj.PERIODBETWEENDATEOFCREAANDDOD || 0;
          let saIncreaseDate = obj.SA_INCREASE_DATE;
          let riderSA = riderObj ? riderObj.RIDERSUMASSURED : 0.0;  // doubt
          let sumAssured = productSA + riderSA;
          let totalSumAtRisk = totalAtRiskObj.TOTALOTHERINSURANCE; //doubt
          let reinstatementPeriodInMonths = 0.0;
          let caseDecision = "NA";
          let stpCaseRemark = "";
          let assignmentFlag = obj.ASSIGNMENTFLAG;
          let riderComponentType = "";
          let pincodeFlag = "";
          let cityFlag = "";
          let newTermPlan = 0;
          let getRiderData = getRiderPresentObj.COUNT;  //doubt

          if (dateOfDeath && reinstatementDate) {
              reinstatementPeriod = nDaysBetweenDates(dateOfDeath, reinstatementDate);
              reinstatementInYear = reinstatementPeriod / 365; //initialize
          }
          if (dateOfDeath && saIncreaseDate) {
              reinstatementPeriod = nDaysBetweenDates(dateOfDeath, saIncreaseDate);
              saIncreaseInYeaer = reinstatementPeriod / 365;
          }

          if (paidToDate && reinstatementDate) {
              reinstatementPeriodInMonths = getReinstatementPeriodInMonths(claimId);
          }

          //"select source as CODE, REASON from caps_fraud_master where fraud_id in (select fraud_id from caps_fraud_flags_mapping  "+ "where claim_id = :claimId )"
          //"caps_fraud_flags_mapping"
          let fraudObj = {}

          if (productCode) {
              //select count(*) as count from CAPS_NEW_TERMS_PLAN_MASTER where product_code=:productCode"
              let newTermPlanObj = {}
              newTermPlan = newTermPlanObj.COUNT;
          }

          //"SELECT count (DISTINCT CRM.RIDERCOMPONENT_TYPE) AS COUNT FROM CAPS_RIDER_DETAILS CRD,CAPS_RIDER_MAPPING_CODES CRM WHERE CRM.RIDER_COMPONENT_CODE= CRD.RIDER_COMPONENT_CODE AND CLAIM_ID =:claimId"
          let riderCompObj = {}
          if (riderCompObj != null) {
              if (riderCompObj.count === "2") {
                  riderComponentType = "Both"
              } else if (riderCompObj.count === "1") {
                  let riderDetailsObj = {}
                  if (riderDetailsObj.riderComponentType === "Accidental") {
                      riderComponentType = "Accidental"
                  } else {
                      riderComponentType = "Non-Accidental"
                  }
              } else {
                  riderComponentType = "No"
              }
          }
      }


      const fraudMaster = CAPS_SAMPLING_MATRIX_HIST.getTrapScoreCity(claimId);

      let pincodeFlag = "No";
      let cityFlag = "No";

      if (fraudMaster.toLowerCase() === "This case is fraud") {
          pincodeFlag = "Yes";
          cityFlag = "Yes";
      } else if (fraudMaster.toLowerCase() === "City is fraud") {
          pincodeFlag = "No";
          cityFlag = "Yes";
      } else if (fraudMaster.toLowerCase() === "Pin code is fraud") {
          pincodeFlag = "Yes";
          cityFlag = "No";
      }


      if (policyStatusOnDOD && claimType && productType) {
          if (
              ["la", "pu"].includes(policyStatusOnDOD.toLowerCase()) &&
              productType.toLowerCase() === "ulip" &&
              claimType.toLowerCase() === "death"
          ){
              if (riskCommDate && paidToDate && rcd) {
                  if (riskCommDate.getTime() < compareToRiskCommDate.getTime() && premiumPaidYear >= 0.0 && premiumPaidYear < 1.0) {
                      if (productCode) {
                          if (productCode.toLowerCase() === "u12") {
                              if (issuanceDate) {
                                  let lapsedPoliciesQuery;
                                  if (issuanceDate.getTime() < compareToIssuanceDate.getTime()) {
                                      lapsedPoliciesQuery = `
                                          SELECT DECISION, REASON, REMARK, AMOUNT_PAYABLE, CALCULATED_FIELDS 
                                          FROM CAPS_LAPSED_POLICIES_MASTER 
                                          WHERE PRODUCT_CODE = :productCode 
                                          AND POLICY_STATUS_ON_DEATH = :policyStatusOnDOD 
                                          AND ISSUANCE_DATE = 'is earlier than Feb 1, 2006' 
                                          AND PREMIUM_PAID_YEARS = '0>=PREMIUM_PAID_YEARS<1'
                                      `;
                                  } else {
                                      lapsedPoliciesQuery = `
                                          SELECT DECISION, REASON, REMARK, AMOUNT_PAYABLE, CALCULATED_FIELDS 
                                          FROM CAPS_LAPSED_POLICIES_MASTER 
                                          WHERE PRODUCT_CODE = :productCode 
                                          AND POLICY_STATUS_ON_DEATH = :policyStatusOnDOD 
                                          AND ISSUANCE_DATE = 'is later than or equal to Jan 1, 2006' 
                                          AND PREMIUM_PAID_YEARS = '0>=PREMIUM_PAID_YEARS<1'
                                      `;
                                  }

                                  const lapsedPoliciesQueryObj = new QueryObject(lapsedPoliciesQuery);
                                  lapsedPoliciesQueryObj.addParameter("productCode", "CAPS_LAPSED_POLICIES_MASTER.PRODUCT_CODE", QueryObject.PARAM_STRING, productCode);
                                  lapsedPoliciesQueryObj.addParameter("policyStatusOnDOD", "CAPS_LAPSED_POLICIES_MASTER.POLICY_STATUS_ON_DEATH", QueryObject.PARAM_STRING, policyStatusOnDOD);

                                  const lapsedPolicyObj = lapsedPoliciesQueryObj.getObject();
                                  if (lapsedPolicyObj) {
                                      decision = lapsedPolicyObj.getStringProperty("DECISION");
                                      reason = lapsedPolicyObj.getStringProperty("REASON");
                                      remark = lapsedPolicyObj.getStringProperty("REMARK");
                                      calculatedFields += lapsedPolicyObj.getStringProperty("CALCULATED_FIELDS") + ";";
                                      amountPayable = obj.getDoubleProperty("FUND_VALUE");
                                  }
                              } else {
                                  return "Issuance date is null";
                              }
                          } else {
                              const lapsedPoliciesQuery = `
                                  SELECT DECISION, REASON, REMARK, AMOUNT_PAYABLE, CALCULATED_FIELDS 
                                  FROM CAPS_LAPSED_POLICIES_MASTER 
                                  WHERE PRODUCT_CODE = :productCode 
                                  AND POLICY_STATUS_ON_DEATH = :policyStatusOnDOD 
                                  AND PREMIUM_PAID_YEARS = '0>=PREMIUM_PAID_YEARS<1'
                              `;

                              const lapsedPoliciesQueryObj = new QueryObject(lapsedPoliciesQuery);
                              lapsedPoliciesQueryObj.addParameter("productCode", "CAPS_LAPSED_POLICIES_MASTER.PRODUCT_CODE", QueryObject.PARAM_STRING, productCode);
                              lapsedPoliciesQueryObj.addParameter("policyStatusOnDOD", "CAPS_LAPSED_POLICIES_MASTER.POLICY_STATUS_ON_DEATH", QueryObject.PARAM_STRING, policyStatusOnDOD);

                              const lapsedPolicyObj = lapsedPoliciesQueryObj.getObject();
                              if (lapsedPolicyObj) {
                                  decision = lapsedPolicyObj.getStringProperty("DECISION");
                                  reason = lapsedPolicyObj.getStringProperty("REASON");
                                  remark = lapsedPolicyObj.getStringProperty("REMARK");
                                  calculatedFields += lapsedPolicyObj.getStringProperty("CALCULATED_FIELDS") + ";";
                                  amountPayable = obj.getDoubleProperty("FUND_VALUE");
                              }
                          }
                      } else {
                          return "Product code is null";
                      }
                  }

                  if (riskCommDate.getTime() < compareToRiskCommDate.getTime() && premiumPaidYear >= 1.0 && premiumPaidYear < 2.0) {
                      if (productCode) {
                          if (productCode.toLowerCase() === "u12") {
                              if (issuanceDate) {
                                  let lapsedPoliciesQuery;
                                  if (issuanceDate.getTime() < compareToIssuanceDate.getTime()) {
                                      lapsedPoliciesQuery = `
                                          SELECT DECISION, REASON, REMARK, AMOUNT_PAYABLE, CALCULATED_FIELDS 
                                          FROM CAPS_LAPSED_POLICIES_MASTER 
                                          WHERE PRODUCT_CODE = :productCode 
                                          AND POLICY_STATUS_ON_DEATH = :policyStatusOnDOD 
                                          AND ISSUANCE_DATE = 'is earlier than Feb 1, 2006' 
                                          AND PREMIUM_PAID_YEARS = '1>=PREMIUM_PAID_YEARS<2'
                                      `;
                                  } else {
                                      lapsedPoliciesQuery = `
                                          SELECT DECISION, REASON, REMARK, AMOUNT_PAYABLE, CALCULATED_FIELDS 
                                          FROM CAPS_LAPSED_POLICIES_MASTER 
                                          WHERE PRODUCT_CODE = :productCode 
                                          AND POLICY_STATUS_ON_DEATH = :policyStatusOnDOD 
                                          AND ISSUANCE_DATE = 'is later than or equal to Jan 1, 2006' 
                                          AND PREMIUM_PAID_YEARS = '1>=PREMIUM_PAID_YEARS<2'
                                      `;
                                  }

                                  const lapsedPoliciesQueryObj = new QueryObject(lapsedPoliciesQuery);
                                  lapsedPoliciesQueryObj.addParameter("productCode", "CAPS_LAPSED_POLICIES_MASTER.PRODUCT_CODE", QueryObject.PARAM_STRING, productCode);
                                  lapsedPoliciesQueryObj.addParameter("policyStatusOnDOD", "CAPS_LAPSED_POLICIES_MASTER.POLICY_STATUS_ON_DEATH", QueryObject.PARAM_STRING, policyStatusOnDOD);

                                  const lapsedPolicyObj = lapsedPoliciesQueryObj.getObject();
                                  if (lapsedPolicyObj) {
                                      decision = lapsedPolicyObj.getStringProperty("DECISION");
                                      reason = lapsedPolicyObj.getStringProperty("REASON");
                                      remark = lapsedPolicyObj.getStringProperty("REMARK");
                                      calculatedFields += lapsedPolicyObj.getStringProperty("CALCULATED_FIELDS") + ";";
                                      amountPayable = obj.getDoubleProperty("FUND_VALUE");
                                  }
                              } else {
                                  return "Issuance date is null";
                              }
                          }
                      }
                  }
              }
          }
          //Product Rule sub flow
          else if (
              (policyStatusOnDOD.toLowerCase() != "la" || policyStatusOnDOD.toLowerCase() != "pu") || productType.toLowerCase() != "ulip") {
              if (productType.toLowerCase() === "term") {
                  if (typeOfClaim.toLowerCase() != "na") {
                      if (typeOfClaim.toLowerCase() === "suicide") {
                          if (policyAge < 1.0) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  decision = "Accept"
                                  reason = "PDPR"
                                  remark = "ROP"
                                  amountPayable = totalPremiumPaid;
                                  tempCalculatedFields = "totalPremiumPaid+excessPremium" //doubt
                                  calculatedFields = calculatedFields + tempCalculatedFields
                              }
                          }
                      }
                  } else {
                      return "Type of claim is empty"
                  }
              }

              if (typeOfClaim.toLowerCase() != "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyAge >= 1.0) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              decision = "Accept"
                              reason = "APVD"
                              remark = "Full SA"
                              amountPayable = productSA;
                              tempCalculatedFields = "sumAssured" //doubt
                              calculatedFields = calculatedFields + tempCalculatedFields
                          }
                      }
                  }
              } else {
                  return "Type of claim is empty"
              }


              if (typeOfClaim.toLowerCase() != "na") {
                  if (typeOfClaim.toLowerCase() === "non-accidental") {

                      if (policyStatusOnDOD.toLowerCase() === "if") {
                          decision = "Accept"
                          reason = "APVD"
                          remark = "Full SA"
                          amountPayable = productSA;
                          tempCalculatedFields = "sumAssured" //doubt
                          calculatedFields = calculatedFields + tempCalculatedFields
                      }

                  }
              } else {
                  return "Type of claim is empty"
              }

              if (typeOfClaim.toLowerCase() != "na") {
                  if (typeOfClaim.toLowerCase() === "accidental") {
                      if (policyStatusOnDOD.toLowerCase() === "if") {
                          decision = "Accept"
                          reason = "APVD"
                          remark = "Full SA"
                          amountPayable = productSA;
                          tempCalculatedFields = "sumAssured" //doubt
                          calculatedFields = calculatedFields + tempCalculatedFields
                      }
                  }
              } else {
                  return "Type of claim is empty"
              }

              if (productCode !== null) {
                  if (productCode.toLowerCase() === "t01" || productCode.toLowerCase() === "t02") {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "la") {
                          if (premiumPaidYear < 3.0) {
                              decision = "Reject";
                              reason = "LARJ";
                              remark = "T&C REJECT";
                              amountPayable = 0.0;
                              calculatedFields = calculatedFields + ";";
                              calculatedFields = calculatedFields + tempCalculatedFields;
                          }
                      }
                  }
              } else {
                  return "Product code is empty";
              }

              if (productCode !== null) {
                  if (productCode.toLowerCase() === "t01" || productCode.toLowerCase() === "t02") {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "pu") {
                          if (premiumPaidYear >= 3.0) {
                              decision = "Accept";
                              reason = "PUPD";
                              remark = "T&C REJECT";
                              amountPayable = productSA;
                              calculatedFields = calculatedFields + "sumAssured;";
                          }
                      }
                  }
              }

              if (productCode !== null) {
                  if (["t03", "t04", "t06", "t08"].includes(productCode.toLowerCase())) {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "la") {
                          if (premiumPaidYear >= 3.0) {
                              decision = "Reject";
                              reason = "LARJ";
                              remark = "T&C REJECT";
                              amountPayable = 0.0;
                              calculatedFields = calculatedFields + ";"; //doubt
                          }
                      }
                  }
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (productCode !== null) {
                      if (["t20", "t21", "t24", "t25", "t26", "t27"].includes(productCode.toLowerCase())) {
                          if (typeOfClaim.toLowerCase() === "suicide") {
                              if (reinstatementPeriod < 12) {
                                  decision = "Reject";
                                  reason = "TCRJ";
                                  remark = "T&C REJECT";
                                  amountPayable = 0.0;
                                  tempCalculatedFields = calculatedFields + ";";
                                  calculatedFields = calculatedFields + tempCalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is empty";
              }

              if (productCode !== null) {
                  if (["t20", "t21", "t24", "t25", "t26", "t27"].includes(productCode.toLowerCase())) {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "la") {
                          if (premiumPaidYear >= 3.0) {
                              decision = "Reject";
                              reason = "LARJ";
                              remark = "T&C REJECT";
                              amountPayable = 0.0;
                              calculatedFields = calculatedFields + ";";
                          }
                      }
                  }
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (productCode !== null && productCode.toLowerCase() === "t01") {
                      if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                          decision = "Accept";
                          reason = "APVD";
                          remark = "Full SA";
                          amountPayable = 0.0;
                          tempCalculatedFields = "sumAssured;outstandingPremium;";
                          calculatedFields = calculatedFields + tempCalculatedFields;
                      }
                  }
              } else {
                  return "Type of claim is empty";
              }
          }
          else if (productType.toLowerCase() === "traditional") {
              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyAge < 1.0) {
                          if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "if") {
                              if (ageAtEvent < 7) {
                                  decision = "Accept";
                                  reason = "PDPR";
                                  remark = "ROP";
                                  amountPayable = premiuminDouble;
                                  tempCalculatedFields = "premium;";
                                  calculatedFields = calculatedFields + tempCalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty"
              }

              //traditional Rule 2

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyAge >= 1.0) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (ageAtEvent >= 7) {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "Full SA";
                                  amountPayable = theAmtPayableVar1;
                                  tempCalculatedFields = "sumAssured;outstandingPremium;guaranteedAdditions;revisionaryBonus;interimBonus;";
                                  calculatedFields += tempCalculatedFields;
                              }
                          } else {
                              return "Policy status on Death is Empty";
                          }
                      }
                  }
              } else {
                  return "Type of claim in Event Details is Empty";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (productCode) {
                      if (productCode.toLowerCase() !== "e05") {
                          if (["non-accidental", "accidental"].includes(typeOfClaim.toLowerCase())) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (ageAtEvent >= 7) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "Full SA";
                                      amountPayable = theAmtPayableVar1;
                                      tempCalculatedFields = "sumAssured;guaranteedAdditions;revisionaryBonus;outstandingPremium;interimBonus;";
                                      calculatedFields += tempCalculatedFields;
                                  }
                              } else {
                                  return "Policy status on Death is Empty";
                              }
                          }
                      }
                  } else {
                      return "Product code is Empty";
                  }
              } else {
                  return "Type of claim is Empty in Event Details";
              }

              if (productCode) {
                  if (productCode.toLowerCase() !== "e05") {
                      if (outstandingLoan >= 0.0) {
                          if (typeOfClaim.toLowerCase() !== "na") {
                              if (["non-accidental", "accidental", "suicide"].includes(typeOfClaim.toLowerCase())) {
                                  if (policyStatusOnDOD) {
                                      if (policyStatusOnDOD.toLowerCase() === "if") {
                                          if (ageAtEvent >= 7) {
                                              decision = "Accept";
                                              reason = "APVD";
                                              remark = "Full SA";
                                              amountPayable = theAmtPayableVar1;
                                              tempCalculatedFields = "sumAssured;guaranteedAdditions;revisionaryBonus;outstandingPremium;interimBonus;";
                                              calculatedFields += tempCalculatedFields;
                                          }
                                      }
                                  }
                              }
                          } else {
                              return "Type of claim is Empty!";
                          }
                      }
                  }
              }

              if (ageAtEvent < 7) {
                  if (policyStatusOnDOD) {
                      if (policyStatusOnDOD.toLowerCase() === "if") {
                          decision = "Accept";
                          reason = "PDPR";
                          remark = "ROP";
                          amountPayable = premiuminDouble;
                          calculatedFields += "premium;";
                      }
                  }
              }

              if (productCode) {
                  if (["a01", "a02", "a03", "d02", "d03", "d04", "e00", "e01", "s03", "e03", "e04"].includes(productCode.toLowerCase())) {
                      if (policyStatusOnDOD) {
                          if (policyStatusOnDOD.toLowerCase() === "la") {
                              if (premiumPaidYear < 3.0) {
                                  decision = "Reject";
                                  reason = "TCRJ";
                                  remark = "T&C REJECT";
                                  amountPayable = 0.0;
                                  calculatedFields += ";";
                              }
                          }
                      }
                  }
              }

              if (productCode) {
                  if (["a01", "a02", "a03", "d02", "d03", "d04", "e00", "e01", "s03", "e03", "e04"].includes(productCode.toLowerCase())) {
                      if (policyStatusOnDOD) {
                          if (policyStatusOnDOD.toLowerCase() === "pu") {
                              if (premiumPaidYear >= 3.0) {
                                  decision = "Accept";
                                  reason = "PUPD";
                                  remark = "Paid Up";
                                  amountPayable = theAmtPayableVar2;
                                  calculatedFields += ";";
                              }
                          }
                      }
                  }
              }

              if (productCode) {
                  if (["e03", "e04"].includes(productCode.toLowerCase())) {
                      if (typeOfClaim.toLowerCase() !== "na") {
                          if (typeOfClaim.toLowerCase() === "suicide") {
                              if (policyStatusOnDOD) {
                                  if (policyStatusOnDOD.toLowerCase() === "if") {
                                      if (reinstatementPeriod < 12 || policyAge < 1.0) {
                                          decision = "Reject";
                                          reason = "LARJ";
                                          remark = "LARJ";
                                          amountPayable = 0.0;
                                          tempCalculatedFields = ";";
                                          calculatedFields += tempCalculatedFields;
                                      }
                                  }
                              }
                          }
                      } else {
                          return "Type of claim is Empty in Event Details";
                      }
                  }
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (productCode) {
                      if (productCode.toLowerCase() === "e04") {
                          if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                              if (policyStatusOnDOD) {
                                  if (policyStatusOnDOD.toLowerCase() === "if") {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "Full SA";
                                      amountPayable = 2 * productSA;
                                      tempCalculatedFields = ";";
                                      calculatedFields += tempCalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event Details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (productCode !== null) {
                      if (productCode.toLowerCase() === "e05") {
                          if (typeOfClaim.toLowerCase() === "accidental" || typeOfClaim.toLowerCase() === "non-accidental") {
                              if (policyStatusOnDOD !== null) {
                                  if (policyStatusOnDOD.toLowerCase() === "if") {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "Reduced SA";
                                      amountPayable = availableSumAssuredinDouble;
                                      tempCalculatedFields = "availableSumAssured";
                                      calculatedFields = calculatedFields + tempCalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (policyAge < 1.0) {
                                  decision = "Reject";
                                  reason = "TCRJ";
                                  remark = "Ex-Gratia of premium Refund-Suicide within first year";
                                  amountPayable = totalPremiumPaid;
                                  tempCalculatedFields = "totalPremiumPaid";
                                  calculatedFields = calculatedFields + tempCalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is empty in Event details";
              }

              if (productCode !== null) {
                  if (productCode.toLowerCase() === "e05") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "la") {
                              if (premiumPaidYear < 3.0) {
                                  decision = "Reject";
                                  reason = "TCRJ";
                                  remark = "T&C REJECT";
                                  amountPayable = 0.0;
                                  calculatedFields = calculatedFields + ";";
                              }
                          }
                      }
                  }
              }

              if (productCode !== null) {
                  if (productCode.toLowerCase() === "e05") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "la") {
                              if (premiumPaidYear >= 3.0) {
                                  decision = "Accept";
                                  reason = "PUPD";
                                  remark = "PUPD";
                                  amountPayable = availableSumAssuredinDouble;
                                  calculatedFields = calculatedFields + ";";
                              }
                          }
                      }
                  }
              }
          }
          else if (productType.toLowerCase() === "ulip") {
              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (!["u47", "u29", "u46", "u28", "u34"].includes(productCode.toLowerCase())) {
                                  if (diffOfDodAndIssueDate < 1.0 && productSA > 0.0) {
                                      decision = "Accept";
                                      reason = "PDPR";
                                      remark = "FundValue Refund";
                                      amountPayable = fundValue;
                                      tempCalculatedFields = "fundValue";
                                      calculatedFields = calculatedFields + tempCalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (policyStatusOnDOD !== null) {
                  if (policyStatusOnDOD.toLowerCase() === "if") {
                      if (["u46", "u47", "u28", "u29"].includes(productCode.toLowerCase())) {
                          if (ageAtEvent < 7) {
                              decision = "Accept";
                              reason = "PDPR";
                              remark = "FundValue Refund";
                              amountPayable = maximumBeetweenTwoNumbers(guaranteedFundValueinDouble, fundValue);
                              calculatedFields = calculatedFields + "fundValue;";
                          }
                      }
                  }
              }

              if (policyStatusOnDOD !== null) {
                  if (policyStatusOnDOD.toLowerCase() === "if") {
                      if (["u29", "u28", "ul7", "u20", "u37", "u38", "u48", "s53", "u42", "u43", "ul6", "u19", "u26", "u27", "u39", "u12", "u11", "lt", "ll2", "ul2", "u55", "u71", "u74", "u75", "u77"].includes(productCode.toLowerCase())) {
                          if (ageAtEvent < 7) {
                              decision = "Accept";
                              reason = "PDPR";
                              remark = "FundValue Refund";
                              amountPayable = fundValue;
                              calculatedFields = calculatedFields + "fundValue;";
                          }
                      }
                  }
              }

              if (policyStatusOnDOD !== null) {
                  if (policyStatusOnDOD.toLowerCase() === "if") {
                      if (["ul7", "u20", "u37", "u53", "u42", "u43", "ul6", "u19", "u26", "u27", "u39", "lt", "ll2", "u55", "u76", "u63", "u73", "u75", "u60", "u66", "u67", "u72", "u64", "u71", "u74", "u83", "ul1"].includes(productCode.toLowerCase())) {
                          if (ageAtEvent >= 7 && productSA > 0.0 && partialWithdrawnAmount >= 0.0) {
                              decision = "Accept";
                              reason = "APVD";
                              remark = "Higher of SA or VOU";
                              amountPayable = maximumBeetweenTwoNumbers(productSA, fundValue);
                              calculatedFields = calculatedFields + "sumAssured;fundValue;";
                          }
                      }
                  }
              }

              if (policyStatusOnDOD !== null) {
                  if (policyStatusOnDOD.toLowerCase() === "if") {
                      if (["u11", "u12", "u38", "u48", "u54", "u58", "u59", "u70", "u77"].includes(productCode.toLowerCase())) {
                          if (ageAtEvent >= 7 && productSA > 0.0 && partialWithdrawnAmount >= 0.0) {
                              decision = "Accept";
                              reason = "APVD";
                              remark = "SA + VOU";
                              amountPayable = theAmtPayableULIP9;
                              calculatedFields = calculatedFields + "sumAssured;fundValue;partialWithdrawalAmount;";
                          }
                      }
                  }
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (["u78", "u28", "u29", "u47"].includes(productCode.toLowerCase())) {
                                  if (ageAtEvent >= 7) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "SA + VOU";
                                      amountPayble = theAmtPayableULIP9;
                                      tempcalculatedFields = "sumAssured;fundValue;partialWithdrawalAmount";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          } else {
                              return "Policy status on Death is Empty";
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (["u66", "u67", "u71", "u72", "u73", "u75", "u91", "u94"].includes(productCode.toLowerCase())) {
                                  if (reinstatmentInYear > 0.0 && reinstatmentInYear < 1.0) {
                                      decision = "Accept";
                                      reason = "PDPR";
                                      remark = "FundValue Refund";
                                      amountPayble = fundValue;
                                      tempcalculatedFields = "fundValue;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          } else {
                              return "Policy status on Death is Empty";
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (["u48", "u53", "u54", "u55", "u59", "u60", "u63", "u64", "u66", "u67", "u70", "u71", "u72", "u73", "u74", "u75", "u76", "u77", "u78", "u79"].includes(productCode.toLowerCase())) {
                          if (saIncreaseInYear > 0.0 && saIncreaseInYear < 1.0) {
                              if (saIncreaseFlag.toLowerCase() === "yes") {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "Higher of Originial SA or VOU";
                                  amountPayble = maximumBeetweenTwoNumbers(sumAssured, fundValue);
                                  tempcalculatedFields = "sumAssured;fundValue;";
                                  calculatedFields = calculatedFields + tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental", "suicide"].includes(typeOfClaim.toLowerCase())) {
                      if (["ul4", "ul5", "ul8", "ul9", "u10", "u21", "u22", "u35", "u36", "u40", "u44", "u49", "u51", "u52"].includes(productCode.toLowerCase())) {
                          if (productSA > 0.0) {
                              if (policyStatusOnDOD !== null) {
                                  if (policyStatusOnDOD.toLowerCase() === "if") {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "Higher of Originial SA or VOU";
                                      amountPayble = maximumBeetweenTwoNumbers(productSA, fundValue);
                                      tempcalculatedFields = "sumAssured;fundValue;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (["u13", "u18", "u11", "u78", "u79"].includes(productCode.toLowerCase())) {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "SA + VOU";
                                  amountPayble = theSumOfSAVOU;
                                  tempcalculatedFields = "sumAssured;fundValue;";
                                  calculatedFields = calculatedFields + tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (["u30", "u46", "u34"].includes(productCode.toLowerCase())) {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (ageAtEvent > 7) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "SA + (Higher of VOU or guaranteed fund)";
                                      amountPayble = theAmtPayableULIP14;
                                      tempcalculatedFields = "sumAssured;guaranteedFundValue;fundValue;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (["u62", "u10", "ul4", "ul5", "ul8", "ul9", "u13", "u18", "u21", "u22", "u30", "u40", "u49", "u52", "u51", "u44", "u66", "u65", "u81", "u67", "u59", "u70", "u94"].includes(productCode.toLowerCase())) {
                  if (policyStatusOnDOD !== null) {
                      if (["if", "na"].includes(policyStatusOnDOD.toLowerCase())) {
                          if (productSA === 0.0) {
                              decision = "Accept";
                              reason = "APVD";
                              remark = "Fund Value Paid";
                              amountPayble = fundValue;
                              calculatedFields = calculatedFields + "fundValue;";
                          }
                      }
                  }
              }


              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (["u14", "u15", "u23", "u24", "u68", "u69"].includes(productCode.toLowerCase())) {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "Full SA";
                                  amountPayble = productSA;
                                  tempcalculatedFields = "sumAssured;";
                                  calculatedFields = calculatedFields + tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (productCode.toLowerCase() === "u80") {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "SA + VOU";
                                  amountPayble = theSumOfSAVOU;
                                  tempcalculatedFields = "sumAssured;fundValue;";
                                  calculatedFields = calculatedFields + tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (productCode.toLowerCase() === "u80") {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (policyAge < 1.0) {
                                      decision = "Accept";
                                      reason = "PDPR";
                                      remark = "FundValue Refund";
                                      amountPayble = fundValue;
                                      tempcalculatedFields = "fundValue;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (productCode.toLowerCase() === "u80") {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (saIncreaseInYear < 1.0) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "SA + VOU";
                                      amountPayble = theSumOfOriginalSAAndFundValue;
                                      tempcalculatedFields = "fundValue;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (productCode.toLowerCase() === "u84") {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if ([1, 4, 12, 2].includes(premFreq)) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "SA + VOU";
                                      amountPayble = theSumOfSAVOU;
                                      tempcalculatedFields = "fundValue;sumAssured;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (["u83", "u92"].includes(productCode.toLowerCase())) {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (![1, 4, 12, 2].includes(premFreq)) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "Higher of SA or VOU";
                                      amountPayble = maximumBeetweenTwoNumbers(sumAssured, fundValue);
                                      tempcalculatedFields = "fundValue;sumAssured;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (productCode.toLowerCase() === "u60") {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (ageAtEvent < 7 && diffOfDodAndIssueDate > 1.0) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "";
                                      amountPayble = sumAssured;
                                      tempcalculatedFields = ";";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (["u85", "u86", "u88", "u87"].includes(productCode.toLowerCase())) {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (partialWithdrawnAmount > 1.0) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "Higher of SA or VOU including top up fund value less partial withdrawal";
                                      amountPayble = Math.max(availableSumAssuredinDouble, fundValue);
                                      tempcalculatedFields = ";";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (["u54", "u59", "u60", "u72", "u73", "u70"].includes(productCode.toLowerCase())) {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (productSA === 0.0 && premiumPaidYear <= 1.0) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "Premium refund since VOU not available in first year on Ex-gratia";
                                      amountPayble = totalPremiumPaid;
                                      tempcalculatedFields = "totalPremiumPaid;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (["u59", "u54", "u60", "u70", "u72", "u73"].includes(productCode.toLowerCase())) {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (diffOfDodAndIssueDate < 1.0) {
                                      decision = "Accept";
                                      reason = "PDPR";
                                      remark = "Ex-Gratia of premium Refund-Suicide within first year";
                                      amountPayble = totalPremiumPaid;
                                      tempcalculatedFields = "totalPremiumPaid;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (productCode.toLowerCase() === "u91") {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (sumAssured > 0.0) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "SA + VOU";
                                      amountPayble = theSumOfSAVOU;
                                      tempcalculatedFields = "sumAssured;fundValue;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (productCode.toLowerCase() === "u94") {
                          if (policyStatusOnDOD !== null) {
                              if (policyStatusOnDOD.toLowerCase() === "if") {
                                  if (sumAssured < 1.0) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "Fund value or guaranteed death benefit (GDB) whichever is higher";
                                      amountPayble = availableSumAssuredinDouble;
                                      tempcalculatedFields = "sumAssured;fundValue;";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }
          } else if (["u14", "u15", "u23", "u24", "u41", "u45", "u68", "u69", "a03"].includes(productCode.toLowerCase())) {
              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (policyAge >= 1.0) {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "Full SA";
                                  amountPayble = productSA;
                                  tempcalculatedFields = "sumAssured;";
                                  calculatedFields = calculatedFields + tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (partialWithdrawnAmount === 0.0) {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "Full SA";
                                  amountPayble = productSA;
                                  tempcalculatedFields = "sumAssured;";
                                  calculatedFields = calculatedFields + tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "accidental") {
                      if (partialWithdrawnAmount >= 0.0) {
                          decision = "Accept";
                          reason = "APVD";
                          remark = "Full SA";
                          amountPayble = theDiffOfSAPWA;
                          tempcalculatedFields = "sumAssured;";
                          calculatedFields = calculatedFields + tempcalculatedFields;
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (productCode.toLowerCase() === "a03") {
                                  decision = "Accept";
                                  reason = "PDPR";
                                  remark = "ROP";
                                  amountPayble = premiuminDouble;
                                  tempcalculatedFields = "premium;";
                                  calculatedFields = calculatedFields + tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (productCode.toLowerCase() === "a03") {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "Reduced SA";
                                  amountPayble = theDiffOfSAOutStndPrem;
                                  tempcalculatedFields = ";";
                                  calculatedFields = calculatedFields + tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (["u14", "u15", "u24", "u23", "u41", "u45", "u68", "u69"].includes(productCode.toLowerCase())) {
                                  if (policyAge <= 1.0) {
                                      decision = "Accept";
                                      reason = "PDPR";
                                      remark = "VOU Refund";
                                      amountPayble = fundValue;
                                      tempcalculatedFields = ";";
                                      calculatedFields = calculatedFields + tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

          } else if (productType.toLowerCase() === "creditassure" || productType.toLowerCase() === "mrta") {
              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (policyAge <= 1.0) {
                                  decision = "Accept";
                                  reason = "PDPR";
                                  remark = "ROP";
                                  amountPayble = premiuminDouble;
                                  tempcalculatedFields = "premium;";
                                  calculatedFields += tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "non-accidental") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              // int policyAgeInDays = 0;
                              if (policyAgeInDays < 45) {
                                  decision = "Accept";
                                  reason = "PDPR";
                                  remark = "ROP";
                                  amountPayble = totalPremiumPaid;
                                  tempcalculatedFields = "premium;";
                                  calculatedFields += tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "non-accidental" || typeOfClaim.toLowerCase() === "accidental") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (policyAgeInDays >= 45) {
                                  if (productCode !== null) {
                                      if (productCode.toLowerCase() !== "c02" && productCode.toLowerCase() !== "c03") {
                                          decision = "Accept";
                                          reason = "APVD";
                                          remark = "Outstanding Loan To Bank";
                                          amountPayble = availableSumAssuredinDouble;
                                          tempcalculatedFields = "availableSumAssured;";
                                          calculatedFields += tempcalculatedFields;
                                      }
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }
          } else if (productType.toLowerCase() === "rural") {
              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["non-accidental", "accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (productCode !== null) {
                                  if (["t06", "t07", "e02", "mt1"].includes(productCode.toLowerCase())) {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "Full SA";
                                      amountPayble = productSA;
                                      tempcalculatedFields = "sumAssured;";
                                      calculatedFields += tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (policyAge < 1.0) {
                                  if (productCode !== null) {
                                      if (["t06", "t07", "e02", "mt1"].includes(productCode.toLowerCase())) {
                                          decision = "Accept";
                                          reason = "PDPR";
                                          remark = "ROP";
                                          amountPayble = premiuminDouble;
                                          tempcalculatedFields = "premium;";
                                          calculatedFields += tempcalculatedFields;
                                      }
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (policyAge >= 1.0) {
                                  if (productCode !== null) {
                                      if (["t06", "t07", "e02", "mt1"].includes(productCode.toLowerCase())) {
                                          decision = "Accept";
                                          reason = "PDPR";
                                          remark = "ROP";
                                          amountPayble = productSA;
                                          tempcalculatedFields = "sumAssured;";
                                          calculatedFields += tempcalculatedFields;
                                      }
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["accidental", "non-accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (productCode !== null) {
                                  if (productCode.toLowerCase() === "u57") {
                                      decision = "Accept";
                                      reason = "APVD";
                                      remark = "";
                                      amountPayble = amtPyabableRural;
                                      tempcalculatedFields = "sumAssured;fundValue;premium;partialWithdrawalAmount;";
                                      calculatedFields += tempcalculatedFields;
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (policyAge < 1.0) {
                                  if (productCode !== null) {
                                      if (productCode.toLowerCase() === "u57") {
                                          decision = "Accept";
                                          reason = "PDPR";
                                          remark = "VOU Refund";
                                          amountPayble = fundValue;
                                          tempcalculatedFields = "valueOfUnits;";
                                          calculatedFields += tempcalculatedFields;
                                      }
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

              if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null) {
                          if (policyStatusOnDOD.toLowerCase() === "if") {
                              if (policyAge >= 1.0) {
                                  if (productCode !== null) {
                                      if (productCode.toLowerCase() === "u57") {
                                          decision = "Accept";
                                          reason = "APVD";
                                          remark = "VOU Refund";
                                          amountPayble = theAmtPayable_Rural6;
                                          tempcalculatedFields = "sumAssured;valueOfUnits;partialWithdrawalAmount;premium;";
                                          calculatedFields += tempcalculatedFields;
                                      }
                                  }
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

          } else if (productType.toLowerCase() === "reassure") {
              if (productCode !== null) {
                  if (["S51", "S52", "S53", "S71", "S72", "S73", "Sx1", "Sx2", "Sx3", "V51", "V52", "V71", "V72"].includes(productCode.toUpperCase())) {

                      if (typeOfClaim.toLowerCase() !== "na") {
                          if (typeOfClaim.toLowerCase() === "accidental") {
                              if (policyStatusOnDOD !== null) {
                                  if (policyStatusOnDOD.toLowerCase() === "if") {
                                      if (policyAge <= 1.0) {
                                          decision = "Accept";
                                          reason = "APVD";
                                          remark = "110% Of SP";
                                          amountPayble = theAmtPayableRASR1;
                                          tempcalculatedFields = ";";
                                          calculatedFields += tempcalculatedFields;
                                      }
                                  }
                              }
                          }
                      } else {
                          return "Type of claim is Empty in Event details";
                      }

                      if (typeOfClaim.toLowerCase() !== "na") {
                          if (typeOfClaim.toLowerCase() === "non-accidental") {
                              if (policyStatusOnDOD !== null) {
                                  if (policyStatusOnDOD.toLowerCase() === "if") {
                                      if (policyAge <= 1.0 || policyAge > 1.0) {
                                          decision = "Accept";
                                          reason = "APVD";
                                          remark = "Full SA";
                                          amountPayble = productSA;
                                          tempcalculatedFields = "sumAssured;";
                                          calculatedFields += tempcalculatedFields;
                                      }
                                  }
                              }
                          }
                      } else {
                          return "Type of claim is Empty in Event details";
                      }

                      if (typeOfClaim.toLowerCase() !== "na") {
                          if (typeOfClaim.toLowerCase() === "suicide") {
                              if (policyStatusOnDOD !== null) {
                                  if (policyStatusOnDOD.toLowerCase() === "if") {
                                      if (policyAge <= 1.0) {
                                          decision = "Reject";
                                          reason = "TCRJ";
                                          remark = "T&C REJECT";
                                          amountPayble = 0.0;
                                          tempcalculatedFields = ";";
                                          calculatedFields += tempcalculatedFields;
                                      }
                                  }
                              }
                          }
                      } else {
                          return "Type of claim is Empty in Event details";
                      }
                  }
              }

          } else if (productType.toLowerCase() === "social") {
              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["Accidental", "Non-Accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "if") {
                          if (productCode !== null && ["G01", "T08"].includes(productCode.toUpperCase())) {
                              decision = "Accept";
                              reason = "APVD";
                              remark = "Full SA";
                              amountPayble = productSA;
                              tempcalculatedFields = "sumAssured;";
                              calculatedFields += tempcalculatedFields;
                          }
                      }
                  }

                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "if") {
                          if (productCode !== null && ["G01", "T08"].includes(productCode.toUpperCase())) {
                              if (policyAge < 1.0) {
                                  decision = "Accept";
                                  reason = "PDPR";
                                  remark = "ROP";
                                  amountPayble = premiuminDouble;
                                  tempcalculatedFields = "premium;";
                                  calculatedFields += tempcalculatedFields;
                              } else if (policyAge >= 1.0) {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "Full SA";
                                  amountPayble = productSA;
                                  tempcalculatedFields = "sumAssured;";
                                  calculatedFields += tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }

          } else if (productType.toLowerCase() === "health death"){
              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["Accidental", "Non-Accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "if") {
                          if (productCode !== null && ["T09", "T13", "T16"].includes(productCode.toUpperCase())) {
                              decision = "Accept";
                              reason = "APVD";
                              remark = "Full SA";
                              amountPayble = sumAssured;
                              tempcalculatedFields = "sumAssured;";
                              calculatedFields += tempcalculatedFields;
                          }
                      }
                  }
              
                  if (typeOfClaim.toLowerCase() === "suicide") {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "if") {
                          if (productCode !== null && ["T09", "T13", "T16", "U56"].includes(productCode.toUpperCase())) {
                              if (diffOfDodAndIssueDate < 1.0) {
                                  decision = "Accept";
                                  reason = "PDPR";
                                  remark = "ROP";
                                  amountPayble = totalPremiumPaid;
                                  tempcalculatedFields = ";";
                                  calculatedFields += tempcalculatedFields;
                              }
                          }
                      }
                  }
              
                  if (["Accidental", "Non-Accidental"].includes(typeOfClaim.toLowerCase())) {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "if") {
                          if (productCode !== null && productCode.toUpperCase() === "U56") {
                              decision = "Accept";
                              reason = "APVD";
                              remark = "Fund Value Paid";
                              amountPayble = availableSumAssuredinDouble;
                              tempcalculatedFields = ";";
                              calculatedFields += tempcalculatedFields;
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }                
          } else if (productType.toLowerCase() === "annuity death"){
              if (typeOfClaim.toLowerCase() !== "na") {
                  if (["Accidental", "Non-Accidental", "Suicide"].includes(typeOfClaim.toLowerCase())) {
                      if (policyStatusOnDOD !== null && policyStatusOnDOD.toLowerCase() === "if") {
                          if (productCode !== null && ["I04", "I05"].includes(productCode.toUpperCase())) {
                              if (productSA > 0.0) {
                                  decision = "Accept";
                                  reason = "APVD";
                                  remark = "Payout as per the annuity option selected by Life Assured";
                                  amountPayble = availableSumAssuredinDouble;
                                  tempcalculatedFields = ";";
                                  calculatedFields += tempcalculatedFields;
                              }
                          }
                      }
                  }
              } else {
                  return "Type of claim is Empty in Event details";
              }                
          }else{
              decision="ERR"
              remark=",,No Rule Triggered"
          }

      } else {
      return "Policy status on DOD and claim type and product category is null."
  }





  return "Success"
} catch (error) {
  console.log(error)
  return error
}
}

const generateSystemDecision1 = async (obj) => {
  //bre function is commented else giving error
  //commented the below code to avoid error

  const connection = await db.getConnection(); //instead of bsf use this here
  let calculatedFields = "";//to avoid error

  console.log("simran fucntion dec1", obj);
  try {
    if (
      obj.sourcingChannel.toLowerCase() === "telesales" &&
      obj.policyAge < 0.5
    ) {
      const getSystemRemarksQuery =
        "SELECT COUNT(*) AS COUNTNUMBER FROM SYSTEM_REMARK WHERE CLAIM_ID = ?";
      const [systemRemarksRow] = await connection.query(getSystemRemarksQuery, [
        claimId,
      ]);
      // console.log("COUNTNUMBER:", systemRemarksRow[0].COUNTNUMBER);
      if (systemRemarksRow[0].COUNTNUMBER <= 0) {
        const slNo = "Sales Source";
        const rem =
          "For telesales sourcing channel policy duration cannot be greater than 6 months";
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertSystemRemarksQuery =
            "INSERT INTO SYSTEM_REMARK (CLAIM_ID, SL_NO, REMARKS) VALUES (?, ?, ?)";
          await connection.query(insertSystemRemarksQuery, [claimId, slNo, rem]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    //ask sir the variables
    const relationOfAdvisorWithLA = obj.relationOfAdvisorWithLa || ""; //not found
    const knownToLASince = obj.knownToLaSince || 0; //not found

    if (
      relationOfAdvisorWithLA.toLowerCase() === "self" &&
      knownToLASince >= 3.0
    ) {
      const getSystemRemarksQuery =
        "SELECT COUNT(*) AS COUNTNUMBER FROM SYSTEM_REMARK WHERE CLAIM_ID = ?";
      const [systemRemarksRow] = await connection.query(getSystemRemarksQuery, [
        claimId,
      ]);

      if (systemRemarksRow[0].COUNTNUMBER <= 0) {
        const slNo = "Related Advisor";
        const rem =
          "For Self relationship with advisor and known relationship cannot be greater than 3 years";
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertSystemRemarksQuery =
            "INSERT INTO SYSTEM_REMARK (CLAIM_ID, SL_NO, REMARKS) VALUES (?, ?, ?)";
          await connection.query(insertSystemRemarksQuery, [claimId, slNo, rem]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    if (obj.policyAge <= 0.5) {
      const getSystemRemarksQuery =
        "SELECT COUNT(*) AS COUNTNUMBER FROM SYSTEM_REMARK WHERE CLAIM_ID = ?";
      const [systemRemarksRow] = await connection.query(getSystemRemarksQuery, [
        claimId,
      ]);

      if (systemRemarksRow[0].COUNTNUMBER <= 0) {
        const slNo = "Policy Age";
        const rem = "Policy Age is less than or equal to 6 months.";
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertSystemRemarksQuery =
            "INSERT INTO SYSTEM_REMARK (CLAIM_ID, SL_NO, REMARKS) VALUES (?, ?, ?)";
          await connection.query(insertSystemRemarksQuery, [claimId, slNo, rem]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    let claimId = "100"; //declared for now else error is thrown
    const getPastIllnessQuery = `
    SELECT ILLNESS AS illness, OTHERS_SPECIFY AS otherDetails, REMARKS AS remarks, DURATION_MONTHS AS month, 
    COALESCE(DURATION_YEARS, 0.0) AS years 
    FROM CAPS_PAST_ILLNESS_DETAILS WHERE CLAIM_ID = ?`;

    const [pastIllnessRows] = await connection.query(getPastIllnessQuery, [claimId]);

    for (const pastIllnessObj of pastIllnessRows) {
      const pastIllnessYear = pastIllnessObj.years;

      if (pastIllnessYear >= policyAge) {
        const getSystemRemarksQuery = `SELECT COUNT(*) AS COUNTNUMBER FROM SYSTEM_REMARK WHERE CLAIM_ID = ?`;
        const [systemRemarksRow] = await connection.query(getSystemRemarksQuery, [
          claimId,
        ]);

        if (systemRemarksRow[0].COUNTNUMBER <= 0) {
          const slNo = "Past Illness";
          const rem = "Past Illness Duration is greater than Policy Age";
          const transId = crypto.randomUUID();

          try {
            await connection.beginTransaction(transId);
            const insertSystemRemarksQuery = `INSERT INTO SYSTEM_REMARK (CLAIM_ID, SL_NO, REMARKS) VALUES (?, ?, ?)`;
            await connection.query(insertSystemRemarksQuery, [claimId, slNo, rem]);
            await connection.commit(transId);
          } catch (error) {
            await connection.rollback(transId);
            console.error("Transaction failed:", error);
          }
        }
      }
    }

    //ask sir--bre
    
    // const getEventDetailsQuery = await PropertyUtil.getProperty(
    //   "BRE.properties",
    //   "ipru.bre.getEventDetails"
    // );
    // const [eventObjs] = await connection.query(getEventDetailsQuery, [claimId]);

    // if (eventObjs.length > 0) {
    //   for (const eventDataObj of eventObjs) {
    //     const causeOfClaim = eventDataObj.causeOfClaim || "";

    //     if (causeOfClaim.toLowerCase() === "ahla" && policyAge < 0.5) {
    //       const getSystemRemarksQuery = `SELECT COUNT(*) AS COUNTNUMBER FROM SYSTEM_REMARK WHERE CLAIM_ID = ?`;
    //       const [systemRemarksRow] = await connection.query(getSystemRemarksQuery, [
    //         claimId,
    //       ]);

    //       if (systemRemarksRow[0].COUNTNUMBER <= 0) {
    //         const slNo = "Suspicious Event";
    //         const rem =
    //           "For policy Age less than 6 months and this disease, this event looks suspicious.";
    //         const transId = crypto.randomUUID();

    //         try {
    //           await connection.beginTransaction(transId);
    //           const insertSystemRemarksQuery = `INSERT INTO SYSTEM_REMARK (CLAIM_ID, SL_NO, REMARKS) VALUES (?, ?, ?)`;
    //           await connection.query(insertSystemRemarksQuery, [claimId, slNo, rem]);
    //           await connection.commit(transId);
    //         } catch (error) {
    //           await connection.rollback(transId);
    //           console.error("Transaction failed:", error);
    //         }
    //       }
    //     }
    //   }
    // }

    let agentCategory = "demo";
    if (agentCategory.toLowerCase() === "gold premier") {
      const prioritySource = "GoldPremierAdvisor";
      const priorityReason = "Advisor category belongs to Gold Premier";

      const getPriorityCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?`;
      const [priorityCountRow] = await connection.query(getPriorityCountQuery, [
        prioritySource,
      ]);

      if (priorityCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityMasterQuery = `INSERT INTO CAPS_PRIORITY_MASTER (SOURCE, REASON) VALUES (?, ?)`;
          await connection.query(insertPriorityMasterQuery, [
            prioritySource,
            priorityReason,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }

      const getPriorityFlagsCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_FLAGS_MAPPING WHERE CLAIM_ID = ?`;
      const [priorityFlagsCountRow] = await connection.query(
        getPriorityFlagsCountQuery,
        [claimId]
      );

      if (priorityFlagsCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityFlagsMappingQuery = `
    INSERT INTO CAPS_PRIORITY_FLAGS_MAPPING (CLAIM_ID, PRIORITY_ID) 
    VALUES (?, (SELECT PRIORITY_ID FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?))
`;

          await connection.query(insertPriorityFlagsMappingQuery, [
            claimId,
            prioritySource,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    if (agentCategory.toLowerCase() === "gold") {
      const prioritySource = "GoldAdvisor";
      const priorityReason = "Advisor Category belongs to Gold";

      const getPriorityCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?`;
      const [priorityCountRow] = await connection.query(getPriorityCountQuery, [
        prioritySource,
      ]);

      if (priorityCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityMasterQuery = `INSERT INTO CAPS_PRIORITY_MASTER (SOURCE, REASON) VALUES (?, ?)`;
          await connection.query(insertPriorityMasterQuery, [
            prioritySource,
            priorityReason,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }

      const getPriorityFlagsCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_FLAGS_MAPPING WHERE CLAIM_ID = ?`;
      const [priorityFlagsCountRow] = await connection.query(
        getPriorityFlagsCountQuery,
        [claimId]
      );

      if (priorityFlagsCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityFlagsMappingQuery = `
                INSERT INTO CAPS_PRIORITY_FLAGS_MAPPING (CLAIM_ID, PRIORITY_ID) 
                VALUES (?, (SELECT PRIORITY_ID FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?))
            `;

          await connection.query(insertPriorityFlagsMappingQuery, [
            claimId,
            prioritySource,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    let hniFlag = "demo";
    if (hniFlag.toLowerCase() === "s") {
      const prioritySource = "Client SuperHNI";
      const priorityReason = "Client is SuperHNI";

      const getPriorityCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?`;
      const [priorityCountRow] = await connection.query(getPriorityCountQuery, [
        prioritySource,
      ]);

      if (priorityCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityMasterQuery = `INSERT INTO CAPS_PRIORITY_MASTER (SOURCE, REASON) VALUES (?, ?)`;
          await connection.query(insertPriorityMasterQuery, [
            prioritySource,
            priorityReason,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }

      const getPriorityFlagsCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_FLAGS_MAPPING WHERE CLAIM_ID = ?`;
      const [priorityFlagsCountRow] = await connection.query(
        getPriorityFlagsCountQuery,
        [claimId]
      );

      if (priorityFlagsCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityFlagsMappingQuery = `
    INSERT INTO CAPS_PRIORITY_FLAGS_MAPPING (CLAIM_ID, PRIORITY_ID) 
    VALUES (?, (SELECT PRIORITY_ID FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?))
`;
          await connection.query(insertPriorityFlagsMappingQuery, [
            claimId,
            prioritySource,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    let occupationCode = "demo";
    if (occupationCode.toLowerCase() === "sa") {
      const prioritySource = "Occupation";
      const priorityReason = "Salaried";

      const getPriorityCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?`;
      const [priorityCountRow] = await connection.query(getPriorityCountQuery, [
        prioritySource,
      ]);

      if (priorityCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityMasterQuery = `INSERT INTO CAPS_PRIORITY_MASTER (SOURCE, REASON) VALUES (?, ?)`;
          await connection.query(insertPriorityMasterQuery, [
            prioritySource,
            priorityReason,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }

      const getPriorityFlagsCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_FLAGS_MAPPING WHERE CLAIM_ID = ?`;
      const [priorityFlagsCountRow] = await connection.query(
        getPriorityFlagsCountQuery,
        [claimId]
      );

      if (priorityFlagsCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityFlagsMappingQuery = `
    INSERT INTO CAPS_PRIORITY_FLAGS_MAPPING (CLAIM_ID, PRIORITY_ID) 
    VALUES (?, (SELECT PRIORITY_ID FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?))
`;

          await connection.query(insertPriorityFlagsMappingQuery, [
            claimId,
            prioritySource,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    let annualIncome = 1000;
    if (annualIncome > 1000000.0) {
      const prioritySource = "Income";
      const priorityReason = "Income more than 10 lacs";

      const getPriorityCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?`;
      const [priorityCountRow] = await connection.query(getPriorityCountQuery, [
        prioritySource,
      ]);

      if (priorityCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityMasterQuery = `INSERT INTO CAPS_PRIORITY_MASTER (SOURCE, REASON) VALUES (?, ?)`;
          await connection.query(insertPriorityMasterQuery, [
            prioritySource,
            priorityReason,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }

      const getPriorityFlagsCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_FLAGS_MAPPING WHERE CLAIM_ID = ?`;
      const [priorityFlagsCountRow] = await connection.query(
        getPriorityFlagsCountQuery,
        [claimId]
      );

      if (priorityFlagsCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityFlagsMappingQuery = `
    INSERT INTO CAPS_PRIORITY_FLAGS_MAPPING (CLAIM_ID, PRIORITY_ID) 
    VALUES (?, (SELECT PRIORITY_ID FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?))
`;
          await connection.query(insertPriorityFlagsMappingQuery, [
            claimId,
            prioritySource,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    if (hniFlag.toLowerCase() === "h") {
      const prioritySource = "ClientHNI";
      const priorityReason = "Client is HNI";

      const getPriorityCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?`;
      const [priorityCountRow] = await connection.query(getPriorityCountQuery, [
        prioritySource,
      ]);

      if (priorityCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityMasterQuery = `INSERT INTO CAPS_PRIORITY_MASTER (SOURCE, REASON) VALUES (?, ?)`;
          await connection.query(insertPriorityMasterQuery, [
            prioritySource,
            priorityReason,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }

      const getPriorityFlagsCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_FLAGS_MAPPING WHERE CLAIM_ID = ?`;
      const [priorityFlagsCountRow] = await connection.query(
        getPriorityFlagsCountQuery,
        [claimId]
      );

      if (priorityFlagsCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityFlagsMappingQuery = `
    INSERT INTO CAPS_PRIORITY_FLAGS_MAPPING (CLAIM_ID, PRIORITY_ID) 
    VALUES (?, (SELECT PRIORITY_ID FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?))
`;
          await connection.query(insertPriorityFlagsMappingQuery, [
            claimId,
            prioritySource,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    if (agentCategory.toLowerCase() === "premier") {
      const prioritySource = "PremierAdvisor";
      const priorityReason = "Advisor Category belongs to Premier";

      const getPriorityCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?`;
      const [priorityCountRow] = await connection.query(getPriorityCountQuery, [
        prioritySource,
      ]);

      if (priorityCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityMasterQuery = `INSERT INTO CAPS_PRIORITY_MASTER (SOURCE, REASON) VALUES (?, ?)`;
          await connection.query(insertPriorityMasterQuery, [
            prioritySource,
            priorityReason,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }

      const getPriorityFlagsCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_FLAGS_MAPPING WHERE CLAIM_ID = ?`;
      const [priorityFlagsCountRow] = await connection.query(
        getPriorityFlagsCountQuery,
        [claimId]
      );

      if (priorityFlagsCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityFlagsMappingQuery = `
    INSERT INTO CAPS_PRIORITY_FLAGS_MAPPING (CLAIM_ID, PRIORITY_ID) 
    VALUES (?, (SELECT PRIORITY_ID FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?))
`;
          await connection.query(insertPriorityFlagsMappingQuery, [
            claimId,
            prioritySource,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    if (agentCategory.toLowerCase() === "platinum") {
      const prioritySource = "PlatinumAdvisor";
      const priorityReason = "Advisor Category belongs to Platinum";

      const getPriorityCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?`;
      const [priorityCountRow] = await connection.query(getPriorityCountQuery, [
        prioritySource,
      ]);

      if (priorityCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityMasterQuery = `INSERT INTO CAPS_PRIORITY_MASTER (SOURCE, REASON) VALUES (?, ?)`;
          await connection.query(insertPriorityMasterQuery, [
            prioritySource,
            priorityReason,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }

      const getPriorityFlagsCountQuery = `SELECT COUNT(*) AS count FROM CAPS_PRIORITY_FLAGS_MAPPING WHERE CLAIM_ID = ?`;
      const [priorityFlagsCountRow] = await connection.query(
        getPriorityFlagsCountQuery,
        [claimId]
      );

      if (priorityFlagsCountRow[0].count <= 0) {
        const transId = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId);
          const insertPriorityFlagsMappingQuery = `
    INSERT INTO CAPS_PRIORITY_FLAGS_MAPPING (CLAIM_ID, PRIORITY_ID) 
    VALUES (?, (SELECT PRIORITY_ID FROM CAPS_PRIORITY_MASTER WHERE SOURCE = ?))
`;
          await connection.query(insertPriorityFlagsMappingQuery, [
            claimId,
            prioritySource,
          ]);
          await connection.commit(transId);
        } catch (error) {
          await connection.rollback(transId);
          console.error("Transaction failed:", error);
        }
      }
    }

    let assignmentFlag = "demo";
    if (assignmentFlag.toLowerCase() === "true") {
      if (caseDecision.toLowerCase() !== "non-stp") {
        caseDecision = "Non-STP";
        stpCaseRemark = "Assignment flag is true";
      }
    }

    let totalSumAtRisk = 1000;
    if (totalSumAtRisk > 1000000.0) {
      if (caseDecision.toLowerCase() !== "non-stp") {
        caseDecision = "Non-STP";
        stpCaseRemark = "Total sum at risk greater than 1,000,000";
      }
    }

    let reinstatementPeriodInMonths = 4;
    if (reinstatementPeriodInMonths > 6.0) {
      if (caseDecision.toLowerCase() !== "non-stp") {
        caseDecision = "Non-STP";
        stpCaseRemark = "Reinstatement after 6 months";
      }
    }

    let quesAnsCount = 0;
    if (quesAnsCount > 0) {
      if (caseDecision.toLowerCase() !== "non-stp") {
        caseDecision = "Non-STP";
        stpCaseRemark = "Unfavourable assessment answer";
      }
    }

    let productCode = "demo";
    let issueanceDate = new Date("12/10/2001");
    if (productCode && issueanceDate) {
      if (
        productCode.toLowerCase() === "e05" &&
        issueanceDate.getTime() < compareIssueDate.getTime()
      ) {
        if (caseDecision.toLowerCase() !== "non-stp") {
          caseDecision = "STP";
          stpCaseRemark = stpCaseRemark + ""; // Keep the remark as is
        }
      }
    }

    let dateOfDeathinDate = new Date("12/10/2001");
    let riskCommDate = new Date("12/10/2001");
    let caseDecision = "";

    // Need to discuss with Rahul for OTHER INSURANCE AND INTEREST AND FRAUD FLAG AND DATEONDEATHREG
    if (dateOfDeathinDate.getTime() < riskCommDate.getTime()) {
      if (caseDecision.toLowerCase() !== "non-stp") {
        caseDecision = "Non-STP";
        stpCaseRemark = "Date of death prior to RCD";
      }
    }

    let numOfDaysBtwCreamAndDod = 2;
    if (numOfDaysBtwCreamAndDod > 2) {
      if (caseDecision.toLowerCase() !== "non-stp") {
        caseDecision = "Non-STP";
        stpCaseRemark = "Cremation after 2 days from death";
      }
    }

    let reqStatus = 1;
    if (reqStatus > 0) {
      if (caseDecision.toLowerCase() !== "non-stp") {
        caseDecision = "Non-STP";
        stpCaseRemark = "Requirement pending";
      }
    }

    let amountPayble = 1000;
    let sumAssured = 1000;
    if (amountPayble >= 500000.0 || sumAssured >= 500000.0) {
      if (caseDecision.toLowerCase() !== "non-stp") {
        caseDecision = "Non-STP";
        stpCaseRemark = "Total amount payable/Sum assured is over 500,000";
      }
    }

    let portfolio = "";
    if (portfolio) {
      if (
        portfolio.toLowerCase() === "urban" &&
        assignmentFlag.toLowerCase() === "true"
      ) {
        if (caseDecision.toLowerCase() !== "non-stp") {
          caseDecision = "Non-STP";
          stpCaseRemark = "Assignment flag is true";
        }
      }
    }

    let policyStatusOnDOD = "";
    if (policyStatusOnDOD) {
      if (policyStatusOnDOD.toLowerCase() === "pu" && othInsuCount <= 1) {
        caseDecision = "STP";
        stpCaseRemark = "";
      }
    }

    if (
      policyStatusOnDOD.toLowerCase() === "pu" &&
      othInsuCount > 1 &&
      totalSumAtRisk === 0.0
    ) {
      caseDecision = "STP";
      stpCaseRemark = "";
    }

    let premFreq = 1;
    if (premFreq === 0) {
      if (sumAssured <= 1.35 * totalPremiumPaid && othInsuCount <= 1) {
        caseDecision = "STP";
        stpCaseRemark = "";
      }
    }

    if (premFreq === 0) {
      if (policyStatusOnDOD) {
        if (policyStatusOnDOD.toLowerCase() === "pu") {
          if (
            sumAssured <= 1.35 * totalPremiumPaid &&
            othInsuCount > 1 &&
            totalSumAtRisk === 0.0
          ) {
            caseDecision = "STP";
            stpCaseRemark = "";
          }
        }
      }
    }

    if (portfolio && productCode) {
      const urbanPortfolios = [
        "Urban",
        "MRTA",
        "Annuity",
        "Credit Assure",
        "Health",
        "Lapsed",
        "Paid-Up",
      ];
      const validProductCodes = ["U94", "I04", "I05"];

      if (urbanPortfolios.includes(portfolio.toLowerCase())) {
        if (validProductCodes.includes(productCode.toLowerCase())) {
          if (productSA > 1.0) {
            if (caseDecision.toLowerCase() !== "non-stp") {
              caseDecision = "Non-STP";
              stpCaseRemark = "Non-STP Portfolio";
            }
          }
        }
      }
    }

    let excessPremiuminDouble = 0;
    if (excessPremiuminDouble > 0.0) {
      totalAmountPayable = excessPremiuminDouble;
    } else {
      totalAmountPayable = amountPayble;
    }

    //many lines are commented in actual code from 5277 to 5453 hence skipped it

    if (portfolio.toLowerCase() === "urban") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (
          typeOfClaim.toLowerCase() === "accidental" &&
          productSA < 100000.0
        ) {
          caseDecision = "STP";
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (
      portfolio.toLowerCase() === "mrta" &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (
          typeOfClaim.toLowerCase() === "accidental" &&
          productSA < 100000.0
        ) {
          caseDecision = "STP";
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (portfolio.toLowerCase() === "credit assure") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (
          typeOfClaim.toLowerCase() === "accidental" &&
          productSA < 100000.0
        ) {
          caseDecision = "STP";
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (portfolio.toLowerCase() === "urban") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "accidental") {
          if (productSA >= 100000.0 && productSA <= 500000.0) {
            if (policyAge > 2.0) {
              caseDecision = "Non-STP";
            }
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (portfolio.toLowerCase() === "mrta") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "accidental") {
          if (productSA >= 100000.0 && productSA <= 500000.0) {
            if (policyAge > 2.0) {
              caseDecision = "Non-STP";
            }
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (portfolio.toLowerCase() === "credit assure") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "accidental") {
          if (productSA >= 100000.0 && productSA <= 500000.0) {
            if (policyAge > 2.0) {
              caseDecision = "Non-STP";
            }
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (portfolio.toLowerCase() === "urban") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "non-accidental") {
          if (productSA < 100000.0 && policyAge > 2.0) {
            caseDecision = "STP";
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (
      portfolio.toLowerCase() === "mrta" &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "non-accidental") {
          if (productSA < 100000.0) {
            caseDecision = "STP";
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (portfolio.toLowerCase() === "credit assure") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (
          typeOfClaim.toLowerCase() === "non-accidental" &&
          productSA < 100000.0
        ) {
          caseDecision = "STP";
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (portfolio.toLowerCase() === "urban") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "non-accidental") {
          if (
            productSA >= 100000.0 &&
            productSA <= 500000.0 &&
            policyAge > 2.0
          ) {
            caseDecision = "STP";
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (
      portfolio.toLowerCase() === "mrta" &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "non-accidental") {
          if (
            productSA >= 100000.0 &&
            productSA <= 500000.0 &&
            policyAge > 2.0
          ) {
            caseDecision = "STP";
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (portfolio.toLowerCase() === "credit assure") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "non-accidental") {
          if (
            productSA >= 100000.0 &&
            productSA <= 500000.0 &&
            policyAge > 2.0
          ) {
            caseDecision = "STP";
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (
      portfolio.toLowerCase() === "urban" &&
      portfolioSubType.toLowerCase() === "traditional"
    ) {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "suicide") {
          if (productCode) {
            if (productCode.toLowerCase() === "e05" && policyAge < 1.0) {
              caseDecision = "STP";
            }
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (portfolio.toLowerCase() === "paid-up") {
      caseDecision = "STP";
    }

    if (portfolio.toLowerCase() === "lapsed") {
      caseDecision = "STP";
    }

    if (portfolio.toLowerCase() === "urban") {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "accidental") {
          if (productCode) {
            if (productSA >= 0.0 && productSA <= 1000000.0) {
              if (getRiderData > 0) {
                if (policyAge >= 3.0) {
                  caseDecision = "Non-STP";
                }
              }
            }
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (
      portfolio.toLowerCase() === "urban" ||
      portfolio.toLowerCase() === "mrta" ||
      portfolio.toLowerCase() === "credit assure"
    ) {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "accidental") {
          if (productCode != null) {
            if (productSA >= 0.0 && productSA <= 1000000.0) {
              if (
                getRiderData === 0 &&
                portfolioSubType.toLowerCase() !== "mrta"
              ) {
                if (policyAge >= 3.0) {
                  caseDecision = "STP";
                }
              }
            }
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (
      portfolio.toLowerCase() === "urban" ||
      portfolio.toLowerCase() === "mrta" ||
      portfolio.toLowerCase() === "credit assure"
    ) {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "non-accidental") {
          if (productCode != null) {
            if (productSA >= 0.0 && productSA <= 1000000.0) {
              if (
                getRiderData === 0 &&
                portfolioSubType.toLowerCase() !== "mrta"
              ) {
                if (policyAge >= 3.0) {
                  caseDecision = "STP";
                }
              }
            }
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    if (
      portfolio.toLowerCase() === "urban" ||
      portfolio.toLowerCase() === "mrta" ||
      portfolio.toLowerCase() === "credit assure"
    ) {
      if (typeOfClaim.toLowerCase() !== "na") {
        if (typeOfClaim.toLowerCase() === "suicide") {
          if (productCode != null) {
            if (productSA >= 0.0 && productSA <= 1000000.0) {
              if (policyAge < 1.0) {
                caseDecision = "Non-STP";
              }
            }
          }
        }
      } else {
        return "Type of claim is Empty in Event details";
      }
    }

    let claimType = "";
    if (claimType.toLowerCase() === "terminal illness") {
      caseDecision = "Non-STP";
      // stpCaseRemark = "Terminal illness claim";
    }

    if (excessPremiuminDouble > 0.0) {
      amountPayble = amountPayble + excessPremiuminDouble;
      calculatedFields = calculatedFields + ";excessPremium";
    }

    /*
				String getRiderSA = "select sum(RIDER_CODE_SA) AS RIDERSA from caps_rider_details where claim_id=:claimId";
				QueryObject getRiderSAObj = new QueryObject(getRiderSA);
				getRiderSAObj.addParameter("claimId",	"CAPS_RIDER_DETAILS.CLAIM_ID",	QueryObject.PARAM_INT, claimId);
				BusObject riderSAObj =getRiderSAObj.getObject();
				 */
    let riderSAInDouble = 0.0;
    /*
				if(riderSAObj!=null) {
					if(riderSAObj.getStringProperty("RIDERSA")!=null) {
						riderSAInDouble = Double.parseDouble(riderSAObj.getStringProperty("RIDERSA"));

					}
				}
				 */
    totalAmountPayable = amountPayble + riderSAInDouble;

    if (claimType.toLowerCase() === "rider") {
      caseDecision = "Non-STP";
      stpCaseRemark = "Rider claim";
    }

    if (claimType.toLowerCase() === "terminal illness") {
      caseDecision = "Non-STP";
      stpCaseRemark = "Terminal illness claim";
    }

    if (claimType.toLowerCase() === "death" && reqStatus > 0) {
      caseDecision = "Non-STP";
      stpCaseRemark = "Requirement pending";
    }

    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolio.toLowerCase() === "zdb" &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1
      ) {
        caseDecision = "STP";
        stpCaseRemark = "ZDB portfolio";
      }
    }

    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolio.toLowerCase() === "annuity" &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1
      ) {
        caseDecision = "STP";
        stpCaseRemark = "Annuity portfolio";
      }
    }

    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolio.toLowerCase() === "rural" &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1
      ) {
        caseDecision = "STP";
        stpCaseRemark = "Rural portfolio";
      }
    }

    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolio.toLowerCase() === "health" &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1
      ) {
        caseDecision = "STP";
        stpCaseRemark = "Health portfolio";
      }
    }

    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1
      ) {
        if (productCode != null) {
          if (productCode.toLowerCase() === "e05") {
            const tempRcdDate = "2012-04-10";
            const compareToRcd = new Date(tempRcdDate);
            if (new Date(rcd).getTime() < compareToRcd.getTime()) {
              caseDecision = "STP";
              stpCaseRemark = "Old GSIP";
            }
          }
        }
      }
    }

    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1
      ) {
        if (premFreq === 0 && sumAssured < 1.25 * totalPremiumPaid) {
          caseDecision = "STP";
          stpCaseRemark = "Single Premium";
        }
      }
    }

    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1
      ) {
        if (policyStatusOnDOD != null) {
          if (policyStatusOnDOD.toLowerCase() === "pd") {
            caseDecision = "STP";
            stpCaseRemark = "Policy discontinued";
          }
        }
      }
    }

    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1
      ) {
        if (policyStatusOnDOD != null) {
          if (policyStatusOnDOD.toLowerCase() === "pu") {
            caseDecision = "STP";
            stpCaseRemark = "Policy Paid up";
          }
        }
      }
    }
    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1
      ) {
        if (policyStatusOnDOD != null) {
          if (policyStatusOnDOD.toLowerCase() === "is") {
            caseDecision = "STP";
            stpCaseRemark = "Policy Interim Surrender";
          }
        }
      }
    }

    if (
      claimType.toLowerCase() === "death" &&
      reqStatus === 0 &&
      portfolioSubType.toLowerCase() !== "mrta"
    ) {
      if (
        trapScore < 60.0 &&
        source.toLowerCase() === "branch" &&
        payeeAndClaimaintMatchCount > 1 &&
        diffOfDODandRCD < 1.0
      ) {
        if (subTypeOfClaim.toLowerCase() === "na") {
          if (subTypeOfClaim.toLowerCase() === "suicide") {
            caseDecision = "STP";
            stpCaseRemark = "RCD Suicide clause";
          }
        } else {
          return "Type of claim is Empty in Event details";
        }
      }
    }

    let fraudObj = "";
    if (fraudObj == null) {
      if (newTermPlan === 0) {
        if (
          claimType.toLowerCase() === "death" &&
          reqStatus === 0 &&
          portfolioSubType.toLowerCase() !== "mrta"
        ) {
          if (
            trapScore < 60.0 &&
            source.toLowerCase() === "branch" &&
            payeeAndClaimaintMatchCount > 1
          ) {
            if (ratedSA > 0.0 && ratedSA < 100000.0) {
              if (
                riderComponentType.toLowerCase() === "no" &&
                pincodeFlag.toLowerCase() === "no" &&
                cityFlag.toLowerCase() === "no"
              ) {
                caseDecision = "STP";
                stpCaseRemark = "Rule14";
              }
            }
          }
        }
      }
    }

    if (fraudObj == null) {
      if (newTermPlan === 0) {
        if (
          claimType.toLowerCase() === "death" &&
          reqStatus === 0 &&
          portfolioSubType.toLowerCase() !== "mrta"
        ) {
          if (
            trapScore < 60.0 &&
            source.toLowerCase() === "branch" &&
            payeeAndClaimaintMatchCount > 1
          ) {
            if (ratedSA > 0.0 && ratedSA < 100000.0) {
              if (
                riderComponentType.toLowerCase() === "accidental" &&
                pincodeFlag.toLowerCase() === "no" &&
                cityFlag.toLowerCase() === "no"
              ) {
                if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "non-accidental") {
                    caseDecision = "STP";
                    stpCaseRemark = "Rule15";
                  }
                } else {
                  return "Type of claim is Empty in Event details";
                }
              }
            }
          }
        }
      }
    }

    if (fraudObj == null) {
      if (newTermPlan === 0) {
        if (
          claimType.toLowerCase() === "death" &&
          reqStatus === 0 &&
          portfolioSubType.toLowerCase() !== "mrta"
        ) {
          if (
            trapScore < 60.0 &&
            source.toLowerCase() === "branch" &&
            payeeAndClaimaintMatchCount > 1 &&
            diffOfDODandRCD >= 2.0
          ) {
            if (ratedSA >= 100000.0 && ratedSA <= 500000.0) {
              if (
                riderComponentType.toLowerCase() === "no" &&
                pincodeFlag.toLowerCase() === "no" &&
                cityFlag.toLowerCase() === "no"
              ) {
                caseDecision = "STP";
                stpCaseRemark = "Rule16";
              }
            }
          }
        }
      }
    }

    if (fraudObj == null) {
      if (newTermPlan === 0) {
        if (
          claimType.toLowerCase() === "death" &&
          reqStatus === 0 &&
          portfolioSubType.toLowerCase() !== "mrta"
        ) {
          if (
            trapScore < 60.0 &&
            source.toLowerCase() === "branch" &&
            payeeAndClaimaintMatchCount > 1 &&
            diffOfDODandRCD >= 2.0
          ) {
            if (ratedSA >= 100000.0 && ratedSA <= 500000.0) {
              if (
                riderComponentType.toLowerCase() === "accidental" &&
                pincodeFlag.toLowerCase() === "no" &&
                cityFlag.toLowerCase() === "no"
              ) {
                if (typeOfClaim.toLowerCase() !== "na") {
                  if (typeOfClaim.toLowerCase() === "non-accidental") {
                    caseDecision = "STP";
                    stpCaseRemark = "Rule17";
                  }
                } else {
                  return "Type of claim is Empty in Event details";
                }
              }
            }
          }
        }
      }
    }
    if (fraudObj == null) {
      if (newTermPlan === 0) {
        if (
          claimType.toLowerCase() === "death" &&
          reqStatus === 0 &&
          portfolioSubType.toLowerCase() !== "mrta"
        ) {
          if (
            trapScore < 60.0 &&
            source.toLowerCase() === "branch" &&
            payeeAndClaimaintMatchCount > 1 &&
            diffOfDODandRCD >= 3.0
          ) {
            if (ratedSA > 500000.0 && ratedSA <= 1000000.0) {
              if (
                riderComponentType.toLowerCase() === "no" &&
                pincodeFlag.toLowerCase() === "no" &&
                cityFlag.toLowerCase() === "no"
              ) {
                caseDecision = "STP";
                stpCaseRemark = "Rule18";
              }
            }
          }
        }
      }
    }

    if (fraudObj == null) {
      if (newTermPlan === 0) {
        if (
          claimType.toLowerCase() === "death" &&
          reqStatus === 0 &&
          portfolioSubType.toLowerCase() !== "mrta"
        ) {
          if (
            trapScore < 60.0 &&
            source.toLowerCase() === "branch" &&
            payeeAndClaimaintMatchCount > 1 &&
            diffOfDODandRCD >= 3.0
          ) {
            if (ratedSA > 500000.0 && ratedSA <= 1000000.0) {
              if (
                riderComponentType.toLowerCase() === "accidental" &&
                pincodeFlag.toLowerCase() === "no" &&
                cityFlag.toLowerCase() === "no"
              ) {
                caseDecision = "STP";
                stpCaseRemark = "Rule19";
              }
            }
          }
        }
      }
    }

    if (excessPremiuminDouble > 0.0) {
      amountPayble += excessPremiuminDouble;
    }

    if (caseDecision.toLowerCase() === "na") {
      caseDecision = "Non-STP";
      stpCaseRemark = "";
    }

    console.log("okkk. reached till part 1 of code");

    let interest = "0.0";
    let penalInterest = "0.0";
    let CaseDecision = caseDecision;
    let CaseRemarks = stpCaseRemark;
    let decPri = "";
    let decReason = "";
    let remarks = "";

    let decision = ""; //declared to avoid error
    let reason = ""; //declared to avoid error
    let remark = ""; //declared to avoid error
    if (decision.toUpperCase() !== "NA") {
      decPri = decision;
      decReason = reason;
      remarks = remark;
    } else {
      decPri = "ERR";
      remarks = ",,No Rule Triggered";
    }

    // confirm the params once
    let claimID = parseInt(claimId);
    let transId = crypto.randomUUID();

    const dmlQuery1 = `
      UPDATE claims_poc.claims
      SET DECISION_PRI = ?, DECISION_REASON_PRI = ?, DECISION_REMARKS_PRI = ?
      WHERE CLAIM_ID = ?
    `;

    try {
      await connection.beginTransaction();
      await connection.execute(dmlQuery1, [decPri, decReason, remarks, claimID]);
      await connection.commit(transId);
    } catch (error) {
      await connection.rollback(transId);
      throw error;
    }

    // confirm the params once and the table
    transId = crypto.randomUUID();

    // case decision error in table hence commented
    // try {
    //   await connection.beginTransaction();
    //   let dmlQuery2 = `UPDATE DECISION_DETAILS SET CASE_DECISION = ?, CASE_REMARKS = ?, INTEREST_PRI = ?, PENAL_INTEREST_PRI = ? WHERE claim_id = ?`;
    //   await connection.execute(dmlQuery2, [
    //     CaseDecision,
    //     CaseRemarks,
    //     interest,
    //     penalInterest,
    //     claimID,
    //   ]);
    //   await connection.commit();
    // } catch (err) {
    //   await connection.rollback();
    //   console.error("Transaction failed:", err);
    // }

        //confirm the params and table once
        //commented as getting error in CALCULATED_FIELDS
        // if (calculatedFields !== null) {
        //   try {
        //     transId = crypto.randomUUID();
        //     await connection.beginTransaction();
        //     const query = `
        //           UPDATE DECISION_DETAILS
        //           SET CALCULATED_FIELDS = ?
        //           WHERE CLAIM_ID = ?
        //       `;
        //     await connection.execute(query, [calculatedFields, claimID]);
        //     await connection.commit();
        //   } catch (error) {
        //     await connection.rollback();
        //     throw error;
        //   }
        // }

        const calFields = calculatedFields.split(";");

        //remove this once code is combined
        let productSA=10;
        let investmentFundInDouble=10;
        let guaranteedFundValueInDouble=10;
        let interimBonusInDouble=10;
        let availableSumAssuredInDouble=10;
        let reversionaryBonusInDouble=10;
        let partialWithdrawnAmount=10;
        let premiumInDouble=10;
        let outstandingPremiumInDouble=10;
        // let totalPremiumPaid=10;---getting error at this hence commented
        let guaranteedAdditionInDouble=10;
        let excessPremiumInDouble=10;

        //getting error on sumAssured hence sumAssured1
        const sumAssured1 = productSA.toString();
        const investmentFund = investmentFundInDouble.toString();
        const guaranteedFundValue = guaranteedFundValueInDouble.toString();
        const interimBonus = interimBonusInDouble.toString();
        const availableSumAssured = availableSumAssuredInDouble.toString();
        const reversionaryBonus = reversionaryBonusInDouble.toString();
        const partialWithdrawalAmount = partialWithdrawnAmount.toString();
        const premium = premiumInDouble.toString();
        const outstandingPremium = outstandingPremiumInDouble.toString();
        const outstandingLoanToBank = obj.OUTSTANDINGLOANTOBANK;
        // const totalPremiumPaid = totalPremiumPaid.toString();
        const excessPremium = excessPremiumInDouble.toString();
        const outstandingLoanAsPerNOC = obj.OUTSTANDINGLOANASPERNOC;
        const guaranteedAdditions = guaranteedAdditionInDouble.toString();

        //errors in parametres used
       
    //     const qrySec = `
    //     SELECT
    //         COALESCE(INTEREST_SEC, ?) AS Sinterest,
    //         COALESCE(PENAL_INTEREST_SEC, ?) AS SpenalInterest,
    //         COALESCE(BASE_SEC, ?) AS Ssumassured,
    //         COALESCE(FUND_SEC, ?) AS SguaranteedFundValue,
    //         COALESCE(LOAN_SCHEDULE_SEC, ?) AS Soutstandingloantobank,
    //         COALESCE(INTERIM_SEC, ?) AS SinterimBonus,
    //         COALESCE(IBR_INST_SEC, ?) AS Stotalpremiumpaid,
    //         COALESCE(LOAN_NOC_SEC, ?) AS Soutstandingloanaspernoc,
    //         COALESCE(PREMIUM_OTS_SEC, ?) AS Soutstandingpremium,
    //         COALESCE(PARTIAL_WDWL_SEC, ?) AS SpartialWithdrawalAmount,
    //         COALESCE(REV_BONUS_SEC, ?) AS Srevisonarybonus,
    //         COALESCE(GA_SEC, ?) AS SguaranteedAdditions,
    //         COALESCE(EXCESS_PREMIUM_SEC, ?) AS SexcessPremium
    //     FROM decision_details
    //     WHERE claimId = ?
    // `;
 
    
        // const qrySecData = await connection.execute(qrySec, [
        //   interest,
        //   penalInterest,
        //   sumassured,
        //   guaranteedFundValue,
        //   outstandingloantobank,
        //   interimBonus,
        //   totalpremiumpaid,
        //   outstandingloanaspernoc,
        //   outstandingpremium,
        //   partialWithdrawalAmount,
        //   revisonarybonus,
        //   guaranteedAdditions,
        //   excessPremium,
        //   claimID,
        // ]);

        
        // const busSecObject = qrySecData[0];
        

        /***** below global vars created by harish-on 11-10-12 ******/
        let Sinterest = "0.0";
        let SpenalInterest = "0.0";
        let Ssumassured = "0.0";
        let SguaranteedFundValue = "0.0";
        let Soutstandingloantobank = "0.0";
        let SinterimBonus = "0.0";
        let Stotalpremiumpaid = "0.0";
        let Soutstandingloanaspernoc = "0.0";
        let Soutstandingpremium = "0.0";
        let SpartialWithdrawalAmount = "0.0";
        let Srevisonarybonus = "0.0";
        let SguaranteedAdditions = "0.0";
        let SexcessPremium = "0.0";

        // if (busSecObject && busSecObject.length > 0) {
        //   const secData = busSecObject[0];

        //   Sinterest = secData.Sinterest || "";
        //   SpenalInterest = secData.SpenalInterest || "";
        //   Ssumassured = secData.Ssumassured || "";
        //   SguaranteedFundValue = secData.SguaranteedFundValue || "";
        //   Soutstandingloantobank = secData.Soutstandingloantobank || "";
        //   SinterimBonus = secData.SinterimBonus || "";
        //   Stotalpremiumpaid = secData.Stotalpremiumpaid || "";
        //   Soutstandingloanaspernoc = secData.Soutstandingloanaspernoc || "";
        //   Soutstandingpremium = secData.Soutstandingpremium || "";
        //   SpartialWithdrawalAmount = secData.SpartialWithdrawalAmount || "";
        //   Srevisonarybonus = secData.Srevisonarybonus || "";
        //   SguaranteedAdditions = secData.SguaranteedAdditions || "";
        //   SexcessPremium = secData.SexcessPremium || "";
        // }
       
        const updateFields = ['CLAIM_ID = ?'];
        const updateParams = [claimID];
        if (
          calculatedFields.includes("sumAssured") &&
          (calculatedFields.includes("guaranteedFundValue") ||
            calculatedFields.includes("fundValue"))
        ) {
          if (remarks.toUpperCase() === "SA + VOU") {
            updateFields.push('BASE_PRI = ?', 'FUND_PRI = ?');
            updateParams.push(sumassured, guaranteedFundValue);
          } else {
            if (parseFloat(sumassured) - parseFloat(guaranteedFundValue) > 0) {
              updateFields.push('BASE_PRI = ?');
              updateParams.push(sumassured);
            } else {
              updateFields.push('FUND_PRI = ?');
              updateParams.push(guaranteedFundValue);
            }
          }
        } else {
          if (calculatedFields.includes("sumAssured")) {
            updateFields.push("BASE_PRI = ''");
          }

          if (
            calculatedFields.includes("guaranteedFundValue") ||
            calculatedFields.includes("fundValue")
          ) {
            updateFields.push('FUND_PRI = ?');
            updateParams.push(guaranteedFundValue);
          }
        }

        if (calculatedFields.includes("interimBonus"))
          updateFields.push('INTERIM_PRI = ?'), updateParams.push(interimBonus);

        if (calculatedFields.includes("outstandingLoanToBank"))
          updateFields.push('LOAN_SCHEDULE_PRI = ?'), updateParams.push(outstandingloantobank);

        if (calculatedFields.includes("totalPremiumPaid"))
          updateFields.push('IBR_INST_PRI = ?'), updateParams.push(totalpremiumpaid);

        if (calculatedFields.includes("outstandingLoanAsPerNOC"))
          updateFields.push('LOAN_NOC_PRI = ?'), updateParams.push(outstandingloanaspernoc);

        if (calculatedFields.includes("outstandingPremium"))
          updateFields.push('PREMIUM_OTS_PRI = ?'), updateParams.push(outstandingpremium);

        if (calculatedFields.includes("partialWithdrawalAmount"))
          updateFields.push('PARTIAL_WDWL_PRI = ?'), updateParams.push(partialWithdrawalAmount);

        if (calculatedFields.includes("revisionaryBonus"))
          updateFields.push('REV_BONUS_PRI = ?'), updateParams.push(revisonarybonus);

        if (calculatedFields.includes("guaranteedAdditions"))
          updateFields.push('GA_PRI = ?'), updateParams.push(guaranteedAdditions);

        if (calculatedFields.includes("excessPremium"))
          updateFields.push('EXCESS_PREMIUM_PRI = ?'), updateParams.push(excessPremium);

        const updateQuery00 = `
          UPDATE DECISION_DETAILS
          SET ${updateFields.join(', ')}
          WHERE CLAIM_ID = ?
        `;
        updateParams.push(claimID);

        const transId1 = crypto.randomUUID();

        try {
          await connection.beginTransaction(transId1);
          await connection.execute(updateQuery00, updateParams);
          await connection.commit(transId1);
        } catch (error) {
          await connection.rollback(transId1);
          throw error;
        }

        const totalAmtPayable = totalAmountPayable.toString();
        const transId2 = crypto.randomUUID();

        //error at TOTAL_AMT_PAYABLE_PRI
        // try {
        //   await connection.beginTransaction(transId2);
        //   const query = `
        //         UPDATE DECISION_DETAILS
        //         SET TOTAL_AMT_PAYABLE_PRI = ?
        //         WHERE CLAIM_ID = ?
        //     `;
        //   await connection.execute(query, [totalAmtPayable, claimID]);
        //   await connection.commit(transId2);
        // } catch (error) {
        //   await connection.rollback(transId2);
        //   throw error;
        // }

    //     //whose else is this couldnt identify in code
    //     // else {
    //     //   return "Data is Empty!";
    //     // }
    console.log("okkk. reached till part 2 of code");
    return "Simran function Success";
  } catch (error) {
        let claimId="1";//declared to avoid error
        let uuid23 = crypto.randomUUID();
        const decPri = "ERR";
        const remarks = ",,No Rule Triggered";
        const CaseDecision = "Non-STP";

        const claimID = parseInt(claimId);

        const dmlQuery1 = `
        UPDATE claim
        SET DECISION_PRI = ?, DECISION_REMARKS_PRI = ?
        WHERE claim_id = ?
    `;

        uuid23 = crypto.randomUUID();
        
        try {
          await  connection.beginTransaction();
          await  connection.execute(dmlQuery1, [decPri, remarks, claimID]);
          await  connection.commit();
        } catch (error) {
          await  connection.rollback();
          throw error;
        }
     
        uuid23 = crypto.randomUUID();
       
        try {
          await  connection.beginTransaction();
          const query = `
                UPDATE DECISION_DETAILS
                SET CASE_DECISION = ?
                WHERE CLAIM_ID = ?
            `;
          await  connection.execute(query, [CaseDecision, claimID]);
          await  connection.commit();
        } catch (error) {
          await connection.rollback();
          throw error;
        }


    // throw new Error("Error while calling setSystemDecisionAndReason service");

    console.log(error);
    return error;
  }
};

module.exports = {
  generateSystemDecision,
  generateSystemDecision1,
};
