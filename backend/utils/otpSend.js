const nodemailer = require("nodemailer");
const crypto = require("crypto");

// In-memory OTP store (for production, use Redis)
const otpStore = new Map();

// Cleanup expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 60000);

exports.generateOTP = (email) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 300000; // 5 minutes
  
  otpStore.set(email, { 
    otp, 
    expiresAt 
  });
  
  return otp;
};

exports.sendOTP = async (email) => {
  const otp = exports.generateOTP(email);

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"${process.env.EMAIL_SENDER_NAME || 'System'}" <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}\nThis code is valid for 5 minutes.`,
    html: `
      <div>
        <h3>Your OTP Code</h3>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 5 minutes.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

exports.verifyOTP = (email, otp) => {
  const storedData = otpStore.get(email);
  
  if (!storedData) return false;
  if (storedData.expiresAt < Date.now()) {
    otpStore.delete(email);
    return false;
  }
  if (storedData.otp !== otp) return false;
  
  otpStore.delete(email);
  return true;
};