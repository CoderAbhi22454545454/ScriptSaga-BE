import express from 'express';
import { 
    createUser, 
    loginUser, 
    logout, 
    checkAuth, 
    getUserById, 
    searchUser, 
    createStudent, 
    updateStudent, 
    deleteStudent, 
    getAllStudents ,
    getStudentMetrics,
    updateProfile
} from '../controllers/user.controller.js';
import authMiddelware from '../middelwares/auth.js';

const router = express.Router();

// Auth routes
router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.get("/check-auth", checkAuth);

// Student management routes (specific routes before parameter routes)
router.get('/all-students', getAllStudents);
router.post('/create-student', createStudent);
router.put('/update-student/:id', updateStudent);
router.delete('/delete-student/:id', deleteStudent);
router.get('/student-metrics', getStudentMetrics);
router.put('/update-profile/:id', updateProfile);
// Search route
router.get('/search', authMiddelware, searchUser);

// Parameter routes should come last
router.get('/:userId',  getUserById);

export default router;