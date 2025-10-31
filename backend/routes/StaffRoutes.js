const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const staffController = require("../controllers/StaffController");

// Resident-only routes
router.post("/add-staff", authMiddleware, staffController.registerStaff);
router.get("/resident/:residentId", authMiddleware, staffController.getResidentStaff);

// Admin-only routes
router.put("/block/:staffId", authMiddleware, staffController.blockStaff);
router.put("/unblock/:staffId", authMiddleware, staffController.unblockStaff);
router.delete("/delete/:staffId", authMiddleware, staffController.deleteStaff);

// Security-only routes
router.post("/entry", authMiddleware, staffController.staffEntry);
router.post("/exit", authMiddleware, staffController.staffExit);

// Shared routes (accessible by multiple roles)
router.get("/verify/:permanentId", authMiddleware, staffController.verifyPermanentId);
router.get("/history/:permanentId", authMiddleware, staffController.getStaffHistory);
router.post("/send-sms", authMiddleware, staffController.sendStaffSMS);

// Admin-only routes
router.get("/admin/all", authMiddleware, staffController.getAllStaff);
router.get("/admin/stats", authMiddleware, staffController.getStaffWithStats);

// Resident routes
router.get("/resident/stats/:residentId", authMiddleware, staffController.getStaffWithStats);


module.exports = router;