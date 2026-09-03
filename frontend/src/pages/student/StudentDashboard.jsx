import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, Award, Activity, CheckCircle, Clock,
  FileText, Sparkles, ChevronRight, BrainCircuit, Target, Network,
  Star, BookOpen, Users, GraduationCap, Zap, Shield, BarChart2,
  AlignLeft, ArrowUpRight, Download, ExternalLink, RefreshCw,
  PlusCircle, Library, School, Dumbbell, Gamepad2, CalendarDays,
  Heart, Trophy, ChevronLeft, X, CheckCheck, BarChart3, Microscope,
  Globe, Flame, Medal, Clock3, TrendingDown
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import DevelopmentRadar from '../../components/DevelopmentRadar';
import AiMentorChat from '../../components/AiMentorChat';

/* ─────────────────────────────── Constants ─────────────────────────────── */

const TABS = [
  { id: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'log',          label: 'Log Activity',    icon: PlusCircle },
  { id: 'activities',   label: 'My Activities',   icon: Activity },
  { id: 'stats',        label: 'Statistics',      icon: BarChart3 },
  { id: 'assessment',   label: 'AI Assessment',   icon: BrainCircuit },
  { id: 'growth',       label: 'Growth',          icon: TrendingUp },
  { id: 'skills',       label: 'Skills',          icon: Target },
  { id: 'certificates', label: 'Certificate',     icon: Award },
];

