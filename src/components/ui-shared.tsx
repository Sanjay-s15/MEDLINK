interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    color: string;
    sub?: string;
}

export function StatCard({ label, value, icon, color, sub }: StatCardProps) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-lg`}>
                    {icon}
                </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
    );
}

interface BadgeProps { children: React.ReactNode; variant?: 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'online' | 'offline' | 'pending' | 'approved' | 'rejected' }
export function Badge({ children, variant }: BadgeProps) {
    const colors: Record<string, string> = {
        waiting: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        in_consultation: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        completed: 'bg-green-500/20 text-green-300 border-green-500/30',
        cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
        online: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        offline: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        approved: 'bg-green-500/20 text-green-300 border-green-500/30',
        rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[variant || ''] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
            {children}
        </span>
    );
}

interface PageHeaderProps { title: string; subtitle?: string; action?: React.ReactNode }
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{title}</h1>
                {subtitle && <p className="text-slate-400 mt-1 text-xs sm:text-sm leading-snug">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
    );
}

export function EmptyState({ message, icon = '📭' }: { message: string; icon?: string }) {
    return (
        <div className="text-center py-16">
            <span className="text-5xl">{icon}</span>
            <p className="text-slate-400 mt-4">{message}</p>
        </div>
    );
}
