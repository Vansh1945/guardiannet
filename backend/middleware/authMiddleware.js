// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Access Denied. No token provided." });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID found in token." });
    }

    // Optionally fetch user to verify role (if needed for additional validation)
    const user = await User.findById(decoded.userId).select("role");
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found." });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      role: user.role || decoded.role, // Prefer DB role, fallback to token role
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(403).json({ success: false, message: "Invalid or expired token." });
  }
};



module.exports = { authMiddleware };