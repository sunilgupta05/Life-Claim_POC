const getAmount = async (obj) => {
  try {
    console.log("calc amount data:",obj)
    
    var fundTempVal = obj.fund || 0;
    var baseTempVal = obj.base || 0;
    var msarSaSecTempVal = obj.msarsa || 0;
    var exGratiaTemp = obj.exgratia || 0;

    if (obj.base === "" || obj.base === null) {
      baseTempVal = 0;
    }

    if (obj.fund === "" || obj.fund === null) {
      fundTempVal = 0;
    }

    if (obj.interim === "" || obj.interim === null) {
      obj.interim = 0;
    }

    if (obj.ga === "" || obj.ga === null) {
      obj.ga = 0;
    }

    if (obj.revBonus === "" || obj.revBonus === null) {
      obj.revBonus = 0;
    }

    if (obj.interest === "" || obj.interest === null) {
      obj.interest = 0;
    }

    if (obj.penalInterest1 === "" || obj.penalInterest1 === null) {
      obj.penalInterest1 = 0;
    }

    if (obj.partialWdwt === "" || obj.partialWdwt === null) {
      obj.partialWdwt = 0;
    }

    if (obj.ibrsa === "" || obj.ibrsa === null) {
      obj.ibrsa = 0;
    }

    // loan seh sec ???????? 
    // if (obj.loanSehSec === "" || obj.loanSehSec  === "null") {
    //   obj.loanSehSec  = 0;
    // }

    if (obj.premiumOts === "" || obj.premiumOts === null) {
      obj.premiumOts = 0;
    }

    // field not avaialbale
    // if (obj.expPremiumSec === "" || obj.expPremiumSec === "null") {
    //   obj.expPremiumSec = 0;
    // }

    if (obj.ltarsa === "" || obj.ltarsa === null) {
      obj.ltarsa = 0;
    }

    if (obj.abrsa === "" || obj.abrsa === null) {
      obj.abrsa = 0;
    }

    if (obj.adbrsa === "" || obj.adbrsa === null) {
      obj.adbrsa = 0;
    }

    if (obj.msarsa === "" || obj.msarsa === null) {
      msarSaSecTempVal = 0;
    }

    // nyprsa not there so ppyrsa
    if (obj.ppyrsa === "" || obj.ppyrsa === null) {
      obj.ppyrsa = 0;
    }

    if (obj.ibrsa === "" || obj.ibrsa === null) {
      obj.ibrsa = 0;
    }

    // 3 variables assume 
    // let productFlag = "Group";
    // let cdfDetail = "No";
    // let splitPayment = "";
    
    if (obj.cibrsa === "" || obj.cibrsa === null) {
      obj.cibrsa = 0;
    } 
    // else {
    //   if (productFlag === "Group") {
    //     if (baseTempVal === 0) {
    //       if (parseInt(obj.loanNoc) > parseInt(obj.cibrsa)) {
    //         if (obj.cdfDetail === "No") {
    //           obj.loanNoc = 0;
    //         } else if (cdfDetail === "Yes" && splitPayment === "No") {
    //           obj.loanNoc = 0;
    //         } else {
    //           obj.loanNoc = obj.cibrsa;
    //         }
    //       } else {
    //         if (cdfDetail === "No") {
    //           obj.loanNoc = 0;
    //         } else if (cdfDetail === "Yes" && splitPayment === "No") {
    //           obj.loanNoc = 0;
    //         } else {
    //           obj.loanNoc = obj.cibrsa;
    //         }
    //       }
    //     } else {
    //       if (obj.cibrsa === 0) {
    //         if (parseFloat(obj.loanNoc) > parseFloat(baseTempVal)) {
    //           obj.loanNoc = baseTempVal;
    //         }

    //         if (cdfDetail === "No") {
    //           obj.loanNoc = 0;
    //         }

    //         if (cdfDetail === "Yes" && splitPayment === "No") {
    //           obj.loanNoc = 0;
    //         }
    //       }
    //     }
    //   }
    // }

    if (obj.exgratia === "" || obj.exgratia === null) {
      exGratiaTemp = 0;
    }

    if (obj.terminalBonus === "" || obj.terminalBonus === null) {
      obj.terminalBonus = 0;
    }

    if (obj.otsLoan === "" || obj.otsLoan === null) {
      obj.otsLoan = 0;
    }

    // IntrestAndExgraiaCalling();

    // Adding amounts for total calculation
   
      var totAmtAdd = (
        parseFloat(baseTempVal || 0) +
        parseFloat(obj.revBonus || 0) +
        // parseFloat(obj.expPremiumSec) +
        parseFloat(obj.abrsa || 0) +
        parseFloat(obj.adbrsa || 0) +
        parseFloat(obj.ga || 0) +
        parseFloat(obj.interim || 0) +
        parseFloat(fundTempVal || 0) +
        parseFloat(exGratiaTemp || 0)+
        parseFloat(obj.ppyrsa || 0)+
        parseFloat(obj.msarsa|| 0)+
        parseFloat (obj.ibrsa|| 0)
         // + parseFloat(obj.loanSehSec)

      ).toFixed(2);
      
      var totAmtAdd2 = (
        parseFloat(obj.terminalBonus || 0) +
        parseFloat(msarSaSecTempVal || 0) +
        parseFloat(obj.cibrsa || 0) +
        parseFloat(obj.ltarsa || 0)
      ).toFixed(2);


    if (obj.reqDamt >= 0) {
      var RepudiationAmt = parseFloat(obj.reqDamt).toFixed(2);
    } else {
      var RepudiationAmt = 0;
    }
    var totAmtDeduct = (
      parseFloat(obj.partialWdwt) +
      parseFloat(obj.premiumOts) +
      parseFloat(obj.otsLoan)
    ).toFixed(2);

    var totAmt = (
      parseFloat(totAmtAdd) +
      parseFloat(totAmtAdd2) +
      parseFloat(totAmtDeduct) +
      parseFloat(RepudiationAmt)
    ).toFixed(2);

    // totalAmtPayable is a field that stores the total amount
    obj.totalAmtPayable = totAmt;

    //   logic by himanshu sir
    let bankPay = obj.loanNoc;
    let custPay = obj.totalAmtPayable - obj.loanNoc;

    
    // let bankPay = 0
    // let custPay = 0
    // // Handle Split Payment logic
    // if (splitPayment === "Yes") {
    //   bankPay = obj.loanNoc;
    //   custPay = obj.totalAmtPayable - obj.bankPay;
    // } else if (splitPayment === "No") {
    //   custPay = obj.totalAmtPayable;
    //   bankPay = 0;
    // } else if (cdfDetail === "No") {
    //   custPay = obj.totalAmtPayable;
    //   bankPay = 0;
    // } else {
    //   bankPay = obj.loanNoc;
    //   custPay = obj.totalAmtPayable - obj.bankPay;
    // }








    // to be checked from here logic not discussed
    //partial payout
    if(obj.decision == 'Reject_Decision' && obj.decisionReason == 'PartialPayout'){
      obj.reqDamt = 0
      obj.totalAmtPayable = 0;
      obj.ppAmt1 = 0
      obj.ppAmt2 = 0
    }
    
    //assume varible 4th therefore else is executed line 282 and sets ppamt1,ppamt2 to 0
    let ppDecision="Not eligible for partial payment"
    let ppAmount2 = 0.0, ppAmount1 = 0.0
    if(ppDecision != "Not eligible for partial payment"){
      
      let demosAvailableSA = obj.totalAmtPayable; //5th value assume its equal to totamypaypri in sirs code 
      demosAvailableSA = demosAvailableSA.toString();
      let avlSA = demosAvailableSA.replace(/[,]+/g, "");
      let ctmFlag = "0" // 6th value assume

      if(ctmFlag == "0"){
        ppAmount1 = parseFloat(avlSA/2).toFixed(2)
      }

      if(ppAmount1>2500000){
        if (
          ctmFlag == 0 &&
          obj.decision == "Accept_Decision" &&
          obj.decisionReason == "PartialPayout"
        ) {
          obj.ppAmt1 = 2500000;
        } else {
          if (
            ctmFlag == 2 &&
            obj.decision == "Accept_Decision" &&
            obj.decisionReason != "PartialPayout"
          )
          ppAmount2 = parseFloat(totAmt).toFixed(2) - parseFloat(2500000).toFixed(2);
          ppAmount2 = parseFloat(ppAmount2).toFixed(2);
  
          obj.ppAmt2 = ppAmount2;
        }
      } else {
        if (
          ctmFlag == 0 &&
          obj.decision == "Accept_Decision" &&
          obj.decisionReason == "PartialPayout"
        ) {
          obj.ppAmt1 = ppAmount1;
        } else {
          if (
            ctmFlag == 2 &&
            obj.decision == "Accept_Decision" &&
            obj.decisionReason != "PartialPayout"
          ) {
            ppAmount1 = ppAmt1.getValue();
            ppAmount2 = parseFloat(totAmt) - parseFloat(ppAmount1);
          }
          ppAmount2 = parseFloat(ppAmount2).toFixed(2);
  
          obj.ppAmt2 = ppAmount2;
        }
      }

    }else{
      if(obj.ppAmt1=='0' || obj.ppAmt1 == null){
        obj.ppAmt1 = 0
      }

      if(obj.ppAmt2=='0' || obj.ppAmt2 == null){
        obj.ppAmt2 = 0
      }
    }


    return {
      totalAmount: totAmt,
      totalAdditions: totAmtAdd,
      totalDeductions: totAmtDeduct,
      bankPay,
      custPay,
      partialPayout: { ppAmount1, ppAmount2 },
    }

  } catch (error) {
    console.log(error)
    throw new Error('Error in service');
  }
};

module.exports = {
  getAmount,
};