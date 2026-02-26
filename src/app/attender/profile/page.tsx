'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getProfile, updateProfile } from '@/lib/api';

export default function AttenderProfilePage() {
    const { token } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [form, setForm] = useState({ name: '', email: '' });

    useEffect(() => {
        if (!token) return;
        getProfile(token, 'attender')
            .then(r => {
                setProfile(r.data);
                setForm({ name: r.data.name || '', email: r.data.email || '' });
            })
            .catch(() => setError('Failed to load profile'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleSave = async () => {
        setSaving(true); setError(''); setSuccess('');
        try {
            const res = await updateProfile(token!, 'attender', form);
            setProfile(res.data);
            setSuccess('Profile updated successfully!');
            setEditMode(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (e: any) {
            setError(e.message || 'Failed to update profile');
        } finally { setSaving(false); }
    };

    const inp = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition';
    const readonlyInp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm';

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Profile</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage your account information</p>
                </div>
                {!editMode ? (
                    <button onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2">
                        ✏️ Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => { setEditMode(false); setError(''); }}
                            className="px-4 py-2 border border-white/20 text-slate-400 hover:text-white rounded-xl text-sm font-medium transition">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition">
                            {saving ? '⏳ Saving…' : '💾 Save'}
                        </button>
                    </div>
                )}
            </div>

            {success && <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">✅ {success}</div>}
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">❌ {error}</div>}

            {/* Avatar Card */}
            <div className="bg-gradient-to-r from-teal-500/10 to-cyan-600/10 border border-teal-500/20 rounded-2xl p-6 flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
                    {profile?.name?.charAt(0) || '?'}
                </div>
                <div>
                    <h2 className="text-white text-xl font-bold">{profile?.name}</h2>
                    <p className="text-teal-300 text-sm mt-0.5">Attender</p>
                    <div className="mt-2">
                        <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-0.5 rounded-full text-xs font-semibold">Staff</span>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                <h3 className="text-slate-400 font-semibold text-sm uppercase tracking-wider">Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Full Name *</label>
                        {editMode ? (
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className={inp} placeholder="Full name" />
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
                                className={inp} placeholder="attender@email.com" />
                        ) : (
                            <p className={readonlyInp}>{profile?.email || '—'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Clinic</label>
                        <p className={readonlyInp}>{(profile?.clinicId as any)?.name || '—'}</p>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Role</label>
                        <p className={readonlyInp}>Attender</p>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-medium mb-1.5">Status</label>
                        <p className={`${readonlyInp} ${profile?.isActive ? 'text-green-400' : 'text-red-400'}`}>
                            {profile?.isActive ? '✓ Active' : '✗ Inactive'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
