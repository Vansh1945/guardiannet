const Staff = require("../models/staffModel");
const User = require("../models/User");
const generateUniqueId = require("../utils/generateUniqueId");
const sendSMS = require("../utils/smsSend");

exports.registerStaff = async (req, res) => {
    try {
        const { name, role, residentId, other_role, phone } = req.body;

        // Validation
        if (!name || !role || !residentId || !phone) {
            return res.status(400).json({
                success: false,
                message: "Name, role, residentId, and phone are required."
            });
        }

        if (!["maid", "driver", "cook", "other"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid staff role."
            });
        }

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number must 10 digits"
            });
        }

        const resident = await User.findById(residentId);
        if (!resident) return res.status(404).json({
            success: false,
            message: "Resident not found."
        });

        const existingStaff = await Staff.findOne({ name, role, residentId });
        if (existingStaff) {
            return res.status(400).json({
                success: false,
                message: "Staff with this name, role, and resident already exists."
            });
        }

        const permanentId = await generateUniqueId(Staff);

        const newStaff = new Staff({
            name,
            role,
            residentId,
            other_role: role === 'other' ? other_role : '',
            permanentId,
            phone
        });

        await newStaff.save();

        try {
            const smsMessage = `Hello ${name}, you have been registered as ${role} staff. Your Permanent ID is: ${permanentId}. Please keep this ID safe for entry/exit purposes.`;
            await sendSMS(phone, smsMessage);
        } catch (smsError) {
            console.error("SMS sending failed:", smsError);
        }

        res.status(201).json({
            success: true,
            message: "Staff registered successfully.",
            data: newStaff
        });
    } catch (error) {
        console.error("Error registering staff:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.getResidentStaff = async (req, res) => {
    try {
        const { residentId } = req.params;
        const staff = await Staff.find({ residentId }).sort({ createdAt: -1 });
        res.json(staff);
    } catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({ message: "Error fetching staff", error: error.message });
    }
};

exports.blockStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { remark } = req.body;

        if (!remark || !remark.trim()) {
            return res.status(400).json({ message: "Block remark is required." });
        }

        const staff = await Staff.findById(staffId);
        if (!staff) return res.status(404).json({ message: "Staff not found." });

        if (staff.status === "blocked") {
            return res.status(400).json({ message: "Staff is already blocked." });
        }

        staff.status = "blocked";
        staff.blockRemark = remark.trim();
        await staff.save();

        try {
            const smsMessage = `Hello ${staff.name}, your access has been blocked. Reason: ${remark}. Please contact the resident for more information.`;
            await sendSMS(staff.phone, smsMessage);
            console.log(`Block notification SMS sent to ${staff.phone}`);
        } catch (smsError) {
            console.error("SMS sending failed:", smsError);
        }

        res.json({
            message: "Staff blocked successfully.",
            staff
        });
    } catch (error) {
        console.error("Error blocking staff:", error);
        res.status(500).json({ message: "Error blocking staff", error: error.message });
    }
};

exports.unblockStaff = async (req, res) => {
    try {
        const { staffId } = req.params;

        const staff = await Staff.findById(staffId);
        if (!staff) return res.status(404).json({ message: "Staff not found." });

        if (staff.status !== "blocked") {
            return res.status(400).json({ message: "Staff is not blocked." });
        }

        staff.status = "active";
        staff.blockRemark = "";
        await staff.save();

        try {
            const smsMessage = `Hello ${staff.name}, your access has been restored. You can now use your Permanent ID: ${staff.permanentId} for entry/exit.`;
            await sendSMS(staff.phone, smsMessage);
            console.log(`Unblock notification SMS sent to ${staff.phone}`);
        } catch (smsError) {
            console.error("SMS sending failed:", smsError);
        }

        res.json({
            message: "Staff unblocked successfully.",
            staff
        });
    } catch (error) {
        console.error("Error unblocking staff:", error);
        res.status(500).json({ message: "Error unblocking staff", error: error.message });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const staff = await Staff.findById(staffId);
        if (!staff) return res.status(404).json({ message: "Staff not found." });

        try {
            const smsMessage = `Hello ${staff.name}, your staff registration has been cancelled. Your Permanent ID: ${staff.permanentId} is no longer valid.`;
            await sendSMS(staff.phone, smsMessage);
            console.log(`Deletion notification SMS sent to ${staff.phone}`);
        } catch (smsError) {
            console.error("SMS sending failed:", smsError);
        }

        await Staff.findByIdAndDelete(staffId);
        res.json({ message: "Staff deleted successfully." });
    } catch (error) {
        console.error("Error deleting staff:", error);
        res.status(500).json({ message: "Error deleting staff", error: error.message });
    }
};

