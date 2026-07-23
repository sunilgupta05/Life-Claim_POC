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
        console.log(capsClaimDetailsObj);
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
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        console.log('Records:', records);
    } catch (error) {
        console.error('Error:', error);
    }
}

console.log(sendMail(195));
module.exports = {
    sendMail
    }
