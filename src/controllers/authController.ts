import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Doctor from '../models/Doctor';
import { ENV } from '../config/env';
import { generateOTP, getOTPExpiry, isOTPValid } from '../utils/otp';
import { successResponse, errorResponse } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';

const signToken = (userId: string, role: string) =>
    jwt.sign({ userId, role }, ENV.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/doctor-register
export const doctorRegister = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile, name, email, password, doctorName, clinicName, clinicAddress, licenseNumber, specialization } = req.body;

        if (!mobile || !password || !doctorName || !clinicName || !clinicAddress || !licenseNumber || !specialization) {
            errorResponse(res, 'All fields are required', 400); return;
        }

        const exists = await User.findOne({ mobile });
        if (exists) { errorResponse(res, 'Mobile already registered', 409); return; }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ mobile, name: name || doctorName, email, password: hashed, role: 'doctor' });

        await Doctor.create({ userId: user._id, doctorName, clinicName, clinicAddress, licenseNumber, specialization, status: 'pending' });

        successResponse(res, { userId: user._id, status: 'pending' }, 'Doctor registration submitted. Awaiting admin approval.', 201);
    } catch (err: any) {
        if (err.code === 11000) { errorResponse(res, 'Mobile or license number already exists', 409); return; }
        errorResponse(res, 'Registration failed');
    }
};

// POST /api/auth/login  (staff: doctor/attender/admin)
export const staffLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile, password } = req.body;
        const user = await User.findOne({ mobile });
        if (!user || !user.password) { errorResponse(res, 'Invalid credentials', 401); return; }
        if (!user.isActive) { errorResponse(res, 'Account is deactivated', 403); return; }

        // Doctors who self-registered via /auth/doctor-register go through approval.
        // Doctors provisioned directly by admin have no Doctor record → skip check.
        if (user.role === 'doctor') {
            const doc = await Doctor.findOne({ userId: user._id });
            if (doc && doc.status !== 'approved') {
                errorResponse(res, 'Doctor account pending admin approval', 403); return;
            }
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) { errorResponse(res, 'Invalid credentials', 401); return; }

        const token = signToken(user._id.toString(), user.role);
        successResponse(res, {
            token,
            user: { id: user._id, name: user.name, role: user.role, mobile: user.mobile },
        }, 'Login successful');
    } catch {
        errorResponse(res, 'Login failed');
    }
};

// POST /api/auth/send-otp  (patient OTP login)
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile, name } = req.body;
        if (!mobile) { errorResponse(res, 'Mobile number required', 400); return; }

        let user = await User.findOne({ mobile });
        if (!user) {
            user = await User.create({ mobile, name: name || 'Patient', role: 'patient' });
        }

        const otp = generateOTP();
        const otpExpiry = getOTPExpiry();
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        successResponse(res, { devOtp: otp }, 'OTP sent successfully');
    } catch {
        errorResponse(res, 'Failed to send OTP');
    }
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile, otp } = req.body;
        const user = await User.findOne({ mobile });
        if (!user || !user.otp || !user.otpExpiry) { errorResponse(res, 'OTP not requested', 400); return; }
        if (!isOTPValid(otp, user.otp, user.otpExpiry)) { errorResponse(res, 'Invalid or expired OTP', 400); return; }

        user.otp = undefined; user.otpExpiry = undefined;
        await user.save();

        const token = signToken(user._id.toString(), user.role);
        successResponse(res, {
            token,
            user: { id: user._id, name: user.name, role: user.role, mobile: user.mobile },
        }, 'Login successful');
    } catch {
        errorResponse(res, 'OTP verification failed');
    }
};

// GET /api/auth/dev/otp/:mobile
export const getDevOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findOne({ mobile: req.params.mobile });
        if (!user?.otp) { errorResponse(res, 'No OTP found', 404); return; }
        successResponse(res, { otp: user.otp }, 'Dev OTP');
    } catch {
        errorResponse(res, 'Failed to get OTP');
    }
};
