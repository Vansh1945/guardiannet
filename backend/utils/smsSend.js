require("dotenv").config();
const twilio = require("twilio");

// Use consistent environment variable names
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE; // Handle both variants

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  throw new Error("Twilio credentials not configured in environment variables");
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendSMS = async (to, message) => {
  try {
    // Validate and format phone number
    if (!to.startsWith('+')) {
      throw new Error('Phone number must include 10 digits and country code, e.g., +1234567890');
    }

    const response = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: to
    });
    
    return {
      success: true,
      sid: response.sid,
      status: response.status
    };
  } catch (error) {
    console.error("Twilio Error:", error);
    throw error; // Re-throw to handle in calling function
  }
};

module.exports = sendSMS;