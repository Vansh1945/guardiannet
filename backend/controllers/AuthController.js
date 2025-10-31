const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOTP, verifyOTP } = require("../utils/otpSend");

// Register with OTP verification
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, otp, flat_no, role, profilePicture, familyMembers } = req.body;

    // Basic validation
    const requiredFields = { name, email, password, phone, role };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    // Role-based validation
    if (role === "resident" && !flat_no) {
      return res.status(400).json({
        success: false,
        message: "Flat number is required for residents"
      });
    }

    // Check if user exists
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Check flat number uniqueness for residents
    if (role === "resident") {
      const flatExist = await User.findOne({ flat_no });
      if (flatExist) {
        return res.status(400).json({
          success: false,
          message: "Flat number already registered"
        });
      }
    }

    // OTP handling
    if (!otp) {
      try {
        await sendOTP(email);
        return res.json({
          success: true,
          message: "OTP sent to email"
        });
      } catch (error) {
        console.error("OTP send error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP"
        });
      }
    }

    // Verify OTP
    if (!verifyOTP(email, otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    // Create user (password will be hashed by pre-save hook)
    const userCreated = await User.create({
      name,
      email,
      password,
      phone,
      flat_no: role === "resident" ? flat_no : undefined,
      role,
      approval_status: ["admin", "security"].includes(role) ? "approved" : "pending",      profilePicture,
      familyMembers
    });

    // Generate token if approved
    const token = userCreated.approval_status === "approved"
      ? jwt.sign(
        { userId: userCreated._id, role: userCreated.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      )
      : null;

    // Prepare user response without sensitive data
    const userResponse = {
      _id: userCreated._id,
      name: userCreated.name,
      email: userCreated.email,
      phone: userCreated.phone,
      role: userCreated.role,
      flat_no: userCreated.flat_no,
      approval_status: userCreated.approval_status,
      profilePicture: userCreated.profilePicture,
      createdAt: userCreated.createdAt
    };

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: userResponse
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check approval status
    if (user.approval_status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: "Account not approved yet",
        approval_status: user.approval_status
      });
    }

    // Compare passwords using model method
    const isMatch = await user.comparePasswords(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Prepare user response without sensitive data
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      flat_no: user.flat_no,
      approval_status: user.approval_status,
      profilePicture: user.profilePicture,
      familyMembers: user.familyMembers,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: userResponse
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await sendOTP(email);
    res.json({
      success: true,
      message: "OTP sent for password reset"
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
};

// Reset Password with OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password required"
      });
    }

    // Verify OTP
    if (!verifyOTP(email, otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be same as old password"
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. You can now log in with the new password."
    });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      success: false,
      message: "Password reset failed"
    });
  }
};

// Verify OTP (generic)
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP required"
      });
    }

    if (!verifyOTP(email, otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    res.json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({
      success: false,
      message: "OTP verification failed"
    });
  }
};