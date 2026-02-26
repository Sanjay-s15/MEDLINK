'use client';
import { useEffect, useState } from 'react';
import { getDoctorQueue, updateTokenStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, Badge, LoadingSpinner, EmptyState } from '@/components/ui-shared';
import Link from 'next/link';

interface QueueToken {
    _id: string; tokenNumber: number; patientName: string; patientMobile: string;
    patientId: string;
    type: 'online' | 'offline'; status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
    reason?: string; createdAt: string;
}

export default function DoctorQueuePage() {
    const { token } = useAuth();
    const [queue, setQueue] = useState<QueueToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchQueue = async () => {
        try {
            const res = await getDoctorQueue(token!);
            setQueue(res.data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { if (token) fetchQueue(); }, [token]);

    const changeStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            await updateTokenStatus(token!, id, status, 'doctor');
            setQueue(prev => prev.map(t => t._id === id ? { ...t, status: status as QueueToken['status'] } : t));
        } catch (err: any) {
            alert('Failed to update status: ' + err.message);
        }
        finally { setUpdatingId(null); }
    };

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const active = queue.filter(t => t.status === 'waiting' || t.status === 'in_consultation');
    const done = queue.filter(t => t.status === 'completed' || t.status === 'cancelled');

    return (
        <div>
            <PageHeader
                title="Today's Queue"
                subtitle={today}
                action={
                    <button onClick={fetchQueue} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
                        🔄 Refresh
                    </button>
                }
            />

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {[
                    { label: 'Total', val: queue.length, color: 'text-white' },
                    { label: 'Waiting', val: queue.filter(t => t.status === 'waiting').length, color: 'text-amber-400' },
                    { label: 'In Consultation', val: queue.filter(t => t.status === 'in_consultation').length, color: 'text-blue-400' },
                    { label: 'Completed', val: done.length, color: 'text-green-400' },
                ].map(s => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                        <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-slate-400 text-xs mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {loading ? <LoadingSpinner /> : queue.length === 0 ? <EmptyState message="No tokens in queue today" icon="🎉" /> : (
                <div className="space-y-8">
                    {/* Active */}
                    {active.length > 0 && (
                        <section>
                            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Active</h2>
                            <div className="space-y-3">
                                {active.map(t => <TokenRow key={t._id} token={t} updatingId={updatingId} onStatusChange={changeStatus} />)}
                            </div>
                        </section>
                    )}
                    {/* Done */}
                    {done.length > 0 && (
                        <section>
                            <h2 className="text-slate-400 font-semibold mb-4">Completed / Cancelled</h2>
                            <div className="space-y-3 opacity-60">
                                {done.map(t => <TokenRow key={t._id} token={t} updatingId={updatingId} onStatusChange={changeStatus} readOnly />)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

function TokenRow({ token: t, updatingId, onStatusChange, readOnly = false }:
    { token: QueueToken; updatingId: string | null; onStatusChange: (id: string, s: string) => void; readOnly?: boolean }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/8 transition-all">
            <div className="flex items-start sm:items-center gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${t.status === 'in_consultation' ? 'bg-blue-600' : t.status === 'completed' ? 'bg-green-600' : 'bg-slate-700'} text-white`}>
                    {t.tokenNumber}
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-white font-semibold">{t.patientName}</p>
                        <Badge variant={t.type}>{t.type}</Badge>
                        <Badge variant={t.status}>{t.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-slate-400 text-sm">📱 {t.patientMobile}</p>
                    {t.reason && <p className="text-slate-500 text-xs mt-0.5 break-words">Reason: {t.reason}</p>}
                </div>
            </div>
            {!readOnly && (
                <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Link href={`/doctor/search?mobile=${t.patientMobile}`}
                        className="flex items-center justify-center px-3 py-2.5 sm:py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm sm:text-xs font-medium transition w-full sm:w-auto">
                        👤 History
                    </Link>
                    {t.status === 'waiting' && (
                        <button onClick={() => onStatusChange(t._id, 'in_consultation')} disabled={updatingId === t._id}
                            className="flex items-center justify-center px-3 py-2.5 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm sm:text-xs font-medium transition disabled:opacity-50 w-full sm:w-auto">
                            ▶ Call In
                        </button>
                    )}
                    {t.status === 'in_consultation' && (
                        <>
                            <Link href={`/doctor/prescriptions?tokenId=${t._id}&patientId=${t.patientId || ''}&mobile=${t.patientMobile}&name=${encodeURIComponent(t.patientName)}`}
                                className="flex items-center justify-center px-3 py-2.5 sm:py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm sm:text-xs font-medium transition w-full sm:w-auto">
                                💊 Prescribe
                            </Link>
                            <button onClick={() => onStatusChange(t._id, 'completed')} disabled={updatingId === t._id}
                                className="flex items-center justify-center px-3 py-2.5 sm:py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm sm:text-xs font-medium transition disabled:opacity-50 w-full sm:w-auto">
                                ✓ Done
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
