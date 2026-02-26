'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getActiveAppointment, cancelAppointment } from '@/lib/api';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; border: string; desc: string }> = {
    waiting: { label: 'Waiting', icon: '⏳', color: 'text-amber-400', border: 'border-amber-500/30', desc: 'Please wait — you will be called soon' },
    in_consultation: { label: 'In Consultation', icon: '🩺', color: 'text-blue-400', border: 'border-blue-500/30', desc: 'Your turn — please proceed to the doctor' },
    completed: { label: 'Completed', icon: '✅', color: 'text-emerald-400', border: 'border-emerald-500/30', desc: 'Consultation done. Check your prescriptions.' },
    cancelled: { label: 'Cancelled', icon: '❌', color: 'text-red-400', border: 'border-red-500/30', desc: 'This appointment was cancelled.' },
};

export default function TokenStatusPage() {
    const { token } = useAuth();
    const [appt, setAppt] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [countdown, setCountdown] = useState(30);
    const [showConfirm, setShowConfirm] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');

    const fetchAppt = useCallback(async () => {
        if (!token) return;
        try {
            const r = await getActiveAppointment(token);
            setAppt(r.data);
        } catch { setAppt(null); }
        finally { setLoading(false); setLastRefresh(new Date()); setCountdown(30); }
    }, [token]);

    // Auto-refresh every 30 s
    useEffect(() => { fetchAppt(); }, [fetchAppt]);
    useEffect(() => {
        const iv = setInterval(fetchAppt, 30000);
        return () => clearInterval(iv);
    }, [fetchAppt]);
    useEffect(() => {
        const iv = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
        return () => clearInterval(iv);
    }, [lastRefresh]);

    const handleCancel = async () => {
        if (!appt?.token?._id) return;
        setCancelling(true); setCancelError('');
        try {
            await cancelAppointment(token!, appt.token._id);
            setShowConfirm(false);
            await fetchAppt(); // refresh to show "No Active Token"
        } catch (err: any) {
            setCancelError(err.message || 'Failed to cancel. Please try again.');
        } finally { setCancelling(false); }
    };

    const cfg = appt?.token?.status ? STATUS_CONFIG[appt.token.status] : null;
    const canCancel = appt?.token?.status === 'waiting'; // only cancellable when waiting

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Token Status</h1>
                    <p className="text-slate-500 text-sm mt-1">Live queue position tracking</p>
                </div>
                <button onClick={fetchAppt}
                    className="flex items-center gap-2 px-4 py-2 border border-[#30363d] hover:border-slate-500 text-slate-400 hover:text-white rounded-xl text-sm transition">
                    🔄 Refresh
                    <span className="text-xs text-slate-600">({countdown}s)</span>
                </button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-40 bg-[#161b22] border border-[#30363d] rounded-2xl animate-pulse" />)}
                </div>
            ) : !appt || !appt.token ? (
                <div className="text-center py-24">
                    <p className="text-5xl mb-4">🎉</p>
                    <h2 className="text-white text-xl font-bold mb-2">No Active Token</h2>
                    <p className="text-slate-500 text-sm mb-6">You don't have any appointment right now</p>
                    <Link href="/patient/book"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
                        📅 Book Appointment
                    </Link>
                </div>
            ) : (
                <>
                    {/* Status Banner */}
                    <div className={`bg-[#161b22] border ${cfg?.border} rounded-2xl p-6`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{cfg?.icon}</span>
                                <div>
                                    <p className={`font-bold text-lg ${cfg?.color}`}>{cfg?.label}</p>
                                    <p className="text-slate-500 text-sm">{cfg?.desc}</p>
                                </div>
                            </div>
                            <div className="text-right text-xs text-slate-600">
                                Last updated<br />{lastRefresh.toLocaleTimeString('en-IN')}
                            </div>
                        </div>
                    </div>

                    {/* Token Number */}
                    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center">
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Your Token Number</p>
                        <p className="text-9xl font-black text-white leading-none mb-4">{appt.token.tokenNumber}</p>
                        {appt.patientsAhead !== undefined && appt.token.status === 'waiting' && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-amber-400 text-sm font-semibold">
                                    {appt.patientsAhead} patient{appt.patientsAhead !== 1 ? 's' : ''} ahead of you
                                </span>
                            </div>
                        )}
                        {appt.token.status === 'in_consultation' && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-blue-400 text-sm font-semibold">It's your turn — go in now!</span>
                            </div>
                        )}
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#30363d]">
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Appointment Details</p>
                        </div>
                        <div className="divide-y divide-[#30363d]">
                            {[
                                ['🏥', 'Clinic', appt.token?.clinicId?.name || '—'],
                                ['🩺', 'Doctor', appt.token?.doctorId?.name || 'Assigned at clinic'],
                                ['📱', 'Type', appt.token?.type === 'online' ? 'Online Booking' : 'Walk-in'],
                                ['📅', 'Date', appt.token?.date || new Date().toLocaleDateString()],
                                ['💬', 'Reason', appt.token?.reason || 'Not specified'],
                            ].map(([icon, label, value]) => (
                                <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                                    <span className="text-base w-6">{icon}</span>
                                    <span className="text-slate-500 text-sm w-24">{label}</span>
                                    <span className="text-white text-sm font-medium">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {appt.token.status === 'completed' && (
                            <Link href="/patient/prescriptions"
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold transition">
                                💊 View Prescription
                            </Link>
                        )}
                        {canCancel && (
                            <button onClick={() => { setShowConfirm(true); setCancelError(''); }}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-2xl font-semibold transition">
                                ✕ Cancel Appointment
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* ── Cancel Confirmation Modal ── */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-sm shadow-2xl">
                        <div className="p-6">
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🗑️</span>
                            </div>
                            <h3 className="text-white font-bold text-lg text-center mb-2">Cancel Appointment?</h3>
                            <p className="text-slate-400 text-sm text-center mb-2">
                                Token <span className="text-white font-bold">#{appt?.token?.tokenNumber}</span> at{' '}
                                <span className="text-white font-medium">{appt?.token?.clinicId?.name}</span> will be cancelled.
                            </p>
                            <p className="text-slate-600 text-xs text-center mb-6">
                                Your spot in the queue will be lost. You can book a new appointment anytime.
                            </p>

                            {cancelError && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-xs text-center">
                                    {cancelError}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setShowConfirm(false); setCancelError(''); }}
                                    className="flex-1 py-3 border border-[#30363d] text-slate-400 hover:text-white hover:border-slate-500 rounded-xl text-sm font-medium transition">
                                    Keep Appointment
                                </button>
                                <button onClick={handleCancel} disabled={cancelling}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition">
                                    {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
