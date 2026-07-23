const db = require("../config/dbConfig");
// const trapScoreService = require("../services/trapScoreService");

const todayIso = () => new Date().toISOString().split("T")[0];

/** Ensure trap always has values — missing fields use safe POC defaults. */
const applyTrapDefaults = (input = {}) => {
  const d = { ...input };
  const firPm = d.firPmReceived ?? d.firPMReceived ?? "Not Required";
  const claimRepudiate = d.claimRepudiate ?? d.claimsRupidiate ?? "Not Required";
  const productCode = d.productCode || "P001";
  const city = d.city || "Mumbai";
  const pin = String(d.pin || d.pinCode || "400001");

  d.gender = d.gender || "Male";
  d.source = d.source || "Branch";
  d.placeOfClaim = d.placeOfClaim || "Residence";
  d.firPmReceived = firPm;
  d.firPMReceived = firPm;
  d.declareByDR = d.declareByDR || "No";
  d.claimRepudiate = claimRepudiate;
  d.claimsRupidiate = claimRepudiate;
  d.productCategory = d.productCategory || "Traditional";
  d.claimType = d.claimType || "Death";
  d.typeOfClaim = d.typeOfClaim || "Non-accidental";
  d.intimationDate = d.intimationDate || todayIso();
  d.dateOfDeath = d.dateOfDeath || d.dateOfDisability || todayIso();
  d.dateOfDisability = d.dateOfDisability || d.dateOfDeath || todayIso();
  d.policyAge = d.policyAge ?? 1;
  d.ageAtDeath = d.ageAtDeath ?? 45;
  d.causeOfDeath = d.causeOfDeath || "OTHER";
  d.city = city;
  d.pin = pin;
  d.pinCode = pin;
  d.productCode = productCode;
  d.advisorCode = d.advisorCode || d.umCode || d.advisorClub || d.advisorCategory || "NA";
  if (productCode.charAt(0) !== "G" && !d.occCategory) {
    d.occCategory = "OTH";
  }
  d.avlSA = d.avlSA ?? 0;
  return d;
};

