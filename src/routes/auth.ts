import { Router } from 'express';
import { signup, login, getMe, logout, firebaseLogin, updateDoctorProfile, updateHospitalProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);
router.post('/firebase-login', authRateLimiter, firebaseLogin);

// Authenticated session validation
router.get('/me', authenticate, getMe);
router.post('/doctor-profile', authenticate, updateDoctorProfile);
router.post('/hospital-profile', authenticate, updateHospitalProfile);
router.post('/logout', logout);

export default router;
