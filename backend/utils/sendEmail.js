const nodemailer = require("nodemailer");
require("dotenv").config(); 

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.SENDER_EMAIL || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error("Missing email credentials in .env file.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SENDER_EMAIL, 
        pass: process.env.EMAIL_APP_PASSWORD, 
      },
    });

    const mailOptions = {
      from: `"Society Security System" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw new Error("Email sending failed: " + error.message);
  }
};

module.exports = sendEmail;
