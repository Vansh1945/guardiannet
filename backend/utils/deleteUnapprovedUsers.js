const cron = require("node-cron");
const mongoose = require("mongoose");
const User = require("../models/User");

const deleteUnapprovedUsers = async () => {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Delete users who are pending or rejected for more than 24 hours
    const result = await User.deleteMany({ 
      approval_status: { $in: ["pending", "rejected"] }, 
      createdAt: { $lt: twentyFourHoursAgo }
    });

    console.log(`${result.deletedCount} unapproved/rejected users deleted.`);
  } catch (error) {
    console.error("Error deleting unapproved users:", error);
  }
};

// Schedule the job to run every 24 hours at midnight
cron.schedule("0 0 * * *", () => {
  deleteUnapprovedUsers();
});

module.exports = deleteUnapprovedUsers;
