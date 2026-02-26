'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getProfile, updateProfile } from '@/lib/api';

export default function DoctorProfilePage() {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        email: '',
        specialization: '',
        regNumber: '',
        medicalCouncilRegNumber: '',
    });

    useEffect(() => {
        if (!token) return;
        getProfile(token, 'doctor')
            .then(r => {
                setProfile(r.data);
                setForm({
                    name: r.data.name || '',
                    email: r.data.email || '',
                    specialization: r.data.specialization || '',
                    regNumber: r.data.regNumber || '',
                    medicalCouncilRegNumber: r.data.medicalCouncilRegNumber || '',
                });
            })
            .catch(() => setError('Failed to load profile'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleSave = async () => {
        setSaving(true); setError(''); setSuccess('');
        try {
            const res = await updateProfile(token!, 'doctor', form);
            setProfile(res.data);
            setSuccess('Profile updated successfully!');
            setEditMode(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (e: any) {
            setError(e.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const inp = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition';
    const readonlyInp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm';

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Profile</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage your professional information</p>
                </div>
                {!editMode ? (
                    <button onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2">
                        ✏️ Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => { setEditMode(false); setError(''); }}
                            className="px-4 py-2 border border-white/20 text-slate-400 hover:text-white rounded-xl text-sm font-medium transition">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition flex items-center gap-2">
                            {saving ? '⏳ Saving…' : '💾 Save'}
                        </button>
                    </div>
                )}
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm flex items-center gap-2">
                    ✅ {success}
                </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                    ❌ {error}
                </div>
            )}

            {/* Avatar Card */}
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-6 flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
                    {profile?.name?.charAt(0) || '?'}
                </div>
                <div>
                    <h2 className="text-white text-xl font-bold">Dr. {profile?.name}</h2>
                    <p className="text-blue-300 text-sm mt-0.5">{profile?.specialization || 'General Physician'}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-0.5 rounded-full text-xs font-semibold">Doctor</span>
                        {profile?.medicalCouncilRegNumber && (
                            <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                                ✓ Verified Doctor
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider text-slate-400">Personal Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Full Name *</label>
                        {editMode ? (
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className={inp} placeholder="Dr. Full Name" />
                        ) : (
                            <p className={readonlyInp}>{profile?.name || '—'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Mobile</label>
                        <p className={readonlyInp}>+91 {profile?.mobile}</p>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Email</label>
                        {editMode ? (
                            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                className={inp} placeholder="doctor@email.com" />
                        ) : (
                            <p className={readonlyInp}>{profile?.email || '—'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Clinic</label>
                        <p className={readonlyInp}>{(profile?.clinicId as any)?.name || '—'}</p>
                    </div>
                </div>
            </div>

            {/* Professional Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                <h3 className="text-slate-400 font-semibold text-sm uppercase tracking-wider">Professional Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Specialization</label>
                        {editMode ? (
                            <input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                                className={inp} placeholder="e.g., Cardiology, General Medicine" />
                        ) : (
                            <p className={readonlyInp}>{profile?.specialization || '—'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Registration Number</label>
                        {editMode ? (
                            <input value={form.regNumber} onChange={e => setForm(f => ({ ...f, regNumber: e.target.value }))}
                                className={inp} placeholder="Your registration number" />
                        ) : (
                            <p className={readonlyInp}>{profile?.regNumber || '—'}</p>
                        )}
                    </div>
                </div>

                {/* Medical Council Reg Number — highlighted */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <label className="block text-amber-300 text-xs font-semibold mb-1 flex items-center gap-2">
                        🏛️ Medical Council Registration Number
                        <span className="text-amber-500 font-normal">(Required for verification)</span>
                    </label>
                    {editMode ? (
                        <input value={form.medicalCouncilRegNumber}
                            onChange={e => setForm(f => ({ ...f, medicalCouncilRegNumber: e.target.value }))}
                            className="w-full bg-white/10 border border-amber-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
                            placeholder="Enter your official medical council registration number" />
                    ) : (
                        <div className="flex items-center gap-3">
                            <p className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm font-mono tracking-wide">
                                {profile?.medicalCouncilRegNumber || 'Not provided'}
                            </p>
                            {profile?.medicalCouncilRegNumber ? (
                                <span className="text-green-400 text-xs font-semibold bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">✓ Verified</span>
                            ) : (
                                <span className="text-amber-400 text-xs font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">⚠ Pending</span>
                            )}
                        </div>
                    )}
                    <p className="text-amber-600 text-xs mt-2">
                        This number is displayed on all prescriptions to help patients verify your credentials.
                    </p>
                </div>
            </div>
        </div>
    );
}
