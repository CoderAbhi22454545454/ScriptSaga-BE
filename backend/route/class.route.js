import express from 'express';
import { createClass, getAllClasses, getClaaById,  getStudentByClass } from '../controllers/class.controller.js';
import authMiddelware from '../middelwares/auth.js';

const router = express.Router();

router.post('/class', createClass);
router.get("/classes" , getAllClasses);
router.get('/:classId', getClaaById);
router.get('/classes/:classId/students', authMiddelware, getStudentByClass)
// router.get('/Clasesssss', getAllClasses);

export default router;
