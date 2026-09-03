import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL = {
  student: 'Student', faculty: 'Faculty', admin: 'Admin',
  recruiter: 'Recruiter', placement_officer: 'Placement Officer'
};

const ROLE_HOME = {
  student: '/student', faculty: '/faculty', admin: '/admin',
  recruiter: '/recruiter', placement_officer: '/placement'
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="glass-panel sticky top-0 z-50 animate-fade-in border-b border-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to={user ? ROLE_HOME[user.role] : '/'} className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-slate-800 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white flex items-center justify-center text-xs shadow-md shadow-brand-500/30">AI</div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">CharactAI</span>
        </Link>
        {user && (
          <div className="flex items-center gap-6 text-sm">
            {user.role === 'student' && (
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/student" className="text-slate-500 hover:text-brand-600 font-medium transition-colors">Dashboard</Link>
                <Link to="/student/placements" className="text-slate-500 hover:text-brand-600 font-medium transition-colors">Placements</Link>
              </nav>
            )}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{ROLE_LABEL[user.role]}</span>
              <span className="font-semibold text-slate-700">{user.name}</span>
            </div>
            <button
              className="btn-secondary"
              onClick={() => { logout(); navigate('/login'); }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
