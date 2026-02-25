import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getDoctorTokens, getPatientHistory, getPatientHistoryById, addPrescription,
    updateTokenStatus, requestConsent, verifyConsent, searchPatient,
} from '../controllers/doctorController';

const router = Router();
router.use(authenticate, authorize('doctor'));

// Tokens / queue
router.get('/tokens', getDoctorTokens);  // GET /api/doctor/tokens
router.get('/queue', getDoctorTokens);  // alias
router.post('/updateTokenStatus/:tokenId', updateTokenStatus);// POST /api/doctor/updateTokenStatus/:tokenId

// Patient search
router.get('/patients/search', searchPatient);    // GET /api/doctor/patients/search?mobile=X

// Patient history — two route forms
router.get('/patients/:id/history', getPatientHistoryById);  // GET /api/doctor/patients/:id/history  (used by search page)
router.get('/patientHistory/:phone', getPatientHistory);      // GET /api/doctor/patientHistory/:phone (legacy)

// Prescriptions
router.post('/addPrescription', addPrescription);  // POST /api/doctor/addPrescription
router.post('/prescriptions', addPrescription);  // alias

// Consent
router.post('/consent/request', requestConsent);
router.post('/consent/verify', verifyConsent);

export default router;
