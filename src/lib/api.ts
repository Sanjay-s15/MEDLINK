let API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
if (typeof window !== 'undefined' && API_BASE.includes('localhost')) {
    API_BASE = `http://${window.location.hostname}:8000/api`;
}

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const api = async (path: string, options: RequestInit = {}, token?: string) => {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...getHeaders(token), ...(options.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
};

// Auth
export const sendOTP = (mobile: string, name?: string) =>
    api('/auth/send-otp', { method: 'POST', body: JSON.stringify({ mobile, name }) });

export const verifyOTP = (mobile: string, otp: string) =>
    api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ mobile, otp }) });

export const staffLogin = (mobile: string, password: string) =>
    api('/auth/staff-login', { method: 'POST', body: JSON.stringify({ mobile, password }) });

// Patient
export const getNearbyClinics = (token: string, lat?: number, lng?: number) =>
    api(`/patient/clinics${lat ? `?lat=${lat}&lng=${lng}` : ''}`, {}, token);

export const bookAppointment = (token: string, clinicId: string, doctorId?: string, reason?: string) =>
    api('/patient/appointments', { method: 'POST', body: JSON.stringify({ clinicId, doctorId, reason }) }, token);

export const getActiveAppointment = (token: string) =>
    api('/patient/appointments/active', {}, token);

export const cancelAppointment = (token: string, appointmentId: string) =>
    api(`/patient/appointments/${appointmentId}`, { method: 'DELETE' }, token);

export const getPrescriptions = (token: string) =>
    api('/patient/prescriptions', {}, token);

export const getPendingConsents = (token: string) =>
    api('/patient/consents', {}, token);

export const respondToConsent = (token: string, consentId: string, action: 'approve' | 'deny', otp?: string) =>
    api(`/patient/consents/${consentId}/respond`, { method: 'POST', body: JSON.stringify({ action, otp }) }, token);

// Doctor
export const getDoctorQueue = (token: string, date?: string) =>
    api(`/doctor/queue${date ? `?date=${date}` : ''}`, {}, token);

export const searchPatient = (token: string, mobile: string) =>
    api(`/doctor/patients/search?mobile=${mobile}`, {}, token);

export const requestConsent = (token: string, patientMobile: string) =>
    api('/doctor/consent/request', { method: 'POST', body: JSON.stringify({ patientMobile }) }, token);

export const verifyConsent = (token: string, consentId: string, otp: string) =>
    api('/doctor/consent/verify', { method: 'POST', body: JSON.stringify({ consentId, otp }) }, token);

export const getPatientHistory = (token: string, patientId: string) =>
    api(`/doctor/patients/${patientId}/history`, {}, token);

export const createPrescription = (token: string, data: Record<string, unknown>) =>
    api('/doctor/prescriptions', { method: 'POST', body: JSON.stringify(data) }, token);

export const updateTokenStatus = (token: string, tokenId: string, status: string, role: 'doctor' | 'attender') =>
    api(`/${role}/tokens/${tokenId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);

// Attender
export const createWalkInToken = (token: string, mobile: string, name?: string, doctorId?: string, reason?: string) =>
    api('/attender/tokens', { method: 'POST', body: JSON.stringify({ mobile, name, doctorId, reason }) }, token);

export const getAttenderQueue = (token: string) =>
    api('/attender/queue', {}, token);

// Admin
export const getAdminMetrics = (token: string) =>
    api('/admin/metrics', {}, token);

export const getClinics = (token: string) =>
    api('/admin/clinics', {}, token);

export const createClinic = (token: string, data: Record<string, unknown>) =>
    api('/admin/clinics', { method: 'POST', body: JSON.stringify(data) }, token);

export const updateClinicStatus = (token: string, clinicId: string, status: string) =>
    api(`/admin/clinics/${clinicId}`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);

export const getStaff = (token: string, role?: string) =>
    api(`/admin/users${role ? `?role=${role}` : ''}`, {}, token);

export const createStaff = (token: string, data: Record<string, unknown>) =>
    api('/admin/users', { method: 'POST', body: JSON.stringify(data) }, token);

export const deactivateUser = (token: string, userId: string) =>
    api(`/admin/users/${userId}`, { method: 'DELETE' }, token);

export const updateUser = (token: string, userId: string, data: Record<string, unknown>) =>
    api(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }, token);

export const getClinicDoctors = (token: string, clinicId: string) =>
    api(`/admin/clinics/${clinicId}/doctors`, {}, token);

// Profile APIs
export const getProfile = (token: string, role: 'doctor' | 'attender' | 'admin' | 'patient') =>
    api(`/${role}/profile`, {}, token);

export const updateProfile = (token: string, role: 'doctor' | 'attender' | 'admin' | 'patient', data: Record<string, unknown>) =>
    api(`/${role}/profile`, { method: 'PATCH', body: JSON.stringify(data) }, token);

// Doctor updates patient profile
export const updatePatientProfileByDoctor = (token: string, patientId: string, data: Record<string, unknown>) =>
    api(`/doctor/patients/${patientId}/profile`, { method: 'PATCH', body: JSON.stringify(data) }, token);

export const getPatientProfileByDoctor = (token: string, patientId: string) =>
    api(`/doctor/patients/${patientId}/profile`, {}, token);
