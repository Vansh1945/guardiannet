const mongoose = require("mongoose");
const Vehicle = require("../models/vehicleModel");
const User = require("../models/User");
const Visitor = require("../models/Visitor");

// Helper function to validate vehicle number
const validateVehicleNumber = (vehicle_no) => {
  const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
  return vehicleRegex.test(vehicle_no.toUpperCase());
};

// Helper function to validate vehicle type
const validateVehicleType = (vehicle_type) => {
  const validVehicleTypes = ["car", "bike", "scooter", "truck", "van"];
  return validVehicleTypes.includes(vehicle_type.toLowerCase());
};

// ==================== RESIDENT FUNCTIONS ====================

// Register Personal Vehicle
const registerPersonalVehicle = async (req, res) => {
  try {
    const { vehicle_no, vehicle_type } = req.body;
    const owner_id = req.user.userId;

    if (!vehicle_no || !vehicle_type) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number and vehicle type are required",
      });
    }

    if (!validateVehicleNumber(vehicle_no)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle number format (e.g., MH12AB1234 or HP37G9923)",
      });
    }

    if (!validateVehicleType(vehicle_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle type. Must be one of: car, bike, scooter, truck, van",
      });
    }

    const owner = await User.findById(owner_id);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    const existingVehicle = await Vehicle.findOne({
      vehicle_no: { $regex: new RegExp(`^${vehicle_no}$`, "i") },
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: "Vehicle already registered",
      });
    }

    const newVehicle = new Vehicle({
      owner_id,
      ownerType: "User",
      flat_no: owner.flat_no,
      vehicle_no: vehicle_no.toUpperCase(),
      vehicle_type: vehicle_type.toLowerCase(),
      is_guest: false,
      entry_status: "allowed",
      movement_logs: [
        {
          action: "Registered",
          timestamp: new Date(),
        },
      ],
    });

    await newVehicle.save();

    res.status(201).json({
      success: true,
      message: "Personal vehicle registered successfully",
      data: {
        _id: newVehicle._id,
        vehicle_no: newVehicle.vehicle_no,
        vehicle_type: newVehicle.vehicle_type,
        flat_no: newVehicle.flat_no,
        is_guest: newVehicle.is_guest,
        entry_status: newVehicle.entry_status,
        owner_name: owner.name,
      },
    });
  } catch (error) {
    console.error("Error registering personal vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Server error during vehicle registration",
      error: error.message,
    });
  }
};

