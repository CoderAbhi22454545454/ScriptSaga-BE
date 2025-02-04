import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Class } from '../models/class.model.js';
import { GithubData } from '../models/githubData.model.js';
import { LeetCode } from '../models/leetcode.model.js';
import mongoose from 'mongoose';

// Create a user (admin or student)
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, githubID, leetCodeID, email, password, rollNo, classId, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Please enter all required fields',
        success: false,
      });
    }

    if (role === 'student') {
      if (!firstName || !lastName || !githubID || !rollNo || !classId) {
        return res.status(400).json({
          message: 'Please enter all required fields for student',
          success: false,
        });
      }

      const classExists = await Class.findById(classId);
      if (!classExists) {
        return res.status(400).json({
          message: 'Class does not exist',
          success: false,
        });
      }

      const student = await User.findOne({ email });
      if (student) {
        return res.status(400).json({
          message: 'Student already exists with this email',
          success: false,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        firstName,
        lastName,
        githubID,
        leetCodeID,
        email,
        password: hashedPassword,
        rollNo,
        classId,
        role
      });

      return res.status(200).json({
        message: 'Student created successfully',
        success: true,
      });
    } else if (role === 'admin') {
      const admin = await User.findOne({ email });
      if (admin) {
        return res.status(400).json({
          message: 'Admin already exists with this email',
          success: false,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
      });

      return res.status(200).json({
        message: 'Admin created successfully',
        success: true,
      });
    } else {
      return res.status(400).json({
        message: 'Invalid role',
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', success: false });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please enter all required fields',
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'Incorrect email or password',
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: 'Incorrect password',
        success: false,
      });
    }

    const tokenData = {
      userId: user._id,
      role: user.role,
    };

    const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '30d' });

    const responseUser = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    return res.status(200).cookie('token', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      httpOnly: true,
      sameSite: 'strict',
    }).json({
      message: `Welcome back ${user.firstName} 🤠`,
      user: responseUser,
      success: true,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', success: false });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).cookie('token', '', { maxAge: 0 }).json({
      message: 'Logout successfully',
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', success: false });
  }
};


export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated', success: false });
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    return res.status(200).json({ message: 'Authenticated', success: true });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', success: false });
  }
};


export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('-password')
      .populate('classId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get GitHub repos data if available
    let repos = [];
    if (user.githubID) {
      const githubData = await GithubData.findOne({ userId: user._id });
      if (githubData) {
        repos = githubData.repos;
      }
    }

    // Get LeetCode data if available
    let leetcodeProfile = null;
    if (user.leetCodeID) {
      leetcodeProfile = await LeetCode.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        repos,
        leetcodeProfile
      }
    });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

export const searchUser = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        message: "Search Query is required",
        success: false,
      });
    }

    // Trim and split the query into individual words
    const searchWords = query.trim().split(/\s+/);

    // Create a regex for each word
    const searchRegexes = searchWords.map(word => new RegExp(word, 'i'));

    // Find users that match any combination of the first name, last name, or email
    const users = await User.find({
      $or: [
        { $and: searchRegexes.map(regex => ({ firstName: { $regex: regex } })) },
        { $and: searchRegexes.map(regex => ({ lastName: { $regex: regex } })) },
        { $and: searchRegexes.map(regex => ({ email: { $regex: regex } })) },
      ],
      role: { $ne: 'admin' }, // Exclude users with the role 'admin'
    }).select('-password');

    if (users.length === 0) {
      return res.status(200).json({
        users: [],
        message: "No users found",
        success: true,
      });
    }

    return res.status(200).json({
      users,
      success: true,
    });
  } catch (error) {
    console.error('Error searching user:', error);
    res.status(500).json({ message: 'Server error', success: false });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, rollNo, classId, githubID, leetCodeID } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Create new student with default password
    const student = new User({
      firstName,
      lastName,
      email,
      rollNo,
      classId,
      githubID,
      leetCodeID,
      role: 'student',
      password: 'defaultPassword123'
    });

    await student.save();
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating student',
      error: error.message
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, rollNo, classId, githubID, leetCodeID } = req.body;
    const studentId = req.params.id;

    const updatedStudent = await User.findByIdAndUpdate(
      studentId,
      { firstName, lastName, email, rollNo, classId, githubID, leetCodeID },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    await User.findByIdAndDelete(studentId);
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('classId');
    
    res.json({
      success: true,
      students,
      message: 'Students fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

export const getStudentMetrics = async (req, res) => {
  try {
    // Basic counts remain the same
    const totalStudents = await User.countDocuments({ role: 'student' });
    const githubActiveStudents = await User.countDocuments({
      role: 'student',
      githubID: { $exists: true, $ne: '' }
    });
    const leetcodeActiveStudents = await User.countDocuments({
      role: 'student',
      leetCodeID: { $exists: true, $ne: '' }
    });

    // Get top LeetCode performers
    const topLeetCodeStudents = await User.aggregate([
      { 
        $match: { 
          role: 'student',
          leetCodeID: { $exists: true, $ne: '' }
        }
      },
      {
        $lookup: {
          from: 'leetcodes',
          localField: '_id',
          foreignField: 'userId',
          as: 'leetcode'
        }
      },
      {
        $unwind: {
          path: '$leetcode',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { 'leetcode.completeProfile.solvedProblem': -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          problemsSolved: '$leetcode.completeProfile.solvedProblem'
        }
      }
    ]);

    // Get top GitHub contributors
    const topGitHubStudents = await User.aggregate([
      {
        $match: {
          role: 'student',
          githubID: { $exists: true, $ne: '' }
        }
      },
      {
        $lookup: {
          from: 'studentrepos',  // Update this to match your collection name
          localField: '_id',
          foreignField: 'userId',
          as: 'repos'
        }
      },
      {
        $addFields: {
          totalCommits: {
            $sum: {
              $map: {
                input: '$repos',
                as: 'repo',
                in: { $size: { $ifNull: ['$$repo.commits', []] } }
              }
            }
          }
        }
      },
      {
        $sort: { totalCommits: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          totalCommits: 1
        }
      }
    ]);

    res.json({
      success: true,
      metrics: {
        totalStudents,
        githubActiveStudents,
        leetcodeActiveStudents,
        topLeetCodeStudents,
        topGitHubStudents,
        platformEngagement: {
          github: (githubActiveStudents / totalStudents * 100).toFixed(1),
          leetcode: (leetcodeActiveStudents / totalStudents * 100).toFixed(1)
        }
      }
    });
  } catch (error) {
    console.error('Metrics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student metrics',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove any fields that shouldn't be updated
    delete updates.password;
    delete updates.role;
    delete updates.classId;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};