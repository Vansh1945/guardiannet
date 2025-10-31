const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const workerController = require("../controllers/WorkerController");

// Admin-only routes
router.post("/add-worker", authMiddleware,  workerController.registerWorker);
router.patch("/block/:permanentId", authMiddleware,  workerController.blockWorker);
router.patch("/unblock/:permanentId", authMiddleware,  workerController.unblockWorker);
router.patch("/cancel/:permanentId", authMiddleware,  workerController.cancelWorker);

// Security-only routes
router.post("/entry/:permanentId", authMiddleware,  workerController.allowEntry);
router.post("/exit/:permanentId", authMiddleware,  workerController.allowExit);

// Shared authenticated routes
router.get("/workers", authMiddleware, workerController.getAllWorkers);
router.get("/worker/:permanentId", authMiddleware, workerController.getWorkerById);
router.get("/logs/:permanentId", authMiddleware, workerController.getWorkerLogs);

module.exports = router;