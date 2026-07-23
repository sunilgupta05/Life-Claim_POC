const path = require('path');
const dotenv = require('dotenv');

// Ensure .env is loaded when running worker directly
dotenv.config({
  path: path.join(__dirname, '..', '..', '.env'),
});

const { consumeQueue } = require('../queues/rabbitmq');
const whatsappService = require('../services/whatsappService');
const { sendEmail } = require('../services/outgoingEmailService');

const NOTIFICATIONS_QUEUE = 'notifications';

const handleNotificationMessage = async (msg) => {
  if (!msg || !msg.type) {
    console.warn('NotificationWorker >> Received message without type, skipping', msg);
    return;
  }

  switch (msg.type) {
    case 'whatsapp-claim-registration': {
      const { mobileNo, name, claimNo } = msg;
      console.log(
        `NotificationWorker >> Processing WhatsApp claim registration for ${name} (${mobileNo}), claim ${claimNo}`
      );
      await whatsappService.sendClaimRegistrationNotification(mobileNo, name, claimNo);
      break;
    }

    case 'whatsapp-payout-completed': {
      const { mobileNo, name, claimNo, amount } = msg;
      console.log(
        `NotificationWorker >> Processing WhatsApp payout completed for ${name} (${mobileNo}), claim ${claimNo}, amount ${amount}`
      );
      await whatsappService.sendPayoutCompletedNotification(mobileNo, name, claimNo, amount);
      break;
    }

    case 'email': {
      const { to, subject, text, html } = msg;
      console.log(`NotificationWorker >> Processing email to ${to} with subject "${subject}"`);
      await sendEmail({ to, subject, text, html });
      break;
    }

    case 'assessor-assignment': {
      const { claimId, email, mobileNo } = msg;
      const body =
        `Your claim with ID ${claimId} has been assigned to an Assessor. ` +
        'We will update you once the review is completed.';
      const subject = `Your claim ${claimId} has been assigned to an Assessor`;

      console.log(
        'NotificationWorker >> Assessor assignment notification',
        'claimId',
        claimId,
        'email',
        email,
        'mobileNo',
        mobileNo
      );

      if (mobileNo) {
        await whatsappService.sendGenericNotification(mobileNo, body);
      }
      if (email) {
        await sendEmail({
          to: email,
          subject,
          text: body,
          html: `<p>${body}</p>`,
        });
      }
      break;
    }

    case 'verifier-assignment': {
      const { claimId, email, mobileNo } = msg;
      const body =
        `Your claim with ID ${claimId} has been assigned to a Verifier for further verification.`;
      const subject = `Your claim ${claimId} has been assigned to a Verifier`;

      console.log(
        'NotificationWorker >> Verifier assignment notification',
        'claimId',
        claimId,
        'email',
        email,
        'mobileNo',
        mobileNo
      );

      if (mobileNo) {
        await whatsappService.sendGenericNotification(mobileNo, body);
      }
      if (email) {
        await sendEmail({
          to: email,
          subject,
          text: body,
          html: `<p>${body}</p>`,
        });
      }
      break;
    }

    case 'assessor-decision': {
      const { claimId, email, mobileNo, decision } = msg;
      const body =
        `The Assessor has reviewed your claim with ID ${claimId}. ` +
        `Decision: ${decision}. Please check your dashboard for more details.`;
      const subject = `Assessor decision on your claim ${claimId}`;

      console.log(
        'NotificationWorker >> Assessor decision notification',
        'claimId',
        claimId,
        'decision',
        decision,
        'email',
        email,
        'mobileNo',
        mobileNo
      );

      if (mobileNo) {
        await whatsappService.sendGenericNotification(mobileNo, body);
      }
      if (email) {
        await sendEmail({
          to: email,
          subject,
          text: body,
          html: `<p>${body}</p>`,
        });
      }
      break;
    }

    case 'verifier-decision': {
      const { claimId, email, mobileNo, decision } = msg;
      const body =
        `The Verifier has completed verification for your claim with ID ${claimId}. ` +
        `Decision: ${decision}. Please check your dashboard for more details.`;
      const subject = `Verifier decision on your claim ${claimId}`;

      console.log(
        'NotificationWorker >> Verifier decision notification',
        'claimId',
        claimId,
        'decision',
        decision,
        'email',
        email,
        'mobileNo',
        mobileNo
      );

      if (mobileNo) {
        await whatsappService.sendGenericNotification(mobileNo, body);
      }
      if (email) {
        await sendEmail({
          to: email,
          subject,
          text: body,
          html: `<p>${body}</p>`,
        });
      }
      break;
    }

    default:
      console.warn('NotificationWorker >> Unknown message type, skipping:', msg.type);
  }
};

(async () => {
  try {
    console.log('NotificationWorker >> Starting, connecting to RabbitMQ...');
    await consumeQueue(NOTIFICATIONS_QUEUE, handleNotificationMessage);
  } catch (err) {
    console.error('NotificationWorker >> Fatal error, exiting:', err.message || err);
    process.exit(1);
  }
})();

