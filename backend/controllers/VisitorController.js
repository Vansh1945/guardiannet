const mongoose = require("mongoose");
const User = require("../models/User");
const Visitor = require("../models/Visitor");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sendEmail = require("../utils/sendEmail");
const sendSMS = require("../utils/smsSend");

// Helper functions
const getServerBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

const generateQRCode = async (data) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads/qrcodes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, `${data}.png`);
    await QRCode.toFile(filePath, data, {
      color: { dark: '#000000', light: '#ffffff' },
      width: 300,
      margin: 2
    });
    return filePath;
  } catch (error) {
    console.error("QR code generation error:", error);
    throw error;
  }
};

const sendVisitorDetails = async (phone, name, purpose, qrCodeUrl, isPreRegistered = true) => {
  try {
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      throw new Error('Invalid phone number format');
    }

    const message = isPreRegistered
      ? `Visitor Pass for ${name}\nPurpose: ${purpose}\nQR Code: ${qrCodeUrl}`
      : `Visitor Approval Request\nName: ${name}\nPurpose: ${purpose}\nImage: ${qrCodeUrl}`;
    
    const formattedPhone = `+91${cleanedPhone}`;
    const result = await sendSMS(formattedPhone, message);
    
    if (!result.success) {
      throw new Error(result.message || "SMS service failed");
    }
    
    return true;
  } catch (error) {
    console.error("Error sending visitor SMS:", error);
    throw error;
  }
};