exports.verifyPermanentId = async (req, res) => {
    try {
        const { permanentId } = req.params;

        const staff = await Staff.findOne({ permanentId });
        if (!staff) return res.status(404).json({ message: "Invalid Permanent ID." });

        if (staff.status === "blocked") {
            return res.status(403).json({
                message: "Entry Denied. Staff is Blocked.",
                remark: staff.blockRemark
            });
        }

        const totalEntries = staff.entryLogs.length;
        const totalExits = staff.entryLogs.filter(log => log.exitTime).length;
        const lastLog = staff.entryLogs.length > 0 ? staff.entryLogs[staff.entryLogs.length - 1] : null;
        const isInside = lastLog && !lastLog.exitTime;

        res.json({
            message: "Permanent ID Verified.",
            staff: {
                name: staff.name,
                role: staff.role,
                permanentId: staff.permanentId,
                status: staff.status,
                totalEntries,
                totalExits,
                isInside,
                lastEntryTime: lastLog ? lastLog.entryTime : "No previous entries",
                lastExitTime: lastLog?.exitTime || "Not exited yet"
            }
        });
    } catch (error) {
        console.error("Error verifying ID:", error);
        res.status(500).json({ message: "Error verifying ID", error: error.message });
    }
};

exports.staffEntry = async (req, res) => {
    try {
        const { permanentId } = req.body;
        const securityGuardId = req.securityGuardId;

        const staff = await Staff.findOne({ permanentId });
        if (!staff) return res.status(404).json({ message: "Invalid Permanent ID." });

        if (staff.status === "blocked") {
            return res.status(403).json({ message: "Entry Denied. Staff is Blocked.", remark: staff.blockRemark });
        }

        const lastLog = staff.entryLogs.length > 0 ? staff.entryLogs[staff.entryLogs.length - 1] : null;
        if (lastLog && !lastLog.exitTime) {
            return res.status(400).json({ message: "Staff already inside. Exit first before re-entering." });
        }

        const entryLog = { entryTime: new Date(), securityGuard: securityGuardId };
        staff.entryLogs.push(entryLog);
        await staff.save();

        res.json({ message: "Entry Recorded.", entryTime: entryLog.entryTime, staff });
    } catch (error) {
        res.status(500).json({ message: "Error during staff entry", error: error.message });
    }
};

exports.staffExit = async (req, res) => {
    try {
        const { permanentId } = req.body;
        const securityGuardId = req.securityGuardId;

        const staff = await Staff.findOne({ permanentId });
        if (!staff) return res.status(404).json({ message: "Invalid Permanent ID." });

        const lastLogIndex = staff.entryLogs.findIndex(log => !log.exitTime);
        if (lastLogIndex === -1) {
            return res.status(400).json({ message: "Staff has not entered or already exited." });
        }

        staff.entryLogs[lastLogIndex].exitTime = new Date();
        staff.entryLogs[lastLogIndex].securityGuard = securityGuardId;
        await staff.save();

        res.json({
            message: "Exit Recorded.",
            entryTime: staff.entryLogs[lastLogIndex].entryTime,
            exitTime: staff.entryLogs[lastLogIndex].exitTime,
            staff
        });
    } catch (error) {
        res.status(500).json({ message: "Error during staff exit", error: error.message });
    }
};

exports.getStaffHistory = async (req, res) => {
    try {
        const { permanentId } = req.params;

        const staff = await Staff.findOne({ permanentId });
        if (!staff) return res.status(404).json({ message: "Invalid Permanent ID." });

        res.json({ message: "Entry-Exit History Retrieved.", history: staff.entryLogs });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving history", error: error.message });
    }
};

exports.sendStaffSMS = async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({ 
                success: false,
                message: 'Phone number and message are required'
            });
        }

        const result = await sendSMS(phone, message);
        
        res.status(200).json({
            success: true,
            message: 'SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send SMS'
        });
    }
};


// Get All Staff (Admin Only)
exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.find()
            .populate('residentId', 'name email phone')
            .sort({ createdAt: -1 });
            
        res.json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        console.error("Error fetching all staff:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// Get Staff with Entry-Exit Stats (Admin/Resident)
exports.getStaffWithStats = async (req, res) => {
    try {
        const { residentId } = req.query;
        
        let query = {};
        if (residentId) {
            query.residentId = residentId;
        }

        const staff = await Staff.aggregate([
            { $match: query },
            {
                $addFields: {
                    totalEntries: { $size: "$entryLogs" },
                    totalExits: {
                        $size: {
                            $filter: {
                                input: "$entryLogs",
                                as: "log",
                                cond: { $ifNull: ["$$log.exitTime", false] }
                            }
                        }
                    },
                    lastEntry: { $arrayElemAt: ["$entryLogs", -1] }
                }
            },
            {
                $project: {
                    name: 1,
                    role: 1,
                    other_role: 1,
                    phone: 1,
                    permanentId: 1,
                    residentId: 1,
                    status: 1,
                    blockRemark: 1,
                    createdAt: 1,
                    totalEntries: 1,
                    totalExits: 1,
                    isInside: { $not: ["$lastEntry.exitTime"] },
                    lastEntryTime: "$lastEntry.entryTime",
                    lastExitTime: "$lastEntry.exitTime"
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        // Populate resident details
        const populatedStaff = await Staff.populate(staff, [
            { path: 'residentId', select: 'name phone' }
        ]);

        res.json({
            success: true,
            count: populatedStaff.length,
            data: populatedStaff
        });
    } catch (error) {
        console.error("Error fetching staff with stats:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};