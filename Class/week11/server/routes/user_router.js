// routes/userRouter.js
import express from 'express';
import userController from '../controllers/user_controller.js'; // Import the userController
const router = express.Router();

// Register route
router.post('/register', userController.registerUser);

// Login route
router.post('/login', userController.loginUser);

// Logout route
router.get('/logout', userController.logoutUser);

export default router;
