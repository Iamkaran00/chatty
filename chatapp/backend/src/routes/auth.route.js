import express from 'express';
import { protectedRoute } from '../middlewares/auth.middleware.js';
const router = express.Router();
 
import { signup,login,logout, updateProfile,checkAuth } from '../controllers/auth.controller.js';
router.post('/signup',signup );
router.post('/login', login);
router.post('/logout',protectedRoute, logout);
router.put("/update-profile",protectedRoute,updateProfile);
router.get('/checkUser',protectedRoute,checkAuth)

export default router;