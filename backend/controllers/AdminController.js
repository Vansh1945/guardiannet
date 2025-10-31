const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const sendSMS = require("../utils/smsSend"); 
const generateUniqueId = require("../utils/generateUniqueId");

exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.approval_status === "approved") {
      return res.status(400).json({
        success: false,
        message: "User already approved"
      });
    }

    if (user.role === "resident" && !user.permanentId) {
      user.permanentId = await generateUniqueId(User);
    }

    user.approval_status = "approved";
    await user.save();

    // Prepare beautifully formatted email
    const emailHTML = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden;">
      <div style="background: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Account Approved</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${user.name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Your account has been approved by the administrator.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4f46e5;">Your Account Details</h3>
          <p style="margin: 5px 0;"><strong>Login ID:</strong> ${user.email}</p>
          ${user.permanentId ? `<p style="margin: 5px 0;"><strong>Permanent ID:</strong> ${user.permanentId}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Password:</strong> Use the password you created during registration</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">You can now login to your account using the credentials above.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
             style="display: inline-block; background: #4f46e5; color: white; padding: 12px 25px; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Login to Your Account
          </a>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">
          If you didn't request this, please contact our support team immediately.
        </p>
      </div>
      <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        © ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App Name'}. All rights reserved.
      </div>
    </div>
    `;

    // Prepare concise SMS message
    const smsMessage = `Dear ${user.name}, your account has been approved. Login ID: ${user.email} ${user.permanentId ? `| Permanent ID: ${user.permanentId}` : ''}. Use your created password. Login at: ${process.env.FRONTEND_LOGIN_URL || 'yourwebsite.com/login'}`;

    // Notification results
    const notificationResults = {
      email: false,
      sms: false
    };

    try {
      // Send Email
      await sendEmail({
        to: user.email,
        subject: "Your Account Has Been Approved",
        html: emailHTML
      });
      notificationResults.email = true;

      // Send SMS if phone exists
      if (user.phone) {
        try {
          // Ensure phone number has country code
          const phoneNumber = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;
          
          const smsResult = await sendSMS(phoneNumber, smsMessage);
          notificationResults.sms = true;
          notificationResults.smsDetails = smsResult;
        } catch (smsError) {
          console.error("SMS sending failed:", smsError);
          notificationResults.smsError = smsError.message;
        }
      }

      return res.status(200).json({
        success: true,
        message: "User approved successfully",
        notifications: notificationResults,
        user: {
          id: user._id,
          permanentId: user.permanentId,
          email: user.email,
          phone: user.phone
        }
      });

    } catch (notifyError) {
      console.error("Notification error:", notifyError);
      return res.status(200).json({
        success: true,
        message: "User approved but some notifications failed",
        notifications: notificationResults,
        user: {
          id: user._id,
          permanentId: user.permanentId,
          email: user.email,
          phone: user.phone
        }
      });
    }

  } catch (err) {
    console.error("Error approving user:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { remark } = req.body;

    if (!remark || remark.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: "Remark is required" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (user.approval_status === "rejected") {
      return res.status(400).json({ 
        success: false,
        message: "User already rejected" 
      });
    }

    user.approval_status = "rejected";
    user.remark = remark;
    await user.save();

    // Prepare beautifully formatted email
    const emailHTML = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden;">
      <div style="background: #e53e3e; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Registration Rejected</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${user.name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">We regret to inform you that your registration has been rejected.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #e53e3e;">Rejection Details</h3>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${remark}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          If you believe this is a mistake or would like to clarify, please contact our support team.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173/'}" 
             style="display: inline-block; background: #e53e3e; color: white; padding: 12px 25px; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Contact Support
          </a>
        </div>
      </div>
      <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        © ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App Name'}. All rights reserved.
      </div>
    </div>
    `;

    // Prepare SMS message
    const smsMessage = `Dear ${user.name}, your registration was rejected. Reason: ${remark}. Contact support: ${process.env.FRONTEND_URL || 'http://localhost:5173/'}`;

    // Notification results
    const notificationResults = {
      email: false,
      sms: false
    };

    try {
      // Send Email
      await sendEmail({
        to: user.email,
        subject: "Your Registration Has Been Rejected",
        html: emailHTML
      });
      notificationResults.email = true;

      // Send SMS if phone exists
      if (user.phone) {
        try {
          const phoneNumber = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;
          await sendSMS(phoneNumber, smsMessage);
          notificationResults.sms = true;
        } catch (smsError) {
          console.error("SMS sending failed:", smsError);
          notificationResults.smsError = smsError.message;
        }
      }

      return res.status(200).json({ 
        success: true,
        message: "User rejected successfully",
        notifications: notificationResults
      });

    } catch (notifyError) {
      console.error("Notification error:", notifyError);
      return res.status(200).json({ 
        success: true,
        message: "User rejected but notifications partially failed",
        notifications: notificationResults
      });
    }

  } catch (err) {
    console.error("Error rejecting user:", err);
    return res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
};


exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ 
      success: true,
      users 
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch users",
      error: err.message 
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "User updated successfully",
      user: updatedUser 
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update user",
      error: err.message 
    });
  }
};

exports.removeResident = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "User removed successfully" 
    });
  } catch (err) {
    console.error("Error removing user:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to remove user",
      error: err.message 
    });
  }
};