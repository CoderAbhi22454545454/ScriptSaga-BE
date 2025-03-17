import { Class } from "../models/class.model.js";
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { GithubData } from '../models/githubData.model.js';
import { LeetCode } from '../models/leetcode.model.js';
import axios from 'axios';
import { leetCodeUserInfo } from '../services/leetcode.service.js';

// Create GitHub API instance
const GitHub_BaseURL = "https://api.github.com";
const token = process.env.GITHUB_TOKEN;
const githubApi = axios.create({
    baseURL: GitHub_BaseURL,
    headers: {
        'Authorization': `token ${token}`
    }
});

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
        // Get all classes
        const classes = await Class.find().lean();
        
        // Get student counts for all classes in a single query
        const studentCounts = await User.aggregate([
            { $match: { role: 'student' } },
            { $group: { _id: '$classId', count: { $sum: 1 } } }
        ]);
        
        // Create a map of classId to student count
        const countMap = studentCounts.reduce((map, item) => {
            map[item._id.toString()] = item.count;
            return map;
        }, {});
        
        // Combine the data
        const classesWithCount = classes.map(cls => ({
            ...cls,
            totalStudents: countMap[cls._id.toString()] || 0
        }));
        
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

        // Directly fetch students without checking if class exists first
        // This saves one database query
        const students = await User.find({ 
            classId, 
            role: 'student' 
        })
        .select('-password')
        .sort({ rollNo: 1 })
        .lean(); // Use lean() for better performance
        
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
      fgColor: { argb: 'FFFFFFFF' }
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
    
    // First, get the teacher with just the classId references
    const teacher = await User.findById(teacherId).lean();
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    if (!teacher.classId || teacher.classId.length === 0) {
      return res.json({
        success: true,
        classes: []
      });
    }
    
    // Get all classes for this teacher in one query
    const classes = await Class.find({
      _id: { $in: teacher.classId }
    }).lean();
    
    // Get counts of students per class in one query
    const studentCounts = await User.aggregate([
      { 
        $match: { 
          classId: { $in: teacher.classId },
          role: 'student'
        }
      },
      { $group: { _id: '$classId', count: { $sum: 1 } } }
    ]);
    
    // Create a map of classId to student count
    const studentCountMap = studentCounts.reduce((map, item) => {
      map[item._id.toString()] = item.count;
      return map;
    }, {});
    
    // Get assignment stats in one query
    const assignmentStats = await Class.aggregate([
      { $match: { _id: { $in: teacher.classId } } },
      { $lookup: {
          from: 'assignments',
          localField: 'assignments',
          foreignField: '_id',
          as: 'assignmentDetails'
        }
      },
      { $project: {
          _id: 1,
          assignmentCount: { $size: '$assignmentDetails' },
          activeAssignments: {
            $size: {
              $filter: {
                input: '$assignmentDetails',
                as: 'assignment',
                cond: { $gt: ['$$assignment.dueDate', new Date()] }
              }
            }
          }
        }
      }
    ]);
    
    // Create a map of classId to assignment stats
    const assignmentStatsMap = assignmentStats.reduce((map, item) => {
      map[item._id.toString()] = {
        assignmentCount: item.assignmentCount,
        activeAssignments: item.activeAssignments
      };
      return map;
    }, {});
    
    // Combine all the data
    const classesWithStats = classes.map(cls => {
      const classId = cls._id.toString();
      const stats = assignmentStatsMap[classId] || { assignmentCount: 0, activeAssignments: 0 };
      
      return {
        ...cls,
        totalStudents: studentCountMap[classId] || 0,
        activeAssignments: stats.activeAssignments,
        totalAssignments: stats.assignmentCount
      };
    });

    res.json({
      success: true,
      classes: classesWithStats || []
    });
  } catch (error) {
    console.error('Error in getTeacherClasses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher classes',
      error: error.message
    });
  }
};

