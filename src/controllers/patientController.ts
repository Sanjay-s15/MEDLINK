import { Response } from 'express';
import Token from '../models/Token';
import Clinic from '../models/Clinic';
import User from '../models/User';
import Prescription from '../models/Prescription';
import Consent from '../models/Consent';
import { AuthRequest } from '../middleware/auth';
import { getTodayDate, getDistance, successResponse, errorResponse } from '../utils/helpers';

// GET /api/patient/clinics
export const getClinics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lat, lng } = req.query;
        const clinics = await Clinic.find({ status: 'approved' });
        let result: any[] = clinics.map(c => c.toObject());

        if (lat && lng) {
            const uLat = parseFloat(lat as string), uLng = parseFloat(lng as string);
            result = result
                .map(c => ({ ...c, distance: parseFloat(getDistance(uLat, uLng, c.latitude, c.longitude).toFixed(1)) }))
                .sort((a, b) => a.distance - b.distance);
        }

        const today = getTodayDate();
        const enriched = await Promise.all(result.map(async (c: any) => {
            const [queueCount, doctors] = await Promise.all([
                Token.countDocuments({ clinicId: c._id, date: today, status: { $in: ['waiting', 'in_consultation'] } }),
                User.find({ clinicId: c._id, role: 'doctor', isActive: true }).select('name specialization'),
            ]);
            return { ...c, queueCount, doctors };
        }));
        successResponse(res, enriched, 'Clinics fetched');
    } catch { errorResponse(res, 'Failed to fetch clinics'); }
};

// POST /api/patient/appointments
export const bookAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { clinicId, doctorId, reason } = req.body;
        const patient = req.user!;
        const today = getTodayDate();

        const clinic = await Clinic.findOne({ _id: clinicId, status: 'approved' });
        if (!clinic) { errorResponse(res, 'Clinic not found or not approved', 404); return; }

        const existing = await Token.findOne({ clinicId, patientId: patient._id, date: today, status: { $in: ['waiting', 'in_consultation'] } });
        if (existing) { errorResponse(res, 'You already have an active token at this clinic today', 409); return; }

        const last = await Token.findOne({ clinicId, date: today }).sort({ tokenNumber: -1 });
        const tokenNumber = (last?.tokenNumber || 0) + 1;

        const token = await Token.create({
            tokenNumber, clinicId, doctorId: doctorId || undefined,
            patientId: patient._id, patientMobile: patient.mobile, patientName: patient.name,
            type: 'online', status: 'waiting', date: today, reason,
        });
        successResponse(res, { token, queuePosition: tokenNumber }, 'Appointment booked', 201);
    } catch { errorResponse(res, 'Failed to book appointment'); }
};

// DELETE /api/patient/appointments/:id
export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const t = await Token.findOne({ _id: req.params.id, patientId: req.user!._id });
        if (!t) { errorResponse(res, 'Appointment not found', 404); return; }
        if (t.status !== 'waiting') { errorResponse(res, `Cannot cancel — appointment is ${t.status}`, 400); return; }
        t.status = 'cancelled'; await t.save();
        successResponse(res, null, 'Appointment cancelled');
    } catch { errorResponse(res, 'Failed to cancel appointment'); }
};

// GET /api/patient/appointments/active
export const getActiveAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const today = getTodayDate();
        const token = await Token.findOne({ patientId: req.user!._id, date: today, status: { $in: ['waiting', 'in_consultation'] } })
            .populate('clinicId', 'name address phone')
            .populate('doctorId', 'name specialization');

        if (!token) { successResponse(res, null, 'No active appointment'); return; }

        const patientsAhead = await Token.countDocuments({ clinicId: token.clinicId, date: today, tokenNumber: { $lt: token.tokenNumber }, status: { $in: ['waiting', 'in_consultation'] } });
        successResponse(res, { token, patientsAhead });
    } catch { errorResponse(res, 'Failed to fetch appointment'); }
};

// GET /api/patient/history/:phone  (own history, or cross-clinic with consent)
export const getPatientHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const patient = req.user!;
        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate('doctorId', 'name specialization').populate('clinicId', 'name').sort({ createdAt: -1 });
        const tokens = await Token.find({ patientId: patient._id })
            .populate('clinicId', 'name').sort({ date: -1 }).limit(20);
        successResponse(res, { prescriptions, tokens });
    } catch { errorResponse(res, 'Failed to fetch history'); }
};

// GET /api/patient/prescriptions
export const getPrescriptions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.user!._id })
            .populate('doctorId', 'name specialization').populate('clinicId', 'name').sort({ createdAt: -1 });
        successResponse(res, prescriptions);
    } catch { errorResponse(res, 'Failed to fetch prescriptions'); }
};

// GET /api/patient/tokens
export const getPatientTokens = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tokens = await Token.find({ patientId: req.user!._id })
            .populate('clinicId', 'name').sort({ date: -1 });
        successResponse(res, tokens);
    } catch { errorResponse(res, 'Failed to fetch tokens'); }
};

// GET /api/patient/consent
export const getConsents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const consents = await Consent.find({ patientId: req.user!._id })
            .populate('doctorId', 'name specialization').populate('clinicId', 'name');
        successResponse(res, consents);
    } catch { errorResponse(res, 'Failed to fetch consents'); }
};

// PATCH /api/patient/consent/:id
export const updateConsent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { action } = req.body; // 'revoke'
        if (action !== 'revoke') { errorResponse(res, 'Invalid action', 400); return; }
        const consent = await Consent.findOneAndUpdate({ _id: req.params.id, patientId: req.user!._id }, { status: 'revoked' }, { new: true });
        if (!consent) { errorResponse(res, 'Consent not found', 404); return; }
        successResponse(res, consent, 'Consent revoked');
    } catch { errorResponse(res, 'Failed to update consent'); }
};
