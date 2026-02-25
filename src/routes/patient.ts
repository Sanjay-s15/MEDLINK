import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getClinics, bookAppointment, cancelAppointment, getActiveAppointment,
    getPatientHistory, getPrescriptions, getPatientTokens, getConsents, updateConsent,
} from '../controllers/patientController';

const router = Router();
router.use(authenticate);

// Clinic discovery
router.get('/clinics', getClinics);

// Appointments / tokens
router.post('/appointments', bookAppointment);
router.delete('/appointments/:id', cancelAppointment);
router.get('/appointments/active', getActiveAppointment);
router.get('/tokens', getPatientTokens);    // GET /api/patient/tokens
router.post('/createToken', bookAppointment);     // alias

// History
router.get('/history/:phone', getPatientHistory);   // GET /api/patient/history/:phone
router.get('/prescriptions', getPrescriptions);

// Consent
router.get('/consent', getConsents);
router.patch('/consent/:id', updateConsent);

export default router;
