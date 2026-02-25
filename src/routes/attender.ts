import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { registerPatient, getPatientByPhone, createToken, getQueue, updateTokenStatus } from '../controllers/attenderController';

const router = Router();
router.use(authenticate, authorize('attender'));

router.post('/registerPatient', registerPatient);    // POST /api/attender/registerPatient
router.get('/patient/:phone', getPatientByPhone);  // GET  /api/attender/patient/:phone
router.post('/createToken', createToken);        // POST /api/attender/createToken
router.post('/tokens', createToken);         // alias
router.get('/queue', getQueue);
router.patch('/tokens/:id/status', updateTokenStatus);

export default router;
