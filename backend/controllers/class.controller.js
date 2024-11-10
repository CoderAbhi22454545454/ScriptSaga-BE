import { Class } from "../models/class.model.js";
import { User } from '../models/user.model.js';

export const createClass = async (req, res) => {
    try {
        const { className, yearOfStudy, branch, division } = req.body;

        if (!className || !yearOfStudy || !branch || !division) {
            return res.status(400).json({
                message: "Please Enter all required fields",
                success: false
            });
        }

        const newClass = await Class.create({
            className,
            yearOfStudy,
            branch,
            division
        });

        return res.status(200).json({
            message: "Class created successfully",
            class: newClass,
            success: true
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", success: false });
    }
};

export const getAllClasses = async (req, res) => {
    try {
        const classes = await Class.find();
        
        const classesWithCount = await Promise.all(
            classes.map(async (cls) => {
                const studentCount = await User.countDocuments({ 
                    classId: cls._id,
                    role: 'student'
                });
                
                return {
                    ...cls.toObject(),
                    totalStudents: studentCount
                };
            })
        );
        
        res.json({
            success: true,
            classes: classesWithCount,
            message: 'Classes fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching classes',
            error: error.message
        });
    }
};

export const getClassById = async (req, res) => {
    try {
        const classRoom = await Class.findById(req.params.classId);
        if (!classRoom) {
            return res.status(404).json({ 
                success: false, 
                message: 'Class not found' 
            });
        }
        res.json({ 
            success: true, 
            classRoom 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching class', 
            error: error.message 
        });
    }
};

export const updateClass = async (req, res) => {
    try {
        const updatedClass = await Class.findByIdAndUpdate(
            req.params.classId,
            req.body,
            { new: true }
        );
        res.json({ message: 'Class updated successfully', class: updatedClass });
    } catch (error) {
        res.status(500).json({ message: 'Error updating class', error: error.message });
    }
};

export const deleteClass = async (req, res) => {
    try {
        await Class.findByIdAndDelete(req.params.classId);
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting class', error: error.message });
    }
};

export const getStudentByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const students = await User.find({ classId, role: 'student' }).select('-password');
        
        return res.status(200).json({
            students,
            success: true
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", success: false });
    }
};