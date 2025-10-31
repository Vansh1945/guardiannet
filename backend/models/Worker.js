const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["newspaper", "milkman", "swiper"], required: true },
    permanentId: { type: String, unique: true },
    status: { type: String, enum: ["active", "blocked", "canceled"], default: "active" },
    entryExitLogs: [
        {
            entryTime: { type: Date },
            exitTime: { type: Date }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Worker", workerSchema);