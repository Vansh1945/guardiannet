const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require("./config/db");

// Utility functions
const deleteUnapprovedUsers = require("./utils/deleteUnapprovedUsers");

// Middleware
const errorHandler = require("./middleware/errorHandler");

// Route imports
const staffRoutes = require("./routes/StaffRoutes");
const authRoutes = require("./routes/AuthRoutes");
const visitorRoutes = require("./routes/visitorRouters");
const adminRoutes = require("./routes/AdminRoutes");
const vehicleRoutes = require("./routes/VehicleRoutes");
const deliveryRoutes = require("./routes/DeliveryRoutes");
const emergencyRoutes = require("./routes/EmergencyRoutes");
const workerRoutes = require("./routes/workerRoutes");
const eventRoutes = require("./routes/EventRoutes");
const profileRoutes = require("./routes/profileRoutes");

// Initialize Express app
const app = express();
const server = http.createServer(app);


// Helper function to get server base URL
const getServerBaseUrl = (req) => {
  return `${req.protocol}://${req.get("host")}`;
};

// Middleware setup
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Frontend URL (update for production)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("Uploads"));

// Connect to MongoDB
connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/visitor", visitorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/profile", profileRoutes);

// Sample route to test the base URL function
app.get("/api/test-url", (req, res) => {
  const baseUrl = getServerBaseUrl(req);
  res.json({ success: true, baseUrl });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Scheduled tasks
cron.schedule("0 * * * *", async () => {
  console.log("Running scheduled task to delete unapproved users...");
  await deleteUnapprovedUsers();
});

// Server startup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  server.close(() => process.exit(1));
});