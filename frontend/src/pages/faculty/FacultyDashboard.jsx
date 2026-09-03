import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, FileText, UserCircle, Calendar, Tag } from 'lucide-react';
import api from '../../api/client';

export default function FacultyDashboard() {
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [reasonDrafts, setReasonDrafts] = useState({});

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
        
        {pending.length === 0 && (
          <div className="card flex flex-col justify-center items-center py-20 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>You're All Caught Up!</h3>
            <p className="max-w-sm text-sm" style={{ color: 'var(--text-secondary)' }}>There are no pending activities awaiting your verification at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
