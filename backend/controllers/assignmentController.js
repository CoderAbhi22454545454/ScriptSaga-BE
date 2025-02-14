import { Assignment } from '../models/Assignment.model.js';
import { Class } from '../models/class.model.js';
import { User } from '../models/user.model.js';
import GitHubService from '../utils/githubService.js';

export const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, points, templateRepo, repoName, classId } = req.body;
    const teacherId = req.user._id;

    // Get teacher's GitHub credentials
    const teacher = await User.findById(teacherId);

    // Get all students in the class
    const classData = await Class.findById(classId).populate({
      path: 'students',
      model: 'User'
    });
    
    // Create assignment
    const assignment = new Assignment({
      title,
      description,
      dueDate,
      points,
      classId,
      teacherId,
      templateRepo,
      repoName,
      studentRepos: []
    });

    // Create repositories for each student
    for (const student of classData.students) {
      const studentRepoName = `${repoName}-${student.rollNo}`;
      const repoUrl = await GitHubService.createRepoFromTemplate(
        templateRepo,
        studentRepoName,
        process.env.GITHUB_ORG
      );

      // Add student as collaborator
      await GitHubService.addCollaborator(studentRepoName, student.githubID);

      assignment.studentRepos.push({
        studentId: student._id,
        repoUrl
      });
    }

    await assignment.save();

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getClassAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    const assignments = await Assignment.find({ classId })
      .populate('teacherId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacherId', 'firstName lastName')
      .populate('studentRepos.studentId', 'firstName lastName rollNo githubID');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};