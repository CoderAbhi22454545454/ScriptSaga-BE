import express from 'express';
import { createClass, getClasses, getStudentByClass } from '../controllers/class.controller.js';
import authMiddelware from '../middelwares/auth.js';

const router = express.Router();

router.post('/class', createClass);
router.get('/classes', authMiddelware ,getClasses);
router.get('/classes/:classId/students', authMiddelware ,getStudentByClass)

export default router;
