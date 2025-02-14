import { Class } from "../models/class.model.js";
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';

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

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                message: "Invalid class ID format",
                success: false
            });
        }

        // Check if class exists
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({
                message: "Class not found",
                success: false
            });
        }

        const students = await User.find({ 
            classId, 
            role: 'student' 
        })
        .select('-password')
        .sort({ rollNo: 1 });
        
        return res.status(200).json({
            students,
            success: true
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            message: "Server error", 
            success: false,
            error: error.message 
        });
    }
};

export const downloadClassData = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Fetch class details
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Fetch students with their GitHub and LeetCode data
    const students = await User.find({ 
      classId: classId,
      role: 'student'
    })
    .populate('githubData')
    .populate('leetcodeData')
    .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Class Data');

    worksheet.columns = [
      { header: 'Roll No', key: 'rollNo', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'GitHub ID', key: 'githubID', width: 15 },
      { header: 'Total Commits', key: 'totalCommits', width: 15 },
      { header: 'Active Repos', key: 'activeRepos', width: 15 },
      { header: 'LeetCode ID', key: 'leetCodeID', width: 15 },
      { header: 'Problems Solved', key: 'problemsSolved', width: 15 }
    ];

    students.forEach(student => {
      worksheet.addRow({
        rollNo: student.rollNo || 'N/A',
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        githubID: student.githubID || 'N/A',
        totalCommits: student.githubData?.totalCommits || 0,
        activeRepos: student.githubData?.repoCount || 0,
        leetCodeID: student.leetCodeID || 'N/A',
        problemsSolved: student.leetcodeData?.totalSolved || 0
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0000FF' }
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Class_${classData.yearOfStudy}_${classData.division}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating excel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate excel file'
    });
  }
};

export const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    
    const teacher = await User.findById(teacherId)
      .populate('classId')
      .select('classId');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      classes: teacher.classId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher classes',
      error: error.message
    });
  }
};