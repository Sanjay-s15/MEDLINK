'use client';
import { useEffect, useState } from 'react';
import { getAdminMetrics } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, LoadingSpinner } from '@/components/ui-shared';

export default function AdminReportsPage() {
    const { token } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        getAdminMetrics(token).then(r => setMetrics(r.data)).catch(() => { }).finally(() => setLoading(false));
    }, [token]);

    if (loading) return <LoadingSpinner />;

    const barData = [
        { label: 'Online', value: metrics?.todaysTokens?.online || 0, color: 'bg-blue-500' },
        { label: 'Offline', value: metrics?.todaysTokens?.offline || 0, color: 'bg-teal-500' },
    ];
    const maxBar = Math.max(...barData.map(d => d.value), 1);

    const stats = [
        { label: 'Total Patients Registered', value: metrics?.patients || 0, icon: '👥', trend: '+12% this week' },
        { label: 'Clinics Approved', value: metrics?.clinics?.approved || 0, icon: '✅', trend: `${metrics?.clinics?.pending || 0} pending` },
        { label: 'Total Prescriptions', value: metrics?.prescriptionsTotal || 0, icon: '💊', trend: 'All time' },
        { label: 'Consents Requested', value: metrics?.consentsPending || 0, icon: '🔐', trend: 'Pending approval' },
    ];

    return (
        <div>
            <PageHeader title="Platform Reports" subtitle={`System snapshot as of ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`} />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(s => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <span className="text-3xl">{s.icon}</span>
                        <p className="text-3xl font-bold text-white mt-3 mb-1">{s.value}</p>
                        <p className="text-slate-400 text-sm">{s.label}</p>
                        <p className="text-slate-500 text-xs mt-1">{s.trend}</p>
                    </div>
                ))}
            </div>

            {/* Today's Token Bar Chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-6">Today's Token Breakdown</h3>
                <div className="flex items-end gap-6 h-40">
                    {barData.map(d => (
                        <div key={d.label} className="flex flex-col items-center gap-2 flex-1">
                            <span className="text-white font-bold text-lg">{d.value}</span>
                            <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                                <div className={`w-full rounded-t-xl ${d.color}`} style={{ height: `${(d.value / maxBar) * 100}%`, minHeight: d.value > 0 ? '8px' : '0', opacity: 0.85 }} />
                            </div>
                            <span className="text-slate-400 text-sm">{d.label}</span>
                        </div>
                    ))}
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <span className="text-white font-bold text-lg">{metrics?.todaysTokens?.total || 0}</span>
                        <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                            <div className="w-full rounded-t-xl bg-violet-500" style={{ height: `${((metrics?.todaysTokens?.total || 0) / Math.max(metrics?.todaysTokens?.total || 1, 1)) * 100}%`, minHeight: (metrics?.todaysTokens?.total || 0) > 0 ? '8px' : '0', opacity: 0.85 }} />
                        </div>
                        <span className="text-slate-400 text-sm">Total</span>
                    </div>
                </div>
            </div>

            {/* Staff distribution */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Staff Distribution</h3>
                <div className="space-y-3">
                    {[
                        { label: 'Doctors', val: metrics?.staff?.doctors || 0, total: (metrics?.staff?.doctors || 0) + (metrics?.staff?.attenders || 0), color: 'bg-blue-500' },
                        { label: 'Attenders', val: metrics?.staff?.attenders || 0, total: (metrics?.staff?.doctors || 0) + (metrics?.staff?.attenders || 0), color: 'bg-teal-500' },
                    ].map(s => (
                        <div key={s.label}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">{s.label}</span>
                                <span className="text-slate-400">{s.val} / {s.total}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2">
                                <div className={`${s.color} h-2 rounded-full transition-all`} style={{ width: s.total > 0 ? `${(s.val / s.total) * 100}%` : '0%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
