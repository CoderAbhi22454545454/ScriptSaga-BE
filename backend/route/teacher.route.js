import express from 'express';
import { createTeacher, addTeacherFeedback } from '../controllers/teacher.controller.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.post('/create', authMiddleware, createTeacher);
router.post('/feedback', authMiddleware, addTeacherFeedback);

export default router;