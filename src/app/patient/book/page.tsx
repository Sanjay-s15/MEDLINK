'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getNearbyClinics, bookAppointment } from '@/lib/api';

interface Doctor { _id: string; name: string; specialization?: string; }
interface Clinic {
    _id: string; name: string; address: string; phone: string;
    queueCount: number; distance?: number; doctors?: Doctor[];
}

export default function BookAppointmentPage() {
    const { token } = useAuth();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [booking, setBooking] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [modal, setModal] = useState<Clinic | null>(null);
    const [result, setResult] = useState<{ tokenNumber: number; clinicName: string } | null>(null);
    const [error, setError] = useState('');
    const [hasGps, setHasGps] = useState(false);

    useEffect(() => {
        if (!token) return;
        (async () => {
            let lat: number | undefined, lng: number | undefined;
            if ('geolocation' in navigator) {
                try {
                    const pos = await new Promise<GeolocationPosition>((res, rej) =>
                        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
                    );
                    lat = pos.coords.latitude; lng = pos.coords.longitude;
                    setHasGps(true);
                } catch { /* GPS denied/unavailable */ }
            }
            try {
                const r = await getNearbyClinics(token, lat, lng);
                setClinics(r.data);
            } catch { setError('Failed to load clinics'); }
            finally { setLoading(false); }
        })();
    }, [token]);

    const handleBook = async () => {
        if (!modal) return;
        setBooking(modal._id);
        try {
            const r = await bookAppointment(token!, modal._id, undefined, reason || undefined);
            setResult({ tokenNumber: r.data.tokenNumber, clinicName: modal.name });
            setModal(null); setReason('');
        } catch (e: any) { setError(e.message); }
        finally { setBooking(null); }
    };

    const q = search.toLowerCase().trim();
    const filtered = clinics.filter(c =>
        !q ||
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.address ?? '').toLowerCase().includes(q) ||
        (c.doctors ?? []).some(d =>
            d.name.toLowerCase().includes(q) ||
            (d.specialization ?? '').toLowerCase().includes(q)
        )
    );

    /* ── Booking success view ── */
    if (result) return (
        <div className="flex items-center justify-center py-24">
            <div className="text-center max-w-sm w-full">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <span className="text-4xl">🎫</span>
                </div>
                <h2 className="text-white text-2xl font-bold mb-1">Booked!</h2>
                <p className="text-slate-400 text-sm mb-6">{result.clinicName}</p>
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 mb-6">
                    <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Your Token</p>
                    <p className="text-8xl font-black text-white">{result.tokenNumber}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setResult(null)}
                        className="flex-1 py-3 border border-[#30363d] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/5 transition">
                        Book Another
                    </button>
                    <a href="/patient/token"
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium text-center transition">
                        📍 Track Status
                    </a>
                </div>
            </div>
        </div>
    );

    /* ── Main view ── */
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Book Appointment</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Find and book a clinic near you
                    {hasGps && <span className="ml-2 text-emerald-500 text-xs">📍 Sorted by distance</span>}
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                    placeholder="Search by clinic name, area, or doctor name…" />
                {search && (
                    <button onClick={() => setSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-sm transition">
                        ✕
                    </button>
                )}
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

            {/* Clinic List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#161b22] border border-[#30363d] rounded-2xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-4xl mb-3">🏥</p>
                    <p className="text-white font-semibold">No clinics found</p>
                    <p className="text-slate-500 text-sm mt-1">
                        {search ? `No results for "${search}" — try a different search` : 'No approved clinics available right now'}
                    </p>
                    {search && (
                        <button onClick={() => setSearch('')} className="mt-4 text-emerald-400 text-sm underline underline-offset-2">
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-slate-500 text-xs">
                        {filtered.length} clinic{filtered.length !== 1 ? 's' : ''}
                        {search ? ` matching "${search}"` : hasGps ? ' · nearest first' : ''}
                    </p>
                    {filtered.map((c, idx) => (
                        <div key={c._id} className="bg-[#161b22] border border-[#30363d] hover:border-emerald-500/30 rounded-2xl p-5 transition group">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    {/* Nearest badge */}
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl border border-emerald-500/20">🏥</div>
                                        {hasGps && idx === 0 && !search && (
                                            <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-emerald-500 text-black font-black px-1 rounded-full">NEAR</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-semibold text-base group-hover:text-emerald-400 transition truncate">
                                            {c.name ?? 'Unnamed Clinic'}
                                        </h3>
                                        <p className="text-slate-500 text-xs mt-0.5">📍 {c.address ?? 'Address not available'}</p>
                                        <p className="text-slate-500 text-xs">📞 {c.phone ?? '—'}</p>

                                        {/* Doctors list */}
                                        {c.doctors && c.doctors.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {c.doctors.map(d => (
                                                    <span key={d._id}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border
                                                            ${q && (d.name.toLowerCase().includes(q) || (d.specialization ?? '').toLowerCase().includes(q))
                                                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'  // highlight matched doctor
                                                                : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                                        🩺 {d.name}{d.specialization ? ` · ${d.specialization}` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {c.doctors && c.doctors.length === 0 && (
                                            <p className="text-slate-600 text-xs mt-1.5">No doctors assigned yet</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: queue + distance */}
                                <div className="text-right shrink-0 space-y-1">
                                    <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold 
                                        ${c.queueCount > 10
                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                        {c.queueCount} in queue
                                    </div>
                                    {c.distance !== undefined && (
                                        <p className="text-teal-400 text-xs">🚶 {c.distance} km</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[#30363d]">
                                <button onClick={() => { setModal(c); setError(''); }}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
                                    Book Appointment →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Confirmation Modal ── */}
            {modal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">Confirm Booking</h3>
                            <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-xl transition">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex gap-3 items-start">
                                <span className="text-2xl mt-0.5">🏥</span>
                                <div>
                                    <p className="text-white font-semibold">{modal.name ?? 'Clinic'}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{modal.address ?? ''}</p>
                                    {modal.doctors && modal.doctors.length > 0 && (
                                        <p className="text-slate-400 text-xs mt-1">
                                            🩺 {modal.doctors.map(d => d.name).join(', ')}
                                        </p>
                                    )}
                                    <p className="text-amber-400 text-xs mt-1">👥 {modal.queueCount ?? 0} currently in queue</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-medium mb-2">
                                    Reason for visit <span className="text-slate-600">(optional)</span>
                                </label>
                                <input value={reason} onChange={e => setReason(e.target.value)}
                                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                                    placeholder="e.g., Fever, Routine checkup…" />
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                                <p className="text-blue-300 text-xs">ℹ️ You'll receive a token number after booking. Track your position in the queue from the app.</p>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button onClick={() => setModal(null)}
                                className="flex-1 py-3 border border-[#30363d] text-slate-400 hover:text-white hover:border-slate-500 rounded-xl text-sm font-medium transition">
                                Cancel
                            </button>
                            <button onClick={handleBook} disabled={booking === modal._id}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition">
                                {booking === modal._id ? 'Booking…' : '🎫 Confirm Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
