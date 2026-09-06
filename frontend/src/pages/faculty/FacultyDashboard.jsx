import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, FileText, UserCircle, Calendar, Tag, Bot, Users } from 'lucide-react';
import api from '../../api/client';
import DevelopmentRadar from '../../components/DevelopmentRadar';

const TABS = [
  { id: 'verification', label: 'Verification Queue', icon: ShieldCheck },
  { id: 'directory', label: 'Student Directory', icon: Users }
];

export default function FacultyDashboard() {
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [reasonDrafts, setReasonDrafts] = useState({});
  const [activeTab, setActiveTab] = useState('verification');

  const load = useCallback(async () => {
    const { data } = await api.get('/verification/pending');
    setPending(data.activities);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setBusyId(id);
    try {
      await api.put(`/verification/${id}/approve`);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    setBusyId(id);
    try {
      await api.put(`/verification/${id}/reject`, { reason: reasonDrafts[id] || 'Invalid or insufficient evidence' });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-20">
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)', borderColor: 'var(--border)' }}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-300 text-xs font-black tracking-[0.2em] uppercase mb-1">Faculty Portal</p>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Evidence Verification</h1>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 flex items-center gap-5 shadow-inner">
            <div>
              <p className="text-emerald-300 text-[10px] uppercase tracking-widest font-bold mb-1">Pending Review</p>
              <p className="text-4xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-br from-white to-emerald-200">
                {pending.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-emerald-400/80" />
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b overflow-x-auto pb-px scrollbar-hide" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all whitespace-nowrap rounded-t-xl"
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                borderTop: isActive ? '1px solid var(--border)' : '1px solid transparent',
                borderLeft: isActive ? '1px solid var(--border)' : '1px solid transparent',
                borderRight: isActive ? '1px solid var(--border)' : '1px solid transparent',
                marginBottom: isActive ? '-1px' : '0'
              }}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="faculty-active-tab"
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        {activeTab === 'verification' && (
          <div className="space-y-4">

        <AnimatePresence>
          {pending.map((a, i) => (
            <motion.div 
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-6 transition-all group"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      <div className="flex items-center gap-1.5"><UserCircle className="w-4 h-4" /> <span style={{ color: 'var(--text-secondary)' }}>{a.student_name}</span> ({a.student_code})</div>
                      <div className="flex items-center gap-1.5 capitalize"><Tag className="w-4 h-4" /> {a.category_name}</div>
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Year {a.academic_year} · {a.activity_date}</div>
                    </div>
                  </div>
                  
                  {a.role && (
                    <div className="p-3 rounded-xl inline-block" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Role / Achievement</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.role}{a.achievement ? ` · ${a.achievement}` : ''}</p>
                    </div>
                  )}
                  
                  {a.description && (
                    <p className="text-sm p-3 rounded-xl leading-relaxed" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      {a.description}
                    </p>
                  )}
                  
                  {a.evidence_path && (
                    <a href={a.evidence_path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-colors border shadow-sm" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.2)' }}>
                      <FileText className="w-4 h-4" /> View Submitted Evidence
                    </a>
                  )}

                  {(() => {
                    if (!a.details_json) return null;
                    try {
                      const details = JSON.parse(a.details_json);
                      if (details.ragVerification) {
                        const { confidenceScore, reasoning } = details.ragVerification;
                        const isHigh = confidenceScore >= 70;
                        return (
                          <div className={`p-4 rounded-xl border mt-4 flex items-start gap-3 shadow-inner ${isHigh ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isHigh ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              <Bot className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={`text-[10px] uppercase tracking-widest font-black mb-1 ${isHigh ? 'text-emerald-400' : 'text-amber-400'}`}>
                                RAG Verification (Confidence: {confidenceScore}%)
                              </p>
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{reasoning}</p>
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {}
                    return null;
                  })()}
                </div>
                
                <div className="shrink-0 w-full lg:w-72 p-5 rounded-2xl flex flex-col gap-3 shadow-inner" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: 'var(--text-muted)' }}>Verification Action</p>
                  <input
                    className="input text-xs"
                    placeholder="Optional rejection reason..."
                    value={reasonDrafts[a.id] || ''}
                    onChange={(e) => setReasonDrafts({ ...reasonDrafts, [a.id]: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button 
                      className="btn text-xs flex-1 text-white flex items-center justify-center gap-2 shadow-lg" 
                      style={{ background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid rgba(16,185,129,0.3)', opacity: busyId === a.id ? 0.6 : 1 }}
                      disabled={busyId === a.id} 
                      onClick={() => approve(a.id)}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      className="btn text-xs flex-1 flex items-center justify-center gap-2" 
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', opacity: busyId === a.id ? 0.6 : 1 }}
                      disabled={busyId === a.id} 
                      onClick={() => reject(a.id)}
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        )}
      </div>
        )}
        
        {activeTab === 'directory' && <FacultyDirectoryTab />}
      </div>
    </div>
  );
}

function FacultyDirectoryTab() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const load = () => api.get('/faculty/students').then(({data}) => setStudents(data.students));
  useEffect(() => { load(); }, []);

  if (selectedStudent) {
    return <StudentProfileView studentId={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  return (
    <div className="card">
      <h2 className="font-bold text-base mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Users className="w-5 h-5 text-emerald-400" /> Department Students
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(s => (
          <div key={s.id} onClick={() => setSelectedStudent(s.id)} className="p-5 rounded-2xl border cursor-pointer hover:border-emerald-500/50 transition-colors" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg bg-emerald-500/10 text-emerald-400">
                {s.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{s.name}</h3>
                <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-secondary)' }}>{s.student_code}</p>
                <span className="text-[10px] uppercase tracking-wider font-bold text-brand-400">{s.program} · Batch {s.batch_year}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentProfileView({ studentId, onBack }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get(`/faculty/students/${studentId}/profile`).then(({data}) => setProfile(data));
  }, [studentId]);

  if (!profile) return <div className="p-10 text-center animate-pulse">Loading profile...</div>;

  const latestAssessment = profile.assessments?.[0];

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
        ← Back to Directory
      </button>

      <div className="card flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {profile.student.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{profile.student.name}</h2>
          <div className="flex gap-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            <span>Roll: <strong className="font-mono">{profile.student.student_code}</strong></span>
            <span>Program: <strong>{profile.student.program}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-base mb-6" style={{ color: 'var(--text-primary)' }}>Development Radar</h3>
          {latestAssessment ? (
            <div className="h-[300px]">
              <DevelopmentRadar scores={latestAssessment.scores} />
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-10">No AI assessment generated yet.</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-base mb-6" style={{ color: 'var(--text-primary)' }}>Log Achievement</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Directly log an approved achievement for this student to bypass verification.</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target;
            api.post('/faculty/activities', {
              student_id: studentId,
              title: form.title.value,
              category_id: form.category.value,
              activity_date: form.date.value,
              academic_year: 1,
              duration_hours: 2,
              achievement: form.achievement.value
            }).then(() => {
              alert('Achievement logged successfully!');
              form.reset();
            });
          }} className="space-y-4">
            <div>
              <label className="label">Activity Title</label>
              <input name="title" className="input" required placeholder="e.g., Department Hackathon" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category ID (UUID)</label>
                <input name="category" className="input" required placeholder="Enter Category UUID" />
              </div>
              <div>
                <label className="label">Date</label>
                <input name="date" type="date" className="input" required />
              </div>
            </div>
            <div>
              <label className="label">Achievement / Role</label>
              <input name="achievement" className="input" required placeholder="e.g., Winner, 1st Place" />
            </div>
            <button type="submit" className="btn w-full bg-emerald-500 text-white font-bold py-2 shadow-lg">Log Verified Achievement</button>
          </form>
        </div>
      </div>
    </div>
  );
}
