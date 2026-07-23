const { publishToQueue } = require('../queues/rabbitmq');

const NOTIFICATIONS_QUEUE = 'notifications';

const enqueueWhatsAppClaimRegistration = async (mobileNo, name, claimNo) => {
  console.log('Service >>notificationQueueService >> enqueueWhatsAppClaimRegistration', 'Mobile No ',mobileNo, 'name', name, 'claimNo', claimNo);
  await publishToQueue(NOTIFICATIONS_QUEUE, {
    type: 'whatsapp-claim-registration',
    mobileNo,
    name,
    claimNo,
    createdAt: new Date().toISOString(),
  });
};

const enqueueWhatsAppPayoutCompleted = async (mobileNo, name, claimNo, amount) => {
  console.log('Service >> notificationQueueService >> enqueueWhatsAppPayoutCompleted', 'Mobile No ',mobileNo, 'name', name, 'claimNo', claimNo, 'amount', amount);
  await publishToQueue(NOTIFICATIONS_QUEUE, {
    type: 'whatsapp-payout-completed',
    mobileNo,
    name,
    claimNo,
    amount,
    createdAt: new Date().toISOString(),
  });
};

const enqueueEmailNotification = async ({ to, subject, text, html }) => {
  console.log(
    'Service >> notificationQueueService >> enqueueEmailNotification',
    'to',
    to,
    'subject',
    subject
  );
  await publishToQueue(NOTIFICATIONS_QUEUE, {
    type: 'email',
    to,
    subject,
    text,
    html,
    createdAt: new Date().toISOString(),
  });
};

// New helpers for assignment and decision events
const enqueueAssessorAssignmentNotification = async ({ claimId, email, mobileNo }) => {
  console.log(
    'Service >> notificationQueueService >> enqueueAssessorAssignmentNotification',
    'claimId',
    claimId,
    'email',
    email,
    'mobileNo',
    mobileNo
  );
  await publishToQueue(NOTIFICATIONS_QUEUE, {
    type: 'assessor-assignment',
    claimId,
    email,
    mobileNo,
    createdAt: new Date().toISOString(),
  });
};

const enqueueVerifierAssignmentNotification = async ({ claimId, email, mobileNo }) => {
  console.log(
    'Service >> notificationQueueService >> enqueueVerifierAssignmentNotification',
    'claimId',
    claimId,
    'email',
    email,
    'mobileNo',
    mobileNo
  );
  await publishToQueue(NOTIFICATIONS_QUEUE, {
    type: 'verifier-assignment',
    claimId,
    email,
    mobileNo,
    createdAt: new Date().toISOString(),
  });
};

const enqueueAssessorDecisionNotification = async ({ claimId, email, mobileNo, decision }) => {
  console.log(
    'Service >> notificationQueueService >> enqueueAssessorDecisionNotification',
    'claimId',
    claimId,
    'decision',
    decision,
    'email',
    email,
    'mobileNo',
    mobileNo
  );
  await publishToQueue(NOTIFICATIONS_QUEUE, {
    type: 'assessor-decision',
    claimId,
    email,
    mobileNo,
    decision,
    createdAt: new Date().toISOString(),
  });
};

const enqueueVerifierDecisionNotification = async ({ claimId, email, mobileNo, decision }) => {
  console.log(
    'Service >> notificationQueueService >> enqueueVerifierDecisionNotification',
    'claimId',
    claimId,
    'decision',
    decision,
    'email',
    email,
    'mobileNo',
    mobileNo
  );
  await publishToQueue(NOTIFICATIONS_QUEUE, {
    type: 'verifier-decision',
    claimId,
    email,
    mobileNo,
    decision,
    createdAt: new Date().toISOString(),
  });
};

module.exports = {
  enqueueWhatsAppClaimRegistration,
  enqueueWhatsAppPayoutCompleted,
  enqueueEmailNotification,
  enqueueAssessorAssignmentNotification,
  enqueueVerifierAssignmentNotification,
  enqueueAssessorDecisionNotification,
  enqueueVerifierDecisionNotification,
};

