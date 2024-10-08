import express from 'express';
import { createUser, loginUser, logout, checkAuth, getUserById, searchUser } from '../controllers/user.controller.js';
import authMiddelware from '../middelwares/auth.js';
import { getAllClasses } from '../controllers/class.controller.js';

const router = express.Router();

router.route("/register").post(createUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logout);
router.route("/check-auth").get(checkAuth);
// router.route("/Clasesssss").get(getAllClasses);
// Route for searches
router.get('/search', authMiddelware, searchUser)
router.get('/:userId', authMiddelware, getUserById);



export default router;
