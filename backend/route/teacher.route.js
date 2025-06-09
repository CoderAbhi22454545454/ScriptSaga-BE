import express from 'express';
import { createTeacher, addTeacherFeedback, getTeacherStats } from '../controllers/teacher.controller.js';
import authMiddelware from '../middelwares/auth.js';

const router = express.Router();

router.post('/create', createTeacher);
router.post('/feedback',  addTeacherFeedback);
router.get('/:teacherId/stats', authMiddelware, getTeacherStats);

export default router;