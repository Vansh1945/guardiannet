const mongoose = require("mongoose");

const DeliveryRequestSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  deliveryPersonName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  apartment: {
    type: String,
    required: true
  },
  deliveryCompany: {
    type: String,
    required: true
  },
  expectedTime: {
    type: Date,
    required: true
  },
  uniqueId: {
    type: String,
    unique: true,
    default: null
  },
  status: {
    type: String,
    enum: ["pending", "approved", "completed"],
    default: "pending"
  },
  entryTime: {
    type: Date,
    default: null
  },
}, { timestamps: true });

module.exports = mongoose.model("DeliveryRequest", DeliveryRequestSchema);