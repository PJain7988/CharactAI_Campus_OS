import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';
import Badge from '../../components/Badge';
import { Briefcase, Building2, Calendar, Target, CheckCircle2, AlertCircle, PlayCircle, Star } from 'lucide-react';

export default function StudentPlacements() {
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [roundsByApp, setRoundsByApp] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [drivesRes, appsRes] = await Promise.all([
      api.get('/placement/drives?status=open'),
      api.get('/placement/applications/mine')
    ]);
    setDrives(drivesRes.data.drives);
    setApplications(appsRes.data.applications);

    const roundsEntries = await Promise.all(
      appsRes.data.applications.map(async (a) => {
        const { data } = await api.get(`/placement/applications/${a.id}/rounds`);
        return [a.id, data.rounds];
      })
    );
    setRoundsByApp(Object.fromEntries(roundsEntries));
  }, []);

  useEffect(() => { load(); }, [load]);

  const appliedDriveIds = new Set(applications.map(a => a.drive_id));

  const apply = async (driveId) => {
    setBusyId(driveId);
    setMessage('');
    try {
      await api.post(`/placement/drives/${driveId}/apply`);
      setMessage('Application submitted successfully.');
      await load();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not apply.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner" style={{ background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }}>
          <Briefcase className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Placements Hub</h1>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Opportunities & Applications</p>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl text-sm font-semibold border flex items-center gap-3" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.2)' }}>
            <AlertCircle className="w-5 h-5" /> {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Open Drives Section */}
        <div className="card flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Open Placement Drives</h2>
          </div>
          <div className="space-y-4 flex-1">
            {drives.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl p-5 relative overflow-hidden group" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), transparent)' }} />
                <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{d.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" /> {d.companyName}
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        <span className="uppercase tracking-wider font-bold">Eligibility:</span> CGPA ≥ {d.minCgpa} · Backlogs ≤ {d.maxBacklogs}
                        {d.branches?.length ? ` · ${d.branches.join(', ')}` : ''}
                      </p>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        <span className="uppercase tracking-wider font-bold">CTC:</span> <span className="text-emerald-400 font-mono font-bold">₹{d.packageMinLpa}–{d.packageMaxLpa} LPA</span>
                      </p>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        <span className="uppercase tracking-wider font-bold">Rounds:</span> {d.roundsPlan.join(' → ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    {appliedDriveIds.has(d.id) ? (
                      <Badge status="applied" />
                    ) : (
                      <button className="btn w-full sm:w-auto text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid rgba(16,185,129,0.5)', opacity: busyId === d.id ? 0.6 : 1 }} onClick={() => apply(d.id)} disabled={busyId === d.id}>
                        {busyId === d.id ? <><PlayCircle className="w-3.5 h-3.5 animate-spin" /> Processing...</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Apply Now</>}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {!drives.length && (
              <div className="flex flex-col items-center justify-center py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                <Target className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-semibold">No open drives matching your profile right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* My Applications Section */}
        <div className="card flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>My Applications</h2>
          </div>
          <div className="space-y-4 flex-1">
            {applications.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{a.drive_title}</h3>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{a.company_name}</p>
                  </div>
                  <Badge status={a.status} />
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>Recruitment Process</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(roundsByApp[a.id] || []).map((r, index) => (
                      <div key={r.id} className="rounded-xl p-3 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{index + 1}. {r.roundName}</span>
                          <Badge status={r.status} />
                        </div>
                        {r.score != null && <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Score: <span className="font-bold text-brand-400">{r.score}/{r.maxScore}</span></p>}
                        {r.remarks && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>"{r.remarks}"</p>}
                        {r.schedules?.length > 0 && (
                          <div className="mt-2 p-2 rounded-lg flex items-start gap-1.5" style={{ background: 'rgba(99,102,241,0.05)' }}>
                            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <p className="text-[10px] font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
                              {r.schedules[0].scheduledDate} @ {r.schedules[0].scheduledTime} <br/>
                              <span className="uppercase tracking-wider opacity-70">({r.schedules[0].mode})</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {!(roundsByApp[a.id] || []).length && (
                      <p className="text-xs font-medium italic" style={{ color: 'var(--text-muted)' }}>Waiting for recruiter to initiate rounds.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {!applications.length && (
              <div className="flex flex-col items-center justify-center py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                <Star className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-semibold">You haven't applied to any drives yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
