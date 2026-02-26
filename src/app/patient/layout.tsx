'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const NAV = [
    { label: 'Dashboard', href: '/patient', icon: '🏠' },
    { label: 'Book Appointment', href: '/patient/book', icon: '📅' },
    { label: 'Token Status', href: '/patient/token', icon: '🎫' },
    { label: 'Prescriptions', href: '/patient/prescriptions', icon: '💊' },
    { label: 'Medical History', href: '/patient/history', icon: '📋' },
    { label: 'Consent Requests', href: '/patient/consents', icon: '🔐' },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'patient')) router.push('/patient-login');
    }, [user, isLoading, router]);

    if (isLoading || !user) return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading...</p>
            </div>
        </div>
    );

    const handleLogout = () => { logout(); router.push('/patient-login'); };

    return (
        <div className="min-h-screen bg-[#0d1117] flex flex-col">
            {/* ── Top Nav ── */}
            <header className="bg-[#161b22] border-b border-[#30363d] h-14 flex items-center px-3 sm:px-4 gap-2 sm:gap-3 fixed top-0 left-0 right-0 z-30">
                <button onClick={() => setSidebarOpen(o => !o)}
                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0">
                    ☰
                </button>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-sm">❤️</div>
                    <span className="text-white font-bold text-base hidden sm:block">MedLink</span>
                    <span className="text-slate-500 text-[10px] border border-slate-700 rounded px-1.5 py-0.5 ml-1 hidden sm:inline-block">Patient</span>
                </div>
                <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <Link href="/patient/profile"
                            className="flex items-center gap-2 group hover:bg-white/5 rounded-lg px-1.5 py-1 transition-all">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-white text-xs font-semibold leading-none truncate max-w-[120px] group-hover:text-emerald-300 transition-colors">{user.name}</p>
                                <p className="text-slate-500 text-[10px]">+91 {user.mobile}</p>
                            </div>
                        </Link>
                    </div>
                    <button onClick={handleLogout}
                        className="px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs text-slate-400 hover:text-white border border-[#30363d] hover:border-slate-500 rounded-lg transition shrink-0">
                        Sign out
                    </button>
                </div>
            </header>

            <div className="flex flex-1 pt-14">
                {/* Mobile Backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-10 md:hidden mt-14"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* ── Sidebar ── */}
                <aside className={`fixed top-14 left-0 bottom-0 z-20 bg-[#161b22] border-r border-[#30363d] transition-transform duration-300 w-56 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}`}>
                    <nav className="p-3 space-y-0.5 mt-2 h-[calc(100%-80px)] overflow-y-auto">
                        {NAV.map(({ label, href, icon }) => {
                            const active = pathname === href;
                            return (
                                <Link key={href} href={href}
                                    onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                    <span className="text-base w-5 text-center">{icon}</span>
                                    {label}
                                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="absolute bottom-4 left-0 right-0 px-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                            <p className="text-emerald-400 text-xs font-semibold mb-1">🔒 Your data is private</p>
                            <p className="text-slate-500 text-[10px] leading-relaxed">Medical history only shared with doctor consent</p>
                        </div>
                    </div>
                </aside>

                {/* ── Main ── */}
                <main className={`flex-1 w-full max-w-full overflow-x-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-56' : 'ml-0'} min-h-[calc(100vh-56px)]`}>
                    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
