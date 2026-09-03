import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Building2, GraduationCap, Users, UserPlus, FileText, ChevronDown, CheckCircle2, Target, PlayCircle } from 'lucide-react';

export default function PlacementDashboard() {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [byCompany, setByCompany] = useState([]);
  const [byDepartment, setByDepartment] = useState([]);
  const [showNewDrive, setShowNewDrive] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [message, setMessage] = useState('');

  const loadDrives = useCallback(async () => {
    const { data } = await api.get('/placement/drives');
    setDrives(data.drives);
    if (!selectedDriveId && data.drives.length) setSelectedDriveId(data.drives[0].id);
  }, [selectedDriveId]);

  const loadApplications = useCallback(async (driveId) => {
    if (!driveId) return;
    const { data } = await api.get(`/placement/drives/${driveId}/applications`);
    setApplications(data.applications);
  }, []);

  const loadStats = useCallback(async () => {
    const [ov, comp, dept] = await Promise.all([
      api.get('/placement/stats/overview'),
      api.get('/placement/stats/by-company'),
      api.get('/placement/stats/by-department')
    ]);
    setStats(ov.data);
    setByCompany(comp.data.byCompany);
    setByDepartment(dept.data.byDepartment);
  }, []);

  useEffect(() => { loadDrives(); loadStats(); }, [loadDrives, loadStats]);
  useEffect(() => { if (selectedDriveId) loadApplications(selectedDriveId); }, [selectedDriveId, loadApplications]);

  const openApplication = async (appId) => {
    if (expandedAppId === appId) { setExpandedAppId(null); return; }
    const { data } = await api.get(`/placement/applications/${appId}/rounds`);
    setRounds(data.rounds);
    setExpandedAppId(appId);
  };

  const updateRound = async (roundId, patch) => {
    await api.put(`/placement/rounds/${roundId}`, patch);
    const { data } = await api.get(`/placement/applications/${expandedAppId}/rounds`);
    setRounds(data.rounds);
    await loadApplications(selectedDriveId);
    await loadStats();
  };

  const scheduleInterview = async (roundId, form) => {
    await api.post(`/placement/rounds/${roundId}/schedule`, form);
    const { data } = await api.get(`/placement/applications/${expandedAppId}/rounds`);
    setRounds(data.rounds);
  };

  const extendOffer = async (appId, form) => {
    await api.post(`/placement/applications/${appId}/offer`, form);
    setMessage('Offer extended successfully.');
    await loadApplications(selectedDriveId);
    await loadStats();
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner" style={{ background: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)' }}>
            <Briefcase className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Placement Officer Hub</h1>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Drive & Offer Management</p>
          </div>
        </div>
        <button 
          className="btn text-white text-xs px-5 py-2.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all" 
          onClick={() => setShowNewDrive(!showNewDrive)}
          style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)', boxShadow: '0 8px 24px rgba(147,51,234,0.3)' }}
        >
          {showNewDrive ? 'Cancel Form' : '+ New Placement Drive'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tile label="Open Drives" value={stats.openDrives} icon={Target} color="indigo" />
          <Tile label="Applications" value={stats.totalApplications} icon={FileText} color="blue" />
          <Tile label="Offers Extended" value={stats.totalOffers} icon={Award} color="emerald" />
          <Tile label="Placement Rate" value={`${stats.placementRate}%`} icon={PlayCircle} color="amber" />
          <Tile label="Avg. CTC (LPA)" value={stats.averageCtcLpa ?? '—'} icon={Briefcase} color="purple" />
          <Tile label="Highest CTC (LPA)" value={stats.highestCtcLpa ?? '—'} icon={Award} color="rose" />
          <Tile label="Students Placed" value={stats.placedStudents} icon={UserPlus} color="emerald" />
          <Tile label="Eligible Pool" value={stats.totalEligibleStudents} icon={Users} color="cyan" />
        </div>
      )}

      <AnimatePresence>
        {showNewDrive && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <NewDriveForm onCreated={() => { setShowNewDrive(false); loadDrives(); }} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {message && <div className="p-4 rounded-xl text-sm font-semibold border" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', borderColor: 'rgba(16,185,129,0.2)' }}>{message}</div>}

      <div className="card">
        <label className="label">Active Placement Drive</label>
        <div className="relative">
          <select className="input appearance-none pl-4 pr-10 py-3 font-semibold shadow-inner cursor-pointer" style={{ background: 'var(--bg-surface)' }} value={selectedDriveId || ''} onChange={(e) => setSelectedDriveId(e.target.value)}>
            {drives.map(d => (
              <option key={d.id} value={d.id}>
                {d.title} — {d.companyName} ({d.applicationCount} applied, {d.offerCount} offers)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="w-5 h-5 text-purple-400" />
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Applications Pipeline</h2>
        </div>
        <div className="space-y-3">
          {applications.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-2xl transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <button className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 text-left gap-4 hover:bg-white/5 transition-colors rounded-2xl" onClick={() => openApplication(a.id)}>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{a.studentName} <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>({a.studentCode})</span></p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-secondary)' }}>CGPA <span className="text-purple-400">{a.cgpa}</span> · {a.department}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge status={a.status} />
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedAppId === a.id ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                </div>
              </button>
              
              <AnimatePresence>
                {expandedAppId === a.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="p-4 border-t space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Recruitment Rounds</p>
                      {rounds.map((r, i) => (
                        <RoundRow key={r.id} round={r} index={i+1} onUpdate={updateRound} onSchedule={scheduleInterview} />
                      ))}
                      <OfferForm applicationId={a.id} onExtend={extendOffer} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {!applications.length && (
            <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
              <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-semibold">No applications yet for this drive.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Company-wise Report</h2>
          </div>
          <div className="rounded-xl overflow-hidden flex-1" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <table className="w-full text-sm">
              <thead className="uppercase tracking-wider text-[10px] font-black" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <tr className="text-left">
                  <th className="px-4 py-3">Company</th><th className="px-4 py-3 text-right">Apps</th><th className="px-4 py-3 text-right">Offers</th><th className="px-4 py-3 text-right">Avg CTC</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
                {byCompany.map(c => (
                  <tr key={c.company} className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{c.company}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{c.applications}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{c.offers}</td>
                    <td className="px-4 py-3 text-right font-bold text-purple-400">{c.avg_ctc ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="card flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Department-wise Report</h2>
          </div>
          <div className="rounded-xl overflow-hidden flex-1" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <table className="w-full text-sm">
              <thead className="uppercase tracking-wider text-[10px] font-black" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <tr className="text-left">
                  <th className="px-4 py-3">Department</th><th className="px-4 py-3 text-right">Students</th><th className="px-4 py-3 text-right">Placed</th><th className="px-4 py-3 text-right">Avg CTC</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
                {byDepartment.map(d => (
                  <tr key={d.department} className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{d.department}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{d.total_students}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{d.placed_students}</td>
                    <td className="px-4 py-3 text-right font-bold text-purple-400">{d.avg_ctc ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, icon: Icon, color }) {
  const cmap = {
    indigo:  { bg: 'rgba(99,102,241,0.1)', text: '#818cf8' },
    blue:    { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa' },
    emerald: { bg: 'rgba(16,185,129,0.1)', text: '#34d399' },
    amber:   { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24' },
    purple:  { bg: 'rgba(168,85,247,0.1)', text: '#c084fc' },
    rose:    { bg: 'rgba(244,63,94,0.1)',  text: '#fb7185' },
    cyan:    { bg: 'rgba(6,182,212,0.1)',  text: '#22d3ee' },
  };
  const theme = cmap[color];
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.bg }}>
          <Icon className="w-4 h-4" style={{ color: theme.text }} />
        </div>
      </div>
      <p className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function RoundRow({ round, index, onUpdate, onSchedule }) {
  const [score, setScore] = useState(round.score ?? '');
  const [remarks, setRemarks] = useState(round.remarks ?? '');
  const [showSchedule, setShowSchedule] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [link, setLink] = useState('');

  return (
    <div className="rounded-xl p-4 transition-colors" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>{index}</div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{round.roundName}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{round.roundType}</p>
          </div>
        </div>
        <Badge status={round.status} />
      </div>
      
      {round.schedules?.length > 0 && (
        <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <PlayCircle className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-primary)' }}>{round.schedules[0].scheduledDate} at {round.schedules[0].scheduledTime}</span> · {round.schedules[0].mode}
            {round.schedules[0].interviewerName ? ` · w/ ${round.schedules[0].interviewerName}` : ''}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        <input className="input text-xs" type="number" placeholder="Evaluation Score (e.g. 85)" value={score} onChange={(e) => setScore(e.target.value)} />
        <input className="input text-xs" placeholder="Interviewer Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>
      
      <div className="flex flex-wrap gap-2 mt-3">
        <button className="btn text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20" onClick={() => onUpdate(round.id, { status: 'cleared', score: Number(score) || null, remarks })}>Mark Cleared</button>
        <button className="btn text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20" onClick={() => onUpdate(round.id, { status: 'rejected', score: Number(score) || null, remarks })}>Mark Rejected</button>
        <button className="btn-secondary text-xs" onClick={() => setShowSchedule(!showSchedule)}>Schedule Meeting</button>
      </div>
      
      <AnimatePresence>
        {showSchedule && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 p-4 rounded-xl grid grid-cols-2 gap-3 shadow-inner" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="col-span-2 text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-primary)' }}>Schedule Details</div>
              <input className="input text-xs" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <input className="input text-xs" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              <input className="input text-xs" placeholder="Interviewer Name" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} />
              <input className="input text-xs" placeholder="Meeting link / location" value={link} onChange={(e) => setLink(e.target.value)} />
              <button
                className="btn-primary text-xs col-span-2 shadow-lg shadow-indigo-500/25 mt-2"
                onClick={() => {
                  onSchedule(round.id, { scheduledDate: date, scheduledTime: time, interviewerName: interviewer, locationOrLink: link, mode: 'online' });
                  setShowSchedule(false);
                }}
              >
                Confirm Schedule
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OfferForm({ applicationId, onExtend }) {
  const [designation, setDesignation] = useState('Trainee Software Engineer');
  const [ctc, setCtc] = useState('');
  return (
    <div className="border-t pt-4 mt-2" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Extend Final Offer</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="label">Designation Role</label>
          <input className="input text-xs font-semibold" placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
        </div>
        <div>
          <label className="label">CTC (LPA)</label>
          <input className="input text-xs font-mono font-bold text-emerald-400" type="number" placeholder="e.g. 12" value={ctc} onChange={(e) => setCtc(e.target.value)} />
        </div>
      </div>
      <button
        className="btn w-full mt-4 text-xs font-bold text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #059669, #10b981)', border: '1px solid rgba(16,185,129,0.5)', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}
        onClick={() => onExtend(applicationId, { designation, ctcLpa: Number(ctc) || null })}
      >
        Issue Official Offer
      </button>
    </div>
  );
}

function NewDriveForm({ onCreated }) {
  const [form, setForm] = useState({
    companyName: '', title: '', description: '', driveDate: '', applicationDeadline: '',
    minCgpa: 7, maxBacklogs: 0, graduationYear: 2027, branches: 'CSE',
    packageMinLpa: 5, packageMaxLpa: 10
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/placement/drives', {
        ...form,
        minCgpa: Number(form.minCgpa), maxBacklogs: Number(form.maxBacklogs),
        graduationYear: Number(form.graduationYear), branches: form.branches.split(',').map(s => s.trim()).filter(Boolean),
        packageMinLpa: Number(form.packageMinLpa), packageMaxLpa: Number(form.packageMaxLpa),
        roundsPlan: ['Aptitude', 'Technical', 'HR']
      });
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 mb-8 border-purple-500/30 relative overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}><Briefcase className="w-5 h-5 text-purple-400" /> Create New Drive</h2>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="label">Company Name</label><input className="input" value={form.companyName} onChange={set('companyName')} required /></div>
        <div><label className="label">Drive Title</label><input className="input" value={form.title} onChange={set('title')} required /></div>
      </div>
      <div><label className="label">Description & Role Details</label><textarea className="input" rows={3} value={form.description} onChange={set('description')} /></div>
      <div className="grid sm:grid-cols-4 gap-4">
        <div><label className="label">Drive Date</label><input className="input" type="date" value={form.driveDate} onChange={set('driveDate')} /></div>
        <div><label className="label">App Deadline</label><input className="input" type="date" value={form.applicationDeadline} onChange={set('applicationDeadline')} /></div>
        <div><label className="label">Min CGPA</label><input className="input" type="number" step="0.1" value={form.minCgpa} onChange={set('minCgpa')} /></div>
        <div><label className="label">Max Backlogs</label><input className="input" type="number" value={form.maxBacklogs} onChange={set('maxBacklogs')} /></div>
      </div>
      <div className="grid sm:grid-cols-4 gap-4">
        <div><label className="label">Graduation Year</label><input className="input" type="number" value={form.graduationYear} onChange={set('graduationYear')} /></div>
        <div><label className="label">Branches (comma-sep)</label><input className="input" value={form.branches} onChange={set('branches')} /></div>
        <div><label className="label">Min CTC (LPA)</label><input className="input text-emerald-400 font-mono" type="number" value={form.packageMinLpa} onChange={set('packageMinLpa')} /></div>
        <div><label className="label">Max CTC (LPA)</label><input className="input text-emerald-400 font-mono" type="number" value={form.packageMaxLpa} onChange={set('packageMaxLpa')} /></div>
      </div>
      <div className="pt-2">
        <button className="btn-primary w-full sm:w-auto text-sm px-8 shadow-lg shadow-indigo-500/25" disabled={busy}>{busy ? 'Publishing...' : 'Publish Placement Drive'}</button>
      </div>
    </form>
  );
}