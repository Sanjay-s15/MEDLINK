'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getPrescriptions } from '@/lib/api';

interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions?: string }
interface Presc {
    _id: string; diagnosis: string; medications: Medication[]; notes?: string;
    followUpDate?: string; createdAt: string;
    doctorId?: { name: string; specialization?: string };
    clinicId?: { name: string };
}

export default function PrescriptionsPage() {
    const { token } = useAuth();
    const [prescriptions, setPrescriptions] = useState<Presc[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!token) return;
        getPrescriptions(token).then(r => setPrescriptions(r.data || [])).catch(() => { }).finally(() => setLoading(false));
    }, [token]);

    const selected = prescriptions.find(p => p._id === selectedId);
    const filtered = prescriptions.filter(p =>
        p.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
        p.doctorId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.clinicId?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Prescriptions</h1>
                <p className="text-slate-500 text-sm mt-1">{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} on record</p>
            </div>

            {/* Search */}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                    placeholder="Search by diagnosis, doctor, or clinic…" />
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#161b22] border border-[#30363d] rounded-2xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-5xl mb-3">💊</p>
                    <p className="text-white font-semibold">No prescriptions {search ? 'match your search' : 'yet'}</p>
                    <p className="text-slate-500 text-sm mt-1">Prescriptions will appear here after a consultation</p>
                </div>
            ) : (
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-x-auto">
                    <div className="min-w-[650px]">
                        {/* Table header */}
                        <div className="grid grid-cols-12 px-5 py-3 border-b border-[#30363d] text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            <div className="col-span-1">#</div>
                            <div className="col-span-3">Date</div>
                            <div className="col-span-3">Diagnosis</div>
                            <div className="col-span-2">Doctor</div>
                            <div className="col-span-2">Clinic</div>
                            <div className="col-span-1 text-right">View</div>
                        </div>
                        {/* Rows */}
                        <div className="divide-y divide-[#30363d]">
                            {filtered.map((p, i) => (
                                <div key={p._id} className="grid grid-cols-12 px-5 py-4 items-center hover:bg-white/2 transition">
                                    <div className="col-span-1">
                                        <span className="w-7 h-7 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                    </div>
                                    <div className="col-span-3 text-slate-400 text-sm">
                                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="col-span-3 text-white text-sm font-medium truncate pr-2">{p.diagnosis}</div>
                                    <div className="col-span-2 text-slate-400 text-xs truncate">{p.doctorId?.name || '—'}</div>
                                    <div className="col-span-2 text-slate-400 text-xs truncate">{p.clinicId?.name || '—'}</div>
                                    <div className="col-span-1 text-right">
                                        <button onClick={() => setSelectedId(p._id)}
                                            className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded-lg transition font-medium">
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal header */}
                        <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold">Prescription Detail</h3>
                                <p className="text-slate-500 text-xs">{new Date(selected.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-white text-xl transition">✕</button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Clinic + Doctor */}
                            <div className="bg-[#0d1117] rounded-xl p-4 flex gap-4">
                                <span className="text-3xl">🏥</span>
                                <div>
                                    <p className="text-white font-semibold">{selected.clinicId?.name}</p>
                                    <p className="text-slate-400 text-sm">Dr. {selected.doctorId?.name}</p>
                                    {selected.doctorId?.specialization && <p className="text-blue-400 text-xs">{selected.doctorId.specialization}</p>}
                                </div>
                            </div>
                            {/* Diagnosis */}
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Diagnosis</p>
                                <p className="text-white font-semibold text-lg">{selected.diagnosis}</p>
                            </div>
                            {/* Medications */}
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">Medications ({selected.medications.length})</p>
                                <div className="space-y-2">
                                    {selected.medications.map((m, i) => (
                                        <div key={i} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4">
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="text-white font-semibold">💊 {m.name}</p>
                                                <span className="text-emerald-400 text-xs font-semibold">{m.dosage}</span>
                                            </div>
                                            <div className="flex gap-3 text-slate-500 text-xs mt-1">
                                                <span>🔁 {m.frequency}</span>
                                                <span>⏱ {m.duration}</span>
                                            </div>
                                            {m.instructions && <p className="text-amber-400 text-xs mt-2">📌 {m.instructions}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Notes */}
                            {selected.notes && (
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Doctor Notes</p>
                                    <p className="text-slate-300 text-sm bg-[#0d1117] rounded-xl p-4 border border-[#30363d]">{selected.notes}</p>
                                </div>
                            )}
                            {/* Follow-up */}
                            {selected.followUpDate && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                                    <span className="text-2xl">📅</span>
                                    <div>
                                        <p className="text-emerald-400 text-sm font-semibold">Follow-up Appointment</p>
                                        <p className="text-slate-400 text-xs">{selected.followUpDate}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 pb-6">
                            <button onClick={() => setSelectedId(null)}
                                className="w-full py-3 border border-[#30363d] text-slate-400 hover:text-white hover:border-slate-500 rounded-xl text-sm font-medium transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
