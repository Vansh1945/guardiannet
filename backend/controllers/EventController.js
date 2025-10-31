const mongoose = require("mongoose");
const Event = require("../models/Event");
const path = require("path");
const fs = require("fs");

// Admin: Create Event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, time, location } = req.body;

    // Validate required fields
    if (!title || !description || !date || !time || !location) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate image file
    let imagePath = null;
    if (req.file) {
      if (!req.file.mimetype.startsWith("event-image/")) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image file",
        });
      }
      if (req.file.size > 2 * 1024 * 1024) {
        fs.unlinkSync(req.file.path); // Remove invalid file
        return res.status(400).json({
          success: false,
          message: "Image size must be less than 2MB",
        });
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    const event = new Event({
      title,
      description,
      date: new Date(date),
      time,
      location,
      organizer: req.user.userId,
      image: imagePath,
    });

    await event.save();

    // Populate organizer details
    const populatedEvent = await Event.findById(event._id).populate(
      "organizer",
      "name email"
    );

    res.status(201).json({
      success: true,
      data: populatedEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file on error
    }
    res.status(500).json({
      success: false,
      message: "Error creating event",
      error: error.message,
    });
  }
};

// Get All Events with Pagination
exports.getAllEvents = async (req, res) => {
  try {
    const {
      status = "all",
      limit = 10,
      page = 1,
      sort = "date:1",
      search,
    } = req.query;
    let query = { isCancelled: false };

    // Filter by status
    const now = new Date();
    if (status === "past") {
      query.date = { $lt: now };
    } else if (status === "upcoming") {
      query.date = { $gte: now };
    }

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Parse sort parameter (e.g., "date:1" or "date:-1")
    let sortOption = {};
    if (sort) {
      const [field, order] = sort.split(":");
      sortOption[field] = parseInt(order) || 1;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOption,
      populate: { path: "organizer", select: "name email" },
    };

    const events = await Event.paginate(query, options);

    res.json({
      success: true,
      data: {
        events: events.docs,
        pagination: {
          total: events.totalDocs,
          limit: events.limit,
          page: events.page,
          pages: events.totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching events",
      error: error.message,
    });
  }
};

// Get Single Event
exports.getEventById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "name email"
    );

    if (!event || event.isCancelled) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error retrieving event",
      error: error.message,
    });
  }
};

// Admin: Update Event
exports.updateEvent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const { title, description, date, time, location } = req.body;

    // Validate required fields
    if (!title || !description || !date || !time || !location) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Handle image update
    let imagePath;
    if (req.file) {
      if (!req.file.mimetype.startsWith("event-image/")) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Please upload an image file",
        });
      }
      if (req.file.size > 2 * 1024 * 1024) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Image size must be less than 2MB",
        });
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    const updateData = {
      title,
      description,
      date: new Date(date),
      time,
      location,
      ...(imagePath && { image: imagePath }),
    };

    const event = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("organizer", "name email");

    if (!event || event.isCancelled) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating event",
      error: error.message,
    });
  }
};

// Admin: Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }
    const event = await Event.findById(req.params.id);

    if (!event || event.isCancelled) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Delete associated image file
    if (event.image) {
      const imagePath = path.join(__dirname, "..", event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error deleting event",
      error: error.message,
    });
  }
};