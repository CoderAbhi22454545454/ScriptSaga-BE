import express from 'express';
import { 
    createClass,  
    getClassById, 
    updateClass, 
    deleteClass,
    getStudentByClass,
    getAllClasses,
    downloadClassData
} from '../controllers/class.controller.js';
import authMiddleware from '../middelwares/auth.js';
const router = express.Router();

// Class CRUD routes
router.post('/create', authMiddleware, createClass);
router.get('/classes', getAllClasses);
router.get('/:classId', getClassById);
router.put('/:classId', authMiddleware, updateClass);
router.delete('/:classId', authMiddleware, deleteClass);

router.get('/:classId/excel', downloadClassData);

// Student-related routes
router.get('/classes/:classId/students', getStudentByClass);

export default router;