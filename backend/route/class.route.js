import express from 'express';
import { 
    createClass,  
    getClassById, 
    updateClass, 
    deleteClass,
    getStudentByClass,
    getAllClasses
} from '../controllers/class.controller.js';
import authMiddleware from '../middelwares/auth.js';
const router = express.Router();

// Class CRUD routes
router.post('/create', authMiddleware, createClass);
router.get('/classes', getAllClasses);
router.get('/:classId', getClassById);
router.put('/:classId', authMiddleware, updateClass);
router.delete('/:classId', authMiddleware, deleteClass);

// Student-related routes
router.get('/classes/:classId/students', authMiddleware, getStudentByClass);

export default router;