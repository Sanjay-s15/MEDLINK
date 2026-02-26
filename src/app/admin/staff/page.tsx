'use client';
import { useEffect, useState } from 'react';
import { getStaff, createStaff, deactivateUser, getClinics, updateUser } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader, Badge, LoadingSpinner, EmptyState } from '@/components/ui-shared';

interface StaffUser {
    _id: string; name: string; mobile: string; role: 'doctor' | 'attender';
    specialization?: string; clinicId?: { _id: string; name: string }; isActive: boolean;
}
interface Clinic { _id: string; name: string; status: string; }

const emptyForm = {
    mobile: '', name: '', role: 'doctor', password: '',
    clinicId: '', specialization: '', regNumber: '', email: '',
};

export default function AdminStaffPage() {
    const { token } = useAuth();
    const [staff, setStaff] = useState<StaffUser[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [roleFilter, setRoleFilter] = useState<'all' | 'doctor' | 'attender'>('all');

    // Inline clinic reassignment
    const [reassignId, setReassignId] = useState<string | null>(null);
    const [reassignClinic, setReassignClinic] = useState('');
    const [reassigning, setReassigning] = useState(false);

    const fetchAll = async () => {
        try {
            const [s, c] = await Promise.all([getStaff(token!), getClinics(token!)]);
            setStaff(s.data);
            setClinics(c.data.filter((cl: any) => cl.status === 'approved'));
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { if (token) fetchAll(); }, [token]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            await createStaff(token!, form);
            await fetchAll();
            setShowForm(false); setForm(emptyForm);
        } catch (err: any) { alert(err.message); }
        finally { setSaving(false); }
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm('Deactivate this user?')) return;
        try {
            await deactivateUser(token!, id);
            setStaff(prev => prev.map(s => s._id === id ? { ...s, isActive: false } : s));
        } catch { }
    };

    const handleReassign = async (userId: string) => {
        setReassigning(true);
        try {
            const res = await updateUser(token!, userId, { clinicId: reassignClinic });
            setStaff(prev => prev.map(s => s._id === userId ? { ...s, clinicId: res.data.clinicId } : s));
            setReassignId(null); setReassignClinic('');
        } catch (err: any) { alert(err.message); }
        finally { setReassigning(false); }
    };

    const filtered = staff.filter(s => roleFilter === 'all' || s.role === roleFilter);
    const approvedClinics = clinics.filter(c => c.status === 'approved');

    const inp = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500';

    return (
        <div>
            <PageHeader title="Staff Management" subtitle="Add doctors and clinic attenders, manage clinic assignments"
                action={
                    <button onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition">
                        {showForm ? '✕ Cancel' : '+ Add Staff'}
                    </button>
                }
            />

            {/* ── Add Staff Form ── */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-white/5 border border-violet-500/30 rounded-2xl p-6 mb-8 space-y-4">
                    <h3 className="text-white font-semibold text-lg">👤 New Staff Member</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs mb-1.5">Full Name *</label>
                            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Dr. Priya Sharma" required className={inp} />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1.5">Mobile *</label>
                            <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                                placeholder="9XXXXXXXXX" required className={inp} />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1.5">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                placeholder="staff@clinic.com" className={inp} />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1.5">Password *</label>
                            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                placeholder="••••••••" required className={inp} />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1.5">Role *</label>
                            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} required className={inp}>
                                <option value="doctor">🩺 Doctor</option>
                                <option value="attender">🏥 Attender</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs mb-1.5">Assign to Clinic *</label>
                            <select value={form.clinicId} onChange={e => setForm(p => ({ ...p, clinicId: e.target.value }))} required className={inp}>
                                <option value="">— Select Clinic —</option>
                                {approvedClinics.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        {form.role === 'doctor' && (
                            <>
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1.5">Specialization</label>
                                    <input value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))}
                                        placeholder="General Physician" className={inp} />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1.5">Reg. Number</label>
                                    <input value={form.regNumber} onChange={e => setForm(p => ({ ...p, regNumber: e.target.value }))}
                                        placeholder="MCI-XXXXX" className={inp} />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Clinic preview */}
                    {form.clinicId && (
                        <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2.5">
                            <span className="text-violet-400 text-sm">🏥</span>
                            <span className="text-violet-300 text-sm font-medium">
                                Will be assigned to: <strong>{approvedClinics.find(c => c._id === form.clinicId)?.name}</strong>
                            </span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving || !form.clinicId}
                            className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium transition disabled:opacity-50">
                            {saving ? '⏳ Creating…' : '✓ Create Staff Member'}
                        </button>
                        <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                            className="px-6 py-2.5 border border-white/20 text-slate-400 hover:text-white rounded-xl font-medium transition">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* ── Role Filter ── */}
            <div className="flex gap-2 mb-6">
                {(['all', 'doctor', 'attender'] as const).map(r => (
                    <button key={r} onClick={() => setRoleFilter(r)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${roleFilter === r ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                        {r === 'all' ? `All (${staff.length})`
                            : `${r === 'doctor' ? '🩺' : '🏥'} ${r}s (${staff.filter(s => s.role === r).length})`}
                    </button>
                ))}
            </div>

            {/* ── Staff List ── */}
            {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState message="No staff found" icon="👥" /> : (
                <div className="space-y-3">
                    {filtered.map(s => (
                        <div key={s._id} className={`bg-white/5 border border-white/10 rounded-2xl p-5 transition hover:bg-white/[0.07] ${!s.isActive ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 text-lg">
                                        {s.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <p className="text-white font-semibold">{s.name}</p>
                                            <Badge variant={s.role === 'doctor' ? 'online' : 'offline'}>{s.role}</Badge>
                                            {!s.isActive && <span className="text-xs text-red-400 border border-red-400/30 px-2 py-0.5 rounded-full">Inactive</span>}
                                        </div>
                                        <p className="text-slate-400 text-sm">📱 {s.mobile}{s.specialization && ` · ${s.specialization}`}</p>

                                        {/* Clinic assignment row */}
                                        {reassignId === s._id ? (
                                            <div className="flex items-center gap-2 mt-2">
                                                <select value={reassignClinic} onChange={e => setReassignClinic(e.target.value)}
                                                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500">
                                                    <option value="">— Select Clinic —</option>
                                                    {approvedClinics.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                                </select>
                                                <button onClick={() => handleReassign(s._id)} disabled={reassigning || !reassignClinic}
                                                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition">
                                                    {reassigning ? '…' : 'Save'}
                                                </button>
                                                <button onClick={() => { setReassignId(null); setReassignClinic(''); }}
                                                    className="px-2 py-1.5 text-slate-500 hover:text-white text-xs transition">Cancel</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-slate-500 text-xs">
                                                    {s.clinicId ? `🏥 ${s.clinicId.name}` : '⚠️ No clinic assigned'}
                                                </p>
                                                {s.isActive && (
                                                    <button onClick={() => { setReassignId(s._id); setReassignClinic(s.clinicId?._id || ''); }}
                                                        className="text-violet-400 hover:text-violet-300 text-xs underline underline-offset-2 transition">
                                                        {s.clinicId ? 'Change clinic' : 'Assign clinic'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {s.isActive && (
                                    <button onClick={() => handleDeactivate(s._id)}
                                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition shrink-0">
                                        Deactivate
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
