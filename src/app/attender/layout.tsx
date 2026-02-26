'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';

const navItems = [
    { label: 'Create Token', href: '/attender', icon: '🎫' },
    { label: 'Live Queue', href: '/attender/queue', icon: '📋' },
];

export default function AttenderLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'attender')) router.push('/login?role=attender');
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col md:flex-row">
            <Sidebar items={navItems} title="Attender Portal" accentColor="from-teal-500 to-cyan-600" />
            <main className="flex-1 w-full max-w-full overflow-x-hidden p-4 sm:p-6 md:p-8 h-[calc(100vh-73px)] md:h-screen overflow-y-auto">{children}</main>
        </div>
    );
}
