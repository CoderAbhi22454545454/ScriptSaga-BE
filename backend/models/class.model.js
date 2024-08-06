import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true,
        unique: true
    },
    yearOfStudy: {
        type: String,
        required: true,
        enum: ["FE", "SE", "TE", "BE"]
    },
    branch: {
        type: String,
        required: true,
        enum: ["CS", "AIDS", "IT"]
    },
    division: {
        type: String,
        enum: ["A", "B"]
    }
}, { timestamps: true });

export const Class = mongoose.model('Class', classSchema);
