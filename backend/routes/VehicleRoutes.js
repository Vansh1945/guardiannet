const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/VehicleController"); // Fixed path
const { authMiddleware } = require("../middleware/authMiddleware");


// Resident Routes
router.post("/personal", authMiddleware, vehicleController.registerPersonalVehicle);
router.post("/guest", authMiddleware, vehicleController.registerGuestVehicle);
router.get("/my-vehicles", authMiddleware, vehicleController.getResidentVehicles);
router.get("/logs/:id", authMiddleware, vehicleController.getVehicleLogs);
router.delete("/:vehicleId", authMiddleware, vehicleController.deleteResidentVehicle);

// Security Routes
router.post("/verify/:vehicle_no/:action", authMiddleware, vehicleController.verifyVehicleEntry);
router.get("/status", authMiddleware, vehicleController.getVehicleStatus);
router.get("/security/all", authMiddleware, vehicleController.getAllVehiclesForSecurity);
router.get("/history/:vehicleId", authMiddleware, vehicleController.getVehicleHistory);
router.post("/security/register",authMiddleware,vehicleController.registerUnregisteredVehicle);
// Admin Routes
router.get("/admin/all", authMiddleware, vehicleController.getAllVehicles);
router.post("/block/:vehicle_no", authMiddleware, vehicleController.blockVehicle);
router.post("/unblock/:vehicle_no", authMiddleware, vehicleController.unblockVehicle);
router.get("/admin/:vehicleId", authMiddleware, vehicleController.getVehicleDetails);

module.exports = router;