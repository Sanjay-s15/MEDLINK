'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchPatient, requestConsent, verifyConsent, getPatientHistory } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, Badge, LoadingSpinner } from '@/components/ui-shared';

function SearchContent() {
    const params = useSearchParams();
    const { token } = useAuth();

    const [mobile, setMobile] = useState(params.get('mobile') || '');
    const [patient, setPatient] = useState<any>(null);
    const [history, setHistory] = useState<any>(null);
    const [consentId, setConsentId] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [step, setStep] = useState<'search' | 'consent_sent' | 'otp_verify' | 'history'>('search');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [devOtp, setDevOtp] = useState(''); // shown in development mode

    const handleSearch = async () => {
        if (!mobile.trim()) return;
        setLoading(true); setError('');
        try {
            const res = await searchPatient(token!, mobile.trim());
            setPatient(res.data); setStep('search');
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleRequestConsent = async () => {
        setLoading(true); setError(''); setMsg('');
        try {
            const res = await requestConsent(token!, mobile.trim());

            // If consent is already approved, skip the OTP step entirely
            if (res.data?.status === 'approved') {
                const h = await getPatientHistory(token!, patient._id);
                setHistory(h.data);
                setStep('history');
                setMsg('Access already granted! Patient history loaded.');
                return;
            }

            // New consent  → res.data = { consentId, devOtp }
            // Existing pending one → res.data = { _id, otp, status, ... }
            const cid = res.data?.consentId || res.data?._id;
            const otp = res.data?.devOtp || res.data?.otp;
            if (cid) setConsentId(String(cid));
            if (otp) setDevOtp(String(otp));
            setMsg(res.message || 'OTP sent — ask the patient for it');
            setStep('consent_sent');
        } catch (e: any) {
            setError(e.message);
        } finally { setLoading(false); }
    };

    const handleVerifyOTP = async () => {
        setLoading(true); setError('');
        try {
            await verifyConsent(token!, consentId, otpInput.trim());
            const h = await getPatientHistory(token!, patient._id);
            setHistory(h.data); setStep('history');
            setMsg('Access granted! Patient history loaded.');
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div>
            <PageHeader title="Patient Search" subtitle="Search by mobile number, request consent to view history" />

            {/* Search Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <input value={mobile} onChange={e => setMobile(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        placeholder="Enter patient mobile number…" maxLength={10} />
                    <button onClick={handleSearch} disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-50 w-full sm:w-auto">
                        {loading ? '…' : '🔍 Search'}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">{error}</div>}
            {msg && <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm mb-4">{msg}</div>}

            {patient && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                                {patient.name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-white text-xl font-bold">{patient.name}</h2>
                                <p className="text-slate-400">📱 {patient.mobile}</p>
                            </div>
                        </div>
                        {step === 'search' && (
                            <button onClick={handleRequestConsent} disabled={loading}
                                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition disabled:opacity-50 text-center">
                                🔐 Request Medical History
                            </button>
                        )}
                    </div>

                    {/* OTP Verify Step */}
                    {step === 'consent_sent' && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-4">
                            <p className="text-amber-300 text-sm font-medium mb-3">
                                ⏳ OTP generated — ask the patient to share it with you.
                            </p>

                            {/* Patient OTP — always shown in dev/demo mode */}
                            <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-3 mb-3 text-center">
                                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">🛠 Patient OTP</p>
                                {devOtp ? (
                                    <p className="text-amber-200 text-4xl font-black tracking-[0.4em] my-1">{devOtp}</p>
                                ) : (
                                    <p className="text-amber-400 text-sm italic">OTP sent via SMS to patient</p>
                                )}
                                <p className="text-amber-600 text-xs mt-1">Enter this code below to verify access</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <input value={otpInput} onChange={e => setOtpInput(e.target.value)}
                                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-center text-xl tracking-widest w-full"
                                    placeholder="Enter OTP" maxLength={6} />
                                <button onClick={handleVerifyOTP} disabled={loading || otpInput.length < 6}
                                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition disabled:opacity-50 w-full sm:w-auto">
                                    {loading ? '…' : 'Verify'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* History */}
            {step === 'history' && history && (
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4">📜 Prescription History ({history.prescriptions.length})</h3>
                        {history.prescriptions.length === 0 ? (
                            <p className="text-slate-400 text-sm">No prescriptions on record.</p>
                        ) : (
                            <div className="space-y-4">
                                {history.prescriptions.map((p: any) => (
                                    <div key={p._id} className="border border-white/10 rounded-xl p-4">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2 gap-1">
                                            <p className="text-white font-medium">{p.diagnosis}</p>
                                            <span className="text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-slate-400 text-xs mb-2">By {p.doctorId?.name} • {p.clinicId?.name}</p>
                                        <div className="space-y-1">
                                            {p.medications.map((m: any, i: number) => (
                                                <div key={i} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-slate-300">
                                                    💊 <strong>{m.name}</strong> — {m.dosage}, {m.frequency}, {m.duration}
                                                    {m.instructions && <span className="text-slate-500"> ({m.instructions})</span>}
                                                </div>
                                            ))}
                                        </div>
                                        {p.notes && <p className="text-slate-500 text-xs mt-2">📝 {p.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4">🏥 Visit History ({history.visitHistory.length})</h3>
                        <div className="space-y-2">
                            {history.visitHistory.map((v: any) => (
                                <div key={v._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm border border-white/5 rounded-lg px-4 py-3">
                                    <span className="text-slate-300">Token #{v.tokenNumber} — {v.clinicId?.name}</span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={v.type}>{v.type}</Badge>
                                        <Badge variant={v.status}>{v.status}</Badge>
                                        <span className="text-slate-500 text-xs">{new Date(v.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DoctorSearchPage() {
    return <Suspense fallback={<LoadingSpinner />}><SearchContent /></Suspense>;
}