const checkForNull = async (trapScoreData) => {
  let count = 0;

  let cityFlagRemark = "";
  let pincodeFlagRemark = "";
  let sourceRemark = "";
  let genderRemark = "";
  let occCategoryRemark = "";
  let placeOfClaimRemark = "";
  let claimRepudiateRemark = "";
  let productCategoryRemark = "";
  let declareByDRRemark = "";
  let FIRPMRemark = "";
  let ageAtDeathRemark = "";
  let intimationDateRemark = "";
  let dateOfDeathRemark = "";
  let policyAgeRemark = "";
  let typeOfClaimRemark = "";

  let causeOfDeathRemark = "";
  let agentRemark = "";
  console.log(trapScoreData.city)
  //1.checking pincode and city-fraud or not'
  const fraudMaster = await getTrapScoreCity({
    city: trapScoreData.city,
    pincode: trapScoreData.pinCode,
  });
  
  if (fraudMaster === "This case is fraud") {
    trapScoreData.pincodeFlag = "Yes";
    trapScoreData.cityFlag = "Yes";
  } else if (fraudMaster === "City is fraud") {
    trapScoreData.pincodeFlag = "No";
    trapScoreData.cityFlag = "Yes";
  } else if (fraudMaster === "Pin code is fraud") {
    trapScoreData.pincodeFlag = "Yes";
    trapScoreData.cityFlag = "No";
  } else if (fraudMaster === "This case is not fraud") {
    trapScoreData.pincodeFlag = "No";
    trapScoreData.cityFlag = "No";
  }
  console.log(trapScoreData.pincodeFlag)
  console.log(trapScoreData.cityFlag)


  //2.checking for null values
  if (!trapScoreData.cityFlag) {
    count++;
    cityFlagRemark = "City Flag is null hence TRAP not executed";
  }

  if (!trapScoreData.pincodeFlag) {
    count++;
    pincodeFlagRemark = "Pincode Flag is null hence TRAP not executed";
  }

  if (!trapScoreData.source) {
    count++;
    sourceRemark = "Intimation source is null hence TRAP not executed";
  }

  if (!trapScoreData.gender) {
    count++;
    genderRemark = "Gender of LA is not provided hence TRAP not executed";
  }

  //2 variabvles product code and occ category
  //if G then ok, else check occCategory if not remark.
  if (
    trapScoreData.productCode?.charAt(0) !== "G" &&
    !trapScoreData.occCategory
  ) {
    count++;
    occCategoryRemark =
      "Occupation of LA is not provided hence TRAP not executed";
  }

  if (!trapScoreData.placeOfClaim) {
    count++;
    placeOfClaimRemark =
      "Place of claim is not provided hence TRAP not executed";
  }

  if (!trapScoreData.claimRepudiate) {
    count++;
    claimRepudiateRemark =
      "Claims Repudiated is not provided hence TRAP not executed";
  }

  if (!trapScoreData.productCategory) {
    count++;
    productCategoryRemark =
      "Product Category is not provided hence TRAP not executed";
  }

  if (!trapScoreData.declareByDR) {
    count++;
    declareByDRRemark = "DeclaredByDoctor is null hence TRAP not executed";
  }

  const firPmValue = trapScoreData.firPmReceived ?? trapScoreData.firPMReceived;
  if (!firPmValue) {
    count++;
    FIRPMRemark = "firPmRecieved is null hence TRAP not executed";
  }

  if (!trapScoreData.ageAtDeath) {
    count++;
    ageAtDeathRemark = "Age at Death is null hence TRAP not executed";
  }

  if (!trapScoreData.intimationDate) {
    count++;
    intimationDateRemark = "Date Intimation is null hence TRAP not executed";
  }

  // claim type, date of death, date of disability--------3 variables checked
  if (trapScoreData.claimType) {
    if (
      trapScoreData.claimType.toLowerCase() === "death" &&
      !trapScoreData.dateOfDeath
    ) {
      count++;
      dateOfDeathRemark = "Date of Death is null hence TRAP not executed";
    } else if (!trapScoreData.dateOfDisability) {
      count++;
      dateOfDeathRemark =
        "Date of Disability/event is null hence TRAP not executed";
    }
  } else {
    count++;
    dateOfDeathRemark = "Claim Type is null hence TRAP not executed";
  }

  if (!trapScoreData.policyAge) {
    count++;
    policyAgeRemark = "Policy Age is null hence TRAP not executed";
  }

  if (!trapScoreData.typeOfClaim) {
    count++;
    typeOfClaimRemark = "Type of claim is null hence TRAP not executed";
  }
  if (
    trapScoreData.typeOfClaim?.toLowerCase() === "non-accidental" &&
    !trapScoreData.causeOfDeath
  ) {
    count++;
    causeOfDeathRemark = "cause of death is null hence TRAP not executed";
  }

  //1 out of 4 should be present, not compulsory all 4
  if (
    !trapScoreData.advisorClub &&
    !trapScoreData.advisorCode &&
    !trapScoreData.umCode &&
    !trapScoreData.advisorCategory
  ) {
    count++;
    agentRemark =
      "None among UM Code, Advisor Club, Advisor Code, and Advisor Category present hence TRAP not executed";
  }

  const finalRemarks =
    cityFlagRemark +
    pincodeFlagRemark +
    sourceRemark +
    genderRemark +
    occCategoryRemark +
    placeOfClaimRemark +
    claimRepudiateRemark +
    productCategoryRemark +
    declareByDRRemark +
    FIRPMRemark +
    ageAtDeathRemark +
    intimationDateRemark +
    dateOfDeathRemark +
    policyAgeRemark +
    typeOfClaimRemark +
    causeOfDeathRemark +
    agentRemark;
  console.log(count)
  if (count === 0) {
    return { status: "Success" };
    
  } else {
    return { status: "Failure", remarks: finalRemarks.trim() };
  }
};

