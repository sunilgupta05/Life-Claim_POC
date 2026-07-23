const { publishToQueue } = require('../queues/rabbitmq');
const whatsappService = require('./whatsappService');
const { sendEmail } = require('./outgoingEmailService');

const NOTIFICATIONS_QUEUE = 'notifications';

const isValidMobile = (mobileNo) => {
  const digits = String(mobileNo || '').replace(/\D/g, '');
  return digits.length >= 10 && digits !== '0000000000';
};

/**
 * Notify customer on new claim/case registration.
 * Always calls WhatsApp/email APIs directly (same as Postman).
 * Optionally also publishes to RabbitMQ when NOTIFICATION_USE_QUEUE=true.
 */
const notifyClaimRegistered = async ({
  mobileNo,
  name,
  claimNo,
  email = null,
  sendEmail: shouldSendEmail = true,
}) => {
  const customerName = (name && String(name).trim()) || 'Customer';
  const claimRef = claimNo || 'N/A';

  console.log('ClaimRegistrationNotify >> start', {
    claimRef,
    mobileNo: mobileNo ? '***' + String(mobileNo).slice(-4) : null,
    email: email || null,
    shouldSendEmail,
  });

  if (isValidMobile(mobileNo)) {
    const result = await whatsappService.sendClaimRegistrationNotification(
      mobileNo,
      customerName,
      claimRef
    );
    console.log('ClaimRegistrationNotify >> WhatsApp direct result:', {
      claimRef,
      success: result?.success,
      error: result?.error,
    });

    if (process.env.NOTIFICATION_USE_QUEUE === 'true') {
      await publishToQueue(NOTIFICATIONS_QUEUE, {
        type: 'whatsapp-claim-registration',
        mobileNo,
        name: customerName,
        claimNo: claimRef,
        createdAt: new Date().toISOString(),
      });
    }
  } else {
    console.warn('ClaimRegistrationNotify >> WhatsApp skipped: invalid or missing mobile', {
      mobileNo,
    });
  }

  if (shouldSendEmail && email && String(email).trim()) {
    const subject = `Your claim ${claimRef} has been submitted`;
    const text = `Dear ${customerName},

Your life claim with reference ${claimRef} has been successfully submitted.
Our team will review your claim and contact you if any additional information is required.

Thank you,
Life Claims Team`;

    const html = `<p>Dear ${customerName},</p>
<p>Your life claim with reference <strong>${claimRef}</strong> has been successfully submitted.</p>
<p>Our team will review your claim and contact you if any additional information is required.</p>
<p>Thank you,<br/>Life Claims Team</p>`;

    const emailResult = await sendEmail({ to: email.trim(), subject, text, html });
    console.log('ClaimRegistrationNotify >> Email direct result:', {
      claimRef,
      success: emailResult?.success,
      error: emailResult?.error,
    });

    if (process.env.NOTIFICATION_USE_QUEUE === 'true') {
      await publishToQueue(NOTIFICATIONS_QUEUE, {
        type: 'email',
        to: email.trim(),
        subject,
        text,
        html,
        createdAt: new Date().toISOString(),
      });
    }
  } else if (shouldSendEmail) {
    console.warn('ClaimRegistrationNotify >> Email skipped: address missing');
  }
};

module.exports = { notifyClaimRegistered };
