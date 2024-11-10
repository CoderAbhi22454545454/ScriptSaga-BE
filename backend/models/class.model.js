import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true
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
        required: true
    }
}, { timestamps: true });

classSchema.index({ className: 1, yearOfStudy: 1, branch: 1, division: 1 }, { unique: true });
export const Class = mongoose.model('Class', classSchema);
