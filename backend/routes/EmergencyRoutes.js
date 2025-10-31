const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createAlert,
  getAllAlerts,
  getResidentAlerts,
  updateAlertStatus,
  triggerUnauthorizedEntry,
  deleteAlert
} = require("../controllers/EmergencyController");

// Resident endpoints
router.post("/create-emergency", authMiddleware, createAlert);
router.get("/my-alerts", authMiddleware, getResidentAlerts);

// Security endpoints
router.post("/unauthorized-entry", authMiddleware, triggerUnauthorizedEntry);

// Admin/Security endpoints
router.get("/all-emergency-alerts", authMiddleware, getAllAlerts);
router.put("/:id/status", authMiddleware, updateAlertStatus);
router.delete("/delete/:id", authMiddleware, deleteAlert);

module.exports = router;