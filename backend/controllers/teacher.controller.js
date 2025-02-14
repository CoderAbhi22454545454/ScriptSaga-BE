import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const createTeacher = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      classIds,
      githubUsername,
    } = req.body;

    // Validate all required fields
    if (!firstName || !lastName || !email || !password || !classIds || !githubUsername) {
      return res.status(400).json({
        success: false,
        message: 'Please enter all required fields'
      });
    }

      await octokit.rest.users.getAuthenticated();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub credentials'
      });
    }

    const existingTeacher = await User.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'teacher',
      classId: classIds,
      githubUsername,
      // Explicitly set rollNo to undefined to avoid schema conflicts
      rollNo: undefined
    });

    await teacher.save();

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      teacher: {
        _id: teacher._id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        classId: teacher.classId,
        githubUsername: teacher.githubUsername
      }
    });
   
    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      teacher: teacher
    });


};

export const addTeacherFeedback = async (req, res) => {
  try {
    const { studentId, message } = req.body;
    const teacherId = req.user._id;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.notifications.push({
      message,
      from: teacherId
    });

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Feedback sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending feedback',
      error: error.message
    });
  }
}; 