// Register Guest Vehicle
const registerGuestVehicle = async (req, res) => {
  try {
    const { visitor_id, vehicle_no, vehicle_type } = req.body;
    const resident_id = req.user.userId;

    if (!visitor_id || !vehicle_no || !vehicle_type) {
      return res.status(400).json({
        success: false,
        message: "Visitor ID, vehicle number, and vehicle type are required",
      });
    }

    if (!validateVehicleNumber(vehicle_no)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle number format (e.g., MH12AB1234 or HP37G9923)",
      });
    }

    if (!validateVehicleType(vehicle_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle type. Must be one of: car, bike, scooter, truck, van",
      });
    }

    const resident = await User.findById(resident_id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    const visitor = await Visitor.findOne({
      _id: visitor_id,
      resident_id: resident_id,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found or not associated with you",
      });
    }

    const existingVehicle = await Vehicle.findOne({
      vehicle_no: { $regex: new RegExp(`^${vehicle_no}$`, "i") },
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: "Vehicle already registered",
      });
    }

    const newVehicle = new Vehicle({
      owner_id: visitor_id,
      ownerType: "Visitor",
      flat_no: resident.flat_no,
      vehicle_no: vehicle_no.toUpperCase(),
      vehicle_type: vehicle_type.toLowerCase(),
      is_guest: true,
      entry_status: "allowed",
      movement_logs: [
        {
          action: "Registered",
          timestamp: new Date(),
        },
      ],
    });

    await newVehicle.save();

    res.status(201).json({
      success: true,
      message: "Guest vehicle registered successfully",
      data: {
        _id: newVehicle._id,
        vehicle_no: newVehicle.vehicle_no,
        vehicle_type: newVehicle.vehicle_type,
        flat_no: newVehicle.flat_no,
        is_guest: newVehicle.is_guest,
        entry_status: newVehicle.entry_status,
        visitor_name: visitor.name,
        visitor_phone: visitor.phone,
      },
    });
  } catch (error) {
    console.error("Error registering guest vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Resident's Vehicles
const getResidentVehicles = async (req, res) => {
  try {
    const resident_id = req.user.userId;
    const resident = await User.findById(resident_id);

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    const vehicles = await Vehicle.find({
      $or: [
        { owner_id: resident_id, ownerType: "User" },
        { flat_no: resident.flat_no, is_guest: true },
      ],
    })
      .populate({
        path: "owner_id",
        select: "name phone",
        match: { ownerType: "Visitor" },
      })
      .sort({ createdAt: -1 });

    const formattedVehicles = vehicles.map((vehicle) => {
      const lastLog = vehicle.movement_logs.length > 0
        ? vehicle.movement_logs[vehicle.movement_logs.length - 1]
        : null;

      return {
        _id: vehicle._id,
        vehicle_no: vehicle.vehicle_no,
        vehicle_type: vehicle.vehicle_type,
        flat_no: vehicle.flat_no,
        is_guest: vehicle.is_guest,
        entry_status: vehicle.entry_status,
        current_status: lastLog?.action === "Entered" ? "inside" : lastLog?.action === "Exited" ? "outside" : "unknown",
        last_action: lastLog?.action,
        last_timestamp: lastLog?.timestamp,
        createdAt: vehicle.createdAt,
        visitor_name: vehicle.is_guest && vehicle.owner_id ? vehicle.owner_id.name : null,
        visitor_phone: vehicle.is_guest && vehicle.owner_id ? vehicle.owner_id.phone : null,
        owner_name: !vehicle.is_guest ? resident.name : null,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedVehicles.length,
      data: formattedVehicles,
    });
  } catch (error) {
    console.error("Error fetching resident vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Vehicle Logs for Resident
const getVehicleLogs = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const residentId = req.user.userId;

    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      $or: [
        { owner_id: residentId, ownerType: "User" },
        { 
          ownerType: "Visitor",
          owner_id: { $exists: true },
          flat_no: req.user.flat_no
        }
      ]
    });

    if (!vehicle) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access to vehicle logs' 
      });
    }

    res.json({ 
      success: true, 
      logs: vehicle.movement_logs.sort((a, b) => b.timestamp - a.timestamp) 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Delete Resident Vehicle
const deleteResidentVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const resident_id = req.user.userId;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.ownerType === "User" && !vehicle.owner_id.equals(resident_id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this vehicle",
      });
    }

    if (vehicle.ownerType === "Visitor") {
      const visitor = await Visitor.findById(vehicle.owner_id);
      if (!visitor || !visitor.resident_id.equals(resident_id)) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to delete this vehicle",
        });
      }
    }

    await Vehicle.findByIdAndDelete(vehicleId);

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==================== SECURITY FUNCTIONS ====================

