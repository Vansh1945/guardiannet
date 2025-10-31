const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const generateQRCode = async (data) => {
  try {
    const qrDir = path.join(__dirname, "../uploads/qrcodes");
    
    // Ensure directory exists
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const qrPath = path.join(qrDir, `${data}.png`);
    const qrUrl = await QRCode.toFile(qrPath, data, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return data; // Return the QR data (not path) for storage in DB

  } catch (error) {
    console.error("QR generation error:", error);
    throw new Error("Failed to generate QR code");
  }
};

module.exports = generateQRCode;