const db = require("../config/dbConfig");

exports.getassessmentQuestions = async (data) => {
  try {
    console.log("hi,in service", data);
    let { claimType, productCode, portfolio, typeOfClaim, riderType } = data;
    let breQuestionId = "";
    let arr = [];

    //RULE 1
    if (
      ["Urban", "Lapsed", "ZDB", "Paid-Up", "MRTA", "Credit-Assure"].includes(
        portfolio
      ) ||
      productCode === "U57" ||
      ["Death", "Terminal Illness"].includes(claimType)
    ) {
      breQuestionId = "1A,1B";
      arr = breQuestionId.split(",");
    }

    //RULE 2
    if (
      [
        "Urban",
        "Lapsed",
        "ZDB",
        "Paid-Up",
        "MRTA",
        "Credit-Assure",
        "Rural",
        "Social",
        "Annuity",
      ].includes(portfolio) &&
      claimType === "Death"
    ) {
      breQuestionId = "2A";
      arr.push(breQuestionId);
    }

    //RULE 3
    //commented as quest id not present in master
    // if (
    //     ["Urban", "Lapsed", "ZDB", "Paid-Up", "MRTA", "Credit-Assure"].includes(portfolio) &&
    //     claimType === "Death"
    // ) {
    //     breQuestionId = "3A,3B";
    //     arr.push(...breQuestionId.split(","));
    // }

    //RULE 4
    if (
      ["MRTA", "Credit-Assure"].includes(portfolio) &&
      claimType === "Death"
    ) {
      breQuestionId = "7";
      arr.push(breQuestionId);
    }

    // RULE 5
    //USE "AMPU" for testing Accidental
    if (
      [
        "Urban",
        "Lapsed",
        "ZDB",
        "Paid-Up",
        "MRTA",
        "Credit-Assure",
        "Rural",
      ].includes(portfolio) &&
      claimType === "Death" &&
      typeOfClaim === "Accidental"
    ) {
      breQuestionId = "8A,8B,8C,8D,8E";
      arr.push(...breQuestionId.split(","));
    }

    // RULE 6
    //commented as quest id not present in master
    //   if (
    //     (["Urban", "Lapsed", "ZDB", "Paid-Up", "MRTA", "Credit-Assure", "Rural"].includes(portfolio) &&
    //     typeOfClaim === "Accidental") ||
    //     claimType === "Death"
    // ) {
    //     breQuestionId = "2C";
    //     arr.push(breQuestionId);
    // }

     // RULE 7
     if (claimType === "Terminal Illness") {
        breQuestionId = "17";
        arr.push(breQuestionId);
    }

     // DEFAULT RULES
     breQuestionId = "9A,10,11,12,13,14,15,16,Covid1,Covid2";
     arr.push(...breQuestionId.split(","));

    console.log(arr);

         // Fetch data based on arr
         const query = `
         SELECT BRE_QUESTION_ID, BRE_QUES_DESC  
         FROM caps_assessment_qustns_master
         WHERE BRE_QUESTION_ID IN (${arr.map(() => "?").join(",")})
     `;
     
     const [rows] = await db.query(query, arr);
     console.log(rows);

    return rows;
  } catch (error) {
    console.log(error);
  }
};
