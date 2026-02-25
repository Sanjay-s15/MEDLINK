import { Response } from 'express';
import Token from '../models/Token';
import User from '../models/User';
import Patient from '../models/Patient';
import { AuthRequest } from '../middleware/auth';
import { getTodayDate, successResponse, errorResponse } from '../utils/helpers';

// POST /api/attender/registerPatient
export const registerPatient = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, phoneNumber, age, gender, address } = req.body;
        if (!name || !phoneNumber || !age || !gender) { errorResponse(res, 'name, phoneNumber, age, gender required', 400); return; }

        let patient = await Patient.findOne({ phoneNumber });
        if (patient) { successResponse(res, patient, 'Patient already registered'); return; }

        patient = await Patient.create({ name, phoneNumber, age, gender, address });

        // Also ensure a User record exists for this patient (for token system)
        let userRecord = await User.findOne({ mobile: phoneNumber, role: 'patient' });
        if (!userRecord) {
            userRecord = await User.create({ mobile: phoneNumber, name, role: 'patient' });
        }

        successResponse(res, { patient, userId: userRecord._id }, 'Patient registered', 201);
    } catch (err: any) {
        if (err.code === 11000) { errorResponse(res, 'Phone number already registered', 409); return; }
        errorResponse(res, 'Failed to register patient');
    }
};

// GET /api/attender/patient/:phone
export const getPatientByPhone = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const patient = await Patient.findOne({ phoneNumber: req.params.phone });
        if (!patient) { errorResponse(res, 'Patient not found', 404); return; }
        const tokens = await Token.find({ patientMobile: req.params.phone, clinicId: req.user!.clinicId })
            .sort({ date: -1 }).limit(10);
        successResponse(res, { patient, recentTokens: tokens });
    } catch { errorResponse(res, 'Failed to fetch patient'); }
};

// POST /api/attender/createToken
export const createToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { mobile, name, doctorId, reason } = req.body;
        const attender = req.user!;
        const today = getTodayDate();
        if (!mobile) { errorResponse(res, 'Patient mobile required', 400); return; }

        let patient = await User.findOne({ mobile, role: 'patient' });
        if (!patient) { patient = await User.create({ mobile, name: name || 'Walk-in Patient', role: 'patient' }); }

        const existing = await Token.findOne({ clinicId: attender.clinicId, patientId: patient._id, date: today, status: { $in: ['waiting', 'in_consultation'] } });
        if (existing) { errorResponse(res, 'Patient already has an active token today', 409); return; }

        const last = await Token.findOne({ clinicId: attender.clinicId, date: today }).sort({ tokenNumber: -1 });
        const tokenNumber = (last?.tokenNumber || 0) + 1;

        const token = await Token.create({
            tokenNumber, clinicId: attender.clinicId, doctorId: doctorId || undefined,
            patientId: patient._id, patientMobile: mobile, patientName: patient.name,
            type: 'offline', status: 'waiting', date: today, reason,
        });
        successResponse(res, { token, patient: { id: patient._id, name: patient.name, mobile: patient.mobile } }, `Token #${tokenNumber} created`, 201);
    } catch { errorResponse(res, 'Failed to create token'); }
};

// GET /api/attender/queue
export const getQueue = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const today = getTodayDate();
        const queue = await Token.find({ clinicId: req.user!.clinicId, date: today, status: { $ne: 'cancelled' } }).sort({ tokenNumber: 1 });
        successResponse(res, queue, 'Queue fetched');
    } catch { errorResponse(res, 'Failed to fetch queue'); }
};

// PATCH /api/attender/tokens/:id/status
export const updateTokenStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        const allowed = ['waiting', 'in_consultation', 'completed', 'cancelled'];
        if (!allowed.includes(status)) { errorResponse(res, 'Invalid status', 400); return; }
        const token = await Token.findOneAndUpdate({ _id: req.params.id, clinicId: req.user!.clinicId }, { status }, { new: true });
        if (!token) { errorResponse(res, 'Token not found', 404); return; }
        successResponse(res, token, 'Token status updated');
    } catch { errorResponse(res, 'Failed to update token'); }
};
