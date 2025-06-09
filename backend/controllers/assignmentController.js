import { Assignment } from '../models/Assignment.model.js';
import { Class } from '../models/class.model.js';
import { User } from '../models/user.model.js';
import GitHubService from '../utils/githubService.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to ensure student repo entry exists
const ensureStudentRepoEntry = async (assignment, studentId) => {
  let studentRepoIndex = assignment.studentRepos.findIndex(
    repo => repo.studentId.toString() === studentId
  );
  
  if (studentRepoIndex === -1) {
    console.log(`Creating new student repo entry for studentId: ${studentId}`);
    
    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    
    // Add new student repo entry
    assignment.studentRepos.push({
      studentId: studentId,
      submitted: false,
      repoUrl: '',
      submissionDate: null
    });
    
    studentRepoIndex = assignment.studentRepos.length - 1;
  }
  
  return studentRepoIndex;
};

export const createAssignment = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const { title, description, dueDate, points, repoUrl, classId, teacherId } = req.body;
    
    console.log('Teacher ID from request body:', teacherId);

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required'
      });
    }

    // Get all students in the class
    const classData = await Class.findById(classId).populate({
      path: 'students',
      model: 'User'
    });
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Create assignment
    const assignment = new Assignment({
      title,
      description,
      dueDate,
      points,
      classId,
      teacherId,
      repoUrl,
      studentRepos: []
    });

    // Add entry for each student, ensuring they exist and are valid
    if (classData.students && classData.students.length > 0) {
      for (const student of classData.students) {
        if (student && student._id) {
          assignment.studentRepos.push({
            studentId: student._id,
            submitted: false,
            repoUrl: '',
            submissionDate: null
          });
        }
      }
    }

    await assignment.save();

    console.log(`Assignment created with ${assignment.studentRepos.length} student entries`);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getClassAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    console.log('Fetching assignments for class:', classId);
    
    const assignments = await Assignment.find({ classId })
      .populate('teacherId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    console.log('Found assignments:', assignments.length);
    
    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error in getClassAssignments:', error);
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

export const getStudentAssignments = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('Fetching assignments for student ID:', studentId);
    
    // First, get the student to find their class
    const student = await User.findById(studentId);
    if (!student) {
      console.log('Student not found with ID:', studentId);
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    console.log('Found student:', { 
      id: student._id, 
      name: `${student.firstName} ${student.lastName}`,
      classId: student.classId,
      classIdType: Array.isArray(student.classId) ? 'array' : typeof student.classId
    });
    
    // Get the student's class ID - handle both array and single value
    let classId = student.classId;
    if (Array.isArray(classId)) {
      classId = classId[0]; // Take the first class if it's an array
    }
    
    console.log('Using classId for assignment lookup:', classId);
    
    if (!classId) {
      console.log('No classId found for student');
      return res.json({
        success: true,
        assignments: []
      });
    }
    
    // Find all assignments for the student's class
    const assignments = await Assignment.find({
      classId: classId
    })
    .populate('classId', 'name')
    .populate('teacherId', 'firstName lastName')
    .populate('studentRepos.studentId', 'firstName lastName rollNo')
    .sort({ dueDate: 1 });
    
    console.log(`Found ${assignments.length} assignments for classId:`, classId);
    
    // Process assignments to add student repo info if it doesn't exist
    const processedAssignments = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      
      // Check if student already has a repo entry
      const existingRepo = assignmentObj.studentRepos?.find(
        repo => repo.studentId._id.toString() === studentId
      );
      
      console.log(`Assignment ${assignment.title}: existing repo for student:`, !!existingRepo);
      
      // If not, add a placeholder entry
      if (!existingRepo) {
        if (!assignmentObj.studentRepos) {
          assignmentObj.studentRepos = [];
        }
        
        assignmentObj.studentRepos.push({
          studentId: {
            _id: studentId,
            firstName: student.firstName,
            lastName: student.lastName,
            rollNo: student.rollNo
          },
          submitted: false,
          repoUrl: '',
          submissionDate: null
        });
      }
      
      return assignmentObj;
    });
    
    console.log('Returning processed assignments:', processedAssignments.length);
    
    res.json({
      success: true,
      assignments: processedAssignments
    });
  } catch (error) {
    console.error('Error in getStudentAssignments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, studentId, solutionUrl } = req.body;
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Ensure student repo entry exists
    const studentRepoIndex = await ensureStudentRepoEntry(assignment, studentId);
    
    // Update the submission status
    assignment.studentRepos[studentRepoIndex].submitted = true;
    assignment.studentRepos[studentRepoIndex].submissionDate = new Date();
    
    // Add solution URL if provided
    if (solutionUrl) {
      assignment.studentRepos[studentRepoIndex].repoUrl = solutionUrl;
    }
    
    await assignment.save();
    
    res.json({
      success: true,
      message: 'Assignment marked as submitted'
    });
  } catch (error) {
    console.error('Error in submitAssignment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('classId', 'name')
      .populate('teacherId', 'firstName lastName')
      .populate('studentRepos.studentId', 'firstName lastName rollNo')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error in getAllAssignments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};