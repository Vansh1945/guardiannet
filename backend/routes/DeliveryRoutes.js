const express = require("express");
const router = express.Router();
const {
  createDeliveryRequest,
  scanUniqueId,
  editDeliveryDetails,
  deleteDeliveryRequest,
  getAllDeliveryRequests,
  getDeliveryLogs
} = require("../controllers/DeliveryController"); 

const { authMiddleware } = require("../middleware/authMiddleware");

// Routes
router.post("/create", authMiddleware, createDeliveryRequest);
router.post("/scan", authMiddleware, scanUniqueId);
router.put("/edit/:deliveryId", authMiddleware, editDeliveryDetails);
router.delete("/delete/:deliveryId", authMiddleware, deleteDeliveryRequest);
router.get("/all", authMiddleware, getAllDeliveryRequests);
router.get("/logs/:deliveryId", authMiddleware, getDeliveryLogs); // New route for logs

module.exports = router;