import { Response } from 'express';
import Token from '../models/Token';
import User from '../models/User';
import Patient from '../models/Patient';
import Prescription from '../models/Prescription';
import Consent from '../models/Consent';
import { AuthRequest } from '../middleware/auth';
import { getTodayDate, successResponse, errorResponse } from '../utils/helpers';
import { generateOTP, getOTPExpiry, isOTPValid } from '../utils/otp';

// GET /api/doctor/patients/search?mobile=XXXXXXXXXX
export const searchPatient = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { mobile } = req.query;
        if (!mobile) { errorResponse(res, 'Mobile number required', 400); return; }

        const mobileStr = (mobile as string).trim();

        // 1️⃣ First look in User collection — check all roles so we can give a useful error
        const anyUser = await User.findOne({ mobile: mobileStr }).select('-otp -otpExpiry -password');

        if (anyUser && anyUser.role !== 'patient') {
            // Number exists but belongs to a doctor/attender/admin
            errorResponse(res, `This number is registered as a ${anyUser.role}, not a patient`, 400);
            return;
        }

        let userRecord = anyUser; // may be null if not in User collection yet

        if (!userRecord) {
            // 2️⃣ Fall back to Patient collection (registered by attender / inserted via Compass)
            const patientDoc = await Patient.findOne({ phoneNumber: mobileStr });
            if (!patientDoc) {
                errorResponse(res, 'No patient found with this mobile number', 404);
                return;
            }
            // Auto-create a User record so prescriptions and tokens can be linked
            userRecord = await User.create({ mobile: mobileStr, name: patientDoc.name, role: 'patient' });
        }

        // Also fetch Patient demographics if available (age, gender, etc.)
        const patientDetails = await Patient.findOne({ phoneNumber: mobileStr })
            .select('patientId name age gender address');

        successResponse(res, { ...userRecord.toObject(), patientDetails: patientDetails || null });
    } catch { errorResponse(res, 'Patient search failed'); }
};

// GET /api/doctor/tokens  (today's queue)
export const getDoctorTokens = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const date = (req.query.date as string) || getTodayDate();
        const queue = await Token.find({ clinicId: req.user!.clinicId, date, status: { $ne: 'cancelled' } })
            .sort({ tokenNumber: 1 });
        successResponse(res, queue, 'Queue fetched');
    } catch { errorResponse(res, 'Failed to fetch queue'); }
};

// GET /api/doctor/patientHistory/:phone  (legacy)
export const getPatientHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const patient = await User.findOne({ mobile: req.params.phone, role: 'patient' }).select('-otp -otpExpiry -password');
        if (!patient) { errorResponse(res, 'Patient not found', 404); return; }

        const consent = await Consent.findOne({ patientId: patient._id, doctorId: req.user!._id, status: 'approved', expiresAt: { $gt: new Date() } });
        if (!consent) { errorResponse(res, 'Consent required to view patient history', 403); return; }

        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate('doctorId', 'name specialization').populate('clinicId', 'name').sort({ createdAt: -1 });
        const visitHistory = await Token.find({ patientId: patient._id }).populate('clinicId', 'name').sort({ date: -1 }).limit(20);

        successResponse(res, { patient, prescriptions, visitHistory });
    } catch { errorResponse(res, 'Failed to fetch patient history'); }
};

// GET /api/doctor/patients/:id/history  (used by search page after consent OTP)
export const getPatientHistoryById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const patient = await User.findById(req.params.id).select('-otp -otpExpiry -password');
        if (!patient) { errorResponse(res, 'Patient not found', 404); return; }

        const consent = await Consent.findOne({ patientId: patient._id, doctorId: req.user!._id, status: 'approved', expiresAt: { $gt: new Date() } });
        if (!consent) { errorResponse(res, 'Consent required to view patient history', 403); return; }

        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate('doctorId', 'name specialization').populate('clinicId', 'name').sort({ createdAt: -1 });
        const visitHistory = await Token.find({ patientId: patient._id }).populate('clinicId', 'name').sort({ date: -1 }).limit(20);

        successResponse(res, { patient, prescriptions, visitHistory });
    } catch { errorResponse(res, 'Failed to fetch patient history'); }
};


