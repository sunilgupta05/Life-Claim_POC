const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const user = process.env.EMAIL_ID;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('OutgoingEmailService >> EMAIL_ID or EMAIL_PASS not configured; email sending disabled');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const tx = getTransporter();
  if (!tx) {
    console.warn('OutgoingEmailService >> Transporter not available, skipping email send');
    return { success: false, error: 'Email transporter not configured' };
  }

  try {
    const info = await tx.sendMail({
      from: process.env.EMAIL_ID,
      to,
      subject,
      text,
      html,
    });
    console.log('OutgoingEmailService >> Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('OutgoingEmailService >> Error sending email:', err.message || err);
    return { success: false, error: err.message || String(err) };
  }
};

module.exports = {
  sendEmail,
};

