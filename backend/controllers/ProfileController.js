const User = require("../models/User");
const EntryLog = require("../models/ResidentLogModel");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Configure multer for profile pictures
const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profile/";
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${Date.now()}${ext}`);
  }
});

const uploadProfilePic = multer({
  storage: profilePicStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed (JPEG, JPG, PNG)"));
    }
  }
}).single("profilePicture");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.params.userId ? req.params.userId : req.user.userId;
    const user = await User.findById(userId)
      .select("-password -__v")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.profilePicture) {
      user.profilePicture = user.profilePicture.replace(/\\/g, "/");
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Update profile details (without password)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, flat_no } = req.body;
    const userId = req.user.role === 'admin' && req.params.userId ? req.params.userId : req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (email && email !== user.email) {
      const emailExist = await User.findOne({ email });
      if (emailExist) {
        return res.status(400).json({
          success: false,
          message: "Email already registered"
        });
      }
      updates.email = email;
    }
    if (phone && phone !== user.phone) {
      const phoneExist = await User.findOne({ phone });
      if (phoneExist) {
        return res.status(400).json({
          success: false,
          message: "Phone already registered"
        });
      }
      updates.phone = phone;
    }
    if (flat_no && user.role === "resident" && flat_no !== user.flat_no) {
      const existingFlat = await User.findOne({ flat_no, _id: { $ne: userId } });
      if (existingFlat) {
        return res.status(400).json({
          success: false,
          message: "Flat number already in use"
        });
      }
      updates.flat_no = flat_no;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(400).json({
      success: false,
      message: "Update failed",
      error: error.message.includes("validation") ? "Invalid data provided" : error.message
    });
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  uploadProfilePic(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    try {
      const userId = req.user.role === 'admin' && req.params.userId ? req.params.userId : req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      if (user.profilePicture && fs.existsSync(user.profilePicture)) {
        try {
          fs.unlinkSync(user.profilePicture);
        } catch (unlinkError) {
          console.error("Failed to delete old profile picture:", unlinkError);
        }
      }

      const filePath = req.file.path.replace(/\\/g, "/");
      user.profilePicture = filePath;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile picture updated",
        profilePicture: filePath
      });
    } catch (error) {
      console.error("Profile picture update error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile picture",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });
};

// Family member management
exports.addFamilyMember = async (req, res) => {
  try {
    const { name, relation, gender } = req.body;
    const userId = req.user.userId;

    // Authorization check
    if (req.user.role !== "resident") {
      return res.status(403).json({
        success: false,
        message: "Only residents can manage family members"
      });
    }

    // Validation
    if (!name || !relation) {
      return res.status(400).json({
        success: false,
        message: "Name and relation are required"
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prepare new member data
    const newMember = {
      name,
      relation,
      gender: gender || "-",
      permanentId: `PID${Date.now()}${Math.floor(Math.random() * 1000)}`,
      profilePicture: req.file ? req.file.path.replace(/\\/g, "/") : undefined
    };

    // Add member using atomic update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { familyMembers: newMember } },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found after update"
      });
    }

    // Get the newly added member (last in array)
    const addedMember = updatedUser.familyMembers.slice(-1)[0];

    res.status(201).json({
      success: true,
      message: "Family member added successfully",
      familyMember: addedMember,
      familyMembers: updatedUser.familyMembers
    });

  } catch (error) {
    console.error("Add family member error:", error);
    res.status(400).json({
      success: false,
      message: "Add family member failed",
      error: error.message.includes("validation") ? "Invalid data provided" : error.message
    });
  }
};
// Update Family Member - Fixed Version
exports.updateFamilyMember = async (req, res) => {
  try {
    const { memberId, name, relation, gender } = req.body;
    const userId = req.user.userId;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const member = user.familyMembers.id(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Family member not found"
      });
    }

    // Create updates object similar to updateProfile
    const updates = {};
    if (name) updates["familyMembers.$[elem].name"] = name;
    if (relation) updates["familyMembers.$[elem].relation"] = relation;
    if (gender) updates["familyMembers.$[elem].gender"] = gender;
    
    // Handle file upload if provided
    if (req.file) {
      updates["familyMembers.$[elem].profilePicture"] = req.file.path.replace(/\\/g, "/");
    }

    // Use findByIdAndUpdate with arrayFilters for atomic update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ "elem._id": memberId }]
      }
    ).select("-password -__v");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found after update"
      });
    }

    // Find the updated member in the returned document
    const updatedMember = updatedUser.familyMembers.id(memberId);

    res.status(200).json({
      success: true,
      message: "Family member updated successfully",
      updatedMember: updatedMember,
      familyMembers: updatedUser.familyMembers
    });
  } catch (error) {
    console.error("Update family member error:", error);
    res.status(400).json({
      success: false,
      message: "Update failed",
      error: error.message.includes("validation") ? "Invalid data provided" : error.message
    });
  }
};

// Remove Family Member - Fixed Version
exports.removeFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required"
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const initialLength = user.familyMembers.length;
    user.familyMembers = user.familyMembers.filter(
      m => m._id.toString() !== memberId
    );
    
    if (user.familyMembers.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Family member not found"
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Family member removed successfully",
      familyMembers: user.familyMembers
    });
  } catch (error) {
    console.error("Remove family member error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove family member",
      error: error.message
    });
  }
};

// Enhanced Entry/Exit logs controller with PID suggestions
exports.recordEntryExit = async (req, res) => {
  try {
    const { permanentId, type, method } = req.body;

    if (!permanentId || !['entry', 'exit'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Valid permanent ID and type (entry/exit) required"
      });
    }

    let user, personName, isFamilyMember = false;
    
    // First try to find by resident PID
    user = await User.findOne({ permanentId });
    
    if (!user) {
      // If not found as resident, check family members
      user = await User.findOne({ "familyMembers.permanentId": permanentId });
      if (user) {
        const familyMember = user.familyMembers.find(m => m.permanentId === permanentId);
        if (!familyMember) {
          return res.status(404).json({
            success: false,
            message: "Family member not found"
          });
        }
        personName = familyMember.name;
        isFamilyMember = true;
      } else {
        return res.status(404).json({
          success: false,
          message: "Resident or family member not found"
        });
      }
    } else {
      personName = user.name;
    }

    if (user.role !== "resident") {
      return res.status(403).json({
        success: false,
        message: "Entry/Exit logs are only for residents and their family members"
      });
    }

    const log = await EntryLog.create({
      user: user._id,
      permanentId,
      type,
      method,
      verifiedBy: req.user.userId,
      personName,
      flatNo: user.flat_no,
      isFamilyMember
    });

    res.status(201).json({
      success: true,
      message: `${type} recorded for ${personName}`,
      log
    });
  } catch (error) {
    console.error("Record entry/exit error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record log",
      error: error.message
    });
  }
};

// New endpoint for PID suggestions
exports.getPidSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: []
      });
    }

    // Find matching residents
    const residents = await User.find({
      role: "resident",
      $or: [
        { permanentId: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }).select('permanentId name flat_no familyMembers').lean();

    // Process results
    const suggestions = residents.flatMap(resident => {
      const residentEntry = {
        permanentId: resident.permanentId,
        name: resident.name,
        flatNo: resident.flat_no,
        isFamilyMember: false,
        relation: 'Primary Resident'
      };
      
      const familyMembers = resident.familyMembers
        .filter(member => 
          member.permanentId.includes(query) || 
          member.name.toLowerCase().includes(query.toLowerCase())
        )
        .map(member => ({
          permanentId: member.permanentId,
          name: member.name,
          flatNo: resident.flat_no,
          isFamilyMember: true,
          relation: member.relation || 'Family Member'
        }));
      
      return [residentEntry, ...familyMembers];
    });

    res.status(200).json({
      success: true,
      suggestions: suggestions.slice(0, 10) // Limit to 10 suggestions
    });
  } catch (error) {
    console.error("PID suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PID suggestions",
      error: error.message
    });
  }
};

exports.getResidentLogs = async (req, res) => {
  try {
    const { permanentId } = req.params;
    const { type, startDate, endDate, limit = 50 } = req.query;

    const query = {};
    if (permanentId) query.permanentId = permanentId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await EntryLog.find(query)
      .populate("user", "name flat_no profilePicture")
      .populate("verifiedBy", "name role")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    logs.forEach(log => {
      if (log.user?.profilePicture) {
        log.user.profilePicture = log.user.profilePicture.replace(/\\/g, "/");
      }
    });

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error("Get resident logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
      error: error.message
    });
  }
};


// Get all resident logs with optional filters
exports.getResidentLogs = async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 50 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await EntryLog.find(query)
      .populate("user", "name flat_no profilePicture")
      .populate("verifiedBy", "name role")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    logs.forEach(log => {
      if (log.user?.profilePicture) {
        log.user.profilePicture = log.user.profilePicture.replace(/\\/g, "/");
      }
    });

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error("Get all resident logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
      error: error.message
    });
  }
};