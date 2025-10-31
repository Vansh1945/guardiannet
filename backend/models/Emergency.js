const mongoose = require("mongoose");

const EmergencyAlertSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["Fire", "Security Threat", "Suspicious Person", "Unauthorized Entry", "Other"],
    required: true,
  },
  customTitle: {
    type: String,
    required: function () {
      return this.type === "Other";
    },
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  photo: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Resolved"],
    default: "Pending",
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  verifiedAt: {
    type: Date,
  },
  actionTaken: {
    type: String,
  },
  repeatedAttempts: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

EmergencyAlertSchema.virtual('verifier', {
  ref: 'User',
  localField: 'verifiedBy',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model("EmergencyAlert", EmergencyAlertSchema);