'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createPrescription, searchPatient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, LoadingSpinner } from '@/components/ui-shared';
import MedicineAutocomplete from '@/components/MedicineAutocomplete';

interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions: string }
const defaultMed = (): Medication => ({ name: '', dosage: '', frequency: 'Twice daily', duration: '3 days', instructions: '' });

const FREQUENCIES = ['Once daily', 'Twice daily', 'Thrice daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'At bedtime', 'As needed'];
const DURATIONS = ['1 day', '2 days', '3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '3 months', 'Until review'];

const inp = 'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const sel = `${inp} cursor-pointer`;

function PrescriptionForm() {
    const params = useSearchParams();
    const router = useRouter();
    const { token } = useAuth();

    const tokenId = params.get('tokenId') || '';
    const initMobile = params.get('mobile') || '';
    const initName = params.get('name') ? decodeURIComponent(params.get('name')!) : '';
    const initPatientId = params.get('patientId') || '';

    const [patientMobile, setPatientMobile] = useState(initMobile);
    const [patientName] = useState(initName);
    const [patientId, setPatientId] = useState(initPatientId);
    const [diagnosis, setDiagnosis] = useState('');
    const [medications, setMedications] = useState<Medication[]>([defaultMed()]);
    const [notes, setNotes] = useState('');
    const [followUp, setFollowUp] = useState('');
    const [loading, setLoading] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Auto-resolve patient by mobile on mount (patientId may be empty when coming from queue)
    useEffect(() => {
        if (initPatientId || !initMobile || !token) return;
        setLookingUp(true);
        searchPatient(token, initMobile)
            .then(res => setPatientId(res.data._id))
            .catch(() => { /* will show manual lookup form */ })
            .finally(() => setLookingUp(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addMed = () => setMedications(p => [...p, defaultMed()]);
    const removeMed = (i: number) => setMedications(p => p.filter((_, idx) => idx !== i));
    const updateMed = (i: number, field: keyof Medication, val: string) =>
        setMedications(p => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });

    const handleLookup = async () => {
        setLookingUp(true); setError('');
        try {
            const res = await searchPatient(token!, patientMobile);
            setPatientId(res.data._id);
        } catch {
            setError('Patient not found — they must have logged in at least once via the patient portal.');
        }
        finally { setLookingUp(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) { setError('Resolve patient first'); return; }
        setLoading(true); setError('');
        try {
            await createPrescription(token!, {
                tokenId, patientId, patientMobile,
                diagnosis, medications, notes, followUpDate: followUp,
            });
            setSuccess(true);
            setTimeout(() => router.push('/doctor'), 2000);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    if (success) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-white text-xl font-semibold">Prescription saved!</p>
                <p className="text-slate-400 text-sm mt-1">Redirecting back to queue…</p>
            </div>
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Create Prescription"
                subtitle={patientName
                    ? `For: ${patientName}${patientMobile ? ` · ${patientMobile}` : ''}`
                    : 'Fill in patient details and medications'}
            />

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* ── Patient lookup (shown only if patientId not yet resolved) ── */}
                {!patientId && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
                        <h3 className="text-white font-semibold mb-3 sm:mb-4">Patient</h3>
                        {lookingUp ? (
                            <div className="flex items-center gap-3 text-slate-400 text-sm">
                                <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                Resolving patient…
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    value={patientMobile}
                                    onChange={e => setPatientMobile(e.target.value)}
                                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                    placeholder="Patient mobile number"
                                    maxLength={10}
                                />
                                <button type="button" onClick={handleLookup} disabled={lookingUp}
                                    className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition">
                                    Find
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Diagnosis ── */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
                    <label className="block text-white font-semibold mb-3">Diagnosis *</label>
                    <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Viral Fever, Hypertension" />
                </div>

                {/* ── Medications ── */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-white font-semibold">Medications</h3>
                        <button type="button" onClick={addMed}
                            className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-sm transition">
                            + Add Medicine
                        </button>
                    </div>

                    <div className="space-y-4">
                        {medications.map((m, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 relative">
                                {medications.length > 1 && (
                                    <button type="button" onClick={() => removeMed(i)}
                                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center text-xs transition">
                                        ✕
                                    </button>
                                )}
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                                    Medicine #{i + 1}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                    {/* Name — Autocomplete */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-slate-400 text-xs mb-1">Medicine Name *</label>
                                        <MedicineAutocomplete
                                            value={m.name}
                                            onChange={val => updateMed(i, 'name', val)}
                                            placeholder="Start typing medicine name…"
                                            className={inp}
                                            required
                                        />
                                    </div>

                                    {/* Dosage */}
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Dosage *</label>
                                        <input value={m.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} required
                                            className={inp} placeholder="e.g., 500mg, 10ml" />
                                    </div>

                                    {/* Frequency */}
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Frequency *</label>
                                        <select value={m.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} required className={sel}>
                                            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Duration *</label>
                                        <select value={m.duration} onChange={e => updateMed(i, 'duration', e.target.value)} required className={sel}>
                                            {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>

                                    {/* Instructions */}
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1">Instructions</label>
                                        <input value={m.instructions} onChange={e => updateMed(i, 'instructions', e.target.value)}
                                            className={inp} placeholder="e.g., After food, Before sleep" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Notes + Follow-up ── */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-white font-semibold mb-2">Doctor Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Additional notes for patient…" />
                        </div>
                        <div>
                            <label className="block text-white font-semibold mb-2">Follow-up Date</label>
                            <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading || lookingUp}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white rounded-2xl font-semibold text-lg transition disabled:opacity-50 shadow-xl">
                    {loading ? 'Saving…' : '💊 Save Prescription'}
                </button>
            </form>
        </div>
    );
}

export default function PrescriptionPage() {
    return <Suspense fallback={<LoadingSpinner />}><PrescriptionForm /></Suspense>;
}
