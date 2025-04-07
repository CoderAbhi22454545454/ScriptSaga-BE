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
  getAllAssignments
} from '../controllers/assignmentController.js';

const router = express.Router();

router.post('/create', authMiddelware, createAssignment);
router.get('/assignment/:id', getAssignment);
router.get('/:classId', getClassAssignments);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);
router.get('/student/:studentId', getStudentAssignments);
router.post('/submit', submitAssignment);
router.get('/all', getAllAssignments);

export default router;