const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    image: {
        type: String 
    },
    isCancelled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

eventSchema.plugin(mongoosePaginate);
eventSchema.index({ date: 1, isCancelled: 1 });

module.exports = mongoose.model("Event", eventSchema);