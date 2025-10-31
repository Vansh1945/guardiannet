const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["maid", "driver", "cook", "other"], 
        required: true
    },
    other_role: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        required: true,
    },
    residentId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true
    },
    permanentId: { 
        type: String, 
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "blocked"],
        default: "active"
    },
    entryLogs: [
        {
            entryTime: { type: Date },
            exitTime: { type: Date },
            securityGuard: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    blockRemark: { 
        type: String, 
        default: "" 
    },
});

module.exports = mongoose.model("Staff", staffSchema);