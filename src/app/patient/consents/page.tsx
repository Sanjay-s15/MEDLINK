'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getPendingConsents, respondToConsent } from '@/lib/api';

interface Consent {
    _id: string; status: string; createdAt: string;
    doctorId?: { name: string; specialization?: string };
    clinicId?: { name: string };
}

export default function ConsentRequestsPage() {
    const { token } = useAuth();
    const [consents, setConsents] = useState<Consent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [responding, setResponding] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchConsents = async () => {
        if (!token) return;
        try { setConsents((await getPendingConsents(token)).data || []); }
        catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchConsents(); }, [token]);

    const handleRespond = async (id: string, action: 'approve' | 'deny') => {
        if (action === 'approve' && otp.length !== 6) { showToast('Please enter the 6-digit OTP', 'error'); return; }
        setResponding(true);
        try {
            await respondToConsent(token!, id, action, otp || undefined);
            setConsents(prev => prev.filter(c => c._id !== id));
            setSelected(null); setOtp('');
            showToast(action === 'approve' ? 'Access granted for 24 hours' : 'Access denied successfully', 'success');
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setResponding(false); }
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl border text-sm font-semibold shadow-2xl transition-all ${toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'
                    }`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
                </div>
            )}

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Consent Requests</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage doctor access to your medical history</p>
                </div>
                {consents.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-amber-400 text-xs font-semibold">{consents.length} pending</span>
                    </div>
                )}
            </div>

            {/* Privacy notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
                <span className="text-xl shrink-0">🔒</span>
                <div>
                    <p className="text-blue-300 text-sm font-medium">Your privacy is protected</p>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Doctors can only access your medical history after your explicit approval. Access automatically expires in 24 hours. You can deny at any time.</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-36 bg-[#161b22] border border-[#30363d] rounded-2xl animate-pulse" />)}</div>
            ) : consents.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-5xl mb-3">🔒</p>
                    <p className="text-white font-semibold text-lg">No Pending Requests</p>
                    <p className="text-slate-500 text-sm mt-1">No doctor has requested access to your medical history</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {consents.map(c => {
                        const isSelected = selected === c._id;
                        return (
                            <div key={c._id} className="bg-[#161b22] border border-amber-500/30 rounded-2xl overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl border border-amber-500/20 shrink-0">🩺</div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-white font-bold text-base">Dr. {c.doctorId?.name}</h3>
                                                    {c.doctorId?.specialization && (
                                                        <p className="text-blue-400 text-xs font-medium">{c.doctorId.specialization}</p>
                                                    )}
                                                    <p className="text-slate-500 text-xs mt-1">🏥 {c.clinicId?.name || 'Clinic'}</p>
                                                    <p className="text-slate-600 text-xs mt-0.5">
                                                        Requested {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs border border-amber-500/20 font-semibold uppercase">Pending</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                        <p className="text-amber-300 text-sm">
                                            🔐 <strong>Dr. {c.doctorId?.name}</strong> is requesting access to your <strong>complete medical history</strong> for 24 hours.
                                        </p>
                                    </div>

                                    {/* OTP input shown after selecting approve */}
                                    {isSelected && (
                                        <div className="mt-4 space-y-3">
                                            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4">
                                                <p className="text-slate-400 text-xs mb-1">An OTP was sent to your registered mobile number.</p>
                                                <p className="text-emerald-400 text-xs font-semibold">Enter it below to confirm access:</p>
                                            </div>
                                            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="w-full bg-[#0d1117] border-2 border-emerald-500/40 focus:border-emerald-500 rounded-xl px-4 py-4 text-white text-center text-3xl font-black tracking-[0.5em] placeholder-slate-700 focus:outline-none transition"
                                                placeholder="• • • • • •" maxLength={6} inputMode="numeric" />
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => { handleRespond(c._id, 'deny'); }}
                                            disabled={responding}
                                            className="flex-1 py-3 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                            ✕ Deny Access
                                        </button>
                                        <button
                                            onClick={() => { if (!isSelected) { setSelected(c._id); setOtp(''); } else { handleRespond(c._id, 'approve'); } }}
                                            disabled={responding}
                                            className="flex-2 flex-1 sm:flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                                            {isSelected
                                                ? (responding ? '⏳ Verifying…' : '✓ Confirm with OTP')
                                                : '✓ Approve Access'}
                                        </button>
                                    </div>
                                    {isSelected && (
                                        <button onClick={() => { setSelected(null); setOtp(''); }}
                                            className="w-full mt-2 text-slate-600 hover:text-slate-400 text-xs transition">
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* How it works */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4">How Consent Works</h3>
                <div className="space-y-3">
                    {[
                        { step: '1', icon: '🩺', text: 'A doctor requests access to your medical history during consultation' },
                        { step: '2', icon: '📱', text: 'You receive an OTP on your registered mobile number' },
                        { step: '3', icon: '🔐', text: 'Share the OTP only with the doctor you trust. They enter it to verify.' },
                        { step: '4', icon: '⏰', text: 'Access is granted for 24 hours and then automatically revoked' },
                    ].map(s => (
                        <div key={s.step} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-[#30363d] flex items-center justify-center text-xs text-slate-500 shrink-0 mt-0.5">{s.step}</div>
                            <p className="text-slate-400 text-sm leading-relaxed">{s.icon} {s.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