const ACTIVITY_CATEGORIES = [
  { id: 'library',    label: 'Library Visit',     icon: Library,       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  desc: 'Books read, research, reading sessions' },
  { id: 'classroom',  label: 'Class Attendance',  icon: School,        color: '#6366f1', bg: 'rgba(99,102,241,0.12)', desc: 'Daily attendance, participation, labs' },
  { id: 'academic',   label: 'Academic',          icon: GraduationCap, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', desc: 'Assignments, exams, presentations' },
  { id: 'learning',   label: 'Course / Learning', icon: BookOpen,      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', desc: 'Certifications, workshops, seminars' },
  { id: 'technical',  label: 'Technical',         icon: Microscope,    color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  desc: 'Projects, hackathons, internships' },
  { id: 'sports',     label: 'Sports & Fitness',  icon: Dumbbell,      color: '#10b981', bg: 'rgba(16,185,129,0.12)', desc: 'Practice, tournaments, fitness' },
  { id: 'games',      label: 'Games & Strategy',  icon: Gamepad2,      color: '#f97316', bg: 'rgba(249,115,22,0.12)', desc: 'Chess, strategy games, skill building' },
  { id: 'events',     label: 'Events',            icon: CalendarDays,  color: '#ec4899', bg: 'rgba(236,72,153,0.12)', desc: 'College, national, international events' },
  { id: 'cultural',   label: 'Cultural',          icon: Star,          color: '#a855f7', bg: 'rgba(168,85,247,0.12)', desc: 'Dance, music, drama, photography' },
  { id: 'leadership', label: 'Leadership',        icon: Users,         color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  desc: 'Club roles, organizing, mentoring' },
  { id: 'social',     label: 'Social Service',    icon: Heart,         color: '#14b8a6', bg: 'rgba(20,184,166,0.12)', desc: 'Volunteering, NGO, community service' },
  { id: 'teamwork',   label: 'Teamwork',          icon: Network,       color: '#64748b', bg: 'rgba(100,116,139,0.12)',desc: 'Group projects, collaborative work' },
];

const DIM_META = {
  academic:        { color: '#60a5fa', grad: 'linear-gradient(135deg,#3b82f6,#60a5fa)',  icon: GraduationCap },
  learning:        { color: '#a78bfa', grad: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',  icon: BookOpen },
  classroom:       { color: '#818cf8', grad: 'linear-gradient(135deg,#6366f1,#818cf8)',  icon: School },
  technical:       { color: '#22d3ee', grad: 'linear-gradient(135deg,#06b6d4,#22d3ee)',  icon: Microscope },
  leadership:      { color: '#c084fc', grad: 'linear-gradient(135deg,#a855f7,#c084fc)',  icon: Users },
  teamwork:        { color: '#94a3b8', grad: 'linear-gradient(135deg,#64748b,#94a3b8)',  icon: Network },
  discipline:      { color: '#fbbf24', grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)',  icon: Flame },
  creativity:      { color: '#f472b6', grad: 'linear-gradient(135deg,#ec4899,#f472b6)',  icon: Star },
  sports:          { color: '#34d399', grad: 'linear-gradient(135deg,#10b981,#34d399)',  icon: Dumbbell },
  events:          { color: '#fb7185', grad: 'linear-gradient(135deg,#f43f5e,#fb7185)',  icon: CalendarDays },
  social:          { color: '#2dd4bf', grad: 'linear-gradient(135deg,#14b8a6,#2dd4bf)',  icon: Heart },
  extracurricular: { color: '#fb923c', grad: 'linear-gradient(135deg,#f97316,#fb923c)',  icon: Globe },
};

/* ─────────────────────────────── Main Component ────────────────────────── */

export default function StudentDashboard() {
  const { user } = useAuth();
  const [student,         setStudent]         = useState(null);
  const [assessment,      setAssessment]      = useState(null);
  const [growth,          setGrowth]          = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [activities,      setActivities]      = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [certificate,     setCertificate]     = useState(null);
  const [busy,            setBusy]            = useState(false);
  const [message,         setMessage]         = useState('');
  const [activeTab,       setActiveTab]       = useState('dashboard');
  const [filterCat,       setFilterCat]       = useState('All');
  const [showScanner,     setShowScanner]     = useState(false);

  const load = useCallback(async () => {
    try {
      const [profRes, actRes, catsRes] = await Promise.all([
        api.get('/students/me'),
        api.get('/activities'),
        api.get('/activities/categories'),
      ]);
      setStudent(profRes.data.student);
      setActivities(actRes.data.activities);
      setCategories(catsRes.data.categories || []);
      try { const r = await api.get(`/ai/insights/${profRes.data.student.id}`);         setAssessment(r.data.assessment); }      catch {}
      try { const r = await api.get(`/ai/recommendations/${profRes.data.student.id}`); setRecommendations(r.data.recommendations); } catch {}
      try { const r = await api.get(`/ai/growth/${profRes.data.student.id}`);           setGrowth(r.data.growth); }              catch {}
      try { const r = await api.get('/certificates/mine'); setCertificate(r.data.certificates[0] || null); }                     catch {}
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAssessment = async () => {
    setBusy(true); setMessage('');
    try   { await api.post(`/ai/assessment/${student.id}`); await load(); setMessage('✓ Assessment complete! Scores updated.'); }
    catch { setMessage('✗ Error running assessment. Please try again.'); }
    finally { setBusy(false); }
  };

  const syncBiometric = async () => {
    setBusy(true); setMessage('');
    try { const { data } = await api.post('/activities/sync-biometric'); setMessage(`✓ ${data.message}`); await load(); }
    catch { setMessage('✗ Error syncing biometric data.'); }
    finally { setBusy(false); }
  };

  const generateCertificate = async (type = 'Overall Holistic') => {
    setBusy(true); setMessage('');
    try { const { data } = await api.post(`/certificates/${student.id}/generate`, { certificateType: type }); setMessage(`✓ ${type} Certificate generated!`); await load(); }
    finally { setBusy(false); }
  };

  const generateResumeAI = async () => {
    setBusy(true); setMessage('');
    try { 
      const { data } = await api.post(`/certificates/resume/${student.id}/generate`);
      window.open(data.downloadUrl, '_blank');
      setMessage('✓ AI Resume generated successfully!');
    } catch {
      setMessage('✗ Error generating resume.');
    } finally { setBusy(false); }
  };

  if (!student) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-5">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-2 border-brand-500/40 rounded-full animate-spin [animation-duration:3s]" />
        <div className="absolute inset-2 border-2 border-t-brand-500 rounded-full animate-spin" />
        <div className="absolute inset-5 border-2 border-r-cyan-400 rounded-full animate-spin [animation-duration:1.5s_reverse]" />
        <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-brand-400 animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Initializing AI Engine</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Loading your development profile…</p>
      </div>
    </div>
  );

  const approved = activities.filter(a => a.verification_status === 'approved');
  const pending  = activities.filter(a => a.verification_status === 'pending');
  const rejected = activities.filter(a => a.verification_status === 'rejected');
  const catNames = ['All', ...new Set(activities.map(a => a.category_name))];
  const filtered = filterCat === 'All' ? activities : activities.filter(a => a.category_name === filterCat);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ══════════════════ HERO BANNER ══════════════════ */}
      <div className="relative overflow-hidden px-6 lg:px-10 pt-8 pb-0"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        {/* Ambient glow orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-0 right-1/4 w-72 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.10) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-medium mb-6" style={{ color: 'var(--text-muted)' }}>
            <GraduationCap className="w-3.5 h-3.5" />
            <span>CharactAI</span>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: 'var(--text-primary)' }}>Student Portal</span>
          </div>

          {/* Hero row */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 pb-8">
            {/* Left — identity */}
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
                  {user.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 shadow-sm shadow-emerald-400/50"
                  style={{ borderColor: 'var(--bg-surface)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  {student.program} · Batch {student.batch}
                </p>
                <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Hello, {user.name.split(' ')[0]}! 👋
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                    {student.student_code || 'CAI-001'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {student.department}
                  </span>
                  {assessment?.archetype && (
                    <span className="text-xs px-2 py-0.5 rounded-md font-bold" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                      <Sparkles className="w-3 h-3 inline-block mr-1 mb-0.5" />
                      {assessment.archetype}
                    </span>
                  )}
                </div>
                <p className="text-sm mt-2.5 max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Tracking <strong style={{ color: 'var(--text-primary)' }}>{activities.length} activities</strong> across{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>12 dimensions</strong> — library, classes, sports, events & more.
                </p>
                <div className="mt-4">
                  <button onClick={() => setShowScanner(true)} disabled={busy} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5 text-brand-400" />}
                    Simulate Biometric Auto-Sync
                  </button>
                </div>
              </div>
            </div>

            {/* Right — score cards */}
            <div className="flex items-center gap-3 shrink-0">
              <HeroScoreCard
                value={assessment?.overall ?? '—'}
                label="Holistic Score"
                sublabel="AI-Powered"
                gradient="linear-gradient(135deg,#6366f1,#4f46e5)"
                glow="rgba(99,102,241,0.3)"
              />
              <HeroScoreCard
                value={student.cgpa ?? '—'}
                label="CGPA"
                sublabel="Academic Index"
                gradient="linear-gradient(135deg,#06b6d4,#0891b2)"
                glow="rgba(6,182,212,0.3)"
              />
              <HeroScoreCard
                value={activities.length}
                label="Activities"
                sublabel={`${approved.length} verified`}
                gradient="linear-gradient(135deg,#10b981,#059669)"
                glow="rgba(16,185,129,0.3)"
              />
            </div>
          </div>

          {/* ── Tab Bar ── */}
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="relative flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all duration-200 rounded-t-xl"
                  style={{
                    color: active ? '#818cf8' : 'var(--text-muted)',
                    background: active ? 'var(--bg-base)' : 'transparent',
                    borderTop: active ? '1px solid var(--border)' : '1px solid transparent',
                    borderLeft: active ? '1px solid var(--border)' : '1px solid transparent',
                    borderRight: active ? '1px solid var(--border)' : '1px solid transparent',
                    borderBottom: active ? '1px solid var(--bg-base)' : '1px solid transparent',
                    marginBottom: active ? '-1px' : '0',
                    zIndex: active ? 2 : 1,
                  }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.id === 'log' && (
                    <span className="ml-0.5 w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center" style={{ background: '#6366f1' }}>+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════ TAB CONTENT ══════════════════ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
          >

            {/* ─────── DASHBOARD ─────── */}
            {activeTab === 'dashboard' && (
              <div className="space-y-7">
                {/* 4 stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: CheckCircle, label: 'Verified Activities', value: approved.length,      delta: `${pending.length} pending`,           color: '#10b981', grad: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
                    { icon: Clock,       label: 'Pending Review',      value: pending.length,        delta: 'Awaiting faculty',                    color: '#f59e0b', grad: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
                    { icon: FileText,    label: 'Total Activities',    value: activities.length,    delta: `${[...new Set(activities.map(a=>a.category_name))].length} categories`, color: '#6366f1', grad: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
                    { icon: Award,       label: 'Certificate',         value: certificate ? '✓' : '—', delta: certificate ? 'Issued & Verified' : 'Not issued yet',  color: '#a855f7', grad: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      whileHover={{ y: -4, transition: { duration: 0.15 } }}
                      className="rounded-2xl p-5 cursor-default"
                      style={{ background: s.grad, border: `1px solid ${s.border}` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: `${s.color}20` }}>
                          <s.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: s.color }} />
                        </div>
                        <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ color: s.color, background: `${s.color}15` }}>{s.delta}</span>
                      </div>
                      <p className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Radar + Recent stream */}
                <div className="grid lg:grid-cols-5 gap-6">
                  <Section title="Development Radar" icon={Network} className="lg:col-span-2">
                    {assessment
                      ? <DevelopmentRadar scores={assessment.scores} />
                      : <EmptyState icon={BrainCircuit} message="Run AI Assessment to unlock your radar chart."
                          action={<button className="btn-primary text-xs mt-3 px-4 py-2" onClick={runAssessment} disabled={busy}>{busy ? 'Running…' : 'Run Assessment'}</button>} />
                    }
                  </Section>

                  <Section title="Recent Activities" icon={Activity} className="lg:col-span-3"
                    action={<button onClick={() => setActiveTab('activities')} className="text-xs text-brand-400 font-bold flex items-center gap-1 hover:text-brand-300 transition-colors">View All <ArrowUpRight className="w-3.5 h-3.5" /></button>}
                  >
                    <div className="space-y-2">
                      {activities.slice(0, 6).map((a, i) => {
                        const cat = ACTIVITY_CATEGORIES.find(c => c.id === a.category_name);
                        return (
                          <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: cat?.bg || 'rgba(99,102,241,0.12)' }}>
                              {cat ? <cat.icon className="w-4 h-4" style={{ color: cat.color }} /> : <Activity className="w-4 h-4 text-brand-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.category_name} · Year {a.academic_year}</p>
                            </div>
                            <Badge status={a.verification_status} />
                          </motion.div>
                        );
                      })}
                      {activities.length === 0 && (
                        <EmptyState icon={Activity} message="No activities yet."
                          action={<button className="btn-primary text-xs mt-2 px-4 py-2" onClick={() => setActiveTab('log')}>Log First Activity</button>} />
                      )}
                    </div>
                  </Section>
                </div>

                {/* Recommendations */}
                {recommendations && (
                  <Section title="AI Coach Recommendations" icon={Sparkles}>
                    <div className="rounded-xl p-4 mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      {recommendations.narrative}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {recommendations.developmentSuggestions.slice(0, 3).map((s, i) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-3.5 h-3.5 text-brand-400" />
                            <span className="text-xs font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{s.dimension}</span>
                            <span className="ml-auto text-xs font-black text-cyan-400">{s.score}/100</span>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* ─────── LOG ACTIVITY ─────── */}
            {activeTab === 'log' && (
              <LogActivityForm
                categories={categories}
                studentId={student.id}
                userName={user.name}
                academicYear={student.batch ? Math.min(4, Math.max(1, new Date().getFullYear() - parseInt(student.batch.split('-')[0]) + 1)) : 1}
                onSuccess={() => { load(); setMessage('✓ Activity submitted for faculty verification!'); setActiveTab('activities'); }}
              />
            )}

            {/* ─────── MY ACTIVITIES ─────── */}
            {activeTab === 'activities' && (
              <div className="space-y-5">
                {/* Summary pills */}
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { label: 'Approved', count: approved.length, color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' },
                    { label: 'Pending',  count: pending.length,  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
                    { label: 'Rejected', count: rejected.length, color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                      <span className="text-base font-black">{s.count}</span> {s.label}
                    </div>
                  ))}
                  <div className="ml-auto text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{activities.length} total records</div>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap gap-2">
                  {catNames.map(cat => (
                    <button key={cat} onClick={() => setFilterCat(cat)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: filterCat === cat ? '#6366f1' : 'var(--bg-card)',
                        border:     `1px solid ${filterCat === cat ? 'transparent' : 'var(--border)'}`,
                        color:      filterCat === cat ? '#fff' : 'var(--text-secondary)',
                        boxShadow:  filterCat === cat ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
                      }}
                    >{cat === 'All' ? `All (${activities.length})` : cat}</button>
                  ))}
                </div>

                {/* Activity cards */}
                <div className="space-y-2.5">
                  {filtered.map((a, i) => {
                    const cat = ACTIVITY_CATEGORIES.find(c => c.id === a.category_name);
                    return (
                      <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.025, 0.3) }}
                        className="flex items-start gap-4 p-4 rounded-2xl transition-all group"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                      >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                          style={{ background: cat?.bg || 'rgba(99,102,241,0.12)' }}>
                          {cat ? <cat.icon className="w-5 h-5" style={{ color: cat.color }} /> : <Activity className="w-5 h-5 text-brand-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                            <Badge status={a.verification_status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-[11px] px-2 py-0.5 rounded-md capitalize font-medium"
                              style={{ background: cat?.bg || 'rgba(99,102,241,0.12)', color: cat?.color || '#818cf8' }}>
                              {a.category_name}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Year {a.academic_year}</span>
                            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.activity_date}</span>
                            {a.duration_hours > 0 && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.duration_hours}h</span>}
                          </div>
                          {/* Rich detail chips */}
                          {a.details && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {a.details.bookTitle          && <Chip emoji="📚" label={a.details.bookTitle} />}
                              {a.details.attendancePercent  && <Chip emoji="✅" label={`${a.details.attendancePercent}% Attendance`} />}
                              {a.details.eventLevel         && <Chip emoji="🏟" label={a.details.eventLevel} />}
                              {a.details.sport              && <Chip emoji="⚽" label={a.details.sport} />}
                              {a.details.gameName           && <Chip emoji="♟" label={a.details.gameName} />}
                              {a.details.skillsLearned?.length > 0 && <Chip emoji="💡" label={a.details.skillsLearned.slice(0,2).join(', ')} />}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {filtered.length === 0 && <EmptyState icon={Activity} message="No activities in this category." />}
                </div>
              </div>
            )}

            {/* ─────── STATISTICS ─────── */}
            {activeTab === 'stats' && <ActivityStatsPanel activities={activities} />}

            {/* ─────── AI ASSESSMENT ─────── */}
            {activeTab === 'assessment' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Holistic Assessment</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Explainable AI analysis across 12 development dimensions</p>
                  </div>
                  <button onClick={runAssessment} disabled={busy} className="btn-primary flex items-center gap-2 shrink-0">
                    {busy ? <><RefreshCw className="w-4 h-4 animate-spin" />Running…</> : <><Sparkles className="w-4 h-4" />Run Assessment</>}
                  </button>
                </div>
                {message && <Msg text={message} />}
                {assessment ? (
                  <>
                    {/* Score hero row */}
                    <div className="grid sm:grid-cols-4 gap-4">
                      <div className="sm:col-span-1 rounded-2xl p-6 text-center flex flex-col items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(79,70,229,0.08))', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 8px 32px rgba(99,102,241,0.15)' }}>
                        <div className="text-6xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{assessment.overall}</div>
                        <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Overall Score</div>
                        <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>out of 100</div>
                        <div className="flex gap-1.5 mt-3 flex-wrap justify-center">
                          {assessment.strengths?.map(s => (
                            <span key={s} className="text-[9px] font-bold capitalize px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <Section title="Dimension Scores" icon={BarChart2}>
                          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
                            {Object.entries(assessment.scores).map(([dim, score]) => {
                              const m = DIM_META[dim] || DIM_META.academic;
                              return (
                                <div key={dim}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[11px] font-bold capitalize flex items-center gap-1.5" style={{ color: m.color }}>
                                      <m.icon className="w-3 h-3" /> {dim}
                                    </span>
                                    <span className="text-[11px] font-black" style={{ color: 'var(--text-primary)' }}>{score}</span>
                                  </div>
                                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--border)' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                                      className="h-2 rounded-full" style={{ background: m.grad }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Section>
                      </div>
                    </div>
                    {/* Radar + Explanation */}
                    <div className="grid lg:grid-cols-2 gap-6">
                      <Section title="Competency Radar" icon={Network}>
                        <DevelopmentRadar scores={assessment.scores} />
                      </Section>
                      <Section title="Explainable AI — Why this score?" icon={BrainCircuit}>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {Object.entries(assessment.explanation).map(([dim, text]) => (
                            <div key={dim} className="p-3 rounded-xl" style={{ background: 'var(--bg-card)', borderLeft: `3px solid ${DIM_META[dim]?.color || '#6366f1'}` }}>
                              <p className="text-[11px] font-bold capitalize mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                {DIM_META[dim] && (() => {
                                  const Icon = DIM_META[dim].icon;
                                  return <Icon className="w-3 h-3" style={{ color: DIM_META[dim].color }} />;
                                })()} {dim}
                              </p>
                              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
                            </div>
                          ))}
                        </div>
                      </Section>
                    </div>
                  </>
                ) : (
                  <Section title="" icon={BrainCircuit}>
                    <EmptyState icon={BrainCircuit} message="No assessment yet. Click 'Run Assessment' to analyze your activities."
                      action={<button className="btn-primary mt-4 mx-auto flex items-center gap-2" onClick={runAssessment} disabled={busy}><Sparkles className="w-4 h-4" />{busy ? 'Running…' : 'Run AI Assessment'}</button>} />
                  </Section>
                )}
              </div>
            )}

            {/* ─────── GROWTH ─────── */}
            {activeTab === 'growth' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Year-wise Growth Report</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Holistic development trajectory across your academic years</p>
                </div>
                {growth.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {growth.map((g, i) => (
                        <motion.div key={g.year} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                          className="rounded-2xl p-6 text-center relative overflow-hidden group"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.05),transparent)' }} />
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Year {g.year}</p>
                          <p className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>{g.overall}</p>
                          <p className="text-[10px] text-cyan-400 mt-1 font-bold">/ 100</p>
                          {g.scores && Object.entries(g.scores).slice(0,3).map(([d,v]) => (
                            <div key={d} className="flex justify-between text-[10px] mt-1.5">
                              <span className="capitalize" style={{ color: 'var(--text-muted)' }}>{d}</span>
                              <span style={{ color: DIM_META[d]?.color || '#818cf8' }}>{v}</span>
                            </div>
                          ))}
                        </motion.div>
                      ))}
                    </div>
                    {growth.length > 1 && (
                      <Section title="Growth Trend & Predictive AI" icon={TrendingUp}>
                        <div className="flex items-end gap-5 h-40 px-6">
                          {growth.map((g, i) => (
                            <div key={g.year} className="flex-1 flex flex-col items-center gap-2">
                              <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{g.overall}</span>
                              <motion.div initial={{ height: 0 }} animate={{ height: `${g.overall}%` }} transition={{ delay: i * 0.15, duration: 1, ease: 'easeOut' }}
                                className="w-full rounded-t-xl min-h-[4px]" style={{ background: 'linear-gradient(to top, #4f46e5, #818cf8)' }} />
                              <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Y{g.year}</span>
                            </div>
                          ))}
                          {/* Predictive AI Bar */}
                          {growth.length < 4 && (() => {
                            const diff = growth[growth.length - 1].overall - growth[growth.length - 2].overall;
                            const pred = Math.min(100, Math.max(0, Math.round((growth[growth.length - 1].overall + diff)*10)/10));
                            const nextYear = growth[growth.length - 1].year + 1;
                            return (
                              <div key="pred" className="flex-1 flex flex-col items-center gap-2 opacity-60">
                                <span className="text-xs font-black text-amber-400">{pred} (Pred)</span>
                                <motion.div initial={{ height: 0 }} animate={{ height: `${pred}%` }} transition={{ delay: growth.length * 0.15, duration: 1, ease: 'easeOut' }}
                                  className="w-full rounded-t-xl min-h-[4px]" style={{ border: '2px dashed #fbbf24', background: 'rgba(251,191,36,0.1)' }} />
                                <span className="text-[10px] font-bold text-amber-400">Y{nextYear}</span>
                              </div>
                            );
                          })()}
                        </div>
                        {growth.length >= 2 && (
                          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                              <Sparkles className="w-4 h-4 inline-block mr-2 text-brand-400 mb-0.5" />
                              The student demonstrated significant growth in <strong>technical engagement</strong> and <strong>leadership</strong>, 
                              particularly from Year {growth[0].year} to Year {growth[growth.length - 1].year}, resulting in an overall trajectory increase from {growth[0].overall} to {growth[growth.length - 1].overall}.
                            </p>
                          </div>
                        )}
                      </Section>
                    )}
                  </>
                ) : (
                  <Section title="" icon={TrendingUp}>
                    <EmptyState icon={TrendingUp} message="Run assessments across multiple years to see your growth trajectory." />
                  </Section>
                )}
              </div>
            )}

            {/* ─────── SKILLS ─────── */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Skills & Behavioral Profile</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>AI-mapped competency across 12 development dimensions</p>
                </div>
                {assessment ? (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(assessment.scores).map(([dim, score], i) => {
                        const m = DIM_META[dim] || DIM_META.academic;
                        const grade = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work';
                        const gc = score >= 80 ? '#34d399' : score >= 60 ? '#22d3ee' : score >= 40 ? '#fbbf24' : '#f87171';
                        return (
                          <motion.div key={dim} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                            className="p-5 rounded-2xl relative overflow-hidden group"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20"
                              style={{ background: `radial-gradient(circle at 100% 0%, ${m.color}, transparent 70%)` }} />
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `${m.color}18`, border: `1px solid ${m.color}30` }}>
                                <m.icon className="w-5 h-5" style={{ color: m.color }} />
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{score}</p>
                                <p className="text-[10px] font-bold" style={{ color: gc }}>{grade}</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold capitalize mb-2" style={{ color: 'var(--text-primary)' }}>{dim}</p>
                            <div className="w-full rounded-full h-1.5" style={{ background: 'var(--border)' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, ease: 'easeOut', delay: i * 0.07 }}
                                className="h-1.5 rounded-full" style={{ background: m.grad }} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    {recommendations?.developmentSuggestions?.length > 0 && (
                      <Section title="AI Development Suggestions" icon={Zap}>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {recommendations.developmentSuggestions.map((s, i) => (
                            <div key={i} className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
                                <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{s.dimension}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{s.score}/100</span>
                                </div>
                                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.suggestion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                  </>
                ) : (
                  <Section title="" icon={Target}>
                    <EmptyState icon={Target} message="Run AI Assessment first to generate your profile."
                      action={<button className="btn-primary mt-4 mx-auto flex items-center gap-2" onClick={() => setActiveTab('assessment')}><BrainCircuit className="w-4 h-4" />Go to Assessment</button>} />
                  </Section>
                )}
              </div>
            )}

            {/* ─────── CERTIFICATE ─────── */}
            {activeTab === 'certificates' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Holistic Development Certificate</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>AI-backed, QR-verifiable digital credential</p>
                </div>
                {message && <Msg text={message} />}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* The certificate */}
                  <div className="relative rounded-3xl p-8 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1a1040 0%, #0d0d2a 100%)', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 20px 60px rgba(99,102,241,0.2)' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30"
                      style={{ background: 'radial-gradient(circle at 80% 20%, rgba(99,102,241,0.4), transparent 60%)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20"
                      style={{ background: 'radial-gradient(circle at 20% 80%, rgba(6,182,212,0.4), transparent 60%)' }} />
                    {/* Decorative corner lines */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 rounded-tl-xl opacity-30" style={{ borderColor: '#818cf8' }} />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 rounded-br-xl opacity-30" style={{ borderColor: '#818cf8' }} />

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)' }}>
                          <Shield className="w-6 h-6 text-brand-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">CharactAI</p>
                          <p className="font-bold text-white text-sm">Holistic Development Certificate</p>
                        </div>
                      </div>
                      <p className="text-3xl font-black text-white mb-1 leading-tight">{user.name}</p>
                      <p className="text-sm text-slate-400 mb-6">{student.program} · Batch {student.batch}</p>
                      {certificate ? (
                        <>
                          <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.35)' }}>
                              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Certificate ID</p>
                              <p className="font-mono text-xs text-brand-300 break-all">{certificate.certificate_code}</p>
                            </div>
                            <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.35)' }}>
                              <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Final Score</p>
                              <p className="text-2xl font-black text-white leading-none">{certificate.overall_score}<span className="text-sm text-slate-500 font-normal ml-0.5">/100</span></p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <a href={`/api/certificates/${certificate.certificate_code}/download`} target="_blank" rel="noreferrer" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                              <Download className="w-4 h-4" /> Download PDF
                            </a>
                            <a href={`/verify/${certificate.certificate_code}`} target="_blank" rel="noreferrer" className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm" style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#e2e8f0' }}>
                              <ExternalLink className="w-4 h-4" /> Verify
                            </a>
                          </div>
                          <button onClick={() => setCertificate(null)} className="text-xs text-slate-400 hover:text-white mt-4 w-full text-center">Generate another certificate</button>
                        </>
                      ) : (
                        <>
                          {assessment ? (
                            <div className="space-y-2 mt-4">
                              <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Select Certificate Type</p>
                              <button onClick={() => generateCertificate('Overall Holistic Development')} disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2">
                                <Award className="w-4 h-4" /> Overall Holistic Development
                              </button>
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => generateCertificate('Academic Excellence')} disabled={busy} className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg font-bold transition-all" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" /> Academic
                                </button>
                                <button onClick={() => generateCertificate('Technical Excellence')} disabled={busy} className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg font-bold transition-all" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                  <Microscope className="w-3.5 h-3.5 text-cyan-400" /> Technical
                                </button>
                                <button onClick={() => generateCertificate('Leadership')} disabled={busy} className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg font-bold transition-all" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                  <Users className="w-3.5 h-3.5 text-purple-400" /> Leadership
                                </button>
                                <button onClick={() => generateCertificate('Community Engagement')} disabled={busy} className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg font-bold transition-all" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                  <Heart className="w-3.5 h-3.5 text-teal-400" /> Community
                                </button>
                              </div>
                              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Career Tools</p>
                                <button onClick={generateResumeAI} disabled={busy} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2 bg-slate-800 text-white border-indigo-500 hover:bg-indigo-900 transition-colors">
                                  <FileText className="w-4 h-4 text-indigo-400" /> Generate AI Resume (ATS)
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-400 mt-3 text-center flex items-center justify-center gap-1"><Zap className="w-3 h-3" /> Complete AI Assessment first</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* How it works */}
                  <Section title="How Certificate Generation Works" icon={BookOpen}>
                    <div className="space-y-5">
                      {[
                        { n: '01', title: 'Log All Activities', desc: 'Record library visits, daily classes, sports sessions, events, projects, and more throughout your degree.' },
                        { n: '02', title: 'Faculty Verification', desc: 'Each activity is reviewed and approved by your faculty mentor with evidence submission.' },
                        { n: '03', title: 'AI Assessment', desc: 'The AI engine analyzes verified activities across 12 dimensions to produce explainable holistic scores.' },
                        { n: '04', title: 'Certificate Issued', desc: 'A QR-verifiable digital certificate is generated with your complete 4-year development profile.' },
                      ].map(s => (
                        <div key={s.n} className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-brand-400 shrink-0"
                            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>{s.n}</div>
                          <div>
                            <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {showScanner && (
        <BiometricScannerModal 
          onClose={() => setShowScanner(false)} 
          onSuccess={syncBiometric} 
          userName={user.name} 
        />
      )}
    </div>
  );
}

/* ─────────────────────── Log Activity Form ─────────────────────────────── */

function LogActivityForm({ categories, onSuccess, academicYear, userName }) {
  const [step, setStep]           = useState(1);
  const [selectedCat, setSelectedCat] = useState(null);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm]           = useState({
    title: '', description: '', activityDate: new Date().toISOString().split('T')[0],
    academicYear: academicYear || 1, durationHours: '', role: '', achievement: '',
    bookTitle: '', author: '', pagesRead: '', topic: '', visitPurpose: 'study',
    attendancePercent: '', totalClasses: '', attended: '', participationType: 'Regular attendance',
    sport: '', trainingType: 'Practice', coach: '', skillsLearned: '',
    gameName: '', gameLevel: 'Beginner', gameSkills: '',
    eventName: '', eventLevel: 'College', eventOutcome: '',
    organization: '', serviceHours: '', beneficiaries: '',
  });

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const catMeta = selectedCat ? ACTIVITY_CATEGORIES.find(c => c.id === selectedCat.id) : null;

  const buildDetails = () => {
    if (!selectedCat) return null;
    switch (selectedCat.id) {
      case 'library':   return { bookTitle: form.bookTitle, author: form.author, pagesRead: +form.pagesRead||null, topic: form.topic, visitPurpose: form.visitPurpose };
      case 'classroom': return { attendancePercent: +form.attendancePercent||null, totalClasses: +form.totalClasses||null, attended: +form.attended||null, participationType: form.participationType };
      case 'sports':    return { sport: form.sport, trainingType: form.trainingType, coach: form.coach, skillsLearned: form.skillsLearned ? form.skillsLearned.split(',').map(s=>s.trim()) : [] };
      case 'games':     return { gameName: form.gameName, level: form.gameLevel, skillsLearned: form.gameSkills ? form.gameSkills.split(',').map(s=>s.trim()) : [] };
      case 'events':    return { eventName: form.eventName, eventLevel: form.eventLevel, role: form.role, outcome: form.eventOutcome };
      case 'social':    return { organization: form.organization, serviceHours: +form.serviceHours||null, beneficiaries: form.beneficiaries };
      default:          return null;
    }
  };

  const handleSubmit = async () => {
    setBusy(true); setError('');
    try {
      const catObj = categories.find(c => c.name === selectedCat?.id);
      if (!catObj) throw new Error('Category not found in database. Please re-seed.');
      await api.post('/activities', {
        categoryId: catObj.id, title: form.title, description: form.description,
        activityDate: form.activityDate, academicYear: form.academicYear,
        durationHours: form.durationHours || 0, role: form.role,
        achievement: form.achievement, detailsJson: buildDetails(),
      });
      onSuccess();
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed to submit.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Log New Activity</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track your complete development journey — every step counts</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center mb-8">
        {[
          { n: 1, label: 'Category' },
          { n: 2, label: 'Details' },
          { n: 3, label: 'Review' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${step >= s.n ? 'text-white shadow-lg' : ''}`}
                style={{
                  background: step > s.n ? '#10b981' : step === s.n ? '#6366f1' : 'var(--bg-card)',
                  border: step >= s.n ? 'none' : '2px solid var(--border)',
                  color: step >= s.n ? '#fff' : 'var(--text-muted)',
                  boxShadow: step === s.n ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
                }}>
                {step > s.n ? <CheckCheck className="w-4 h-4" /> : s.n}
              </div>
              <span className="text-[10px] mt-1 font-semibold" style={{ color: step >= s.n ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
            </div>
            {i < 2 && (
              <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-500"
                style={{ background: step > s.n ? '#6366f1' : 'var(--border)' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Choose Category ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <p className="text-sm font-semibold mb-5" style={{ color: 'var(--text-secondary)' }}>What type of activity did you do?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACTIVITY_CATEGORIES.map(cat => (
                <motion.button key={cat.id} whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedCat(cat); setStep(2); }}
                  className="p-4 rounded-2xl text-left transition-all"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: cat.bg }}>
                    <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{cat.label}</p>
                  <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{cat.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Fill Details ── */}
        {step === 2 && selectedCat && (
          <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: `${catMeta?.color || '#6366f1'}10`, border: `1px solid ${catMeta?.color || '#6366f1'}30` }}>
              {catMeta && <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: catMeta.bg }}><catMeta.icon className="w-5 h-5" style={{ color: catMeta.color }} /></div>}
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{catMeta?.label}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{catMeta?.desc}</p>
              </div>
              <button onClick={() => setStep(1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              {/* Universal fields */}
              <Field label="Activity Title *">
                <input className="input" value={form.title} onChange={e => F('title', e.target.value)} placeholder={`e.g. ${catMeta?.desc}`} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date *"><input type="date" className="input" value={form.activityDate} onChange={e => F('activityDate', e.target.value)} /></Field>
                <Field label="Academic Year *">
                  <select className="input" value={form.academicYear} onChange={e => F('academicYear', +e.target.value)}>
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </Field>
              </div>

              {/* ── Library ── */}
              {selectedCat.id === 'library' && (
                <FieldGroup color={catMeta?.color} label="📚 Library Details">
                  <Field label="Book Title"><input className="input" value={form.bookTitle} onChange={e => F('bookTitle', e.target.value)} placeholder="e.g. Introduction to Algorithms" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Author"><input className="input" value={form.author} onChange={e => F('author', e.target.value)} placeholder="e.g. Cormen et al." /></Field>
                    <Field label="Pages Read"><input type="number" className="input" value={form.pagesRead} onChange={e => F('pagesRead', e.target.value)} placeholder="e.g. 120" /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Topic / Subject"><input className="input" value={form.topic} onChange={e => F('topic', e.target.value)} placeholder="e.g. DSA, Networks" /></Field>
                    <Field label="Visit Purpose">
                      <select className="input" value={form.visitPurpose} onChange={e => F('visitPurpose', e.target.value)}>
                        {['study','research','personal growth','assignment','project'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </Field>
                  </div>
                </FieldGroup>
              )}

              {/* ── Classroom ── */}
              {selectedCat.id === 'classroom' && (
                <FieldGroup color={catMeta?.color} label="🏫 Classroom Details">
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Total Classes"><input type="number" className="input" value={form.totalClasses} onChange={e => F('totalClasses', e.target.value)} placeholder="120" /></Field>
                    <Field label="Attended"><input type="number" className="input" value={form.attended} onChange={e => F('attended', e.target.value)} placeholder="112" /></Field>
                    <Field label="Attendance %"><input type="number" className="input" value={form.attendancePercent} onChange={e => F('attendancePercent', e.target.value)} placeholder="91" /></Field>
                  </div>
                  <Field label="Participation Type">
                    <select className="input" value={form.participationType} onChange={e => F('participationType', e.target.value)}>
                      {['Regular attendance','Q&A participation','Lab sessions','Presentations','Active discussion','Assignment submission'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </Field>
                </FieldGroup>
              )}

              {/* ── Sports ── */}
              {selectedCat.id === 'sports' && (
                <FieldGroup color={catMeta?.color} label="⚽ Sports Details">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Sport Name"><input className="input" value={form.sport} onChange={e => F('sport', e.target.value)} placeholder="e.g. Badminton, Cricket" /></Field>
                    <Field label="Training Type">
                      <select className="input" value={form.trainingType} onChange={e => F('trainingType', e.target.value)}>
                        {['Practice','Match','Tournament','Coaching Session','Fitness Training','Competition'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Skills Learned (comma-separated)"><input className="input" value={form.skillsLearned} onChange={e => F('skillsLearned', e.target.value)} placeholder="e.g. smash, footwork, serve" /></Field>
                  <Field label="Coach / Trainer (optional)"><input className="input" value={form.coach} onChange={e => F('coach', e.target.value)} placeholder="e.g. Mr. Sharma" /></Field>
                </FieldGroup>
              )}

              {/* ── Games ── */}
              {selectedCat.id === 'games' && (
                <FieldGroup color={catMeta?.color} label="♟ Game & Strategy Details">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Game Name"><input className="input" value={form.gameName} onChange={e => F('gameName', e.target.value)} placeholder="e.g. Chess, Carrom" /></Field>
                    <Field label="Skill Level">
                      <select className="input" value={form.gameLevel} onChange={e => F('gameLevel', e.target.value)}>
                        {['Beginner','Intermediate','Advanced','Expert'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Skills / Strategies Learned"><input className="input" value={form.gameSkills} onChange={e => F('gameSkills', e.target.value)} placeholder="e.g. opening theory, endgame tactics" /></Field>
                </FieldGroup>
              )}

              {/* ── Events ── */}
              {selectedCat.id === 'events' && (
                <FieldGroup color={catMeta?.color} label="🎪 Event Details">
                  <Field label="Event Name"><input className="input" value={form.eventName} onChange={e => F('eventName', e.target.value)} placeholder="e.g. TechFest 2025, SIH" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Event Level">
                      <select className="input" value={form.eventLevel} onChange={e => F('eventLevel', e.target.value)}>
                        {['College','Inter-College','District','State','National','International'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </Field>
                    <Field label="Outcome / Result"><input className="input" value={form.eventOutcome} onChange={e => F('eventOutcome', e.target.value)} placeholder="e.g. Winner, Finalist" /></Field>
                  </div>
                </FieldGroup>
              )}

              {/* ── Social ── */}
              {selectedCat.id === 'social' && (
                <FieldGroup color={catMeta?.color} label="🌍 Social Service Details">
                  <Field label="Organization / Initiative"><input className="input" value={form.organization} onChange={e => F('organization', e.target.value)} placeholder="e.g. Red Cross, NSS" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Service Hours"><input type="number" className="input" value={form.serviceHours} onChange={e => F('serviceHours', e.target.value)} placeholder="e.g. 8" /></Field>
                    <Field label="Beneficiaries"><input className="input" value={form.beneficiaries} onChange={e => F('beneficiaries', e.target.value)} placeholder="e.g. 50 students" /></Field>
                  </div>
                </FieldGroup>
              )}

              {/* Common extra */}
              <div className="grid grid-cols-3 gap-3">
                <Field label="Your Role"><input className="input" value={form.role} onChange={e => F('role', e.target.value)} placeholder="Participant / Organizer" /></Field>
                <Field label="Achievement"><input className="input" value={form.achievement} onChange={e => F('achievement', e.target.value)} placeholder="Winner / Completed" /></Field>
                <Field label="Duration (hrs)"><input type="number" className="input" value={form.durationHours} onChange={e => F('durationHours', e.target.value)} placeholder="e.g. 3" /></Field>
              </div>
              <Field label="Description (optional)">
                <textarea className="input" rows={2} value={form.description} onChange={e => F('description', e.target.value)} placeholder="Brief description of this activity…" />
              </Field>
            </div>

            {error && <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>{error}</div>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2"><ChevronLeft className="w-4 h-4" />Back</button>
              <button onClick={() => { if (!form.title) { setError('Title is required.'); return; } setError(''); setStep(3); }}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                Review & Submit <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {/* Header */}
              <div className="px-5 py-4 flex items-center gap-3" style={{ background: `${catMeta?.color || '#6366f1'}10`, borderBottom: '1px solid var(--border)' }}>
                {catMeta && <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: catMeta.bg }}><catMeta.icon className="w-4.5 h-4.5" style={{ color: catMeta.color }} /></div>}
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{catMeta?.label} Activity — Review</p>
              </div>
              {/* Fields */}
              <div className="p-5 space-y-3">
                {[
                  ['Title',        form.title],
                  ['Date',         form.activityDate],
                  ['Academic Year',`Year ${form.academicYear}`],
                  ['Role',         form.role],
                  ['Achievement',  form.achievement],
                  ['Duration',     form.durationHours ? `${form.durationHours} hours` : null],
                  selectedCat?.id === 'library'   ? ['Book',          form.bookTitle]  : null,
                  selectedCat?.id === 'library'   ? ['Author',        form.author]     : null,
                  selectedCat?.id === 'library'   ? ['Pages',         form.pagesRead]  : null,
                  selectedCat?.id === 'library'   ? ['Topic',         form.topic]      : null,
                  selectedCat?.id === 'classroom' ? ['Attendance',    form.attendancePercent ? `${form.attendancePercent}%` : null] : null,
                  selectedCat?.id === 'classroom' ? ['Classes',       form.totalClasses && form.attended ? `${form.attended}/${form.totalClasses}` : null] : null,
                  selectedCat?.id === 'sports'    ? ['Sport',         form.sport]      : null,
                  selectedCat?.id === 'sports'    ? ['Training Type', form.trainingType]: null,
                  selectedCat?.id === 'sports'    ? ['Skills',        form.skillsLearned]: null,
                  selectedCat?.id === 'games'     ? ['Game',          form.gameName]   : null,
                  selectedCat?.id === 'games'     ? ['Skills',        form.gameSkills] : null,
                  selectedCat?.id === 'events'    ? ['Event',         form.eventName]  : null,
                  selectedCat?.id === 'events'    ? ['Level',         form.eventLevel] : null,
                  selectedCat?.id === 'events'    ? ['Outcome',       form.eventOutcome]: null,
                  selectedCat?.id === 'social'    ? ['Organization',  form.organization]: null,
                  selectedCat?.id === 'social'    ? ['Service Hours', form.serviceHours]: null,
                ].filter(r => r && r[1]).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span className="text-xs font-bold text-right max-w-[60%]" style={{ color: 'var(--text-primary)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <div className="p-3 rounded-xl text-xs flex items-start gap-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                  <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Activity will be submitted for <strong>faculty verification</strong> before contributing to your AI assessment.
                </div>
              </div>
            </div>

            {error && <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>{error}</div>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2"><ChevronLeft className="w-4 h-4" />Edit</button>
              <button onClick={() => setShowScanner(true)} disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                {busy ? <><RefreshCw className="w-4 h-4 animate-spin" />Submitting…</> : <><CheckCircle className="w-4 h-4" />Scan Face to Submit</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AiMentorChat student={student} assessment={assessment} />

      {showScanner && (
        <BiometricScannerModal 
          onClose={() => setShowScanner(false)} 
          onSuccess={() => { setShowScanner(false); handleSubmit(); }} 
          userName={userName} 
        />
      )}
    </div>
  );
}

/* ─────────────────────── Activity Stats Panel ──────────────────────────── */

function ActivityStatsPanel({ activities }) {
  const approved = activities.filter(a => a.verification_status === 'approved');
  const byCategory = ACTIVITY_CATEGORIES.map(cat => ({
    ...cat,
    count:    activities.filter(a => a.category_name === cat.id).length,
    approved: approved.filter(a => a.category_name === cat.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const maxCount    = Math.max(...byCategory.map(c => c.count), 1);
  const books       = activities.filter(a => a.details?.bookTitle);
  const libHours    = activities.filter(a => a.category_name === 'library').reduce((s, a) => s + (a.duration_hours || 0), 0);
  const sportsHrs   = activities.filter(a => a.category_name === 'sports').reduce((s, a) => s + (a.duration_hours || 0), 0);
  const events      = activities.filter(a => a.category_name === 'events');
  const natEvents   = events.filter(a => ['national','international'].some(k => a.details?.eventLevel?.toLowerCase().includes(k)));
  const avgAtt      = (() => {
    const cls = activities.filter(a => a.category_name === 'classroom' && a.details?.attendancePercent);
    return cls.length ? Math.round(cls.reduce((s, a) => s + a.details.attendancePercent, 0) / cls.length) : null;
  })();
  const socialHrs   = activities.filter(a => a.category_name === 'social').reduce((s, a) => s + (+a.details?.serviceHours || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Activity Statistics</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Visual breakdown of your complete development journey</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Library,     label: 'Library Hours',   value: `${libHours}h`,   sub: `${books.length} books read`,         color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
          { icon: School,      label: 'Avg Attendance',  value: avgAtt ? `${avgAtt}%` : '—', sub: 'Classroom regularity',     color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
          { icon: Dumbbell,    label: 'Sports Training', value: `${sportsHrs}h`,  sub: 'Total training hours',               color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
          { icon: CalendarDays,label: 'Events',          value: events.length,    sub: `${natEvents.length} national/intl`,  color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.2)' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-5" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}20` }}>
              <s.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Category breakdown */}
      <Section title="Activity Breakdown by Category" icon={BarChart3}>
        <div className="space-y-4">
          {byCategory.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: cat.bg }}>
                    <cat.icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{cat.approved} approved</span>
                  <span className="text-sm font-black w-6 text-right" style={{ color: cat.color }}>{cat.count}</span>
                </div>
              </div>
              <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: 'var(--border)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.count / maxCount) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: i * 0.05 }}
                  className="h-3 rounded-full" style={{ background: cat.color }} />
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Books */}
      {books.length > 0 && (
        <Section title={`Books & Reading — ${books.length} entries`} icon={Library}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {books.slice(0,6).map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <BookOpen className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{a.details.bookTitle}</p>
                  {a.details.author && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.details.author}</p>}
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {a.details.topic && <Chip emoji="📌" label={a.details.topic} />}
                    {a.details.pagesRead && <Chip emoji="📄" label={`${a.details.pagesRead} pages`} />}
                    {a.details.visitPurpose && <Chip emoji="" label={a.details.visitPurpose} />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Events timeline */}
      {events.length > 0 && (
        <Section title={`Events Participated — ${events.length} total`} icon={CalendarDays}>
          <div className="space-y-2.5">
            {events.map((a, i) => {
              const isNat = ['national','international'].some(k => a.details?.eventLevel?.toLowerCase().includes(k));
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 p-3.5 rounded-xl" style={{ background: 'var(--bg-card)', border: `1px solid ${isNat ? 'rgba(236,72,153,0.25)' : 'var(--border)'}` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: isNat ? 'rgba(236,72,153,0.15)' : 'rgba(99,102,241,0.12)' }}>
                    {isNat ? <Trophy className="w-4 h-4 text-pink-400" /> : <CalendarDays className="w-4 h-4 text-brand-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.activity_date} {a.details?.outcome && `· ${a.details.outcome}`}</p>
                  </div>
                  {a.details?.eventLevel && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
                      style={{ background: isNat ? 'rgba(236,72,153,0.15)' : 'var(--bg-card)', color: isNat ? '#f472b6' : 'var(--text-muted)', border: `1px solid ${isNat ? 'rgba(236,72,153,0.3)' : 'var(--border)'}` }}>
                      {a.details.eventLevel}
                    </span>
                  )}
                  <Badge status={a.verification_status} />
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Social service */}
      {socialHrs > 0 && (
        <Section title="Social Service Contributions" icon={Heart}>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="text-center px-6 py-4 rounded-2xl" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
              <p className="text-4xl font-black text-teal-400">{socialHrs}</p>
              <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Service Hours</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {activities.filter(a => a.category_name === 'social' && a.details?.organization).slice(0,4).map((a, i) => (
                <div key={i} className="p-3 rounded-xl text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{a.details.organization}</p>
                  <p style={{ color: 'var(--text-muted)' }}>{a.details.serviceHours ? `${a.details.serviceHours}h` : a.activity_date}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ─────────────────────── Small Reusable Components ─────────────────────── */

function HeroScoreCard({ value, label, sublabel, gradient, glow }) {
  return (
    <div className="rounded-2xl px-6 py-5 text-center min-w-[110px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: `0 4px 20px ${glow}` }}>
      <p className="text-3xl font-black" style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sublabel}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children, className = '', action }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {title && (
        <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            {Icon && <Icon className="w-4 h-4 text-brand-400" />}{title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function FieldGroup({ label, color, children }) {
  return (
    <div className="space-y-3 p-4 rounded-xl" style={{ background: `${color || '#6366f1'}08`, border: `1px solid ${color || '#6366f1'}25` }}>
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: color || '#818cf8' }}>{label}</p>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <Icon className="w-7 h-7" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
      </div>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{message}</p>
      {action}
    </div>
  );
}

function Chip({ emoji, label }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
      {emoji} {label}
    </span>
  );
}

function Msg({ text }) {
  const ok = !text.toLowerCase().includes('error') && !text.startsWith('✗');
  return (
    <div className="text-sm p-4 rounded-xl flex items-center gap-2"
      style={{ background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, color: ok ? '#34d399' : '#f87171' }}>
      {text}
    </div>
  );
}

/* ─────────────────────── Biometric Scanner Modal ─────────────────────────────── */

function BiometricScannerModal({ onClose, onSuccess, userName }) {
  const videoRef = React.useRef(null);
  const [status, setStatus] = useState('initializing'); // initializing, scanning, matched
  const [stream, setStream] = useState(null);

  useEffect(() => {
    // Start webcam
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(s => {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
        setStatus('scanning');
        
        // Simulate a 3-second face match
        setTimeout(() => {
          setStatus('matched');
          setTimeout(() => {
            s.getTracks().forEach(t => t.stop()); // kill camera
            onSuccess();
            onClose();
          }, 1500); // Wait 1.5s after match before closing
        }, 3000);
      })
      .catch(err => {
        setStatus('error');
      });

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md rounded-3xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="bg-black/50 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Bio-Sync</span>
          </div>
          <button onClick={() => { if(stream) stream.getTracks().forEach(t => t.stop()); onClose(); }} className="w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video feed */}
        <div className="relative aspect-[3/4] w-full bg-black">
          {status === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
              <RefreshCw className="w-8 h-8 animate-spin mb-3" />
              <p className="text-xs">Accessing Secure Camera...</p>
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400">
              <Shield className="w-8 h-8 mb-3" />
              <p className="text-xs">Camera access denied.</p>
            </div>
          )}

          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {/* Scanner UI overlays */}
          {status === 'scanning' && (
            <>
              {/* Laser line */}
              <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 animate-laser z-20" />
              {/* Corner brackets */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-10">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
              </div>
              <div className="absolute bottom-6 left-0 right-0 text-center z-10">
                <p className="text-xs font-mono text-cyan-400 animate-pulse tracking-widest bg-black/40 inline-block px-3 py-1 rounded">SCANNING FACIAL MARKERS...</p>
              </div>
            </>
          )}

          {status === 'matched' && (
            <div className="absolute inset-0 bg-emerald-500/20 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-4 border-4 border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.8)]">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm font-black text-white tracking-wider">IDENTITY VERIFIED</p>
              <p className="text-xl font-bold text-emerald-300 mt-1">{userName}</p>
              <p className="text-xs text-white/70 mt-2 font-mono">Syncing institutional data...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
