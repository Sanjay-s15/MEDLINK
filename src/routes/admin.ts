import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getPendingDoctors, approveDoctor, rejectDoctor, getDoctors,
    getAdminTokens, getClinics, createClinic, updateClinicStatus,
    createUser, getUsers, deactivateUser, updateUser, getClinicDoctors, getMetrics,
} from '../controllers/adminController';

const router = Router();
router.use(authenticate, authorize('admin'));

// Doctor approval
router.get('/pendingDoctors', getPendingDoctors);
router.post('/approveDoctor/:doctorId', approveDoctor);
router.post('/rejectDoctor/:doctorId', rejectDoctor);
router.get('/doctors', getDoctors);

// Tokens
router.get('/tokens', getAdminTokens);

// Clinics
router.get('/clinics', getClinics);
router.post('/clinics', createClinic);
router.patch('/clinics/:id', updateClinicStatus);
router.get('/clinics/:id/doctors', getClinicDoctors);

// Users (staff)
router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deactivateUser);
router.patch('/users/:id', updateUser);

// Metrics
router.get('/metrics', getMetrics);

export default router;
