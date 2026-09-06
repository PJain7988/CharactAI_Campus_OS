import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'priya.jain@charactai.edu', password: 'Student@123' },
  { role: 'Faculty', email: 'faculty@charactai.edu', password: 'Faculty@123' },
  { role: 'Admin', email: 'admin@charactai.edu', password: 'Admin@123' },
  { role: 'Recruiter', email: 'recruiter@abc-tech.com', password: 'Recruit@123' },
  { role: 'Placement Officer', email: 'placement@charactai.edu', password: 'Officer@123' }
];

const ROLE_HOME = {
  student: '/student', faculty: '/faculty', admin: '/admin',
  recruiter: '/recruiter', placement_officer: '/placement'
};

export default function Login() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('priya.jain@charactai.edu');
  const [password, setPassword] = useState('Student@123');

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [registerError, setRegisterError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] || '/');
    } catch {
      // error is surfaced via context
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    try {
      await api.post('/auth/register', {
        name, email, password, student_code: studentCode, department,
        batch_year: 1, program: 'B.Tech' // defaults for demo
      });
      // After registration, log them in
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      setRegisterError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[100px] animate-fade-in pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] animate-fade-in pointer-events-none" style={{ animationDelay: '0.2s' }} />
      
      <div className="w-full max-w-5xl shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row z-10 mx-4 border animate-slide-up" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        
        {/* Left Branding Panel */}
        <div className="w-full md:w-5/12 p-10 text-white flex flex-col justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--brand-700, #4338ca), var(--brand-500, #6366f1))' }}>
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 text-center md:text-left">
            <div className="mx-auto md:mx-0 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8 shadow-inner border border-white/20 backdrop-blur-md">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Charact<span className="text-brand-200">AI</span></h1>
            <p className="text-lg text-brand-100 font-medium leading-relaxed opacity-90 mb-8">
              Holistic Student Development, Employability & Placement Platform.
            </p>
            <div className="hidden md:block">
              <div className="h-1.5 w-16 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-7/12 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>{isRegistering ? 'Register as a new student.' : 'Sign in to your account.'}</p>
              </div>
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors"
              >
                {isRegistering ? 'Sign In Instead' : 'Register as Student'}
              </button>
            </div>

            {isRegistering ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="label">Student Code (Roll No)</label>
                    <input className="input" type="text" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} required placeholder="CS26001" />
                  </div>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)} required>
                    <option>Computer Science</option>
                    <option>Information Technology</option>
                    <option>Electronics</option>
                    <option>Mechanical</option>
                  </select>
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john@charactai.edu" />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
                </div>
                {registerError && (
                  <p className="text-sm p-3 rounded-xl border flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                    {registerError}
                  </p>
                )}
                <button className="btn w-full py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2" type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                  {loading ? 'Registering...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            ) : (
              <>
              <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
              </div>
              {error && (
                <p className="text-sm p-3 rounded-xl border flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                  {error}
                </p>
              )}
              <button className="btn w-full py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2" type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                {loading ? 'Authenticating...' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4 text-center" style={{ color: 'var(--text-muted)' }}>Demo Accounts (Click to autofill)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_ACCOUNTS.filter(acc => acc.role !== 'Recruiter' && acc.role !== 'Placement Officer').map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => { setIsRegistering(false); setEmail(acc.email); setPassword(acc.password); }}
                    className="flex flex-col items-start text-left p-3 rounded-xl border transition-all group hover:border-brand-500/50"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                  >
                    <span className="font-bold text-xs mb-0.5 group-hover:text-brand-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{acc.role}</span>
                    <span className="text-[11px] truncate w-full" style={{ color: 'var(--text-muted)' }}>{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
