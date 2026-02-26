'use client';
import Link from 'next/link';

const PORTALS = [
  {
    role: 'Patient',
    icon: '👤',
    desc: 'OTP login, book appointments, track tokens, view records',
    href: '/patient-login',
    gradient: 'from-emerald-400 to-teal-600',
    glow: 'hover:shadow-emerald-500/20',
    accent: 'text-emerald-400',
    border: 'hover:border-emerald-500/40',
  },
  {
    role: 'Doctor',
    icon: '🩺',
    desc: 'View today\'s queue, search patients, write prescriptions',
    href: '/login?role=doctor',
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'hover:shadow-blue-500/20',
    accent: 'text-blue-400',
    border: 'hover:border-blue-500/40',
  },
  {
    role: 'Attender',
    icon: '🏥',
    desc: 'Create walk-in tokens, manage the clinic queue',
    href: '/login?role=attender',
    gradient: 'from-teal-500 to-cyan-600',
    glow: 'hover:shadow-teal-500/20',
    accent: 'text-teal-400',
    border: 'hover:border-teal-500/40',
  },
  {
    role: 'Admin',
    icon: '⚙️',
    desc: 'Approve clinics, manage staff, view platform metrics',
    href: '/login?role=admin',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'hover:shadow-violet-500/20',
    accent: 'text-violet-400',
    border: 'hover:border-violet-500/40',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">

        {/* Logo + Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30 mb-5">
            <span className="text-3xl">❤️</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">MedLink</h1>
          <p className="text-slate-400 text-lg">Healthcare management platform for local clinics</p>
        </div>

        {/* Staff Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {PORTALS.map(({ role, icon, desc, href, gradient, glow, accent, border }) => (
            <Link key={role} href={href}
              className={`group bg-[#161b22] border border-[#30363d] ${border} rounded-2xl p-6 flex flex-col gap-4 hover:scale-[1.02] hover:shadow-2xl ${glow} transition-all duration-200`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg`}>
                {icon}
              </div>
              <div>
                <p className={`font-bold text-base ${accent}`}>{role} Portal</p>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{desc}</p>
              </div>
              <div className={`mt-auto text-xs font-semibold ${accent} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                Sign in →
              </div>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center mt-8 text-slate-600 text-xs">
          Powered by MedLink · v1.0 · Built for local healthcare
        </p>

      </div>
    </main>
  );
}
