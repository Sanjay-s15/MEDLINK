import { Router } from 'express';
import { doctorRegister, staffLogin, sendOtp, verifyOtp, getDevOtp } from '../controllers/authController';

const router = Router();

// Doctor self-registration (awaits admin approval)
router.post('/doctor-register', doctorRegister);

// Staff + admin login (password-based)
router.post('/login', staffLogin);
router.post('/staff-login', staffLogin); // alias kept for frontend compatibility

// Patient OTP login
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Dev helper — retrieve OTP without SMS
router.get('/dev/otp/:mobile', getDevOtp);

export default router;
