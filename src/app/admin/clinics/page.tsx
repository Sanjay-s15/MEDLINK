'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getClinics, updateClinicStatus, createClinic, getClinicDoctors } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, Badge, LoadingSpinner, EmptyState } from '@/components/ui-shared';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface Clinic {
    _id: string; name: string; address: string; phone: string;
    status: 'pending' | 'approved' | 'rejected'; createdAt: string;
}
interface Doctor { _id: string; name: string; specialization?: string; isActive: boolean; }

const emptyForm = {
    name: '', address: '', phone: '',
    latitude: 12.9716, longitude: 77.5946,   // default: Bangalore centre
    openTime: '09:00', closeTime: '18:00',
};

export default function AdminClinicsPage() {
    const { token } = useAuth();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [mapKey, setMapKey] = useState(0);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [clinicDoctors, setClinicDoctors] = useState<Record<string, Doctor[]>>({});

    const fetchClinics = async () => {
        try { const r = await getClinics(token!); setClinics(r.data); }
        catch { } finally { setLoading(false); }
    };

    useEffect(() => { if (token) fetchClinics(); }, [token]);

    const toggleExpand = async (id: string) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        if (!clinicDoctors[id]) {
            try {
                const r = await getClinicDoctors(token!, id);
                setClinicDoctors(prev => ({ ...prev, [id]: r.data }));
            } catch { setClinicDoctors(prev => ({ ...prev, [id]: [] })); }
        }
    };

    const handleStatus = async (id: string, status: string) => {
        try {
            await updateClinicStatus(token!, id, status);
            setClinics(prev => prev.map(c => c._id === id ? { ...c, status: status as Clinic['status'] } : c));
        } catch { }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            await createClinic(token!, {
                name: form.name,
                address: form.address,
                phone: form.phone,
                latitude: form.latitude,
                longitude: form.longitude,
                openTime: form.openTime,
                closeTime: form.closeTime,
            });
            // Re-fetch the full list so the new clinic name, _id, createdAt
            // are exactly as stored in the database (no shape mismatch)
            await fetchClinics();
            setShowForm(false);
            setForm(emptyForm);
            setMapKey(k => k + 1);
        } catch (err: any) { alert(err.message); }
        finally { setSaving(false); }
    };

    // Called by MapPicker whenever user clicks/drags/searches
    const handleMapChange = (lat: number, lng: number, address: string) => {
        setForm(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: address,   // auto-fill address from reverse geocode
        }));
    };

    const filtered = clinics.filter(c => filter === 'all' || (c.status ?? 'pending') === filter);

    return (
        <div>
            <PageHeader
                title="Clinic Management"
                subtitle="Approve, reject, and manage all registered clinics"
                action={
                    <button onClick={() => { setShowForm(!showForm); if (showForm) { setForm(emptyForm); setMapKey(k => k + 1); } }}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition">
                        {showForm ? '✕ Cancel' : '+ Add Clinic'}
                    </button>
                }
            />

            {/* ── Add Clinic Form ── */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-white/5 border border-violet-500/30 rounded-2xl p-6 mb-8 space-y-6">
                    <h3 className="text-white font-semibold text-lg">📍 New Clinic</h3>

                    {/* Basic details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-slate-400 text-xs mb-1.5">Clinic Name *</label>
                            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. City Health Clinic" required
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1.5">Phone *</label>
                            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                placeholder="9XXXXXXXXX" required
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1.5">Hours</label>
                            <div className="flex items-center gap-2">
                                <input type="time" value={form.openTime} onChange={e => setForm(p => ({ ...p, openTime: e.target.value }))}
                                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                <span className="text-slate-500 text-sm">–</span>
                                <input type="time" value={form.closeTime} onChange={e => setForm(p => ({ ...p, closeTime: e.target.value }))}
                                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                        </div>
                    </div>

                    {/* Map picker section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">Pick Location on Map *</label>
                            {form.latitude !== emptyForm.latitude && (
                                <span className="text-emerald-400 text-xs font-semibold">📍 Location set</span>
                            )}
                        </div>
                        <MapPicker key={mapKey} lat={form.latitude} lng={form.longitude} onChange={handleMapChange} />
                    </div>

                    {/* Address — auto-filled from map, but editable */}
                    <div>
                        <label className="block text-slate-400 text-xs mb-1.5">
                            Address <span className="text-slate-600">(auto-filled from map, you can edit)</span>
                        </label>
                        <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                            placeholder="Full address will be auto-filled when you pick a location on the map" required rows={2}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                    </div>

                    {/* Lat/Lng read-only display */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Latitude', value: form.latitude.toFixed(6) },
                            { label: 'Longitude', value: form.longitude.toFixed(6) },
                        ].map(f => (
                            <div key={f.label}>
                                <label className="block text-slate-500 text-xs mb-1.5">{f.label} <span className="text-slate-600">(from map)</span></label>
                                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-emerald-400 text-sm font-mono">
                                    {f.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving || !form.address}
                            className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2">
                            {saving ? '⏳ Creating…' : '✓ Create Clinic'}
                        </button>
                        <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setMapKey(k => k + 1); }}
                            className="px-6 py-2.5 border border-white/20 text-slate-400 hover:text-white rounded-xl font-medium transition">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* ── Filter Tabs ── */}
            <div className="flex gap-2 mb-6">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${filter === f ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                        {f} ({f === 'all' ? clinics.length : clinics.filter(c => (c.status ?? 'pending') === f).length})
                    </button>
                ))}
            </div>

            {/* ── Clinic List ── */}
            {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState message="No clinics found" icon="🏥" /> : (
                <div className="space-y-3">
                    {filtered.map(c => {
                        const isExpanded = expandedId === c._id;
                        const doctors = clinicDoctors[c._id];
                        return (
                            <div key={c._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] transition">
                                {/* Main row */}
                                <div className="p-5 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                                            <p className="text-white font-semibold">{c.name ?? '—'}</p>
                                            <Badge variant={(c.status ?? 'pending') as any}>{c.status ?? 'pending'}</Badge>
                                        </div>
                                        <p className="text-slate-400 text-sm">📍 {c.address ?? 'No address'}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">📞 {c.phone ?? '—'} · Added {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Doctors toggle */}
                                        <button onClick={() => toggleExpand(c._id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${isExpanded ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'}`}>
                                            🩺 Doctors {isExpanded ? '▲' : '▼'}
                                        </button>
                                        {(c.status ?? 'pending') === 'pending' && <>
                                            <button onClick={() => handleStatus(c._id, 'approved')}
                                                className="px-3 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-green-300 rounded-lg text-xs font-medium transition">
                                                ✓ Approve
                                            </button>
                                            <button onClick={() => handleStatus(c._id, 'rejected')}
                                                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition">
                                                ✕ Reject
                                            </button>
                                        </>
                                        }
                                        {(c.status ?? '') === 'approved' && (
                                            <button onClick={() => handleStatus(c._id, 'rejected')}
                                                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition">
                                                Suspend
                                            </button>
                                        )}
                                        {(c.status ?? '') === 'rejected' && (
                                            <button onClick={() => handleStatus(c._id, 'approved')}
                                                className="px-3 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-green-300 rounded-lg text-xs font-medium transition">
                                                Re-approve
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Doctors panel */}
                                {isExpanded && (
                                    <div className="border-t border-white/10 px-5 py-4 bg-black/20">
                                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Assigned Doctors</p>
                                        {!doctors ? (
                                            <p className="text-slate-600 text-xs">Loading…</p>
                                        ) : doctors.length === 0 ? (
                                            <div className="flex items-center gap-3 text-slate-500 text-sm">
                                                <span>⚠️</span>
                                                <div>
                                                    <p>No doctors assigned to this clinic yet.</p>
                                                    <a href="/admin/staff" className="text-violet-400 hover:text-violet-300 text-xs underline underline-offset-2">
                                                        Go to Staff Management → assign a doctor
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {doctors.map(d => (
                                                    <div key={d._id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                            {d.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-white text-sm font-medium">{d.name}</p>
                                                            {d.specialization && <p className="text-slate-500 text-xs">{d.specialization}</p>}
                                                        </div>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${d.isActive ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 'text-red-400 border-red-400/30 bg-red-400/10'}`}>
                                                            {d.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                ))}
                                                <a href="/admin/staff" className="inline-block text-violet-400 hover:text-violet-300 text-xs underline underline-offset-2 mt-1 transition">
                                                    + Manage doctor assignments →
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