// POST /api/doctor/addPrescription
export const addPrescription = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const doctor = req.user!;
        const { tokenId, patientMobile, diagnosis, medications, notes, followUpDate } = req.body;

        const token = await Token.findById(tokenId);
        if (!token) { errorResponse(res, 'Token not found', 404); return; }

        const prescription = await Prescription.create({
            tokenId, clinicId: doctor.clinicId, doctorId: doctor._id,
            patientId: token.patientId, patientMobile: patientMobile || token.patientMobile,
            diagnosis, medications, notes, followUpDate,
        });

        // Mark token completed
        await Token.findByIdAndUpdate(tokenId, { status: 'completed' });

        successResponse(res, prescription, 'Prescription saved', 201);
    } catch { errorResponse(res, 'Failed to save prescription'); }
};

// POST /api/doctor/updateTokenStatus/:tokenId
export const updateTokenStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        const allowed = ['waiting', 'in_consultation', 'completed', 'cancelled'];
        if (!allowed.includes(status)) { errorResponse(res, 'Invalid status', 400); return; }
        const token = await Token.findOneAndUpdate({ _id: req.params.tokenId, clinicId: req.user!.clinicId }, { status }, { new: true });
        if (!token) { errorResponse(res, 'Token not found', 404); return; }
        successResponse(res, token, 'Status updated');
    } catch { errorResponse(res, 'Failed to update token status'); }
};

// POST /api/doctor/consent/request
export const requestConsent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { patientMobile } = req.body;
        const doctor = req.user!;
        const mobileStr = (patientMobile as string)?.trim();

        // Find or auto-create user record (same dual-lookup as searchPatient)
        let patient = await User.findOne({ mobile: mobileStr, role: 'patient' });
        if (!patient) {
            const patientDoc = await Patient.findOne({ phoneNumber: mobileStr });
            if (!patientDoc) { errorResponse(res, 'Patient not found', 404); return; }
            patient = await User.create({ mobile: mobileStr, name: patientDoc.name, role: 'patient' });
        }

        let existing = await Consent.findOne({
            patientId: patient._id, doctorId: doctor._id,
            status: { $in: ['pending', 'approved'] },
            expiresAt: { $gt: new Date() }
        });

        const otp = generateOTP();
        const otpExpiry = getOTPExpiry();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        if (existing) {
            if (existing.status === 'approved') {
                successResponse(res, existing, 'Access already granted');
                return;
            }
            // If already pending, the old OTP might be expired. Give them a fresh one.
            existing.otp = otp;
            existing.otpExpiry = otpExpiry;
            existing.expiresAt = expiresAt;
            await existing.save();

            await User.findByIdAndUpdate(patient._id, { otp, otpExpiry });
            successResponse(res, { consentId: existing._id, devOtp: otp }, 'Consent OTP resent to patient');
            return;
        }

        const consent = await Consent.create({
            patientId: patient._id,
            patientMobile: mobileStr,           // ← was missing
            doctorId: doctor._id,
            doctorName: doctor.name,           // ← was missing
            clinicId: doctor.clinicId || undefined,   // optional
            otp,
            otpExpiry,
            expiresAt,
        });

        await User.findByIdAndUpdate(patient._id, { otp, otpExpiry });

        successResponse(res, { consentId: consent._id, devOtp: otp }, 'Consent OTP sent to patient');
    } catch (err: any) {
        console.error('[requestConsent]', err.message);
        errorResponse(res, err.message || 'Failed to request consent');
    }
};


// POST /api/doctor/consent/verify
export const verifyConsent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { consentId, otp } = req.body;
        const consent = await Consent.findById(consentId);
        if (!consent) { errorResponse(res, 'Consent not found', 404); return; }

        if (consent.status === 'approved') {
            successResponse(res, consent, 'Access already granted');
            return;
        }

        if (!isOTPValid(otp, consent.otp!, consent.otpExpiry!)) {
            errorResponse(res, 'Invalid or expired OTP', 400);
            return;
        }

        consent.status = 'approved';
        consent.otp = undefined;
        consent.otpExpiry = undefined;
        await consent.save();

        successResponse(res, consent, 'Consent approved');
    } catch { errorResponse(res, 'Failed to verify consent'); }
};
