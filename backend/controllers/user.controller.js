import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Class } from '../models/class.model.js';
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
      message: `Welcome back ${responseUser.firstName}`,
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
    const userId = req.params.userId;
    const user = await User.findById(userId).select('-password');

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID format",
        success: false,
      });
    }

    if (!user) {
      return res.status(400).json({
        message: "User Not found",
        success: false
      })
    }

    return res.status(200).json({
      user,
      success: true
    })

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', success: false });

  }
}


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