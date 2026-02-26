'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getPrescriptions } from '@/lib/api';

interface Visit {
    _id: string; date: string; clinicName: string; doctorName: string;
    diagnosis: string; medications: { name: string; dosage: string; duration: string }[];
    notes?: string; followUpDate?: string; createdAt: string;
}

export default function MedicalHistoryPage() {
    const { token } = useAuth();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        getPrescriptions(token).then(r => {
            // Map prescriptions to visit timeline
            const raw = r.data || [];
            setVisits(raw.map((p: any) => ({
                _id: p._id,
                date: p.createdAt,
                clinicName: p.clinicId?.name || 'Unknown Clinic',
                doctorName: p.doctorId?.name || 'Unknown Doctor',
                diagnosis: p.diagnosis,
                medications: p.medications || [],
                notes: p.notes,
                followUpDate: p.followUpDate,
                createdAt: p.createdAt,
            })));
        }).catch(() => { }).finally(() => setLoading(false));
    }, [token]);

    const filtered = visits.filter(v => {
        const d = new Date(v.date);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo && d > new Date(dateTo)) return false;
        return true;
    });

    // Group by month-year
    const grouped = filtered.reduce<Record<string, Visit[]>>((acc, v) => {
        const key = new Date(v.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(v);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Medical History</h1>
                <p className="text-slate-500 text-sm mt-1">Complete timeline of your visits and treatments</p>
            </div>

            {/* Filters */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-3">Filter by Date Range</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <label className="block text-slate-500 text-xs mb-1.5">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-slate-500 text-xs mb-1.5">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition" />
                    </div>
                    {(dateFrom || dateTo) && (
                        <div className="flex items-end">
                            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                                className="px-4 py-2.5 border border-[#30363d] text-slate-400 hover:text-white rounded-xl text-sm transition">
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary cards */}
            {!loading && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Visits', value: visits.length, icon: '🏥', color: 'text-blue-400' },
                        { label: 'Medicines Used', value: [...new Set(visits.flatMap(v => v.medications.map(m => m.name)))].length, icon: '💊', color: 'text-emerald-400' },
                        { label: 'Unique Clinics', value: [...new Set(visits.map(v => v.clinicName))].length, icon: '📍', color: 'text-purple-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 text-center">
                            <p className="text-2xl mb-1">{s.icon}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-slate-500 text-xs mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Timeline */}
            {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-[#161b22] border border-[#30363d] rounded-2xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-5xl mb-3">📋</p>
                    <p className="text-white font-semibold">No history found</p>
                    <p className="text-slate-500 text-sm mt-1">{dateFrom || dateTo ? 'Try adjusting the date range' : 'Your visit history will appear here'}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(grouped).map(([month, monthVisits]) => (
                        <div key={month}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-[#30363d]" />
                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{month}</span>
                                <div className="h-px flex-1 bg-[#30363d]" />
                            </div>
                            <div className="space-y-3">
                                {monthVisits.map((v, i) => {
                                    const isExpanded = expanded === v._id;
                                    return (
                                        <div key={v._id} className="flex gap-4">
                                            {/* Timeline dot */}
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d1117] mt-5" />
                                                {i < monthVisits.length - 1 && <div className="w-px flex-1 bg-[#30363d] mt-1" />}
                                            </div>
                                            {/* Card */}
                                            <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden mb-3">
                                                <button className="w-full text-left p-5" onClick={() => setExpanded(isExpanded ? null : v._id)}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-white font-semibold">{v.diagnosis}</p>
                                                            <p className="text-slate-500 text-xs mt-1">Dr. {v.doctorName} · {v.clinicName}</p>
                                                            <p className="text-slate-600 text-xs mt-0.5">
                                                                {new Date(v.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs border border-blue-500/20">
                                                                {v.medications.length} med{v.medications.length !== 1 ? 's' : ''}
                                                            </span>
                                                            <span className="text-slate-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                                {isExpanded && (
                                                    <div className="border-t border-[#30363d] px-5 pb-5 pt-4 space-y-3">
                                                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Medications</p>
                                                        <div className="space-y-2">
                                                            {v.medications.map((m, mi) => (
                                                                <div key={mi} className="flex items-center justify-between bg-[#0d1117] rounded-xl px-4 py-3 text-sm">
                                                                    <span className="text-white font-medium">💊 {m.name}</span>
                                                                    <span className="text-slate-400 text-xs">{m.dosage} · {m.duration}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {v.notes && (
                                                            <div className="bg-[#0d1117] rounded-xl p-3">
                                                                <p className="text-slate-500 text-xs mb-1">Doctor Notes</p>
                                                                <p className="text-slate-300 text-sm">{v.notes}</p>
                                                            </div>
                                                        )}
                                                        {v.followUpDate && (
                                                            <p className="text-emerald-400 text-xs">📅 Follow-up: {v.followUpDate}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
