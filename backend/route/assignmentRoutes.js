import express from 'express';
import authMiddleware from '../middelwares/auth.js';

import { 
  createAssignment, 
  getClassAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment 
} from '../controllers/assignmentController.js';

const router = express.Router();

router.post('/create', authMiddleware, createAssignment);
router.get('/:classId', authMiddleware, getClassAssignments);
router.get('/:id', authMiddleware, getAssignment);
router.put('/:id', authMiddleware, updateAssignment);
router.delete('/:id', authMiddleware, deleteAssignment);

export default router;