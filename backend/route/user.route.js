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
    updateProfile,
    createTeacher,
    getTeachers,
    updateTeacher,
    deleteTeacher,
    getStudentsByClass,
    forgotPassword,
    resetPassword,
    updateUserGithubId,
    getUserNotifications
} from '../controllers/user.controller.js';
import { bulkUploadStudentsJSON } from '../controllers/admin.controller.js';
import authMiddelware from '../middelwares/auth.js';

const router = express.Router();

// Auth routes
router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.get("/check-auth", authMiddelware, checkAuth);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Student management routes (specific routes before parameter routes)
router.get('/all-students', getAllStudents);
router.post('/create-student', createStudent);
router.put('/update-student/:id', updateStudent);
router.delete('/delete-student/:id', deleteStudent);
router.get('/student-metrics', getStudentMetrics);

// Search route
router.get('/search', authMiddelware, searchUser);

// Teacher management routes
router.post('/create-teacher', createTeacher);
router.get('/teachers', getTeachers);
router.put('/update-teacher/:id', updateTeacher);
router.delete('/delete-teacher/:id', deleteTeacher);

// Profile update routes
router.put('/update-profile/:id', updateProfile);
router.put('/:userId/github', updateUserGithubId);

// Notifications route
router.get('/notifications/:userId', getUserNotifications);

// Parameter routes should come last
router.get('/:userId',  getUserById);
router.get('/class/:classId/students', getStudentsByClass);

// Admin bulk upload routes
router.post('/bulk-upload-students-json',  bulkUploadStudentsJSON);

export default router;