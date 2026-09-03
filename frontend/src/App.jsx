import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { Sparkles, Sun, Moon, Bell } from 'lucide-react';

import Login from './pages/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentPlacements from './pages/student/StudentPlacements';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import PlacementDashboard from './pages/placement/PlacementDashboard';
import PublicVerify from './pages/verify/PublicVerify';

const ROLE_HOME = {
  student: '/student', faculty: '/faculty', admin: '/admin',
  recruiter: '/recruiter', placement_officer: '/placement'
};

const ROLE_BADGE_COLORS = {
  student: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
  faculty: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  admin: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  recruiter: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  placement_officer: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

export default function App() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {user && <Sidebar />}

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {user && (
          <header
            className="h-16 flex items-center justify-between px-6 shrink-0 relative z-10"
            style={{
              background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Charact<span className="text-brand-400">AI</span>
                </span>
                <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: 1 }}>
                  Development Platform
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Role badge */}
              <span className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${ROLE_BADGE_COLORS[user.role] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
                {user.role.replace('_', ' ')}
              </span>

              {/* Notification bell */}
              <button
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <Bell className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2" style={{ borderColor: 'var(--bg-base)' }} />
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark'
                  ? <Sun className="w-4 h-4 text-amber-400" />
                  : <Moon className="w-4 h-4 text-brand-400" />
                }
              </button>

              {/* User avatar */}
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-brand-500/30">
                  {user.name.charAt(0)}
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 relative">
          <Routes>
            <Route path="/login" element={user ? <Navigate to={ROLE_HOME[user.role]} /> : <Login />} />
            <Route path="/verify/:code" element={<PublicVerify />} />

            <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/placements" element={<ProtectedRoute roles={['student']}><StudentPlacements /></ProtectedRoute>} />
            <Route path="/faculty" element={<ProtectedRoute roles={['faculty', 'admin']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/recruiter" element={<ProtectedRoute roles={['recruiter', 'admin']}><RecruiterDashboard /></ProtectedRoute>} />
            <Route path="/placement" element={<ProtectedRoute roles={['placement_officer', 'admin']}><PlacementDashboard /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to={user ? ROLE_HOME[user.role] : '/login'} />} />
            <Route path="*" element={<Navigate to={user ? ROLE_HOME[user.role] : '/login'} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
