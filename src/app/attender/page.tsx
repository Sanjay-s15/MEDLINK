'use client';
import { useState } from 'react';
import { createWalkInToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/ui-shared';
import Link from 'next/link';

interface TokenResult {
    tokenNumber: number;
    patient: { name: string; mobile: string };
}

export default function AttenderCreateTokenPage() {
    const { token } = useAuth();
    const [mobile, setMobile] = useState('');
    const [name, setName] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TokenResult | null>(null);
    const [error, setError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await createWalkInToken(token!, mobile.trim(), name.trim() || undefined, undefined, reason || undefined);
            setResult(res.data);
            setMobile(''); setName(''); setReason('');
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div>
            <PageHeader
                title="Create Walk-in Token"
                subtitle="Register a new patient and generate their queue token"
                action={<Link href="/attender/queue" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition">📋 View Queue</Link>}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
                {/* Form */}
                <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Mobile Number *</label>
                        <input value={mobile} onChange={e => setMobile(e.target.value)} required maxLength={10}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="10-digit mobile number" />
                        <p className="text-slate-500 text-xs mt-1">Used as patient's unique ID. Existing patients auto-linked.</p>
                    </div>
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Patient Name</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Full name (optional if returning patient)" />
                    </div>
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Reason for Visit</label>
                        <input value={reason} onChange={e => setReason(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="e.g., Fever, Routine checkup" />
                    </div>

                    {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{error}</div>}

                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:opacity-90 text-white rounded-xl font-semibold transition disabled:opacity-50 shadow-lg">
                        {loading ? 'Creating token…' : '🎫 Generate Token'}
                    </button>
                </form>

                {/* Result */}
                {result && (
                    <div className="flex items-center justify-center">
                        <div className="bg-white/5 border-2 border-teal-500/50 rounded-3xl p-10 text-center w-full">
                            <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">Token Generated</p>
                            <div className="text-8xl font-black text-white mb-4">{result.tokenNumber}</div>
                            <div className="space-y-1 mb-6">
                                <p className="text-white text-xl font-semibold">{result.patient.name}</p>
                                <p className="text-slate-400">📱 {result.patient.mobile}</p>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2">
                                <p className="text-green-400 text-sm">✅ Patient notified via SMS</p>
                            </div>
                            <button onClick={() => setResult(null)} className="mt-5 text-teal-400 hover:text-teal-300 text-sm transition">+ Create another token</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
