const EmergencyAlert = require("../models/Emergency");
const sendSMS = require("../utils/smsSend");

// Resident creates emergency alert
exports.createAlert = async (req, res) => {
  try {
    const { type, customTitle, location, description, photo } = req.body;

    if (!type || !location) {
      return res.status(400).json({ success: false, message: "Type and location are required" });
    }

    if (type === "Other" && !customTitle) {
      return res.status(400).json({ success: false, message: "Custom title is required for 'Other' type" });
    }

    // Handle unauthorized entry tracking
    if (type === "Unauthorized Entry") {
      const existingAlert = await EmergencyAlert.findOne({
        type: "Unauthorized Entry",
        location,
        status: "Pending"
      });

      if (existingAlert) {
        existingAlert.repeatedAttempts += 1;
        existingAlert.description = description || existingAlert.description;
        await existingAlert.save();
        return res.status(201).json({ success: true, data: existingAlert });
      }
    }

    const alert = new EmergencyAlert({
      residentId: req.user.userId,
      type,
      customTitle: type === "Other" ? customTitle : undefined,
      location,
      description,
      photo,
      status: "Pending"
    });

    await alert.save();
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all alerts (Admin/Security only)
exports.getAllAlerts = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "security") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const alerts = await EmergencyAlert.find()
      .populate("residentId", "name email phone flat_no")
      .populate("verifier", "name role")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Error fetching all alerts:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get resident's own alerts
exports.getResidentAlerts = async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find({ residentId: req.user.userId })
      .populate("verifier", "name role")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Error fetching resident alerts:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update alert status (Admin/Security only)
exports.updateAlertStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "security") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { status, actionTaken } = req.body;
    if (!["Pending", "Processing", "Resolved"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updateData = { status, actionTaken };
    if (status === "Resolved") {
      updateData.verifiedBy = req.user.userId;
      updateData.verifiedAt = new Date();
    }

    const alert = await EmergencyAlert.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("residentId", "name email phone flat_no")
      .populate("verifier", "name role");

    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    // Send SMS if resolved
    if (status === "Resolved" && alert.residentId.phone) {
      try {
        const message = `Emergency Alert Resolved\nType: ${alert.type === "Other" ? alert.customTitle : alert.type}\nLocation: ${alert.location}\nAction Taken: ${actionTaken || "Resolved by team"}\nResolved on: ${new Date(alert.verifiedAt).toLocaleString()}`;
        await sendSMS(alert.residentId.phone, message);
      } catch (smsError) {
        console.error(`Failed to send SMS to ${alert.residentId.phone}:`, smsError.message);
        // Don't fail the request due to SMS error
      }
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error("Error updating alert status:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Security triggers unauthorized entry alert
exports.triggerUnauthorizedEntry = async (req, res) => {
  try {
    const { location, description } = req.body;

    if (!location) {
      return res.status(400).json({ success: false, message: "Location is required" });
    }

    const alert = new EmergencyAlert({
      residentId: req.user.userId,
      type: "Unauthorized Entry",
      location,
      description: description || "Security reported unauthorized entry",
      status: "Pending"
    });

    await alert.save();
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.error("Error triggering unauthorized entry:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete alert (Admin/Security only)
exports.deleteAlert = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "security") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const alert = await EmergencyAlert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    res.json({ success: true, message: "Alert deleted successfully" });
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};