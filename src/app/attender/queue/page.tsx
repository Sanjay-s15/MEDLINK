'use client';
import { useEffect, useState } from 'react';
import { getAttenderQueue, updateTokenStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, Badge, LoadingSpinner, EmptyState } from '@/components/ui-shared';

interface QueueToken {
    _id: string; tokenNumber: number; patientName: string; patientMobile: string;
    type: 'online' | 'offline'; status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled'; reason?: string;
}

export default function AttenderQueuePage() {
    const { token } = useAuth();
    const [queue, setQueue] = useState<QueueToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await getAttenderQueue(token!);
            setQueue(res.data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { if (token) fetchQueue(); }, [token]);

    const changeStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            await updateTokenStatus(token!, id, status, 'attender');
            setQueue(prev => prev.map(t => t._id === id ? { ...t, status: status as QueueToken['status'] } : t));
        } catch { /* ignore */ }
        finally { setUpdatingId(null); }
    };

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

    return (
        <div>
            <PageHeader
                title="Live Queue"
                subtitle={today}
                action={
                    <button onClick={fetchQueue} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition">
                        🔄 Refresh
                    </button>
                }
            />

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {[
                    { label: 'Total', val: queue.length, color: 'text-white' },
                    { label: 'Waiting', val: queue.filter(t => t.status === 'waiting').length, color: 'text-amber-400' },
                    { label: 'With Doctor', val: queue.filter(t => t.status === 'in_consultation').length, color: 'text-blue-400' },
                    { label: 'Done', val: queue.filter(t => t.status === 'completed').length, color: 'text-green-400' },
                ].map(s => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                        <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-slate-400 text-xs mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {loading ? <LoadingSpinner /> : queue.length === 0 ? <EmptyState message="Queue is empty today" icon="🎉" /> : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-white/10">
                                {['Token', 'Patient', 'Mobile', 'Type', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-5 py-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {queue.map((t, i) => (
                                <tr key={t._id} className={`border-b border-white/5 hover:bg-white/3 transition ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                                    <td className="px-5 py-4">
                                        <span className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-300 font-bold text-sm flex items-center justify-center">
                                            {t.tokenNumber}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-white font-medium">{t.patientName}</td>
                                    <td className="px-5 py-4 text-slate-400 text-sm">📱 {t.patientMobile}</td>
                                    <td className="px-5 py-4"><Badge variant={t.type}>{t.type}</Badge></td>
                                    <td className="px-5 py-4"><Badge variant={t.status}>{t.status.replace('_', ' ')}</Badge></td>
                                    <td className="px-5 py-4">
                                        <div className="flex gap-2">
                                            {t.status === 'waiting' && (
                                                <button onClick={() => changeStatus(t._id, 'in_consultation')} disabled={updatingId === t._id}
                                                    className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-xs transition disabled:opacity-50">
                                                    ▶ Send In
                                                </button>
                                            )}
                                            {(t.status === 'waiting' || t.status === 'in_consultation') && (
                                                <button onClick={() => changeStatus(t._id, 'cancelled')} disabled={updatingId === t._id}
                                                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition disabled:opacity-50">
                                                    ✕ Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
