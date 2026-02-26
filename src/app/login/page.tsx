'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { staffLogin } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const roleConfig = {
    doctor: { label: 'Doctor', icon: '🩺', color: 'from-blue-600 to-indigo-700', redirect: '/doctor' },
    attender: { label: 'Attender', icon: '🏥', color: 'from-teal-600 to-cyan-700', redirect: '/attender' },
    admin: { label: 'Admin', icon: '⚙️', color: 'from-violet-600 to-purple-700', redirect: '/admin' },
};

function LoginForm() {
    const params = useSearchParams();
    const role = (params.get('role') || 'doctor') as keyof typeof roleConfig;
    const cfg = roleConfig[role] || roleConfig.doctor;
    const { login } = useAuth();
    const router = useRouter();

    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await staffLogin(mobile, password);
            login(res.data.token, res.data.user);
            router.push(cfg.redirect);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${cfg.color} shadow-lg mb-4`}>
                        <span className="text-3xl">{cfg.icon}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">{cfg.label} Portal</h1>
                    <p className="text-slate-400 mt-1">Sign in to MedLink</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
                    )}
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Mobile Number</label>
                        <input
                            type="tel" value={mobile} onChange={e => setMobile(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="9XXXXXXXXX" required maxLength={10}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="••••••••" required
                        />
                    </div>
                    <button type="submit" disabled={loading}
                        className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${cfg.color} hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 shadow-lg`}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center mt-4 text-slate-500 text-sm">
                    <a href="/" className="hover:text-white transition">← Back to home</a>
                </p>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
