'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getActiveAppointment, getPrescriptions, getPendingConsents } from '@/lib/api';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    waiting: { label: 'Waiting', color: 'text-amber-400', bg: 'bg-amber-500/10  border-amber-500/30', dot: 'bg-amber-400 animate-pulse' },
    in_consultation: { label: 'In Consultation', color: 'text-blue-400', bg: 'bg-blue-500/10   border-blue-500/30', dot: 'bg-blue-400  animate-pulse' },
    completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
    cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10    border-red-500/30', dot: 'bg-red-400' },
};

export default function PatientDashboard() {
    const { user, token } = useAuth();
    const [appt, setAppt] = useState<any>(null);
    const [prescCount, setPrescCount] = useState(0);
    const [consentCount, setConsentCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        Promise.all([
            getActiveAppointment(token).then(r => setAppt(r.data)).catch(() => setAppt(null)),
            getPrescriptions(token).then(r => setPrescCount(r.data?.length ?? 0)).catch(() => { }),
            getPendingConsents(token).then(r => setConsentCount(r.data?.length ?? 0)).catch(() => { }),
        ]).finally(() => setLoading(false));
    }, [token]);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const st = appt?.token?.status ? STATUS_MAP[appt.token.status] : null;

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
                    <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <Link href="/patient/book"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
                    + Book Appointment
                </Link>
            </div>

            {/* Current Appointment Card */}
            <section>
                <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Current Appointment</h2>
                {loading ? (
                    <div className="border border-[#30363d] rounded-2xl p-6 bg-[#161b22] animate-pulse h-32" />
                ) : appt && appt.token ? (
                    <div className={`border rounded-2xl p-4 sm:p-5 bg-[#161b22] ${st?.bg}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                            <div>
                                <p className="text-slate-400 text-[10px] sm:text-xs mb-1">🏥 {appt.token?.clinicId?.name || 'Clinic'}</p>
                                <div className="flex items-center gap-3 mt-1 sm:mt-0">
                                    <span className="text-4xl sm:text-5xl font-black text-white">{appt.token.tokenNumber}</span>
                                    <div>
                                        <p className="text-slate-400 text-[10px] sm:text-xs">Token Number</p>
                                        {appt.patientsAhead !== undefined && appt.token.status === 'waiting' && (
                                            <p className="text-amber-400 text-[10px] sm:text-xs font-semibold mt-0.5">{appt.patientsAhead} patient{appt.patientsAhead !== 1 ? 's' : ''} ahead</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-semibold ${st?.bg} ${st?.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${st?.dot}`} />
                                    {st?.label}
                                </div>
                                <p className="text-slate-500 text-[10px] sm:text-xs sm:mt-2 hidden sm:block">{appt.token?.type}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/5">
                            <Link href="/patient/token"
                                className="flex-1 py-2 sm:py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-lg text-center transition">
                                📍 Track Live
                            </Link>
                            {appt.token.status === 'completed' && (
                                <Link href="/patient/prescriptions"
                                    className="flex-1 py-2 sm:py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-lg text-center transition">
                                    💊 View Prescription
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-[#30363d] rounded-2xl p-6 bg-[#161b22] text-center">
                        <p className="text-4xl mb-3">🗓️</p>
                        <p className="text-white font-semibold mb-1">No Active Appointment</p>
                        <p className="text-slate-500 text-sm mb-4">You don't have any token for today</p>
                        <Link href="/patient/book"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
                            + Book Now
                        </Link>
                    </div>
                )}
            </section>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                    { label: 'Prescriptions', value: prescCount, icon: '💊', href: '/patient/prescriptions', color: 'text-blue-400' },
                    {
                        label: 'Consent Requests', value: consentCount, icon: '🔐', href: '/patient/consents', color: 'text-amber-400',
                        badge: consentCount > 0
                    },
                    { label: 'Medical Records', value: '—', icon: '📋', href: '/patient/history', color: 'text-purple-400' },
                ].map(s => (
                    <Link key={s.label} href={s.href}
                        className="border border-[#30363d] bg-[#161b22] rounded-2xl p-4 hover:border-slate-600 transition group relative">
                        {s.badge && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />}
                        <p className="text-2xl mb-2">{s.icon}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-slate-500 text-xs mt-1">{s.label}</p>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <section>
                <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { icon: '📅', label: 'Book Appointment', sub: 'Find clinics near you', href: '/patient/book', color: 'from-emerald-500 to-teal-600' },
                        { icon: '💊', label: 'My Prescriptions', sub: 'View all prescriptions', href: '/patient/prescriptions', color: 'from-blue-500 to-indigo-600' },
                        { icon: '📋', label: 'Medical History', sub: 'Timeline of your visits', href: '/patient/history', color: 'from-violet-500 to-purple-600' },
                    ].map(a => (
                        <Link key={a.label} href={a.href}
                            className={`bg-gradient-to-br ${a.color} rounded-2xl p-5 text-white hover:opacity-90 hover:scale-[1.02] transition-all`}>
                            <p className="text-3xl mb-3">{a.icon}</p>
                            <p className="font-bold">{a.label}</p>
                            <p className="text-white/70 text-xs mt-1">{a.sub}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
