import { Class } from "../models/class.model.js";
import { User } from '../models/user.model.js';

export const createClass = async (req, res) => {
    try {
        const { className, yearOfStudy, branch, division } = req.body;

        if (!className || !yearOfStudy || !branch || !division) {
            return res.status(400).json({
                message: "Please Enter all required fields",
                success: false
            })
        }

        const newClass = await Class.create({
            className,
            yearOfStudy,
            branch,
            division
        })

        return res.status(200).json({
            message: "Class created successfully",
            class: newClass,
            success: true
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", success: false });
    }
}

export const getClasses = async (req, res) => {
    try {
        const classes = await Class.find();
        return res.status(200).json({
            classes,
            success: true
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", success: false });
    }
}

export const getStudentByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const students = await User.find({ classId, role: 'student' }).select('-password');

        return res.status(200).json({
            students,
            success: true
        })
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ message : "server error", success})
    }
}