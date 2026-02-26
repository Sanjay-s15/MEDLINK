'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendOTP, verifyOTP } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

// This page is for PATIENTS logging in via OTP.
// It shows the OTP on screen in development mode (devOtp returned by backend).

function PatientLoginForm() {
    const params = useSearchParams();
    const { login } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
    const [mobile, setMobile] = useState(params.get('mobile') || '');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [devOtp, setDevOtp] = useState(''); // shown in dev mode
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mobile.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
        setError(''); setLoading(true);
        try {
            const res = await sendOTP(mobile, name || undefined);
            if (res.data?.devOtp) setDevOtp(res.data.devOtp);
            setStep('otp');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
        setError(''); setLoading(true);
        try {
            const res = await verifyOTP(mobile, otp);
            login(res.data.token, res.data.user);
            router.push('/patient');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Invalid OTP');
        } finally { setLoading(false); }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mb-4">
                        <span className="text-3xl">👤</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Patient Login</h1>
                    <p className="text-slate-400 mt-1">Sign in with your mobile number</p>
                </div>

                {step === 'mobile' ? (
                    <form onSubmit={handleSendOTP} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">
                        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">Mobile Number</label>
                            <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                                placeholder="10-digit mobile number" required maxLength={10} />
                        </div>
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">
                                Your Name <span className="text-slate-500 font-normal">(optional for new patients)</span>
                            </label>
                            <input value={name} onChange={e => setName(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                                placeholder="Full name" />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg">
                            {loading ? 'Sending OTP…' : 'Get OTP →'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">
                        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

                        <p className="text-center text-slate-400 text-sm">OTP sent to <span className="text-white font-semibold">+91 {mobile}</span></p>

                        {/* 🟡 DEV MODE: OTP shown on screen */}
                        {devOtp && (
                            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 text-center">
                                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">🛠 Dev Mode — OTP</p>
                                <p className="text-amber-300 text-4xl font-black tracking-[0.3em]">{devOtp}</p>
                                <p className="text-amber-600 text-xs mt-1">This box is hidden in production</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">Enter OTP</label>
                            <input type="number" value={otp} onChange={e => setOtp(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition text-center text-2xl font-bold tracking-widest"
                                placeholder="• • • • • •" required maxLength={6} />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg">
                            {loading ? 'Verifying…' : 'Verify & Login'}
                        </button>
                        <button type="button" onClick={() => { setStep('mobile'); setDevOtp(''); setOtp(''); setError(''); }}
                            className="w-full text-slate-500 hover:text-white text-sm transition">
                            ← Change mobile number
                        </button>
                    </form>
                )}

                <p className="text-center mt-4 text-slate-500 text-sm">
                    <a href="/" className="hover:text-white transition">← Back to home</a>
                </p>
            </div>
        </main>
    );
}

export default function PatientLoginPage() {
    return <Suspense><PatientLoginForm /></Suspense>;
}
