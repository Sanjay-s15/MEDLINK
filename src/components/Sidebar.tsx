'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavItem { label: string; href: string; icon: string }

interface SidebarProps {
    items: NavItem[];
    title: string;
    accentColor: string;
}

export default function Sidebar({ items, title, accentColor }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-white/10 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accentColor} flex items-center justify-center shrink-0`}>
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-tight">MedLink</p>
                        <p className="text-slate-400 text-[10px] leading-tight uppercase tracking-wider">{title}</p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2 focus:outline-none shrink-0 border border-white/10 rounded-lg bg-white/5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar content */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-white/10 flex flex-col transform transition-transform duration-300 ease-in-out md:static md:translate-x-0
                ${isOpen ? 'translate-x-0 text-left' : '-translate-x-full'}
            `}>
                {/* Logo (Desktop only) */}
                <div className="hidden md:block p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center shrink-0`}>
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">MedLink</p>
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider">{title}</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {items.map(item => {
                        const active = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                                    ? `bg-gradient-to-r ${accentColor} text-white shadow-lg`
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}>
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User */}
                <div className="p-4 border-t border-white/10">
                    <Link href={`/${user?.role}/profile`} onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 mb-3 group hover:bg-white/5 rounded-xl p-1.5 -m-1.5 transition-all">
                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0 group-hover:ring-2 group-hover:ring-white/20 transition-all">
                            {user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-medium truncate group-hover:text-blue-300 transition-colors">{user?.name || 'User'}</p>
                            <p className="text-slate-400 text-xs truncate">{user?.mobile}</p>
                        </div>
                        <span className="text-slate-500 text-xs shrink-0 group-hover:text-slate-300 transition-colors">👤</span>
                    </Link>
                    <button onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-slate-400 hover:text-white border border-transparent hover:border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition focus:outline-none flex items-center justify-center gap-2">
                        🚪 Sign out
                    </button>
                </div>
            </aside>
        </>
    );
}
