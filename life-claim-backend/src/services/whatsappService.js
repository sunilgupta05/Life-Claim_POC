const axios = require('axios');
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://192.168.60.62:3002/api/v1/';
const maskMobile = (mobileNo) => {
  const digits = String(mobileNo || '').replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
};

/**
 * Normalize a mobile number to the numeric format expected by the WhatsApp gateway.
 * The external API has been accepting numbers like "9186573..."
 * and is now returning 400 for numbers with a leading '+'.
 * We therefore normalize to: digits only, starting with "91".
 */
const normalizeMobileForGateway = (mobileNo) => {
  if (!mobileNo) return '';
  // Keep digits only (strip +, spaces, dashes, etc.)
  let digits = String(mobileNo).replace(/\D/g, '');
  // Remove leading 0 if present (e.g., 09867...)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  // Ensure it starts with country code 91
  if (!digits.startsWith('91')) {
    digits = '91' + digits;
  }
  return digits;
};

/**
 * Generic WhatsApp sender using the external API.
 * Reuses the same gateway and normalization logic as registration/payout flows.
 */
const sendGenericNotification = async (mobileNo, message) => {
  const url = WHATSAPP_API_URL;
  const formattedMobile = normalizeMobileForGateway(mobileNo);

  const payload = {
    type: 'text',
    to: formattedMobile,
    content: {
      body: message,
    },
  };

  console.log(
    'WhatsAppService >> Attempting to send generic message to',
    maskMobile(formattedMobile)
  );

  try {
    const response = await axios.post(url, payload);
    console.log('WhatsAppService >> Generic message sent successfully');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsAppService >> Error sending generic message:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Service to send WhatsApp messages via external API
 * @param {string} mobileNo - Recipient's mobile number
 * @param {string} name - Customer Name ({{1}})
 * @param {string} claimNo - Claim Number ({{2}})
 */
const sendClaimRegistrationNotification = async (mobileNo, name, claimNo) => {
    const url = WHATSAPP_API_URL;
    
    // Normalize mobile number to the numeric format required by the gateway (e.g. "9186573...")
    const formattedMobile = normalizeMobileForGateway(mobileNo);

    // Formatting message based on the template provided:
    // Hello {{1}}, Your insurance claim {{2}} has been successfully registered. Our team will review it shortly.
    const message = `Hello ${name}, Your insurance claim ${claimNo} has been successfully registered. Our team will review it shortly.`;

    const payload = {
        type: "text",
        to: formattedMobile,
        content: {
            body: message
        }
    };

    console.log(`WhatsAppService >> Attempting to send message to ${maskMobile(formattedMobile)} for Claim: ${claimNo}`);

    try {
        const response = await axios.post(url, payload);
        console.log('WhatsAppService >> Message sent successfully');
        return { success: true, data: response.data };
    } catch (error) {
        console.error('WhatsAppService >> Error sending message:', error.message);
        // We don't throw error to avoid breaking the main claim process
        return { success: false, error: error.message };
    }
};

/**
 * Service to send WhatsApp notification when a claim is fully approved and paid out
 * @param {string} mobileNo - Recipient's mobile number
 * @param {string} name - Customer Name ({{1}})
 * @param {string} claimNo - Claim Number ({{2}})
 * @param {string} amount - Approved Amount ({{3}})
 */
const sendPayoutCompletedNotification = async (mobileNo, name, claimNo, amount) => {
    const url = WHATSAPP_API_URL;
    
    // Normalize mobile number to the numeric format required by the gateway
    const formattedMobile = normalizeMobileForGateway(mobileNo);

    const companyName = "Life Claims Team";
    const message = `Hello ${name},\nGood news! 🎉\nYour insurance claim ${claimNo} has been approved for ₹${amount}.\nAmount will be credited soon.\n\n– ${companyName}`;

    const payload = {
        type: "text",
        to: formattedMobile,
        content: {
            body: message
        }
    };

    console.log(`WhatsAppService >> Sending Payout Notification to ${maskMobile(formattedMobile)} for Claim: ${claimNo}`);

    try {
        const response = await axios.post(url, payload);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('WhatsAppService >> Error sending payout notification:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Generic notification for any claim status change.
 * Example messages:
 *  - "Your claim CL1234 has been registered."
 *  - "Your claim CL1234 is now In Assessment."
 *  - "Your claim CL1234 has been completed."
 *
 * @param {string} mobileNo
 * @param {string} name
 * @param {string} claimNo
 * @param {string} newStatus
 */
const sendStatusChangeNotification = async (mobileNo, name, claimNo, newStatus) => {
    const url = WHATSAPP_API_URL;

    let formattedMobile = String(mobileNo).trim();
    if (!formattedMobile.startsWith('91')) {
        formattedMobile = '91' + formattedMobile;
    }

    // Normalise status text for a friendlier message
    const statusText = (newStatus || '').toString().trim();
    const message = `Hello ${name},\nYour insurance claim ${claimNo} status has changed to: ${statusText}.`;

    const payload = {
        type: "text",
        to: formattedMobile,
        content: {
            body: message
        }
    };

    console.log(`WhatsAppService >> Status change for ${claimNo} -> "${statusText}" to ${maskMobile(formattedMobile)}`);

    try {
        const response = await axios.post(url, payload);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('WhatsAppService >> Error sending status change notification:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendClaimRegistrationNotification,
    sendPayoutCompletedNotification,
    sendGenericNotification
};
