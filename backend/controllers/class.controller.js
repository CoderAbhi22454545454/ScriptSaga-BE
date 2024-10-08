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


export const getAllClasses = async (req, res) => {
    try {
        console.log('Starting getClasses API');

        const classes = await Class.find({});
        console.log('Classes found:', classes);

        if (classes.length === 0) {
            console.log('No classes found');
            return res.status(404).json({
                message: "No classes found",
                success: false
            });
        }

        console.log('Returning classes');
        return res.status(200).json({
            message: "classes found",
            classes,
            success: true
        });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ message: "Server error", success: false });
    }

    try {
        res.status(200).json({ message: "API is working" });
    } catch (error) {
        res.status(500).json({ message: "Server error", success: false });
    }
}


// export const getClasses = async (req, res) => {
//     try {
//         console.log('Starting getClasses API');

//         const classes = await Class.find({});
//         console.log('Classes found:', classes);

//         if (classes.length === 0) {
//             console.log('No classes found');
//             return res.status(404).json({
//                 message: "No classes found",
//                 success: false
//             });
//         }

//         console.log('Returning classes');
//         return res.status(200).json({
//             message: "classes found",
//             classes,
//             success: true
//         });
//     } catch (error) {
//         console.error('Error fetching classes:', error);
//         res.status(500).json({ message: "Server error", success: false });
//     }

//     try {
//         res.status(200).json({ message: "API is working" });
//     } catch (error) {
//         res.status(500).json({ message: "Server error", success: false });
//     }
// };


export const getClaaById = async (req, res) => {
    try {
        const { classId } = req.params;

        const classRoom = await Class.findById(classId)

        if (!classRoom) {
            return res.status(400).json({
                message: "Class does not exists",
                success: false
            })
        }

        return res.status(200).json({
            classRoom,
            success: true
        })

    } catch (error) {

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
        res.status(400).json({ message: "server error", success })
    }
}