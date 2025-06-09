import express from 'express';
import authMiddelware from '../middelwares/auth.js';

import { 
  createAssignment, 
  getClassAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  getStudentAssignments,
  submitAssignment,
  getAllAssignments,
  fixExistingAssignments
} from '../controllers/assignmentController.js';

const router = express.Router();

// Specific routes first (to avoid conflicts with parameterized routes)
router.post('/create', createAssignment);
router.post('/submit', submitAssignment);
router.get('/all', getAllAssignments);
router.get('/fix-existing', fixExistingAssignments);
router.get('/student/:studentId', getStudentAssignments);
router.get('/assignment/:id', getAssignment);

// Parameterized routes last
router.get('/:classId', getClassAssignments);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

export default router;