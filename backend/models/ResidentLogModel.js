const mongoose = require("mongoose");

const entryLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  permanentId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["entry", "exit"],
    required: true
  },
  method: {
    type: String,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  personName: {
    type: String,
    required: true
  },
  flatNo: {
    type: String,
    required: true
  },
  isFamilyMember: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("EntryLog", entryLogSchema);