export const downloadClassDataWithProgress = async (req, res) => {
  try {
    const { classId } = req.params;
    const { students: studentsWithProgress } = req.body;
    
    if (!studentsWithProgress || !Array.isArray(studentsWithProgress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student data provided'
      });
    }

    // Get class data
    const classData = await Class.findById(classId).lean();
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Class Progress Data');

    // Define columns with additional progress data
    worksheet.columns = [
      { header: 'Roll No', key: 'rollNo', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'GitHub ID', key: 'githubID', width: 15 },
      { header: 'Total Commits', key: 'totalCommits', width: 15 },
      { header: 'Active Repos', key: 'activeRepos', width: 15 },
      { header: 'LeetCode ID', key: 'leetCodeID', width: 15 },
      { header: 'Problems Solved', key: 'problemsSolved', width: 15 },
      // New progress columns
      { header: 'Current Streak', key: 'currentStreak', width: 15 },
      { header: 'Longest Streak', key: 'longestStreak', width: 15 },
      { header: 'Active Days (30d)', key: 'activeDays', width: 15 },
      { header: 'Weekly Average', key: 'weeklyAverage', width: 15 },
      { header: 'Coding Progress', key: 'codingProgress', width: 20 },
      { header: 'Career Suggestion', key: 'careerSuggestion', width: 30 }
    ];

    // Add student data rows
    studentsWithProgress.forEach(student => {
      try {
        // Get data from either progressData or fallback to githubData/leetcodeData
        const progressData = student.progress?.progressData?.codingActivity || {};
        const repoData = student.progress?.progressData?.repositories || {};
        const leetcodeData = student.progress?.progressData?.leetcode || {};
        const githubData = student.progress?.githubData || student.githubData || {};
        const studentLeetcode = student.progress?.leetcodeData || student.leetcodeData || {};
        
        worksheet.addRow({
          rollNo: student.rollNo || 'N/A',
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A',
          email: student.email || 'N/A',
          githubID: student.githubID || 'N/A',
          totalCommits: progressData.totalCommits || githubData.totalCommits || 0,
          activeRepos: repoData.active || githubData.activeRepos || githubData.repoCount || 0,
          leetCodeID: student.leetCodeID || 'N/A',
          problemsSolved: leetcodeData.totalSolved || 
                          studentLeetcode?.completeProfile?.solvedProblem || 
                          studentLeetcode?.totalSolved || 0,
          // New progress data
          currentStreak: progressData.currentStreak || 0,
          longestStreak: progressData.longestStreak || 0,
          activeDays: progressData.activeDaysLast30 || 0,
          weeklyAverage: progressData.weeklyAverage || 0,
          codingProgress: student.progress?.codingProgress || 'Not Available',
          careerSuggestion: student.progress?.careerSuggestion || 'Not Available'
        });
      } catch (error) {
        console.error(`Error adding student ${student._id} to Excel:`, error);
        // Add row with minimal data to prevent Excel generation failure
        worksheet.addRow({
          rollNo: student.rollNo || 'N/A',
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A',
          email: student.email || 'N/A',
          githubID: student.githubID || 'N/A',
          totalCommits: 0,
          activeRepos: 0,
          leetCodeID: student.leetCodeID || 'N/A',
          problemsSolved: 0,
          currentStreak: 0,
          longestStreak: 0,
          activeDays: 0,
          weeklyAverage: 0,
          codingProgress: 'Error',
          careerSuggestion: 'Not Available'
        });
      }
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' }
    };
    
    // Add conditional formatting for coding progress
    worksheet.getColumn('codingProgress').eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        switch(cell.value) {
          case 'Very Good':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } }; // Green
            break;
          case 'Good':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // Light green
            break;
          case 'Average':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } }; // Yellow
            break;
          case 'Needs Improvement':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9900' } }; // Orange
            break;
          case 'Not Started':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; // Red
            break;
          case 'Error':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }; // Light gray
            break;
        }
      }
    });

    // Add summary section at the bottom
    const lastRow = worksheet.lastRow.number;
    worksheet.addRow([]); // Empty row for spacing
    
    // Add class summary
    const summaryRow = worksheet.addRow(['Class Summary']);
    summaryRow.font = { bold: true, size: 14 };
    worksheet.mergeCells(`A${lastRow + 2}:N${lastRow + 2}`);
    
    // Calculate class averages
    const activeStudents = studentsWithProgress.filter(s => s.githubID);
    const totalStudents = studentsWithProgress.length;
    const studentsWithGitHub = activeStudents.length;
    
    // Calculate average commits using either progressData or githubData
    const avgCommits = activeStudents.reduce((sum, s) => {
      try {
        const commits = s.progress?.progressData?.codingActivity?.totalCommits || 
                       s.progress?.githubData?.totalCommits || 
                       s.githubData?.totalCommits || 0;
        return sum + commits;
      } catch (error) {
        return sum;
      }
    }, 0) / (studentsWithGitHub || 1);
    
    // Calculate average active days
    const avgActiveDays = activeStudents.reduce((sum, s) => {
      try {
        const activeDays = s.progress?.progressData?.codingActivity?.activeDaysLast30 || 0;
        return sum + activeDays;
      } catch (error) {
        return sum;
      }
    }, 0) / (studentsWithGitHub || 1);
    
    // Add statistics rows
    worksheet.addRow(['Total Students', totalStudents]);
    worksheet.addRow(['Students with GitHub', studentsWithGitHub]);
    worksheet.addRow(['Average Commits', avgCommits.toFixed(2)]);
    worksheet.addRow(['Average Active Days', avgActiveDays.toFixed(2)]);
    
    // Add progress distribution
    const progressCounts = {
      'Very Good': 0,
      'Good': 0,
      'Average': 0,
      'Needs Improvement': 0,
      'Not Started': 0,
      'Not Available': 0,
      'Error': 0
    };
    
    studentsWithProgress.forEach(s => {
      try {
        const progress = s.progress?.codingProgress || 'Not Available';
        progressCounts[progress] = (progressCounts[progress] || 0) + 1;
      } catch (error) {
        progressCounts['Error'] = (progressCounts['Error'] || 0) + 1;
      }
    });
    
    worksheet.addRow([]); // Empty row
    const distributionRow = worksheet.addRow(['Progress Distribution']);
    distributionRow.font = { bold: true };
    
    Object.entries(progressCounts).forEach(([level, count]) => {
      if (count > 0) { // Only show categories that have students
        worksheet.addRow([level, count, `${((count / totalStudents) * 100).toFixed(2)}%`]);
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Class_${classData.yearOfStudy}_${classData.division}_Progress.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating excel with progress data:', error);
    
    // Try to send a basic error response
    try {
      res.status(500).json({
        success: false,
        message: 'Failed to generate excel file with progress data',
        error: error.message
      });
    } catch (responseError) {
      // If we can't send a JSON response (e.g., headers already sent)
      console.error('Error sending error response:', responseError);
      res.end();
    }
  }
};

export const validateStudentPlatforms = async (req, res) => {
    try {
        const { classId } = req.params;
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                message: "Invalid class ID format",
                success: false
            });
        }

        // Fetch all students in the class
        const students = await User.find({ 
            classId, 
            role: 'student' 
        })
        .select('_id githubID leetCodeID')
        .lean();

        if (!students.length) {
            return res.status(200).json({
                success: true,
                validations: [],
                message: 'No students found in this class'
            });
        }

        // Prepare arrays of IDs to validate
        const githubStudents = students.filter(s => s.githubID);
        const leetcodeStudents = students.filter(s => s.leetCodeID);

        // Rate limiting helper
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const BATCH_SIZE = 5;
        const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay between batches

        // Batch validate GitHub IDs with rate limiting
        const githubValidations = [];
        for (let i = 0; i < githubStudents.length; i += BATCH_SIZE) {
            const batch = githubStudents.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (student) => {
                try {
                    // Check if GitHub data is cached in GithubData collection
                    const githubData = await GithubData.findOne({ userId: student._id });
                    
                    // If we have recent data (less than 24 hours old), use that
                    if (githubData && Date.now() - githubData.lastUpdated < 24 * 60 * 60 * 1000) {
                        return {
                            studentId: student._id,
                            githubValid: githubData.isValid === true,
                            fromCache: true
                        };
                    }
                    
                    // Validate GitHub username format first
                    const githubUsernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
                    if (!githubUsernameRegex.test(student.githubID)) {
                        console.log(`Invalid GitHub username format: ${student.githubID}`);
                        return {
                            studentId: student._id,
                            githubValid: false,
                            fromCache: false,
                            error: 'Invalid GitHub username format'
                        };
                    }
                    
                    // Check GitHub API
                    const response = await githubApi.get(`/users/${student.githubID}`);
                    
                    if (response.status !== 200) {
                        throw new Error(`GitHub API returned status ${response.status}`);
                    }
                    
                    // Verify the response contains expected user data
                    if (!response.data || !response.data.login) {
                        throw new Error('Invalid GitHub API response');
                    }
                    
                    // Create or update GitHub data cache
                    await GithubData.findOneAndUpdate(
                        { userId: student._id },
                        { 
                            userId: student._id,
                            githubId: student.githubID,
                            lastUpdated: Date.now(),
                            data: response.data,
                            isValid: true
                        },
                        { upsert: true }
                    );
                    
                    return {
                        studentId: student._id,
                        githubValid: true,
                        fromCache: false
                    };
                } catch (error) {
                    console.log(`GitHub validation error for ${student.githubID}:`, error.response?.status || error.message);
                    return {
                        studentId: student._id,
                        githubValid: false,
                        fromCache: false,
                        error: error.response?.status === 404 ? 'GitHub account not found' : 'GitHub validation error'
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            githubValidations.push(...batchResults);
            
            // Add delay between batches to respect rate limits
            if (i + BATCH_SIZE < githubStudents.length) {
                await delay(DELAY_BETWEEN_BATCHES);
            }
        }

        // Batch validate LeetCode IDs with rate limiting
        const leetcodeValidations = [];
        for (let i = 0; i < leetcodeStudents.length; i += BATCH_SIZE) {
            const batch = leetcodeStudents.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (student) => {
                try {
                    // Check if LeetCode data is cached
                    const leetcodeData = await LeetCode.findOne({ userId: student._id });
                    
                    // If we have recent data (less than 24 hours old), use that
                    if (leetcodeData && Date.now() - leetcodeData.lastUpdated < 24 * 60 * 60 * 1000) {
                        return {
                            studentId: student._id,
                            leetcodeValid: leetcodeData.isValid === true,
                            fromCache: true
                        };
                    }
                    
                    // Check LeetCode API
                    const data = await leetCodeUserInfo(student.leetCodeID);
                    const isValid = !!data.basicProfile?.username;
                    
                    if (isValid) {
                        // Update LeetCode data cache
                        await LeetCode.findOneAndUpdate(
                            { userId: student._id },
                            { 
                                userId: student._id,
                                leetCodeId: student.leetCodeID,
                                lastUpdated: Date.now(),
                                data: data,
                                isValid: true
                            },
                            { upsert: true }
                        );
                    } else {
                        throw new Error('LeetCode profile not found');
                    }
                    
                    return {
                        studentId: student._id,
                        leetcodeValid: true,
                        fromCache: false
                    };
                } catch (error) {
                    console.log(`LeetCode validation error for ${student.leetCodeID}:`, error.message);
                    return {
                        studentId: student._id,
                        leetcodeValid: false,
                        fromCache: false,
                        error: 'LeetCode profile not found or invalid'
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            leetcodeValidations.push(...batchResults);
            
            // Add delay between batches to respect rate limits
            if (i + BATCH_SIZE < leetcodeStudents.length) {
                await delay(DELAY_BETWEEN_BATCHES);
            }
        }

        // Combine the results
        const validationMap = {};
        
        // Initialize with all students
        students.forEach(student => {
            validationMap[student._id.toString()] = {
                studentId: student._id,
                githubID: student.githubID || null,
                leetCodeID: student.leetCodeID || null,
                githubValid: false,
                leetcodeValid: false,
                errors: {}
            };
        });
        
        // Add GitHub validations
        githubValidations.forEach(validation => {
            const id = validation.studentId.toString();
            if (validationMap[id]) {
                validationMap[id].githubValid = validation.githubValid;
                if (validation.error) {
                    validationMap[id].errors.github = validation.error;
                }
            }
        });
        
        // Add LeetCode validations
        leetcodeValidations.forEach(validation => {
            const id = validation.studentId.toString();
            if (validationMap[id]) {
                validationMap[id].leetcodeValid = validation.leetcodeValid;
                if (validation.error) {
                    validationMap[id].errors.leetcode = validation.error;
                }
            }
        });

        return res.status(200).json({
            success: true,
            validations: Object.values(validationMap)
        });
    } catch (error) {
        console.error('Error validating student platforms:', error);
        res.status(500).json({ 
            message: "Server error", 
            success: false,
            error: error.message 
        });
    }
};