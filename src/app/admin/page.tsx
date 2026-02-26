'use client';
import { useEffect, useState } from 'react';
import { getAdminMetrics } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { StatCard, LoadingSpinner, PageHeader } from '@/components/ui-shared';

interface Metrics {
    clinics: { total: number; approved: number; pending: number };
    staff: { doctors: number; attenders: number };
    patients: number;
    todaysTokens: { total: number; online: number; offline: number };
    prescriptionsTotal: number;
    consentsPending: number;
}

export default function AdminDashboardPage() {
    const { token, user } = useAuth();
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        getAdminMetrics(token).then(r => setMetrics(r.data)).catch(() => { }).finally(() => setLoading(false));
    }, [token]);

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`} subtitle="Platform overview — today's activity" />

            {metrics && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Clinics" value={metrics.clinics.total} icon="🏥" color="from-violet-500 to-purple-600" sub={`${metrics.clinics.approved} approved`} />
                        <StatCard label="Pending Clinics" value={metrics.clinics.pending} icon="⏳" color="from-amber-500 to-orange-600" sub="Need review" />
                        <StatCard label="Doctors" value={metrics.staff.doctors} icon="🩺" color="from-blue-500 to-indigo-600" />
                        <StatCard label="Attenders" value={metrics.staff.attenders} icon="👤" color="from-teal-500 to-cyan-600" />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Registered Patients" value={metrics.patients} icon="👥" color="from-green-500 to-emerald-600" />
                        <StatCard label="Today's Tokens" value={metrics.todaysTokens.total} icon="🎫" color="from-pink-500 to-rose-600"
                            sub={`${metrics.todaysTokens.online} online · ${metrics.todaysTokens.offline} offline`} />
                        <StatCard label="Total Prescriptions" value={metrics.prescriptionsTotal} icon="💊" color="from-indigo-500 to-blue-600" />
                        <StatCard label="Pending Consents" value={metrics.consentsPending} icon="🔐" color="from-amber-400 to-yellow-600" sub="Awaiting patient response" />
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Manage Clinics', href: '/admin/clinics', icon: '🏥', color: 'from-violet-500 to-purple-600' },
                                { label: 'Manage Staff', href: '/admin/staff', icon: '👥', color: 'from-blue-500 to-indigo-600' },
                                { label: 'View Reports', href: '/admin/reports', icon: '📈', color: 'from-green-500 to-emerald-600' },
                            ].map(a => (
                                <a key={a.label} href={a.href}
                                    className={`flex items-center gap-3 p-4 bg-gradient-to-r ${a.color} rounded-xl text-white hover:opacity-90 transition-all hover:scale-105`}>
                                    <span className="text-2xl">{a.icon}</span>
                                    <span className="font-medium text-sm">{a.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
