const Worker = require("../models/Worker");
const generateUniqueId = require("../utils/generateUniqueId");

exports.registerWorker = async (req, res) => {
    try {
        const { name, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: "Name and Type are required." });
        }

        const existingWorker = await Worker.findOne({ name, type });
        if (existingWorker) {
            return res.status(400).json({ message: "Worker with this name and type already exists." });
        }

        const permanentId = await generateUniqueId(Worker); // Pass Worker model
        const newWorker = new Worker({ name, type, permanentId });

        await newWorker.save();
        res.status(201).json({ message: "Worker registered successfully.", worker: newWorker });
    } catch (error) {
        res.status(500).json({ message: "Error registering worker", error: error.message });
    }
};



// ✅ Get All Workers
exports.getAllWorkers = async (req, res) => {
    try {
        const workers = await Worker.find();
        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching workers", error: error.message });
    }
};

// ✅ Block a Worker
exports.blockWorker = async (req, res) => {
    try {
        const { permanentId } = req.params;
        const worker = await Worker.findOneAndUpdate(
            { permanentId },
            { status: "blocked" },
            { new: true }
        );

        if (!worker) return res.status(404).json({ message: "Worker not found." });

        res.json({ message: "Worker blocked successfully.", worker });
    } catch (error) {
        res.status(500).json({ message: "Error blocking worker", error: error.message });
    }
};

// ✅ Unblock a Worker
exports.unblockWorker = async (req, res) => {
    try {
        const { permanentId } = req.params;
        const worker = await Worker.findOneAndUpdate(
            { permanentId },
            { status: "active" },
            { new: true }
        );

        if (!worker) return res.status(404).json({ message: "Worker not found." });

        res.json({ message: "Worker unblocked successfully.", worker });
    } catch (error) {
        res.status(500).json({ message: "Error unblocking worker", error: error.message });
    }
};

// ✅ Cancel a Worker's ID
exports.cancelWorker = async (req, res) => {
    try {
        const { permanentId } = req.params;
        const worker = await Worker.findOneAndUpdate(
            { permanentId },
            { status: "canceled" },
            { new: true }
        );

        if (!worker) return res.status(404).json({ message: "Worker not found." });

        res.json({ message: "Worker ID canceled successfully.", worker });
    } catch (error) {
        res.status(500).json({ message: "Error canceling worker", error: error.message });
    }
};

// ✅ Get a Single Worker by Permanent ID
exports.getWorkerById = async (req, res) => {
    try {
        const { permanentId } = req.params;
        const worker = await Worker.findOne({ permanentId });

        if (!worker) return res.status(404).json({ message: "Worker not found." });

        res.json(worker);
    } catch (error) {
        res.status(500).json({ message: "Error fetching worker", error: error.message });
    }
};


// ✅ Allow or Deny Entry
exports.allowEntry = async (req, res) => {
    try {
        const { permanentId } = req.params;
        const worker = await Worker.findOne({ permanentId });

        if (!worker) return res.status(404).json({ message: "Worker not found." });

        // Check if the worker is allowed entry
        if (worker.status !== "active") {
            return res.status(403).json({ message: "Entry denied. Worker is blocked or canceled." });
        }

        // Record entry time
        worker.entryExitLogs.push({ entryTime: new Date() });
        await worker.save();

        res.json({ message: "Entry allowed.", worker });
    } catch (error) {
        res.status(500).json({ message: "Error allowing entry", error: error.message });
    }
};

// ✅ Allow Exit & Calculate Stay Duration
exports.allowExit = async (req, res) => {
    try {
        const { permanentId } = req.params;
        const worker = await Worker.findOne({ permanentId });

        if (!worker) return res.status(404).json({ message: "Worker not found." });

        // Find the latest entry without an exit
        const latestLog = worker.entryExitLogs[worker.entryExitLogs.length - 1];
        if (!latestLog || latestLog.exitTime) {
            return res.status(400).json({ message: "No active entry found." });
        }

        // Record exit time
        latestLog.exitTime = new Date();
        await worker.save();

        res.json({ message: `Exit allowed. Worker stayed for ${durationInMinutes} minutes.`, worker });
    } catch (error) {
        res.status(500).json({ message: "Error allowing exit", error: error.message });
    }
};

// ✅ Get Worker Entry-Exit Logs
exports.getWorkerLogs = async (req, res) => {
    try {
        const { permanentId } = req.params;
        const worker = await Worker.findOne({ permanentId });

        if (!worker) return res.status(404).json({ message: "Worker not found." });

        res.json({ logs: worker.entryExitLogs });
    } catch (error) {
        res.status(500).json({ message: "Error fetching logs", error: error.message });
    }
};
