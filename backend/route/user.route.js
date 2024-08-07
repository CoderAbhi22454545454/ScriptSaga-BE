import express from 'express';
import { createUser, loginUser, logout, checkAuth, getUserById } from '../controllers/user.controller.js';
import authMiddelware from '../middelwares/auth.js';

const router = express.Router();

router.route("/register").post(createUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logout);
router.route("/check-auth").get(checkAuth);
router.get('/:userId', authMiddelware, getUserById);


export default router;
