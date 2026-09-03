import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, GraduationCap, LogOut,
  UserCheck, Building2, ClipboardList, BrainCircuit
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => { logout(); navigate('/login'); };

  const getLinks = () => {
    if (user.role === 'student') return [
      { to: '/student', icon: LayoutDashboard, label: 'Dashboard' }
    ];
    if (user.role === 'faculty') return [
      { to: '/faculty', icon: UserCheck, label: 'Verify' },
    ];
    if (user.role === 'admin') return [
      { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
    ];

    return [];
  };

  return (
    <aside
      className="w-20 lg:w-24 min-h-screen flex flex-col items-center py-6 relative z-20 shrink-0 border-r"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Brand Mark */}
      <div className="w-12 h-12 bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-brand-500/25 border border-white/20 hover:scale-105 transition-transform cursor-pointer">
        <GraduationCap className="w-6 h-6 text-white" />
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col items-center gap-3 w-full px-3">
        {getLinks().map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `group relative flex flex-col items-center justify-center w-full py-3.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 font-bold shadow-lg shadow-brand-500/10'
                  : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
              }`
            }
            style={({ isActive }) => ({
              border: isActive ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-brand-500 rounded-r-full shadow-glow" />
                )}
                <link.icon className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${isActive ? 'text-brand-400' : ''}`} />
                <span className="text-[9px] uppercase tracking-wider text-center">
                  {link.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="w-10 h-px my-4" style={{ background: 'var(--border)' }} />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
        title="Sign Out"
      >
        <LogOut className="w-5 h-5 text-rose-400/80 group-hover:text-rose-400 transition-colors" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400/80 mt-0.5">Exit</span>
      </button>
    </aside>
  );
}
