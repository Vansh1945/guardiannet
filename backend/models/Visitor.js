const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  flat_no: { type: String, required: true },
  resident_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qr_code: { type: String, unique: true },
  image: { type: String },
  purpose: { type: String, default: 'Guest' },
  entry_status: { 
    type: String, 
    enum: ['pending', 'granted', 'denied', 'checked_in', 'checked_out'],
    default: 'pending'
  },
  is_pre_registered: { type: Boolean, default: false },
  entry_time: { type: Date },
  exit_time: { type: Date },
  expected_arrival: { type: Date },
  entry_logs: [{
    action: { type: String, enum: ['entry', 'exit'] },
    timestamp: { type: Date, default: Date.now },
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['resident', 'security', 'admin'] }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visitor', visitorSchema);