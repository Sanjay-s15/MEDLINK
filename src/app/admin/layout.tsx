'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';

const navItems = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Clinics', href: '/admin/clinics', icon: '🏥' },
    { label: 'Staff', href: '/admin/staff', icon: '👥' },
    { label: 'Reports', href: '/admin/reports', icon: '📈' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) router.push('/login?role=admin');
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col md:flex-row">
            <Sidebar items={navItems} title="Admin Portal" accentColor="from-violet-500 to-purple-600" />
            <main className="flex-1 w-full max-w-full overflow-x-hidden p-4 sm:p-6 md:p-8 h-[calc(100vh-73px)] md:h-screen overflow-y-auto">{children}</main>
        </div>
    );
}
