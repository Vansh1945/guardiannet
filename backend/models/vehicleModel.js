const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "ownerType",
      required: true,
    },
    ownerType: {
      type: String,
      enum: ["User", "Visitor"],
      required: true,
    },
    flat_no: {
      type: String,
      required: true,
    },
    vehicle_no: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      match: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/,
    },
    vehicle_type: {
      type: String,
      enum: ["car", "bike", "scooter", "truck", "van"],
      required: true,
    },
    is_guest: {
      type: Boolean,
      default: false,
    },
    entry_status: {
      type: String,
      enum: ["allowed", "denied"],
      default: "allowed",
    },
    movement_logs: [
      {
        action: {
          type: String,
          enum: ["Registered", "Entered", "Exited", "Blocked", "Unblocked"],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        verified_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        parking_slot: {
          type: String,
        },
        notes: {
          type: String,
        },
        reason: {
          type: String,
        },
        image_url: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
vehicleSchema.index({ vehicle_no: 1 });
vehicleSchema.index({ owner_id: 1, ownerType: 1 });
vehicleSchema.index({ flat_no: 1 });
vehicleSchema.index({ is_guest: 1 });
vehicleSchema.index({ "movement_logs.action": 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);