const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const eventController = require("../controllers/EventController");
const multer = require("multer");
const path = require("path");

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Admin-only routes
router.post(
  "/register-event",
  authMiddleware,
  upload.single("image"),
  eventController.createEvent
);
router.put(
  "/update-event/:id",
  authMiddleware,
  upload.single("image"),
  eventController.updateEvent
);
router.delete("/delete-event/:id", authMiddleware, eventController.deleteEvent);

// Resident routes
router.get("/view-event", authMiddleware, eventController.getAllEvents);
router.get("/view-event/:id", authMiddleware, eventController.getEventById);

module.exports = router;