// Verify Vehicle Entry/Exit
const verifyVehicleEntry = async (req, res) => {
  try {
    const { vehicle_no, action } = req.params;
    const security_id = req.user.userId;
    const { notes, image_url } = req.body;

    if (!["entry", "exit"].includes(action.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'entry' or 'exit'",
      });
    }

    const vehicle = await Vehicle.findOne({
      vehicle_no: { $regex: new RegExp(`^${vehicle_no}$`, "i") },
    }).populate({
      path: "owner_id",
      select: "name phone flat_no",
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.entry_status === "denied" && action === "entry") {
      return res.status(403).json({
        success: false,
        message: "Vehicle is blocked from entry",
        data: {
          vehicle_no: vehicle.vehicle_no,
          entry_status: vehicle.entry_status,
          last_block_reason: vehicle.movement_logs
            .filter((log) => log.action === "Blocked")
            .sort((a, b) => b.timestamp - a.timestamp)[0]?.reason,
        },
      });
    }

    const lastStatusLog = vehicle.movement_logs
      .filter((log) => ["Entered", "Exited"].includes(log.action))
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (action === "entry") {
      if (lastStatusLog?.action === "Entered") {
        return res.status(400).json({
          success: false,
          message: "Vehicle already inside premises",
          data: {
            last_entry: lastStatusLog.timestamp,
            verified_by: lastStatusLog.verified_by,
          },
        });
      }
    } else if (action === "exit") {
      if (lastStatusLog?.action !== "Entered") {
        return res.status(400).json({
          success: false,
          message: "Vehicle must be inside to exit",
          data: {
            last_status: lastStatusLog?.action || "unknown",
            last_timestamp: lastStatusLog?.timestamp,
          },
        });
      }
    }

    const status = action === "entry" ? "Entered" : "Exited";

    vehicle.movement_logs.push({
      action: status,
      timestamp: new Date(),
      verified_by: security_id,
      ...(notes && { notes }),
      ...(image_url && { image_url }),
    });

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: `Vehicle ${status.toLowerCase()} successfully`,
      data: {
        vehicle_no: vehicle.vehicle_no,
        vehicle_type: vehicle.vehicle_type,
        flat_no: vehicle.flat_no,
        is_guest: vehicle.is_guest,
        current_status: status.toLowerCase(),
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Error verifying vehicle entry/exit:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Vehicle Status
const getVehicleStatus = async (req, res) => {
  try {
    const { vehicle_no } = req.query;

    if (!vehicle_no) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number is required",
      });
    }

    const vehicle = await Vehicle.findOne({
      vehicle_no: { $regex: new RegExp(`^${vehicle_no}$`, "i") },
    }).populate({
      path: "owner_id",
      select: "name phone flat_no",
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const lastLog = vehicle.movement_logs.length > 0
      ? vehicle.movement_logs[vehicle.movement_logs.length - 1]
      : null;

    res.status(200).json({
      success: true,
      data: {
        _id: vehicle._id,
        vehicle_no: vehicle.vehicle_no,
        vehicle_type: vehicle.vehicle_type,
        flat_no: vehicle.flat_no,
        is_guest: vehicle.is_guest,
        entry_status: vehicle.entry_status,
        owner: {
          name: vehicle.owner_id?.name,
          ...(vehicle.is_guest ? { phone: vehicle.owner_id?.phone } : { flat_no: vehicle.owner_id?.flat_no }),
        },
        current_status: lastLog?.action === "Entered" ? "inside" : "outside",
        last_action: lastLog?.action,
        last_timestamp: lastLog?.timestamp,
      },
    });
  } catch (error) {
    console.error("Error getting vehicle status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get All Vehicles for Security
const getAllVehiclesForSecurity = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    let query = {};

    if (type === "guest") {
      query.is_guest = true;
    } else if (type === "resident") {
      query.is_guest = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const vehicles = await Vehicle.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    let formattedVehicles = vehicles.map((vehicle) => {
      const lastLog = vehicle.movement_logs.length > 0
        ? vehicle.movement_logs[vehicle.movement_logs.length - 1]
        : null;

      const currentStatus = lastLog?.action === "Entered" ? "inside" : "outside";

      return {
        _id: vehicle._id,
        vehicle_no: vehicle.vehicle_no,
        vehicle_type: vehicle.vehicle_type,
        flat_no: vehicle.flat_no,
        is_guest: vehicle.is_guest,
        entry_status: vehicle.entry_status,
        owner: vehicle.owner_id
          ? {
              name: vehicle.owner_id.name,
              phone: vehicle.owner_id.phone,
              ...(vehicle.is_guest ? {} : { flat_no: vehicle.owner_id.flat_no }),
            }
          : null,
        current_status: currentStatus,
        last_action: lastLog?.action,
        last_timestamp: lastLog?.timestamp,
        createdAt: vehicle.createdAt,
      };
    });

    if (status === "inside") {
      formattedVehicles = formattedVehicles.filter((v) => v.current_status === "inside");
    } else if (status === "outside") {
      formattedVehicles = formattedVehicles.filter((v) => v.current_status === "outside");
    }

    const totalCount = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      count: formattedVehicles.length,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      data: formattedVehicles,
    });
  } catch (error) {
    console.error("Error fetching all vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Vehicle Movement History
const getVehicleHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findById(vehicleId)
      .populate({
        path: "owner_id",
        select: "name phone flat_no",
      })
      .populate({
        path: "movement_logs.verified_by",
        select: "name role",
      });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        vehicle_no: vehicle.vehicle_no,
        vehicle_type: vehicle.vehicle_type,
        flat_no: vehicle.flat_no,
        is_guest: vehicle.is_guest,
        owner: {
          name: vehicle.owner_id?.name,
          ...(vehicle.is_guest ? { phone: vehicle.owner_id?.phone } : { flat_no: vehicle.owner_id?.flat_no }),
        },
        movement_logs: vehicle.movement_logs
          .sort((a, b) => b.timestamp - a.timestamp)
          .map(log => ({
            action: log.action,
            timestamp: log.timestamp,
            verified_by: log.verified_by ? {
              name: log.verified_by.name,
              role: log.verified_by.role
            } : null,
            ...(log.notes && { notes: log.notes }),
            ...(log.reason && { reason: log.reason }),
            ...(log.image_url && { image_url: log.image_url }),
          })),
      },
    });
  } catch (error) {
    console.error("Error fetching vehicle history:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Register Unregistered Vehicle (Security)
const registerUnregisteredVehicle = async (req, res) => {
  try {
    const { vehicle_no, vehicle_type, owner_id, ownerType, flat_no } = req.body;
    const securityGuardId = req.user._id; // Assuming guard is authenticated

    // 1. Validate vehicle number format
    const vehicleNoRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
    if (!vehicleNoRegex.test(vehicle_no.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle number format (e.g. MH12AB1234)'
      });
    }

    // 2. Validate owner exists
    if (!isValidObjectId(owner_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid owner ID format'
      });
    }

    let ownerModel;
    if (ownerType === 'User') {
      ownerModel = User;
    } else if (ownerType === 'Visitor') {
      ownerModel = Visitor;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid ownerType (must be User or Visitor)'
      });
    }

    const ownerExists = await ownerModel.findById(owner_id);
    if (!ownerExists) {
      return res.status(404).json({
        success: false,
        message: `${ownerType} not found with provided ID`
      });
    }

    // 3. Create vehicle with movement log
    const vehicle = await Vehicle.create({
      vehicle_no: vehicle_no.toUpperCase(),
      vehicle_type,
      owner_id,
      ownerType,
      flat_no,
      movement_logs: [{
        action: 'Registered',
        verified_by: securityGuardId
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Vehicle registration error:', error);

    // Handle duplicate vehicle number
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this number already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// ==================== ADMIN FUNCTIONS ====================

// Get All Vehicles for Admin
const getAllVehicles = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 10 } = req.query;

    let query = {};

    if (type === "guest") {
      query.is_guest = true;
    } else if (type === "resident") {
      query.is_guest = false;
    }

    if (search) {
      query.$or = [
        { vehicle_no: { $regex: search, $options: "i" } },
        { flat_no: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const vehicles = await Vehicle.find(query)
    
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    let formattedVehicles = vehicles.map((vehicle) => {
      const lastLog = vehicle.movement_logs.length > 0
        ? vehicle.movement_logs[vehicle.movement_logs.length - 1]
        : null;

      const currentStatus = lastLog?.action === "Entered" ? "inside" : "outside";

      return {
        _id: vehicle._id,
        vehicle_no: vehicle.vehicle_no,
        vehicle_type: vehicle.vehicle_type,
        flat_no: vehicle.flat_no,
        is_guest: vehicle.is_guest,
        entry_status: vehicle.entry_status,
        owner: vehicle.owner_id
          ? {
              name: vehicle.owner_id.name,
              phone: vehicle.owner_id.phone,
              ...(vehicle.is_guest ? {} : { flat_no: vehicle.owner_id.flat_no }),
            }
          : null,
        current_status: currentStatus,
        last_action: lastLog?.action,
        last_timestamp: lastLog?.timestamp,
        createdAt: vehicle.createdAt,
      };
    });

    if (status === "inside") {
      formattedVehicles = formattedVehicles.filter((v) => v.current_status === "inside");
    } else if (status === "outside") {
      formattedVehicles = formattedVehicles.filter((v) => v.current_status === "outside");
    }

    const totalCount = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      count: formattedVehicles.length,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      data: formattedVehicles,
    });
  } catch (error) {
    console.error("Error fetching all vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Block Vehicle
const blockVehicle = async (req, res) => {
  try {
    const { vehicle_no } = req.params;
    const { reason } = req.body;

    const vehicle = await Vehicle.findOne({
      vehicle_no: { $regex: new RegExp(`^${vehicle_no}$`, "i") },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.entry_status === "denied") {
      return res.status(400).json({
        success: false,
        message: "Vehicle is already blocked",
      });
    }

    vehicle.entry_status = "denied";
    vehicle.movement_logs.push({
      action: "Blocked",
      timestamp: new Date(),
      blocked_by: req.user.userId,
      reason: reason || "No reason provided",
    });

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle blocked successfully",
      data: {
        vehicle_no: vehicle.vehicle_no,
        entry_status: vehicle.entry_status,
        blocked_at: new Date(),
        reason: reason || "No reason provided",
      },
    });
  } catch (error) {
    console.error("Error blocking vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Unblock Vehicle
const unblockVehicle = async (req, res) => {
  try {
    const { vehicle_no } = req.params;

    const vehicle = await Vehicle.findOne({
      vehicle_no: { $regex: new RegExp(`^${vehicle_no}$`, "i") },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.entry_status === "allowed") {
      return res.status(400).json({
        success: false,
        message: "Vehicle is not blocked",
      });
    }

    vehicle.entry_status = "allowed";
    vehicle.movement_logs.push({
      action: "Unblocked",
      timestamp: new Date(),
      unblocked_by: req.user.userId,
    });

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle unblocked successfully",
      data: {
        vehicle_no: vehicle.vehicle_no,
        entry_status: vehicle.entry_status,
        unblocked_at: new Date(),
      },
    });
  } catch (error) {
    console.error("Error unblocking vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Vehicle Details
const getVehicleDetails = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findById(vehicleId)
      .populate('owner_id', 'name phone flat_no') // Ensure these fields are populated
      .exec();

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    // Create consistent owner object
    const ownerData = vehicle.owner_id ? {
      name: vehicle.owner_id.name,
      phone: vehicle.owner_id.phone,
      flat_no: vehicle.owner_id.flat_no
    } : null;

    res.status(200).json({
      success: true,
      data: {
        _id: vehicle._id,
        vehicle_no: vehicle.vehicle_no,
        vehicle_type: vehicle.vehicle_type,
        flat_no: vehicle.flat_no,
        is_guest: vehicle.is_guest,
        entry_status: vehicle.entry_status,
        current_status: vehicle.current_status, // Make sure to include this
        owner: ownerData, // Consistent owner structure
        movement_logs: vehicle.movement_logs
          .sort((a, b) => b.timestamp - a.timestamp)
          .map(log => ({
            action: log.action,
            timestamp: log.timestamp,
            verified_by: log.verified_by ? {
              name: log.verified_by.name,
              role: log.verified_by.role
            } : null,
            blocked_by: log.blocked_by ? {
              name: log.blocked_by.name,
              role: log.blocked_by.role
            } : null,
            unblocked_by: log.unblocked_by ? {
              name: log.unblocked_by.name,
              role: log.unblocked_by.role
            } : null,
            ...(log.notes && { notes: log.notes }),
            ...(log.reason && { reason: log.reason }),
            ...(log.image_url && { image_url: log.image_url }),
          })),
        createdAt: vehicle.createdAt, // Include creation date
        updatedAt: vehicle.updatedAt // Include update date
      },
    });
  } catch (error) {
    console.error("Error fetching vehicle details:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  registerPersonalVehicle,
  registerGuestVehicle,
  getResidentVehicles,
  getVehicleLogs,
  deleteResidentVehicle,
  verifyVehicleEntry,
  getVehicleStatus,
  getAllVehiclesForSecurity,
  registerUnregisteredVehicle,
  getVehicleHistory,
  getAllVehicles,
  blockVehicle,
  unblockVehicle,
  getVehicleDetails,
};
