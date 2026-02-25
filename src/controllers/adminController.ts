import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Doctor from '../models/Doctor';
import Clinic from '../models/Clinic';
import Token from '../models/Token';
import Prescription from '../models/Prescription';
import Consent from '../models/Consent';
import { AuthRequest } from '../middleware/auth';
import { getTodayDate, successResponse, errorResponse } from '../utils/helpers';

// GET /api/admin/pendingDoctors
export const getPendingDoctors = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const docs = await Doctor.find({ status: 'pending' }).populate('userId', 'name mobile email');
        successResponse(res, docs);
    } catch { errorResponse(res, 'Failed to fetch pending doctors'); }
};

// POST /api/admin/approveDoctor/:doctorId
export const approveDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const doc = await Doctor.findByIdAndUpdate(req.params.doctorId, { status: 'approved' }, { new: true });
        if (!doc) { errorResponse(res, 'Doctor not found', 404); return; }
        // Also mark the user as active
        await User.findByIdAndUpdate(doc.userId, { isActive: true });
        successResponse(res, doc, 'Doctor approved');
    } catch { errorResponse(res, 'Failed to approve doctor'); }
};

// POST /api/admin/rejectDoctor/:doctorId
export const rejectDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const doc = await Doctor.findByIdAndUpdate(req.params.doctorId, { status: 'rejected' }, { new: true });
        if (!doc) { errorResponse(res, 'Doctor not found', 404); return; }
        successResponse(res, doc, 'Doctor rejected');
    } catch { errorResponse(res, 'Failed to reject doctor'); }
};

// GET /api/admin/doctors — all approved doctors
export const getDoctors = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const docs = await Doctor.find({ status: 'approved' }).populate('userId', 'name mobile email isActive');
        successResponse(res, docs);
    } catch { errorResponse(res, 'Failed to fetch doctors'); }
};

// GET /api/admin/tokens — all tokens (today by default)
export const getAdminTokens = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const date = (req.query.date as string) || getTodayDate();
        const tokens = await Token.find({ date })
            .populate('clinicId', 'name')
            .populate('doctorId', 'name')
            .sort({ tokenNumber: 1 });
        successResponse(res, tokens);
    } catch { errorResponse(res, 'Failed to fetch tokens'); }
};

// GET /api/admin/clinics
export const getClinics = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clinics = await Clinic.find().sort({ createdAt: -1 });

        // Normalize documents that were inserted manually in Compass
        // with alternative field names (clinic_name, area, city, open_time, etc.)
        const normalized = clinics.map((c: any) => {
            const doc = c.toObject ? c.toObject() : { ...c };
            return {
                ...doc,
                name: doc.name || doc.clinic_name || doc.clinicName || '(no name)',
                address: doc.address || [doc.area, doc.city].filter(Boolean).join(', ') || '(no address)',
                phone: doc.phone || doc.contact || doc.mobile || '—',
                openTime: doc.openTime || doc.open_time || '09:00',
                closeTime: doc.closeTime || doc.close_time || '18:00',
            };
        });

        successResponse(res, normalized);
    } catch { errorResponse(res, 'Failed to fetch clinics'); }
};

// POST /api/admin/clinics
export const createClinic = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clinic = await Clinic.create({ ...req.body, status: 'approved' });
        successResponse(res, clinic, 'Clinic created', 201);
    } catch { errorResponse(res, 'Failed to create clinic'); }
};

// PATCH /api/admin/clinics/:id
export const updateClinicStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clinic = await Clinic.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (!clinic) { errorResponse(res, 'Clinic not found', 404); return; }
        successResponse(res, clinic, `Clinic ${req.body.status}`);
    } catch { errorResponse(res, 'Failed to update clinic'); }
};

// POST /api/admin/users — create doctor/attender
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { mobile, name, role, password, clinicId, specialization, regNumber, email } = req.body;
        if (!['doctor', 'attender'].includes(role)) { errorResponse(res, 'Role must be doctor or attender', 400); return; }
        const exists = await User.findOne({ mobile });
        if (exists) { errorResponse(res, 'Mobile already exists', 409); return; }
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ mobile, name, role, password: hashed, clinicId, specialization, regNumber, email });
        successResponse(res, { id: user._id, name: user.name, role: user.role }, 'User created', 201);
    } catch { errorResponse(res, 'Failed to create user'); }
};

// GET /api/admin/users
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role } = req.query;
        const filter: any = { role: { $in: ['doctor', 'attender'] } };
        if (role) filter.role = role;
        const users = await User.find(filter).select('-password -otp -otpExpiry').populate('clinicId', 'name');
        successResponse(res, users);
    } catch { errorResponse(res, 'Failed to fetch users'); }
};

// DELETE /api/admin/users/:id
export const deactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!user) { errorResponse(res, 'User not found', 404); return; }
        successResponse(res, null, 'User deactivated');
    } catch { errorResponse(res, 'Failed to deactivate user'); }
};

// PATCH /api/admin/users/:id
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { clinicId, name, specialization } = req.body;
        const update: any = {};
        if (clinicId !== undefined) update.clinicId = clinicId || null;
        if (name) update.name = name;
        if (specialization) update.specialization = specialization;
        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
            .select('-password -otp -otpExpiry').populate('clinicId', 'name');
        if (!user) { errorResponse(res, 'User not found', 404); return; }
        successResponse(res, user, 'User updated');
    } catch { errorResponse(res, 'Failed to update user'); }
};

// GET /api/admin/clinics/:id/doctors
export const getClinicDoctors = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const doctors = await User.find({ clinicId: req.params.id, role: 'doctor' }).select('name mobile specialization isActive');
        successResponse(res, doctors);
    } catch { errorResponse(res, 'Failed to fetch clinic doctors'); }
};

// GET /api/admin/metrics
export const getMetrics = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const today = getTodayDate();
        const [totalClinics, approvedClinics, totalDoctors, totalAttenders, totalPatients,
            tokensToday, onlineToday, offlineToday, prescriptionsTotal, consentsPending] = await Promise.all([
                Clinic.countDocuments(),
                Clinic.countDocuments({ status: 'approved' }),
                User.countDocuments({ role: 'doctor' }),
                User.countDocuments({ role: 'attender' }),
                User.countDocuments({ role: 'patient' }),
                Token.countDocuments({ date: today }),
                Token.countDocuments({ date: today, type: 'online' }),
                Token.countDocuments({ date: today, type: 'offline' }),
                Prescription.countDocuments(),
                Consent.countDocuments({ status: 'pending' }),
            ]);
        successResponse(res, {
            clinics: { total: totalClinics, approved: approvedClinics, pending: totalClinics - approvedClinics },
            staff: { doctors: totalDoctors, attenders: totalAttenders },
            patients: totalPatients,
            todaysTokens: { total: tokensToday, online: onlineToday, offline: offlineToday },
            prescriptionsTotal,
            consentsPending,
        });
    } catch { errorResponse(res, 'Failed to fetch metrics'); }
};