// Controller Methods
exports.getQRCode = async (req, res) => {
  try {
    const { qr_data } = req.params;
    const qrCodePath = path.join(__dirname, '../uploads/qrcodes', `${qr_data}.png`);
    
    if (!fs.existsSync(qrCodePath)) {
      await generateQRCode(qr_data);
    }

    res.sendFile(path.resolve(qrCodePath));
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.downloadQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);
    
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found" });
    }

    if (visitor.resident_id.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (!visitor.qr_code) {
      return res.status(400).json({ success: false, message: "No QR code available" });
    }

    const qrCodePath = path.join(__dirname, '../uploads/qrcodes', `${visitor.qr_code}.png`);
    
    if (!fs.existsSync(qrCodePath)) {
      await generateQRCode(visitor.qr_code);
    }

    res.setHeader('Content-Disposition', `attachment; filename=visitor-pass-${visitor.name}.png`);
    res.setHeader('Content-Type', 'image/png');
    
    const fileStream = fs.createReadStream(qrCodePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Download QR code error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.scanQRCode = async (req, res) => {
  try {
    const { qr_code } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (!qr_code) {
      return res.status(400).json({ success: false, message: "QR code is required" });
    }

    const visitor = await Visitor.findOne({ qr_code })
      .populate("resident_id", "name email phone flat_no");
    
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Invalid QR code" });
    }

    if (visitor.entry_status === "denied") {
      return res.status(403).json({ success: false, message: "Visitor access denied" });
    }

    if (visitor.entry_status === "pending") {
      return res.status(400).json({ success: false, message: "Visitor approval pending" });
    }

    if (visitor.entry_status === "granted") {
      visitor.entry_status = "checked_in";
      visitor.entry_time = new Date();
      visitor.entry_logs.push({
        action: 'entry',
        performed_by: userId,
        role: userRole
      });
      await visitor.save();
    }

    res.status(200).json({ 
      success: true,
      message: "QR code scanned successfully",
      data: visitor
    });
  } catch (error) {
    console.error("Scan QR code error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.inviteVisitor = async (req, res) => {
  try {
    const { name, phone, flat_no, purpose, expected_arrival } = req.body;
    const resident_id = req.user.userId;

    if (!name || !phone || !flat_no) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const resident = await User.findById(resident_id);
    if (!resident) return res.status(404).json({ success: false, message: "Resident not found" });
    if (resident.flat_no !== flat_no) return res.status(400).json({ success: false, message: "Flat number mismatch" });

    const qrData = `VISITOR-${flat_no}-${uuidv4()}`;
    const qrCodePath = await generateQRCode(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    if (!qrCodePath || !qrCodeDataURL) {
      return res.status(500).json({ success: false, message: "Failed to generate QR code" });
    }

    const visitor = new Visitor({
      name,
      phone,
      flat_no,
      resident_id,
      qr_code: qrData,
      purpose: purpose || 'Guest',
      entry_status: "granted",
      is_pre_registered: true,
      expected_arrival: expected_arrival ? new Date(expected_arrival) : null
    });

    await visitor.save();

    const qrCodeUrl = `${getServerBaseUrl(req)}/api/visitor/qr/${qrData}`;
    await sendVisitorDetails(phone, name, purpose || 'Guest', qrCodeUrl);

    res.status(201).json({ 
      success: true,
      message: "Visitor invited and SMS sent",
      data: {
        visitor,
        qr_code_url: qrCodeUrl,
        qr_code_data: qrCodeDataURL
      }
    });
  } catch (error) {
    console.error("Error inviting visitor:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.resendVisitorSMS = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);
    
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });

    const resident = await User.findById(visitor.resident_id);
    if (!resident) return res.status(404).json({ success: false, message: "Resident not found" });

    const qrCodeUrl = visitor.is_pre_registered 
      ? `${getServerBaseUrl(req)}/api/visitor/qr/${visitor.qr_code}`
      : visitor.image;

    await sendVisitorDetails(
      visitor.phone,
      visitor.name,
      visitor.purpose,
      qrCodeUrl,
      visitor.is_pre_registered
    );

    res.status(200).json({ 
      success: true,
      message: "SMS resent successfully"
    });
  } catch (error) {
    console.error("Error resending SMS:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to resend SMS",
      error: error.message 
    });
  }
};

exports.captureVisitor = async (req, res) => {
  try {
    const { name, phone, flat_no, purpose } = req.body;
    const image = req.file?.path;

    if (!name || !phone || !flat_no || !image) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const resident = await User.findOne({ flat_no });
    if (!resident) return res.status(404).json({ success: false, message: "Resident not found" });

    const imageURL = `${getServerBaseUrl(req)}/${image.replace(/\\/g, "/")}`;
    const qrData = `WALKIN-${flat_no}-${uuidv4()}`;
    const qrCodePath = await generateQRCode(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    const visitor = new Visitor({
      name,
      phone,
      flat_no,
      resident_id: resident._id,
      image: imageURL,
      qr_code: qrData,
      purpose: purpose || 'Guest',
      entry_status: "pending",
      is_pre_registered: false
    });

    await visitor.save();

    await sendVisitorDetails(resident.phone, name, purpose || 'Guest', imageURL, false);

    const emailOptions = {
      to: resident.email,
      subject: "Visitor Entry Request",
      html: `<p>A visitor is requesting entry to your flat <strong>${flat_no}</strong>.</p>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Phone:</strong> ${phone}</p>
             <p><strong>Purpose:</strong> ${purpose || 'Not specified'}</p>
             <p><strong>Visitor Image:</strong><br><img src="${imageURL}" width="300" alt="Visitor Image"/></p>
             <p><a href="${getServerBaseUrl(req)}/api/visitor/approve/${visitor._id}">Approve</a> | 
                <a href="${getServerBaseUrl(req)}/api/visitor/deny/${visitor._id}">Deny</a></p>`
    };

    await sendEmail(emailOptions);

    res.status(201).json({ 
      success: true,
      message: "Approval request sent to resident via SMS and email",
      data: { visitor_id: visitor._id }
    });
  } catch (error) {
    console.error("Capture visitor error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.approveVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const resident_id = req.user.userId;

    const visitor = await Visitor.findOne({ _id: id, resident_id });
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found" });
    }

    visitor.entry_status = "granted";
    visitor.entry_logs.push({
      action: 'entry',
      performed_by: resident_id,
      role: 'resident'
    });
    await visitor.save();

    const qrCodeUrl = `${getServerBaseUrl(req)}/api/visitor/qr/${visitor.qr_code}`;
    await sendVisitorDetails(visitor.phone, visitor.name, visitor.purpose, qrCodeUrl);

    res.status(200).json({ 
      success: true,
      message: "Visitor approved successfully",
      data: visitor
    });
  } catch (error) {
    console.error("Approve visitor error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.exitVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const visitor = await Visitor.findById(id);
        if (!visitor) {
            return res.status(404).json({ 
                success: false, 
                message: "Visitor not found" 
            });
        }

        if (!["checked_in", "granted"].includes(visitor.entry_status)) {
            return res.status(400).json({ 
                success: false, 
                message: "Visitor has not entered yet" 
            });
        }

        visitor.entry_status = "checked_out";
        visitor.exit_time = new Date();
        visitor.entry_logs.push({
            action: 'exit',
            performed_by: userId,
            role: userRole,
            timestamp: new Date()
        });

        await visitor.save();

        res.status(200).json({ 
            success: true,
            message: "Visitor exit recorded",
            data: visitor
        });
    } catch (error) {
        console.error("Exit visitor error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

exports.denyVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const resident_id = req.user.userId;

    const visitor = await Visitor.findOne({ _id: id, resident_id });
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found" });
    }

    visitor.entry_status = "denied";
    visitor.entry_logs.push({
      action: 'exit',
      performed_by: resident_id,
      role: 'resident'
    });
    await visitor.save();

    await sendVisitorDetails(
      visitor.phone, 
      visitor.name, 
      visitor.purpose, 
      "Your visit has been denied by the resident",
      false
    );

    res.status(200).json({ 
      success: true,
      message: "Visitor denied successfully",
      data: visitor
    });
  } catch (error) {
    console.error("Deny visitor error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.getAllVisitorLogs = async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate("resident_id", "name email flat_no")
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true,
      message: "Visitor logs fetched successfully",
      data: visitors
    });
  } catch (error) {
    console.error("Get visitor logs error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.searchVisitorByName = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: "Name must be at least 2 characters" 
      });
    }

    const visitors = await Visitor.find({ 
      name: { $regex: name, $options: 'i' } 
    })
    .populate("resident_id", "name email flat_no")
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Visitors found",
      data: visitors
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingVisitors = await Visitor.find({ entry_status: "pending" })
      .populate("resident_id", "name email flat_no")
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true,
      message: "Pending approvals fetched successfully",
      data: pendingVisitors
    });
  } catch (error) {
    console.error("Get pending approvals error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.getMyVisitors = async (req, res) => {
  try {
    const residentId = req.user.userId;
    
    const visitors = await Visitor.find({ resident_id: residentId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      visitors: visitors
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch visitors",
      error: error.message
    });
  }
};

exports.updateVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, purpose } = req.body;
    const resident_id = req.user.userId;

    const visitor = await Visitor.findOne({ _id: id, resident_id });
    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found" });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "Valid phone number required" });
    }

    visitor.name = name.trim();
    visitor.phone = phone;
    visitor.purpose = purpose || visitor.purpose;
    
    await visitor.save();

    res.status(200).json({ 
      success: true,
      message: "Visitor updated successfully",
      data: visitor
    });
  } catch (error) {
    console.error("Update visitor error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.getResidentVisitorLogs = async (req, res) => {
  try {
    const residentId = req.user.userId;
    
    const visitors = await Visitor.find({ resident_id: residentId })
      .populate('entry_logs.performed_by', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Resident visitor logs fetched successfully",
      data: visitors.map(v => ({
        ...v._doc,
        entry_logs: v.entry_logs.filter(log => log.role === 'resident')
      }))
    });
  } catch (error) {
    console.error("Get resident visitor logs error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.getSecurityVisitorLogs = async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate('entry_logs.performed_by', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Security visitor logs fetched successfully",
      data: visitors.map(v => ({
        ...v._doc,
        entry_logs: v.entry_logs.filter(log => log.role === 'security')
      }))
    });
  } catch (error) {
    console.error("Get security visitor logs error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.getAdminVisitorLogs = async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate('entry_logs.performed_by', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Admin visitor logs fetched successfully",
      data: visitors.map(v => ({
        ...v._doc,
        entry_logs: v.entry_logs.filter(log => log.role === 'admin')
      }))
    });
  } catch (error) {
    console.error("Get admin visitor logs error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.getVisitorLogs = async (req, res) => {
  try {
    const { visitorId } = req.params;
    
    const visitor = await Visitor.findById(visitorId)
      .populate('entry_logs.performed_by', 'name role')
      .sort({ 'entry_logs.timestamp': -1 });

    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor not found" });
    }

    res.status(200).json({
      success: true,
      message: "Visitor logs fetched successfully",
      data: visitor.entry_logs
    });
  } catch (error) {
    console.error("Get visitor logs error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};