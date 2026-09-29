const logger = require('../util/logger');
var nodemailer = require('nodemailer');
const capsEmailCommMasterDAO = require ('../dataAccess/emailCommunicationDao');
const capsClaimDetailsDao = require ('../dataAccess/claimDao');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'healthclaimsdh@gmail.com',
      pass: 'uzbt wykd rivo womp'
    }
  });

  var mailOptions = {
    from: 'healthclaimsdh@gmail.com',
    to: '',
    subject: '',
    text: ''
  }

const sendMail  = async (id) => {
    try {

        const capsClaimDetailsObj = await capsClaimDetailsDao.getClaimDetailsById(id);
        logger.info(capsClaimDetailsObj);
        const claimStatus = capsClaimDetailsObj.CLAIMSTATUS;
        const level = 'REGISTRATION'; 

        const records = await capsEmailCommMasterDAO.getByClaimStatusAndLevel(claimStatus, level);
        
    
        mailOptions.to = 'ravinder.sharma@dhdigital.co.in, rk8373608@gmail.com';
        records.forEach(record => {
           
            mailOptions.subject = record.SUBJECT;
            mailOptions.text = record.BODY;
        });
        
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              logger.info(error);
            } else {
              logger.info('Email sent: ' + info.response);
            }
          });
        logger.info('Records:', records);
    } catch (error) {
        logger.error('Error:', error);
    }
}

logger.info(sendMail(195));
module.exports = {
    sendMail
    }