const getTrapScore = async (rawData) => {
  const data = applyTrapDefaults(rawData);
  const {
    gender,
    ageAtDeath,
    education,
    policyAge,
    productCategory,
    occCategory,
    avlSA,
    advStatus,
    claimsRupidiate,
    causeOfDeath,
    placeOfClaim,
    firPmReceived,
    declareByDR,
    trapScore1,
    cityFlag1,
    pincodeFlag,
    nullRemark,
    umCode,
    advisorCode,
    advisorCategory,
    advisorClub,
    dateOfDisability,
    claimType,
    source,
    intimationDate,
    dateOfDeath,
    typeOfClaim,
    productCode,
    pin,
    city
  } = data
  let pinFlag = null, cityFlag = null
  let trapScore = 0;
  let trapRemark = "# "
  let channelScore = 0;
  let channelRemark = ""
  let finalTrapScore = "0.0";

  try {
    const checkForNullValue = await checkForNull(data)
    console.log(checkForNullValue.status)

    if (checkForNullValue.status.toLowerCase() === "success") {
      const fraudMaster = await getTrapScoreCity({ pin, city })
      if (fraudMaster === ("This case is fraud")) {
        pinFlag = "Yes";
        cityFlag = "Yes";
      } else if (fraudMaster === ("City is fraud")) {
        pinFlag = "No";
        cityFlag = "Yes";
      } else if (fraudMaster === ("Pin code is fraud")) {
        pinFlag = "Yes";
        cityFlag = "No";
      } else if (fraudMaster === ("This case is not fraud")) {
        pinFlag = "No";
        cityFlag = "No";
      }

      if (
        (!(cityFlag?.toLowerCase() === "yes") && !(cityFlag?.toLowerCase() === "no")) &&
        (!(pincodeFlag?.toLowerCase() === "yes") && !(pincodeFlag?.toLowerCase() === "no"))
      ) {
        const cityFlagQuery = 'SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME="Pincode Flag" AND VALUE IS NULL';
        const [cityFlagRow] = await db.query(cityFlagQuery);
        trapScore += cityFlagRow[0].SCORE;
        trapRemark += `\n# ${cityFlagRow[0].REMARK}`;

        const pincodeFlagQuery = 'SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME="Pincode Flag" AND VALUE IS NULL';
        const [pincodeFlagRow] = await db.query(pincodeFlagQuery);
        trapScore += pincodeFlagRow[0].SCORE;
        trapRemark += `\n# ${pincodeFlagRow[0].REMARK}`;

      } else {
        const cityFlagQuery = "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME = 'City Flag' AND VALUE = ?";
        const [cityFlagRow] = await db.query(cityFlagQuery, [cityFlag]);
        trapScore += cityFlagRow[0].SCORE;
        trapRemark += `\n# ${cityFlagRow[0].REMARK}`;

        const pincodeFlagQuery = "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME = 'Pincode Flag' AND VALUE = ?";
        const [pincodeFlagRow] = await db.query(pincodeFlagQuery, [pinFlag]);
        trapScore += pincodeFlagRow[0].SCORE;
        trapRemark += `\n# ${pincodeFlagRow[0].REMARK}`;
      }
      console.log("CityFlag and Pinflag done")


      if (!ageAtDeath) {
        const ageAtDeathQuery =
          'SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME="Age at Death" AND VALUE IS NULL';
        const [ageAtDeathRow] = await db.query(ageAtDeathQuery);
        trapScore += ageAtDeathRow[0].SCORE;
        trapRemark += `\n# ${ageAtDeathRow[0].REMARK}`;
      } else {
        const age = parseInt(ageAtDeath, 10);
        let ageCondition;
        if (age < 35) ageCondition = "< 35";
        else if (age >= 35 && age < 45) ageCondition = "35 <= < 45";
        else if (age >= 45 && age < 60) ageCondition = "45 <= <60";
        else if (age >= 60) ageCondition = ">= 60";

        const ageAtDeathQuery =
          "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Age at Death' AND VALUE = ?";

        const [ageAtDeathRow] = await db.query(ageAtDeathQuery, [ageCondition]);
        trapScore += ageAtDeathRow[0].SCORE;
        trapRemark += `\n# ${ageAtDeathRow[0].REMARK}`;
      }

      console.log("Age At death is done")

      let educationValue;
      if (
        !education ||
        ["<SSC", "SSC", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "OTH"].includes(
          education.toUpperCase()
        )
      ) {
        educationValue = "<SSC";
      } else if (["DIP", "HSC", "UEDU", "<SSC", "SSC", "OTH"].includes(education.toUpperCase())) {
        educationValue = "<SSC";
      } else {
        educationValue = "GRAD";
      }

      const educationQuery = "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Education' AND VALUE = ?";
      const [educationRow] = await db.query(educationQuery, [educationValue]);
      trapScore += educationRow[0].SCORE;
      trapRemark += `\n# ${educationRow[0].REMARK}`;

      console.log("Education done")


      // Occupation scoring logic
      const occupationQuery = "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Occupation' AND VALUE = ?";
      const [occupationRow] = await db.query(occupationQuery, [occCategory]);
      if (occupationRow.length === 0) {
        const occupationQuery1 = "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Occupation' AND VALUE IS NULL";
        const [occupationRow1] = await db.query(occupationQuery1);
        trapScore += occupationRow1[0].SCORE;
        trapRemark += `\n# ${occupationRow1[0].REMARK}`;
      } else {
        trapScore += occupationRow[0].SCORE;
        trapRemark += `\n# ${occupationRow[0].REMARK}`;
      }
      console.log("Occupation works well")

      // Product Category scoring logic
      const productCategoryQuery = "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Product Category' AND VALUE = ?";
      const [productCategoryRow] = await db.query(productCategoryQuery, [productCategory]);
      if (productCategoryRow.length === 0) {
        const productCategoryQuery1 = "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Product Category' AND VALUE IS NULL";
        const [productCategoryRow1] = await db.query(productCategoryQuery1);
        trapScore += productCategoryRow1[0].SCORE;
        trapRemark += `\n# ${productCategoryRow1[0].REMARK}`;
      } else {
        trapScore += productCategoryRow[0].SCORE;
        trapRemark += `\n# ${productCategoryRow[0].REMARK}`;
      }

      console.log("Product Category Done")

      // Available Sum Assured (avlSA) scoring logic
      if (!avlSA) {
        const avlSAQuery = "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Available SumAssured' AND VALUE IS NULL";
        const [avlSARow] = await db.query(avlSAQuery);
        trapScore += avlSARow[0].SCORE;
        trapRemark += `\n# ${avlSARow[0].REMARK}`;
      } else {
        const availableSa = parseFloat(avlSA);
        let avlSACondition = null;

        if (availableSa < 500000.0) {
          avlSACondition = "< 500,000";
        } else if (availableSa >= 500000.0 && availableSa < 1000000.0) {
          avlSACondition = "500,000 <= < 1,000,000";
        } else if (availableSa >= 1000000.0 && availableSa < 2500000.0) {
          avlSACondition = "1,000,000 <= < 2,500,000";
        } else if (availableSa >= 2500000.0) {
          avlSACondition = ">= 2500000";
        }

        if (avlSACondition) {
          const avlSAQuery = "SELECT SCORE, REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Available SumAssured' AND VALUE = ?";
          const [avlSARow] = await db.query(avlSAQuery, [avlSACondition]);
          trapScore += avlSARow[0].SCORE;
          trapRemark += `\n# ${avlSARow[0].REMARK}`;
        } else {
          console.log("Available SA is not valid")
        }
      }
      console.log("Available SA is done")

      if (umCode != null) {
        if (umCode.toLowerCase() === "00006733") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'UMCode for BlueChip is 00006733'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        if (umCode.toLowerCase() === "00612807") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'UMCode for BlueChip is 00612807'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_2_BajajCapital
        if (umCode.toLowerCase() === "00049259") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'UMCode for BajajCapital is 00049259'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_3_BajajCapital
        if (umCode.toLowerCase() === "00006783") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'UMCode for BajajCapital is 00006783'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_4_BajajCapital
        if (umCode.toLowerCase() === "00246504") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'UMCode for BajajCapital is 00246504'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_5_ICICI_Bank
        if (umCode.toLowerCase() === "00151772") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'UMCode for ICICI Bank is 00151772'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_6_ICICI_Securities
        if (umCode.toLowerCase() === "00204168") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'UMCode for ICICI Securities is 00204168'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }
      }
      console.log("UM code is clear")
      //done and dusted
      // Channel_7_SCB
      if (advisorCode != null) {
        if (advisorCode.toLowerCase() === "01251151") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Code for SCB is 01251151'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_8_SCB
        if (advisorCode.toLowerCase() === "01251152") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Code for SCB is 01251152'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_9_SCB
        if (advisorCode.toLowerCase() === "01251153") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Code for SCB is 01251153'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_10_SCB
        if (advisorCode.toLowerCase() === "01251154") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Code for SCB is 01251154'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }
      }

      // Channel_11_CA
      if (
        advisorCategory?.toLowerCase() === "ca" &&
        umCode?.toLowerCase() !== "00151772" &&
        umCode?.toLowerCase() !== "00204168" &&
        !["01251151", "01251152", "01251153", "01251154"].includes(advisorCode?.toLowerCase())
      ) {
        const channelQuery = `
          SELECT SCORE, REMARK 
          FROM trap_score_master 
          WHERE FIELD_NAME='Channel' 
          AND VALUE='Advisor Channel is CA'
        `;
        const [channelRow] = await db.query(channelQuery);
        channelScore = channelRow[0]?.SCORE;
        channelRemark = channelRow[0]?.REMARK;
      }

      // Channel_12_BR
      if (advisorCategory?.toLowerCase() === "br") {
        const channelQuery = `
          SELECT SCORE, REMARK 
          FROM trap_score_master 
          WHERE FIELD_NAME='Channel' 
          AND VALUE='Advisor Channel is BR'
        `;
        const [channelRow] = await db.query(channelQuery);
        channelScore = channelRow[0]?.SCORE;
        channelRemark = channelRow[0]?.REMARK;
      }

      // Channel_13_BOL
        if (advisorCode?.toLowerCase() === "01154717") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Code for BOL is 01154717'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }
      

      // Channel_14_BOL
      
        if (advisorCode?.toLowerCase() === "00066918") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Code for BOL is 00066918'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }
      

      // Channel_15_BOL
      if (advisorCategory != null) {
        if (advisorCategory.toLowerCase() === "w1") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Channel is W1'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_16_BOL
        if (advisorCategory.toLowerCase() === "wa") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Channel is WA'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_17_PSF
        if (advisorCategory.toLowerCase() === "dm") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Channel is DM'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_18_PSF
        if (advisorCategory.toLowerCase() === "df") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Channel is DF'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_19_PSF
        if (advisorCategory.toLowerCase() === "rd") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Channel is RD'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_20_PSF
        if (advisorCategory.toLowerCase() === "rs") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Channel is RS'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_21_PSF
        if (advisorCategory.toLowerCase() === "sm") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Channel is SM'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }

        // Channel_22_PSF
        if (advisorCategory.toLowerCase() === "um") {
          const channelQuery = "SELECT SCORE, REMARK FROM trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Channel is UM'";
          const [channelRow] = await db.query(channelQuery);
          channelScore = channelRow[0].SCORE;
          channelRemark = channelRow[0].REMARK;
        }
      }

      console.log("My part is cleare")

      if (advisorClub != null) {
        //23
        if (advisorClub === "D1GG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is D1GG'";
          const [row] = await db.query(channelQuery);
          // console.log(row)
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        //24
        if (advisorClub=="D2GG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is D2GG'";
          const [row] = db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_25_PSF
        if (advisorClub === "DAGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is DAGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_26_PSF
        if (advisorClub === "DBGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is DBGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        //27
        if (advisorClub === "DCGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is DCGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_28_PSF
        if (advisorClub === "DDGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is DDGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_29_PSF
        if (advisorClub === "DEGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is DEGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_30_PSF
        if (advisorClub === "S1GG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is S1GG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_31_PSF
        if (advisorClub === "S2GG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is S2GG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
        // Channel_32_PSF
        if (advisorClub === "SAGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is SAGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_33_PSF
        if (advisorClub === "SBGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is SBGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_34_PSF
        if (advisorClub === "SCGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is SCGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_35_PSF
        if (advisorClub === "SDGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is SDGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_36_PSF
        if (advisorClub === "SEGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is SEGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_37_PSF
        if (advisorClub === "RAGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is RAGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
        // Channel_38_PSF
        if (advisorClub === "RBGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is RBGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_39_PSF
        if (advisorClub === "RCGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is RCGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_40_PSF
        if (advisorClub === "RDGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is RDGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
    
        // Channel_41_PSF
        if (advisorClub === "REGG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Club for PSF is REGG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
      }
    
      console.log("advisor club clear...")
      //42
      if (advisorCategory != null) {
        if (advisorCategory === "AG") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'Advisor Channel is AG'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
      }
    
      //Channel_43_IEP
    
      // Bin IEP  from characteristic Channel
      if (umCode != null) {
        if (umCode === "00123999") {
          const channelQuery =
            "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE = 'UMCode for IEP is 00123999'";
          const [row] = await db.query(channelQuery);
          channelScore = row[0].SCORE;
          channelRemark = row[0].REMARK;
        }
      }
      if (channelScore == 0) {
        const channelQuery = `SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Channel' AND VALUE IS NULL`;
        const [row] = await db.query(channelQuery);
        channelScore = row[0].SCORE;
        channelRemark = row[0].REMARK;
      }
    
      trapScore = trapScore + channelScore;
      trapRemark = trapRemark + "\n# " + channelRemark;
    
      // need to disucss advisor status
      if (advStatus == null || advStatus == "    ") {
        const advisorStatusQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Advisor Status' AND VALUE ='Advisor status = TAGB'";
        const [row] = await db.query(advisorStatusQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else if (advStatus == "NA") {
        const advisorStatusQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Advisor Status' AND VALUE ='Advisor status = NA'";
        const [row] = await db.query(advisorStatusQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else if (
        advStatus!=="NA" &&
        advStatus!=="CV"
      ) {
        const advisorStatusQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Advisor Status' AND VALUE ='Advisor status <> CV'";
        const [row] = await db.query(advisorStatusQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else if (advStatus == "CV") {
        const advisorStatusQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Advisor Status' AND VALUE ='Advisor status = CV'";
        const [row] = await db.query(advisorStatusQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
    
      if (causeOfDeath == null) {
        const codQuery = `"SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Cause of Death' AND VALUE IS NULL`;
        const [row] = await db.query(codQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else {
        const codQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Cause of Death' AND VALUE =?";
        const [row] = await db.query(codQuery, [causeOfDeath]);
        if (row && row.length > 0) {
          trapScore = trapScore + row[0].SCORE;
          trapRemark = trapRemark + "\n# " + row[0].REMARK;
        } 
        else {
          const codQuery1 = `SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Cause of Death' AND VALUE IS NULL`;
          const [row] = await db.query(codQuery1);
          trapScore = trapScore + row[0].SCORE;
          trapRemark = trapRemark + "\n# " + row[0].REMARK;
        }
      }
      console.log("cause of death done")
      if (placeOfClaim == null) {
        const placeOfClaimQuery = `SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Place of Death' AND VALUE IS NULL`;
        const [row] = await db.query(placeOfClaimQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else {
        const placeOfClaimQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Place of Death' AND VALUE =?";
        const [row] = await db.query(placeOfClaimQuery, [placeOfClaim]);
        if (row && row.length > 0) {
          trapScore = trapScore + row[0].SCORE;
          trapRemark = trapRemark + "\n# " + row[0].REMARK;
        } 
        else {
          const placeOfClaimQuery1 = `SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Place of Death' AND VALUE IS NULL`;
          const [row1] = await db.query(placeOfClaimQuery1);
          trapScore = trapScore + row1[0].SCORE;
          trapRemark = trapRemark + "\n# " + row1[0].REMARK;
        }
      }
    
      console.log("place of claim done")
      if (firPmReceived == null) {
        const firPMrcdQuery = `SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='FIR/PM Received' AND VALUE IS NULL`;
        const [row] = await db.query(firPMrcdQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else if (firPmReceived == "Yes") {
        const firPMrcdQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='FIR/PM Received' AND VALUE ='Yes'";
        const [row] = await db.query(firPMrcdQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else if (firPmReceived == "No") {
        const firPMrcdQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='FIR/PM Received' AND VALUE ='No'";
        const [row] = await db.query(firPMrcdQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else if (firPmReceived == "Not Required") {
        const firPMrcdQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='FIR/PM Received' AND VALUE ='NotRequired'";
        const [row] = await db.query(firPMrcdQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
      console.log("fir pm received done")

      if (declareByDR == null) {
        const declareByDRQuery = `SELECT SCORE,REMARK FROM claims_poc.trap_score_masterWHERE FIELD_NAME='Death Declared By Doctor' AND VALUE IS NULL`;
        const [row] = await db.query(declareByDRQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else if (declareByDR == "Yes") {
        const declareByDRQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Death Declared By Doctor' AND VALUE ='Yes'";
        const [row] = await db.query(declareByDRQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else if (declareByDR == "No") {
        const declareByDRQuery =
          "SELECT SCORE,REMARK FROM claims_poc.trap_score_master WHERE FIELD_NAME='Death Declared By Doctor' AND VALUE ='No'";
        const [row] = await db.query(declareByDRQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
    
      console.log("declare by dr done")
      if (policyAge == null) {
        const policyAgeQuery = `SELECT SCORE,REMARK FROM CAPS_TRAPSCORE_MASTER WHERE FIELD_NAME='Policy Duration' AND VALUE IS NULL`;
        const [row] = await db.query(policyAgeQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      } else {
        //DecimalFormat df = new DecimalFormat("#.#");
        //String roundValueStr = df.format(policyAge);
        let policyAgeDuration = parseFloat(policyAge);
    
        if (policyAgeDuration < 0.5) {
          const policyAgeQuery =
            "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Policy Duration' AND VALUE = '<0.5'";
          const [row] = await db.query(policyAgeQuery);
          trapScore = trapScore + row[0].SCORE;
          trapRemark = trapRemark + "\n# " + row[0].REMARK;
        } else if (policyAgeDuration >= 0.5 && policyAgeDuration < 1.0) {
          const policyAgeQuery =
            "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Policy Duration' AND VALUE = '0.5 <= ..< 1'";
          const [row] = await db.query(policyAgeQuery);
          trapScore = trapScore + row[0].SCORE;
          trapRemark = trapRemark + "\n# " + row[0].REMARK;
        } else if (policyAgeDuration >= 1.0 && policyAgeDuration < 2.0) {
          const policyAgeQuery =
            "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Policy Duration' AND VALUE = '1<=2'";
          const [row] = await db.query(policyAgeQuery);
          trapScore = trapScore + row[0].SCORE;
          trapRemark = trapRemark + "\n# " + row[0].REMARK;
        } else if (policyAgeDuration >= 2.0) {
          const policyAgeQuery =
            "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Policy Duration' AND VALUE = '>=2'";
          const [row] = await db.query(policyAgeQuery);
          trapScore = trapScore + row[0].SCORE;
          trapRemark = trapRemark + "\n# " + row[0].REMARK;
        }
      }
    console.log("policy age done")
    
    
    let deathIntimation = 0.0;
      //claim intimation need to discuss 
      if(deathIntimation < 2.0) {
        const  deathIntimationWithinQuery  = "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Death intimated within' AND VALUE = '<2'";
        const [row] = await db.query(deathIntimationWithinQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
      else if(deathIntimation >= 2.0 && deathIntimation < 6.0) {
        const deathIntimationWithinQuery  = "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Death intimated within' AND VALUE = '2<=..<6'";
        const [row] = await db.query(deathIntimationWithinQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
      else if(deathIntimation >= 6.0 && deathIntimation < 12.0) {
        const  deathIntimationWithinQuery  = "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Death intimated within' AND VALUE = '6 <= ..< 12'";
        const [row] = await db.query(deathIntimationWithinQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
      else if(deathIntimation >= 12.0) {
        const  deathIntimationWithinQuery  = "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Death intimated within' AND VALUE = '>=12'";
        const [row] = await db.query(deathIntimationWithinQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
      else  {
        const  deathIntimationWithinQuery  = "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Death intimated within' AND VALUE IS NULL";
        const [row] = await db.query(deathIntimationWithinQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
    
      console.log("death intimation done")
      if( claimsRupidiate == null) {
        const claimRepudiateQuery  = `SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Claims Repudiated' AND VALUE IS NULL`;
        const [row] = await db.query(claimRepudiateQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
      else if(claimsRupidiate=="Yes") {
        const  claimRepudiateQuery  = "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Claims Repudiated' AND VALUE ='Yes'";
        const [row] = await db.query(claimRepudiateQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
      else if(claimsRupidiate=="No") {
        const claimRepudiateQuery  = "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Claims Repudiated' AND VALUE ='NO'";
        const [row] = await db.query(claimRepudiateQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }
    
      else if(claimsRupidiate=="Not Required") {
        const claimRepudiateQuery  = "SELECT SCORE,REMARK FROM trap_score_master WHERE FIELD_NAME='Claims Repudiated' AND VALUE ='Not Required'";
        const [row] = await db.query(claimRepudiateQuery);
        trapScore = trapScore + row[0].SCORE;
        trapRemark = trapRemark + "\n# " + row[0].REMARK;
      }

      console.log("claims repudiate done")

      const trapScoreForClaimID = trapScore / 9.0;
      finalTrapScore = trapScoreForClaimID.toFixed(2).toString();


    } else {
      trapRemark = checkForNullValue.status
    }
    
    return { trapScoreDate:Date.now(), trapScore:finalTrapScore, trapRemarks: trapRemark }
  } catch (error) {
    console.log(error);
    return {
      trapScoreDate: Date.now(),
      trapScore: "0.0",
      trapRemarks: `# Trap score completed with defaults after error: ${error.message}`,
    };
  }
};


const getTrapScoreCity = async (data) => {
  try {
    if (!data?.city || !data?.pin) {
      return "This case is not fraud";
    }

    const claimCity = String(data.city).toLowerCase();
    const claimPin = data.pin;
    const query =
      "SELECT PIN_CODE, CITY FROM claims_poc.sampling_matrix_hist WHERE PIN_CODE=? OR  CITY=?";
    const [row] = await db.query(query, [claimPin, claimCity]);

    let cityFlag = 0,
      pinFlag = 0;
    for (const { PIN_CODE, CITY } of row) {
      if (CITY.toLowerCase() === claimCity) {
        cityFlag = 1;
      }
      if (PIN_CODE === claimPin) {
        pinFlag = 1;
      }

      if (cityFlag === 1 && pinFlag === 1) {
        break;
      }
    }
    if (cityFlag == 1 && pinFlag == 1) return "This case is fraud";
    else if (cityFlag == 0 && pinFlag == 1) return "Pin code is fraud";
    else if (cityFlag == 1 && pinFlag == 0) return "City is fraud";
    else return "This case is not fraud";
  } catch (error) {
    throw new Error("Error while retrieving data " + error.message);
  }
};

module.exports = {
  checkForNull,
  getTrapScore,
  getTrapScoreCity,
};
