import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, Award, Activity, CheckCircle, Clock,
  FileText, Sparkles, ChevronRight, BrainCircuit, Target, Network,
  Star, BookOpen, Users, GraduationCap, Zap, Shield, BarChart2,
  AlignLeft, ArrowUpRight, Download, ExternalLink, RefreshCw,
  PlusCircle, Library, School, Dumbbell, Gamepad2, CalendarDays,
  Heart, Trophy, ChevronLeft, X, CheckCheck, BarChart3, Microscope,
  Globe, Flame, Medal, Clock3, Menu, Home, LogOut, Bell,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import DevelopmentRadar from '../../components/DevelopmentRadar';

/* ─────────────────────── Icon-safe renderer ────────────────────────────────
   React JSX requires a capitalized identifier — never use obj[key] as a tag. */
const Icon = ({ component: C, ...props }) => C ? <C {...props} /> : null;

/* ─────────────────────────────── Constants ─────────────────────────────── */

const TABS = [
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'log',          label: 'Log Activity',  icon: PlusCircle },
  { id: 'activities',   label: 'Activities',    icon: Activity },
  { id: 'stats',        label: 'Statistics',    icon: BarChart3 },
  { id: 'assessment',   label: 'AI Assessment', icon: BrainCircuit },
  { id: 'growth',       label: 'Growth',        icon: TrendingUp },
  { id: 'skills',       label: 'Skills',        icon: Target },
  { id: 'certificates', label: 'Certificate',   icon: Award },
];

const CATEGORIES = [
  { id: 'library',    label: 'Library Visit',     icon: Library,       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   desc: 'Books, research, reading' },
  { id: 'classroom',  label: 'Class Attendance',  icon: School,        color: '#6366f1', bg: 'rgba(99,102,241,0.12)',   desc: 'Attendance, participation' },
  { id: 'academic',   label: 'Academic',          icon: GraduationCap, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',   desc: 'Assignments, exams' },
  { id: 'learning',   label: 'Course / Learning', icon: BookOpen,      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',   desc: 'Certifications, workshops' },
  { id: 'technical',  label: 'Technical',         icon: Microscope,    color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',    desc: 'Projects, hackathons' },
  { id: 'sports',     label: 'Sports & Fitness',  icon: Dumbbell,      color: '#10b981', bg: 'rgba(16,185,129,0.12)',   desc: 'Practice, tournaments' },
  { id: 'games',      label: 'Games & Strategy',  icon: Gamepad2,      color: '#f97316', bg: 'rgba(249,115,22,0.12)',   desc: 'Chess, strategy games' },
  { id: 'events',     label: 'Events',            icon: CalendarDays,  color: '#ec4899', bg: 'rgba(236,72,153,0.12)',   desc: 'College, national events' },
  { id: 'cultural',   label: 'Cultural',          icon: Star,          color: '#a855f7', bg: 'rgba(168,85,247,0.12)',   desc: 'Dance, music, drama' },
  { id: 'leadership', label: 'Leadership',        icon: Users,         color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',    desc: 'Clubs, organizing' },
  { id: 'social',     label: 'Social Service',    icon: Heart,         color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',   desc: 'Volunteering, NGO' },
  { id: 'teamwork',   label: 'Teamwork',          icon: Network,       color: '#64748b', bg: 'rgba(100,116,139,0.12)',  desc: 'Group projects' },
];

const DIM_META = {
  discipline:                  { color: '#fbbf24', grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)',  Icon: Flame },
  consistency:                 { color: '#fb923c', grad: 'linear-gradient(90deg,#f97316,#fb923c)',  Icon: Clock },
  learning_orientation:        { color: '#a78bfa', grad: 'linear-gradient(90deg,#8b5cf6,#a78bfa)',  Icon: BookOpen },
  leadership:                  { color: '#c084fc', grad: 'linear-gradient(90deg,#a855f7,#c084fc)',  Icon: Users },
  teamwork:                    { color: '#94a3b8', grad: 'linear-gradient(90deg,#64748b,#94a3b8)',  Icon: Network },
  technical_engagement:        { color: '#22d3ee', grad: 'linear-gradient(90deg,#06b6d4,#22d3ee)',  Icon: Microscope },
  academic_engagement:         { color: '#60a5fa', grad: 'linear-gradient(90deg,#3b82f6,#60a5fa)',  Icon: GraduationCap },
  community_participation:     { color: '#2dd4bf', grad: 'linear-gradient(90deg,#14b8a6,#2dd4bf)',  Icon: Heart },
  creativity:                  { color: '#f472b6', grad: 'linear-gradient(90deg,#ec4899,#f472b6)',  Icon: Star },
  extracurricular_involvement: { color: '#fb7185', grad: 'linear-gradient(90deg,#f43f5e,#fb7185)',  Icon: CalendarDays },
  personal_development:        { color: '#34d399', grad: 'linear-gradient(90deg,#10b981,#34d399)',  Icon: Dumbbell },
};

const formatDim = (dim) => dim.replace(/_/g, ' ');

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
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const tabsRef = useRef(null);

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
      try { const r = await api.get('/certificates/mine'); setCertificate(r.data.certificates[0] || null); } catch {}
    } catch (err) { console.error('Load failed:', err); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (!tabsRef.current) return;
    const el = tabsRef.current.querySelector('[data-active="true"]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  const runAssessment = async () => {
    setBusy(true); setMessage('');
    try   { await api.post(`/ai/assessment/${student.id}`); await load(); setMessage('success:Assessment complete! Scores updated.'); }
    catch { setMessage('error:Error running assessment. Please try again.'); }
    finally { setBusy(false); }
  };

  const generateCertificate = async () => {
    setBusy(true); setMessage('');
    try { const { data } = await api.post(`/certificates/${student.id}/generate`); setMessage(`success:Certificate ${data.certificateCode} generated!`); await load(); }
    catch { setMessage('error:Certificate generation failed. Complete AI Assessment first.'); }
    finally { setBusy(false); }
  };

  const switchTab = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  if (!student) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: 'var(--bg-base)' }}>
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-2 border-brand-500/30 rounded-full animate-spin [animation-duration:3s]" />
        <div className="absolute inset-2 border-2 border-t-brand-500 rounded-full animate-spin" />
        <div className="absolute inset-5 border-2 border-r-cyan-400 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
        <BrainCircuit className="absolute inset-0 m-auto w-7 h-7 text-brand-400 animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Initializing AI Engine</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Loading your development profile…</p>
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
      <div className="relative overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-0 right-1/4 w-64 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.09) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium pt-6 mb-4" style={{ color: 'var(--text-muted)' }}>
            <GraduationCap className="w-3.5 h-3.5" />
            <span>CharactAI</span>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: 'var(--text-primary)' }}>Student Portal</span>
          </div>

          {/* ── Hero Row ── */}
          <div className="pt-5 sm:pt-0 pb-5 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
            {/* Identity */}
            <div className="flex items-start sm:items-center gap-4 flex-1">
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 6px 24px rgba(99,102,241,0.35)' }}>
                  {user.name.charAt(0)}
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2"
                  style={{ borderColor: 'var(--bg-surface)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {student.program} · Batch {student.batch}
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                  Hello, {user.name.split(' ')[0]}! 👋
                </h1>
                <p className="text-[10px] font-bold mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                  Transforming years of student activities into an evidence-based holistic development profile.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md border text-brand-400 border-brand-500/25 bg-brand-500/10">
                    {student.student_code || 'CAI-001'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {student.department}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Cards — scroll on mobile */}
            <div className="flex items-stretch gap-3 overflow-x-auto scrollbar-hide pb-1">
              <ScoreCard value={assessment?.overall ?? '—'} label="Holistic Score" sub="AI-Powered"
                grad="linear-gradient(135deg,#6366f1,#4f46e5)" glow="rgba(99,102,241,0.25)" />
              <ScoreCard value={student.cgpa ?? '—'}          label="CGPA"          sub="Academic"
                grad="linear-gradient(135deg,#06b6d4,#0891b2)" glow="rgba(6,182,212,0.25)" />
              <ScoreCard value={activities.length}            label="Activities"    sub={`${approved.length} verified`}
                grad="linear-gradient(135deg,#10b981,#059669)" glow="rgba(16,185,129,0.25)" />
            </div>
          </div>

          {/* ── Tab Bar ── */}
          <div ref={tabsRef} className="flex gap-0.5 overflow-x-auto scrollbar-hide" style={{ marginBottom: '-1px' }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button key={tab.id} data-active={active} onClick={() => switchTab(tab.id)}
                  className="relative flex items-center gap-1.5 px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all duration-200 rounded-t-xl shrink-0"
                  style={{
                    color:       active ? '#818cf8' : 'var(--text-muted)',
                    background:  active ? 'var(--bg-base)' : 'transparent',
                    borderTop:   active ? '1px solid var(--border)' : '1px solid transparent',
                    borderLeft:  active ? '1px solid var(--border)' : '1px solid transparent',
                    borderRight: active ? '1px solid var(--border)' : '1px solid transparent',
                    borderBottom:active ? '1px solid var(--bg-base)' : '1px solid transparent',
                    zIndex:      active ? 2 : 1,
                  }}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════ TAB CONTENT ══════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>

            {/* ════ DASHBOARD ════ */}
            {activeTab === 'dashboard' && (
              <DashboardTab
                approved={approved} pending={pending} activities={activities}
                certificate={certificate} assessment={assessment}
                recommendations={recommendations}
                onRunAssessment={runAssessment} onGoLog={() => switchTab('log')}
                onViewAll={() => switchTab('activities')} busy={busy}
              />
            )}

            {/* ════ LOG ACTIVITY ════ */}
            {activeTab === 'log' && (
              <LogActivityForm
                categories={categories} studentId={student.id}
                academicYear={student.batch ? Math.min(4, Math.max(1, new Date().getFullYear() - parseInt(student.batch.split('-')[0]) + 1)) : 1}
                onSuccess={() => { load(); setMessage('success:Activity submitted for faculty verification!'); switchTab('activities'); }}
              />
            )}

            {/* ════ MY ACTIVITIES ════ */}
            {activeTab === 'activities' && (
              <ActivitiesTab approved={approved} pending={pending} rejected={rejected}
                activities={activities} filtered={filtered} filterCat={filterCat}
                catNames={catNames} setFilterCat={setFilterCat} />
            )}

            {/* ════ STATISTICS ════ */}
            {activeTab === 'stats' && <ActivityStats activities={activities} />}

            {/* ════ AI ASSESSMENT ════ */}
            {activeTab === 'assessment' && (
              <AssessmentTab assessment={assessment} busy={busy} message={message}
                onRun={runAssessment} />
            )}

            {/* ════ GROWTH ════ */}
            {activeTab === 'growth' && <GrowthTab growth={growth} />}

            {/* ════ SKILLS ════ */}
            {activeTab === 'skills' && (
              <SkillsTab assessment={assessment} recommendations={recommendations}
                onGoAssess={() => switchTab('assessment')} />
            )}

            {/* ════ CERTIFICATE ════ */}
            {activeTab === 'certificates' && (
              <CertificateTab student={student} user={user} certificate={certificate}
                assessment={assessment} busy={busy} message={message}
                onGenerate={generateCertificate} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════ TAB PANELS ══════════════════════════════════════ */

function DashboardTab({ approved, pending, activities, certificate, assessment, recommendations, onRunAssessment, onGoLog, onViewAll, busy }) {
  const statCards = [
    { icon: CheckCircle, label: 'Verified Activities', value: approved.length,    delta: `${pending.length} pending`,   color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
    { icon: Clock,       label: 'Pending Review',      value: pending.length,     delta: 'Awaiting faculty',            color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
    { icon: FileText,    label: 'Total Logged',         value: activities.length, delta: `${[...new Set(activities.map(a=>a.category_name))].length} categories`, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
    { icon: Award,       label: 'Certificate',          value: certificate ? '✓' : '—', delta: certificate ? 'Issued' : 'Not issued', color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="rounded-2xl p-4 sm:p-5"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}20` }}>
                  <SIcon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                  style={{ color: s.color, background: `${s.color}15` }}>{s.delta}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Radar + Recent stream */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <SectionCard title="Development Radar" icon={Network} className="lg:col-span-2">
          {assessment
            ? <DevelopmentRadar scores={assessment.scores} />
            : <EmptyState icon={BrainCircuit} message="Run AI Assessment to unlock your radar chart.">
                <button className="btn-primary text-xs mt-4 px-5 py-2.5 mx-auto flex items-center gap-2"
                  onClick={onRunAssessment} disabled={busy}>
                  <Sparkles className="w-3.5 h-3.5" />{busy ? 'Running…' : 'Run Assessment'}
                </button>
              </EmptyState>
          }
        </SectionCard>

        <SectionCard title="Recent Activities" icon={Activity} className="lg:col-span-3"
          action={
            <button onClick={onViewAll}
              className="text-xs text-brand-400 font-bold flex items-center gap-1 hover:text-brand-300 transition-colors">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          }>
          <div className="space-y-2">
            {activities.slice(0, 6).map((a, i) => {
              const cat = CATEGORIES.find(c => c.id === a.category_name);
              const CatIcon = cat?.icon;
              return (
                <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: cat?.bg || 'rgba(99,102,241,0.12)' }}>
                    {CatIcon
                      ? <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                      : <Activity className="w-4 h-4 text-brand-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {a.category_name} · Year {a.academic_year}
                    </p>
                  </div>
                  <Badge status={a.verification_status} />
                </motion.div>
              );
            })}
            {activities.length === 0 && (
              <EmptyState icon={Activity} message="No activities yet.">
                <button className="btn-primary text-xs mt-3 px-5 py-2.5 mx-auto flex items-center gap-2"
                  onClick={onGoLog}>
                  <PlusCircle className="w-3.5 h-3.5" />Log First Activity
                </button>
              </EmptyState>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recommendations */}
      {recommendations && (
        <SectionCard title="AI Coach Recommendations" icon={Sparkles}>
          <div className="rounded-xl p-4 mb-4 text-sm leading-relaxed"
            style={{ color: 'var(--text-secondary)', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
            {recommendations.narrative}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recommendations.developmentSuggestions?.slice(0, 3).map((s, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span className="text-xs font-bold capitalize truncate" style={{ color: 'var(--text-primary)' }}>{s.dimension}</span>
                  <span className="ml-auto text-xs font-black text-cyan-400 shrink-0">{s.score}/100</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.suggestion}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function ActivitiesTab({ approved, pending, rejected, activities, filtered, filterCat, catNames, setFilterCat }) {
  return (
    <div className="space-y-5">
      {/* Status pills */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {[
          { label: 'Approved', count: approved.length, color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' },
          { label: 'Pending',  count: pending.length,  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
          { label: 'Rejected', count: rejected.length, color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
            <span className="text-base font-black">{s.count}</span>{s.label}
          </div>
        ))}
        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{activities.length} total</span>
      </div>

      {/* Category filter chips — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {catNames.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0"
            style={{
              background: filterCat === cat ? '#6366f1' : 'var(--bg-card)',
              border:     `1px solid ${filterCat === cat ? 'transparent' : 'var(--border)'}`,
              color:      filterCat === cat ? '#fff' : 'var(--text-secondary)',
              boxShadow:  filterCat === cat ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
            }}>
            {cat === 'All' ? `All (${activities.length})` : cat}
          </button>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-2.5">
        {filtered.map((a, i) => {
          const cat = CATEGORIES.find(c => c.id === a.category_name);
          const CatIcon = cat?.icon;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.3) }}
              className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl group"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{ background: cat?.bg || 'rgba(99,102,241,0.12)' }}>
                {CatIcon
                  ? <CatIcon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: cat.color }} />
                  : <Activity className="w-5 h-5 text-brand-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                  <Badge status={a.verification_status} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-md capitalize font-medium"
                    style={{ background: cat?.bg || 'rgba(99,102,241,0.12)', color: cat?.color || '#818cf8' }}>
                    {a.category_name}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Year {a.academic_year}</span>
                  {a.activity_date && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.activity_date}</span>}
                  {a.duration_hours > 0 && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.duration_hours}h</span>}
                </div>
                {/* Rich detail chips */}
                {a.details && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {a.details.bookTitle          && <InfoChip label={a.details.bookTitle} prefix="📚" />}
                    {a.details.attendancePercent  && <InfoChip label={`${a.details.attendancePercent}%`} prefix="✅" />}
                    {a.details.eventLevel         && <InfoChip label={a.details.eventLevel} prefix="🏟" />}
                    {a.details.sport              && <InfoChip label={a.details.sport} prefix="⚽" />}
                    {a.details.gameName           && <InfoChip label={a.details.gameName} prefix="♟" />}
                    {a.details.skillsLearned?.length > 0 && <InfoChip label={a.details.skillsLearned.slice(0, 2).join(', ')} prefix="💡" />}
                    
                    {a.details.academicAttendance && <InfoChip label={`${a.details.academicAttendance}% Attd`} prefix="✅" />}
                    {a.details.semesterResults    && <InfoChip label={a.details.semesterResults} prefix="🎓" />}
                    {a.details.projectSubmissions && <InfoChip label={`${a.details.projectSubmissions} Projects`} prefix="🚀" />}
                    {a.details.presentations      && <InfoChip label={`${a.details.presentations} Presentations`} prefix="🗣" />}
                    
                    {a.details.libraryVisits      && <InfoChip label={`${a.details.libraryVisits} Visits`} prefix="🏛" />}
                    {a.details.booksCompleted     && <InfoChip label={`${a.details.booksCompleted} Books`} prefix="📚" />}
                    {a.details.certifications     && <InfoChip label={`${a.details.certifications} Certs`} prefix="🏅" />}
                    {a.details.onlineCourses      && <InfoChip label={`${a.details.onlineCourses} Courses`} prefix="💻" />}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && <EmptyState icon={Activity} message="No activities in this category." />}
      </div>
    </div>
  );
}

function AssessmentTab({ assessment, busy, message, onRun }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Holistic Assessment</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Explainable AI analysis across 12 development dimensions
          </p>
        </div>
        <button onClick={onRun} disabled={busy} className="btn-primary flex items-center gap-2 shrink-0 self-start">
          {busy ? <><RefreshCw className="w-4 h-4 animate-spin" />Running…</>
               : <><Sparkles className="w-4 h-4" />Run Assessment</>}
        </button>
      </div>

      {message && <StatusMsg text={message} />}

      {assessment ? (
        <>
          {/* Score overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Big score */}
            <div className="sm:col-span-1 rounded-2xl p-6 text-center flex flex-col items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 8px 32px rgba(99,102,241,0.12)' }}>
              <div className="text-5xl sm:text-6xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                {assessment.overall}
              </div>
              <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Overall Score</div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>out of 100</div>
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                {assessment.strengths?.map(s => (
                  <span key={formatDim(s)} className="text-[9px] font-bold capitalize px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>{formatDim(s)}</span>
                ))}
              </div>
            </div>

            {/* Dimension bars */}
            <div className="sm:col-span-3">
              <SectionCard title="Dimension Scores" icon={BarChart2}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
                  {Object.entries(assessment.scores).map(([dim, score]) => {
                    const m = DIM_META[dim] || DIM_META.academic;
                    const DimIcon = m.Icon;
                    return (
                      <div key={formatDim(dim)}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-bold capitalize flex items-center gap-1.5" style={{ color: m.color }}>
                            <DimIcon className="w-3 h-3" /> {formatDim(dim)}
                          </span>
                          <span className="text-[11px] font-black" style={{ color: 'var(--text-primary)' }}>{score}</span>
                        </div>
                        <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--border)' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="h-2 rounded-full" style={{ background: m.grad }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Radar + Explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard title="Competency Radar" icon={Network}>
              <DevelopmentRadar scores={assessment.scores} />
            </SectionCard>
            <SectionCard title="Why this score?" icon={BrainCircuit}>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {Object.entries(assessment.explanation || {}).map(([dim, text]) => {
                  const m = DIM_META[dim] || DIM_META.academic;
                  const DimIcon = m.Icon;
                  return (
                    <div key={formatDim(dim)} className="p-3 rounded-xl"
                      style={{ background: 'var(--bg-base)', borderLeft: `3px solid ${m.color}` }}>
                      <p className="text-[11px] font-bold capitalize mb-0.5 flex items-center gap-1.5"
                        style={{ color: 'var(--text-primary)' }}>
                        <DimIcon className="w-3 h-3" style={{ color: m.color }} /> {formatDim(dim)}
                      </p>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </>
      ) : (
        <SectionCard title="" icon={BrainCircuit}>
          <EmptyState icon={BrainCircuit} message="No assessment yet. Click 'Run Assessment' to analyze your activities.">
            <button className="btn-primary mt-4 mx-auto flex items-center gap-2 px-5 py-2.5"
              onClick={onRun} disabled={busy}>
              <Sparkles className="w-4 h-4" />{busy ? 'Running…' : 'Run AI Assessment'}
            </button>
          </EmptyState>
        </SectionCard>
      )}
    </div>
  );
}

function GrowthTab({ growth }) {
  if (!growth || growth.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Year-wise Growth</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Holistic development across your academic years</p>
        </div>
        <SectionCard title="" icon={TrendingUp}>
          <EmptyState icon={TrendingUp} message="Run assessments across multiple years to see your growth trajectory." />
        </SectionCard>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Year-wise Growth</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Holistic development trajectory across academic years</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {growth.map((g, i) => (
          <motion.div key={g.year} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-5 sm:p-6 text-center relative overflow-hidden group"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
              style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.05),transparent)' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Year {g.year}
            </p>
            <p className="text-4xl sm:text-5xl font-black" style={{ color: 'var(--text-primary)' }}>{g.overall}</p>
            <p className="text-[10px] text-cyan-400 mt-1 font-bold">/ 100</p>
            {g.scores && Object.entries(g.scores).slice(0, 3).map(([d, v]) => {
              const m = DIM_META[d] || DIM_META.academic;
              return (
                <div key={formatDim(d)} className="flex justify-between text-[10px] mt-1.5">
                  <span className="capitalize" style={{ color: 'var(--text-muted)' }}>{formatDim(d)}</span>
                  <span style={{ color: m.color }}>{v}</span>
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>

      {growth.length > 1 && (
        <SectionCard title="Growth Trend" icon={TrendingUp}>
          <div className="flex items-end gap-4 sm:gap-6 h-40 px-2 sm:px-6">
            {growth.map((g, i) => (
              <div key={g.year} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{g.overall}</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${g.overall}%` }}
                  transition={{ delay: i * 0.15, duration: 1, ease: 'easeOut' }}
                  className="w-full rounded-t-xl min-h-[4px]"
                  style={{ background: 'linear-gradient(to top,#4f46e5,#818cf8)' }} />
                <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Y{g.year}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SkillsTab({ assessment, recommendations, onGoAssess }) {
  if (!assessment) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Skills & Behavioral Profile</h2>
        </div>
        <SectionCard title="" icon={Target}>
          <EmptyState icon={Target} message="Run AI Assessment first to generate your skills profile.">
            <button className="btn-primary mt-4 mx-auto flex items-center gap-2 px-5 py-2.5" onClick={onGoAssess}>
              <BrainCircuit className="w-4 h-4" />Go to Assessment
            </button>
          </EmptyState>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Skills & Behavioral Profile</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>AI-mapped competency across 12 development dimensions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(assessment.scores).map(([dim, score], i) => {
          const m = DIM_META[dim] || DIM_META.academic;
          const DimIcon = m.Icon;
          const grade = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work';
          const gc    = score >= 80 ? '#34d399'   : score >= 60 ? '#22d3ee' : score >= 40 ? '#fbbf24' : '#f87171';
          return (
            <motion.div key={formatDim(dim)} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 sm:p-5 rounded-2xl relative overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20"
                style={{ background: `radial-gradient(circle at 100% 0%, ${m.color}, transparent 70%)` }} />
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${m.color}18`, border: `1px solid ${m.color}30` }}>
                  <DimIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: m.color }} />
                </div>
                <div className="text-right">
                  <p className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{score}</p>
                  <p className="text-[10px] font-bold" style={{ color: gc }}>{grade}</p>
                </div>
              </div>
              <p className="text-sm font-bold capitalize mb-2" style={{ color: 'var(--text-primary)' }}>{formatDim(dim)}</p>
              <div className="w-full rounded-full h-1.5" style={{ background: 'var(--border)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: i * 0.07 }}
                  className="h-1.5 rounded-full" style={{ background: m.grad }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {recommendations?.developmentSuggestions?.length > 0 && (
        <SectionCard title="AI Development Suggestions" icon={Zap}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.developmentSuggestions.map((s, i) => (
              <div key={i} className="p-4 rounded-xl flex items-start gap-3"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{formatDim(s.dimension)}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {s.score}/100
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function CertificateTab({ student, user, certificate, assessment, busy, message, onGenerate }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Holistic Development Certificate</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>AI-backed, QR-verifiable digital credential</p>
      </div>
      {message && <StatusMsg text={message} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificate card */}
        <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1a1040 0%,#0d0d2a 100%)', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 20px 60px rgba(99,102,241,0.2)' }}>
          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle at 80% 20%,rgba(99,102,241,0.5),transparent 65%)' }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle at 20% 80%,rgba(6,182,212,0.5),transparent 65%)' }} />
          {/* Corner decorators */}
          <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 rounded-tl-xl opacity-30" style={{ borderColor: '#818cf8' }} />
          <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 rounded-br-xl opacity-30" style={{ borderColor: '#818cf8' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)' }}>
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">CharactAI</p>
                <p className="font-bold text-white text-sm">Holistic Development Certificate</p>
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-black text-white mb-1 leading-tight">{user.name}</p>
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
                    <p className="text-2xl font-black text-white leading-none">
                      {certificate.overall_score}<span className="text-sm text-slate-500 font-normal ml-0.5">/100</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={`/api/certificates/${certificate.certificate_code}/download`}
                    target="_blank" rel="noreferrer"
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-3">
                    <Download className="w-4 h-4" /> Download PDF
                  </a>
                  <a href={`/verify/${certificate.certificate_code}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 text-sm py-3 rounded-xl font-bold transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#e2e8f0' }}>
                    <ExternalLink className="w-4 h-4" /> Verify Online
                  </a>
                </div>
              </>
            ) : (
              <>
                <button onClick={onGenerate} disabled={busy || !assessment}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3">
                  {busy
                    ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating…</>
                    : <><Sparkles className="w-4 h-4" />Generate Certificate</>}
                </button>
                {!assessment && (
                  <p className="text-xs text-amber-400 mt-3 text-center flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" /> Complete AI Assessment first
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* How it works */}
        <SectionCard title="How Certificate Generation Works" icon={BookOpen}>
          <div className="space-y-5">
            {[
              { n: '01', title: 'Log All Activities', desc: 'Record library visits, daily classes, sports, events, projects throughout your degree.' },
              { n: '02', title: 'Faculty Verification', desc: 'Each activity is reviewed and approved by your faculty mentor with evidence.' },
              { n: '03', title: 'AI Assessment', desc: 'The AI engine analyzes verified activities across 12 dimensions to produce holistic scores.' },
              { n: '04', title: 'Certificate Issued', desc: 'A QR-verifiable digital certificate is generated with your complete 4-year development profile.' },
            ].map(s => (
              <div key={s.n} className="flex gap-3 sm:gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-brand-400 shrink-0"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  {s.n}
                </div>
                <div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* ═══════════════════════ LOG ACTIVITY FORM ════════════════════════════════ */

function LogActivityForm({ categories, onSuccess, academicYear }) {
  const [step,        setStep]        = useState(1);
  const [selectedCat, setSelectedCat] = useState(null);
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState('');
  const [form,        setForm]        = useState({
    title: '', description: '', activityDate: new Date().toISOString().split('T')[0],
    academicYear: academicYear || 1, durationHours: '', role: '', achievement: '',
    bookTitle: '', author: '', pagesRead: '', topic: '', visitPurpose: 'study',
    attendancePercent: '', totalClasses: '', attended: '', participationType: 'Regular attendance',
    sport: '', trainingType: 'Practice', coach: '', skillsLearned: '',
    gameName: '', gameLevel: 'Beginner', gameSkills: '',
    eventName: '', eventLevel: 'College', eventOutcome: '',
    organization: '', serviceHours: '', beneficiaries: '',
    academicAttendance: '', academicClasses: '', assignmentsCompleted: '', internalAssessments: '',
    semesterResults: '', projectSubmissions: '', presentations: '', vivaPerformance: '',
    academicCompetitions: '', researchActivities: '',
    libraryVisits: '', booksBorrowed: '', booksCompleted: '', readingDuration: '',
    technicalBooks: '', nonFictionBooks: '', researchPapersRead: '', onlineCourses: '',
    certifications: '', workshops: '', seminars: '',
  });

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const catMeta = selectedCat ? CATEGORIES.find(c => c.id === selectedCat.id) : null;
  const CatIcon = catMeta?.icon;

  const buildDetails = () => {
    if (!selectedCat) return null;
    switch (selectedCat.id) {
      case 'academic': return {
        academicAttendance: +form.academicAttendance || null, academicClasses: +form.academicClasses || null,
        assignmentsCompleted: +form.assignmentsCompleted || null, internalAssessments: form.internalAssessments,
        semesterResults: form.semesterResults, projectSubmissions: +form.projectSubmissions || null,
        presentations: +form.presentations || null, vivaPerformance: form.vivaPerformance,
        academicCompetitions: +form.academicCompetitions || null, researchActivities: +form.researchActivities || null
      };
      case 'learning':
      case 'library': return {
        libraryVisits: +form.libraryVisits || null, booksBorrowed: +form.booksBorrowed || null,
        booksCompleted: +form.booksCompleted || null, readingDuration: +form.readingDuration || null,
        technicalBooks: +form.technicalBooks || null, nonFictionBooks: +form.nonFictionBooks || null,
        researchPapersRead: +form.researchPapersRead || null, onlineCourses: +form.onlineCourses || null,
        certifications: +form.certifications || null, workshops: +form.workshops || null, seminars: +form.seminars || null
      };
      case 'classroom': return { attendancePercent: +form.attendancePercent || null, totalClasses: +form.totalClasses || null, attended: +form.attended || null, participationType: form.participationType };
      case 'sports':    return { sport: form.sport, trainingType: form.trainingType, coach: form.coach, skillsLearned: form.skillsLearned ? form.skillsLearned.split(',').map(s => s.trim()) : [] };
      case 'games':     return { gameName: form.gameName, level: form.gameLevel, skillsLearned: form.gameSkills ? form.gameSkills.split(',').map(s => s.trim()) : [] };
      case 'events':    return { eventName: form.eventName, eventLevel: form.eventLevel, role: form.role, outcome: form.eventOutcome };
      case 'social':    return { organization: form.organization, serviceHours: +form.serviceHours || null, beneficiaries: form.beneficiaries };
      default:          return null;
    }
  };

  const handleSubmit = async () => {
    setBusy(true); setError('');
    try {
      const catObj = categories.find(c => c.name === selectedCat?.id);
      if (!catObj) throw new Error('Category not found. Please refresh and try again.');
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

  const goNext = () => {
    if (!form.title.trim()) { setError('Activity title is required.'); return; }
    setError(''); setStep(3);
  };

  const reviewRows = [
    ['Title',         form.title],
    ['Date',          form.activityDate],
    ['Academic Year', `Year ${form.academicYear}`],
    form.role         ? ['Role',         form.role]        : null,
    form.achievement  ? ['Achievement',  form.achievement] : null,
    form.durationHours? ['Duration',     `${form.durationHours} hours`] : null,
    selectedCat?.id === 'academic'  && form.academicAttendance ? ['Attendance', `${form.academicAttendance}%`]                 : null,
    selectedCat?.id === 'academic'  && form.projectSubmissions ? ['Projects', form.projectSubmissions]                         : null,
    selectedCat?.id === 'academic'  && form.presentations      ? ['Presentations', form.presentations]                         : null,
    (selectedCat?.id === 'learning' || selectedCat?.id === 'library') && form.libraryVisits ? ['Library Visits', form.libraryVisits] : null,
    (selectedCat?.id === 'learning' || selectedCat?.id === 'library') && form.booksCompleted ? ['Books Read', form.booksCompleted]   : null,
    (selectedCat?.id === 'learning' || selectedCat?.id === 'library') && form.certifications ? ['Certifications', form.certifications] : null,
    selectedCat?.id === 'classroom' && form.attendancePercent  ? ['Attendance', `${form.attendancePercent}%`]              : null,
    selectedCat?.id === 'classroom' && form.totalClasses       ? ['Classes',    `${form.attended}/${form.totalClasses}`]   : null,
    selectedCat?.id === 'sports'    && form.sport              ? ['Sport',      form.sport]                                : null,
    selectedCat?.id === 'sports'    && form.trainingType       ? ['Type',       form.trainingType]                         : null,
    selectedCat?.id === 'sports'    && form.skillsLearned      ? ['Skills',     form.skillsLearned]                        : null,
    selectedCat?.id === 'games'     && form.gameName           ? ['Game',       form.gameName]                             : null,
    selectedCat?.id === 'games'     && form.gameSkills         ? ['Skills',     form.gameSkills]                           : null,
    selectedCat?.id === 'events'    && form.eventName          ? ['Event',      form.eventName]                            : null,
    selectedCat?.id === 'events'    && form.eventLevel         ? ['Level',      form.eventLevel]                           : null,
    selectedCat?.id === 'events'    && form.eventOutcome       ? ['Outcome',    form.eventOutcome]                         : null,
    selectedCat?.id === 'social'    && form.organization       ? ['Organization', form.organization]                       : null,
    selectedCat?.id === 'social'    && form.serviceHours       ? ['Service Hrs', form.serviceHours]                        : null,
  ].filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Log New Activity</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Track your complete development journey — every step counts
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-7 sm:mb-9">
        {[{ n: 1, label: 'Category' }, { n: 2, label: 'Details' }, { n: 3, label: 'Review' }].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
                style={{
                  background: step > s.n ? '#10b981' : step === s.n ? '#6366f1' : 'var(--bg-card)',
                  border:     step >= s.n ? 'none' : '2px solid var(--border)',
                  color:      step >= s.n ? '#fff' : 'var(--text-muted)',
                  boxShadow:  step === s.n ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
                }}>
                {step > s.n ? <CheckCheck className="w-4 h-4" /> : s.n}
              </div>
              <span className="text-[10px] mt-1 font-semibold hidden sm:block"
                style={{ color: step >= s.n ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className="flex-1 h-0.5 mx-2 mb-4 sm:mb-5 rounded-full transition-all duration-500"
                style={{ background: step > s.n ? '#6366f1' : 'var(--border)' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: Category ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
              What type of activity did you do?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {CATEGORIES.map(cat => {
                const CIcon = cat.icon;
                return (
                  <motion.button key={cat.id} whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedCat(cat); setStep(2); }}
                    className="p-3.5 sm:p-4 rounded-2xl text-left transition-all"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 sm:mb-3"
                      style={{ background: cat.bg }}>
                      <CIcon className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <p className="text-xs sm:text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{cat.label}</p>
                    <p className="text-[10px] mt-0.5 leading-tight hidden sm:block" style={{ color: 'var(--text-muted)' }}>{cat.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && selectedCat && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-5 p-3.5 sm:p-4 rounded-2xl"
              style={{ background: `${catMeta?.color || '#6366f1'}10`, border: `1px solid ${catMeta?.color || '#6366f1'}30` }}>
              {CatIcon && (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: catMeta?.bg }}>
                  <CatIcon className="w-5 h-5" style={{ color: catMeta?.color }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{catMeta?.label}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{catMeta?.desc}</p>
              </div>
              <button onClick={() => setStep(1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-all shrink-0"
                style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <FormField label="Activity Title *">
                <input className="input" value={form.title} onChange={e => F('title', e.target.value)}
                  placeholder={`e.g. ${catMeta?.desc}`} />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Date *">
                  <input type="date" className="input" value={form.activityDate} onChange={e => F('activityDate', e.target.value)} />
                </FormField>
                <FormField label="Academic Year *">
                  <select className="input" value={form.academicYear} onChange={e => F('academicYear', +e.target.value)}>
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </FormField>
              </div>

              {/* Category-specific fields */}
              {selectedCat.id === 'academic' && (
                <FieldGroup label="📚 Academic Portfolio" color={catMeta?.color}>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Attendance %"><input type="number" className="input" value={form.academicAttendance} onChange={e => F('academicAttendance', e.target.value)} placeholder="95" /></FormField>
                    <FormField label="Classes Attended"><input type="number" className="input" value={form.academicClasses} onChange={e => F('academicClasses', e.target.value)} placeholder="110" /></FormField>
                    <FormField label="Assignments %"><input type="number" className="input" value={form.assignmentsCompleted} onChange={e => F('assignmentsCompleted', e.target.value)} placeholder="100" /></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Internal Assessments"><input className="input" value={form.internalAssessments} onChange={e => F('internalAssessments', e.target.value)} placeholder="e.g. 18/20, 19/20" /></FormField>
                    <FormField label="Semester Results"><input className="input" value={form.semesterResults} onChange={e => F('semesterResults', e.target.value)} placeholder="e.g. 8.5 SGPA" /></FormField>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Projects"><input type="number" className="input" value={form.projectSubmissions} onChange={e => F('projectSubmissions', e.target.value)} placeholder="3" /></FormField>
                    <FormField label="Presentations"><input type="number" className="input" value={form.presentations} onChange={e => F('presentations', e.target.value)} placeholder="2" /></FormField>
                    <FormField label="Competitions"><input type="number" className="input" value={form.academicCompetitions} onChange={e => F('academicCompetitions', e.target.value)} placeholder="1" /></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Viva Performance"><input className="input" value={form.vivaPerformance} onChange={e => F('vivaPerformance', e.target.value)} placeholder="e.g. Excellent" /></FormField>
                    <FormField label="Research Papers"><input type="number" className="input" value={form.researchActivities} onChange={e => F('researchActivities', e.target.value)} placeholder="0" /></FormField>
                  </div>
                </FieldGroup>
              )}

              {(selectedCat.id === 'learning' || selectedCat.id === 'library') && (
                <FieldGroup label="📖 Learning & Reading Portfolio" color={catMeta?.color}>
                  <div className="grid grid-cols-4 gap-3">
                    <FormField label="Library Visits"><input type="number" className="input" value={form.libraryVisits} onChange={e => F('libraryVisits', e.target.value)} placeholder="184" /></FormField>
                    <FormField label="Borrowed"><input type="number" className="input" value={form.booksBorrowed} onChange={e => F('booksBorrowed', e.target.value)} placeholder="32" /></FormField>
                    <FormField label="Completed"><input type="number" className="input" value={form.booksCompleted} onChange={e => F('booksCompleted', e.target.value)} placeholder="10" /></FormField>
                    <FormField label="Read Hrs"><input type="number" className="input" value={form.readingDuration} onChange={e => F('readingDuration', e.target.value)} placeholder="50" /></FormField>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Tech Books"><input type="number" className="input" value={form.technicalBooks} onChange={e => F('technicalBooks', e.target.value)} placeholder="5" /></FormField>
                    <FormField label="Non-Fiction"><input type="number" className="input" value={form.nonFictionBooks} onChange={e => F('nonFictionBooks', e.target.value)} placeholder="3" /></FormField>
                    <FormField label="Research Papers"><input type="number" className="input" value={form.researchPapersRead} onChange={e => F('researchPapersRead', e.target.value)} placeholder="18" /></FormField>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Online Courses"><input type="number" className="input" value={form.onlineCourses} onChange={e => F('onlineCourses', e.target.value)} placeholder="6" /></FormField>
                    <FormField label="Certifications"><input type="number" className="input" value={form.certifications} onChange={e => F('certifications', e.target.value)} placeholder="9" /></FormField>
                    <FormField label="Workshops"><input type="number" className="input" value={form.workshops} onChange={e => F('workshops', e.target.value)} placeholder="14" /></FormField>
                  </div>
                  <FormField label="Seminars Attended">
                    <input type="number" className="input" value={form.seminars} onChange={e => F('seminars', e.target.value)} placeholder="5" />
                  </FormField>
                </FieldGroup>
              )}

              {selectedCat.id === 'classroom' && (
                <FieldGroup label="🏫 Classroom Details" color={catMeta?.color}>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Total Classes"><input type="number" className="input" value={form.totalClasses} onChange={e => F('totalClasses', e.target.value)} placeholder="120" /></FormField>
                    <FormField label="Attended"><input type="number" className="input" value={form.attended} onChange={e => F('attended', e.target.value)} placeholder="110" /></FormField>
                    <FormField label="Attendance %"><input type="number" className="input" value={form.attendancePercent} onChange={e => F('attendancePercent', e.target.value)} placeholder="92" /></FormField>
                  </div>
                  <FormField label="Participation Type">
                    <select className="input" value={form.participationType} onChange={e => F('participationType', e.target.value)}>
                      {['Regular attendance', 'Q&A participation', 'Lab sessions', 'Presentations', 'Active discussion'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </FormField>
                </FieldGroup>
              )}

              {selectedCat.id === 'sports' && (
                <FieldGroup label="⚽ Sports Details" color={catMeta?.color}>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Sport Name"><input className="input" value={form.sport} onChange={e => F('sport', e.target.value)} placeholder="Badminton, Cricket…" /></FormField>
                    <FormField label="Training Type">
                      <select className="input" value={form.trainingType} onChange={e => F('trainingType', e.target.value)}>
                        {['Practice', 'Match', 'Tournament', 'Coaching', 'Fitness', 'Competition'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </FormField>
                  </div>
                  <FormField label="Skills Learned (comma-separated)">
                    <input className="input" value={form.skillsLearned} onChange={e => F('skillsLearned', e.target.value)} placeholder="e.g. smash, footwork" />
                  </FormField>
                  <FormField label="Coach / Trainer (optional)">
                    <input className="input" value={form.coach} onChange={e => F('coach', e.target.value)} placeholder="Mr. Sharma" />
                  </FormField>
                </FieldGroup>
              )}

              {selectedCat.id === 'games' && (
                <FieldGroup label="♟ Game & Strategy" color={catMeta?.color}>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Game Name"><input className="input" value={form.gameName} onChange={e => F('gameName', e.target.value)} placeholder="Chess, Carrom…" /></FormField>
                    <FormField label="Skill Level">
                      <select className="input" value={form.gameLevel} onChange={e => F('gameLevel', e.target.value)}>
                        {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </FormField>
                  </div>
                  <FormField label="Strategies Learned">
                    <input className="input" value={form.gameSkills} onChange={e => F('gameSkills', e.target.value)} placeholder="opening theory, endgame tactics" />
                  </FormField>
                </FieldGroup>
              )}

              {selectedCat.id === 'events' && (
                <FieldGroup label="🎪 Event Details" color={catMeta?.color}>
                  <FormField label="Event Name">
                    <input className="input" value={form.eventName} onChange={e => F('eventName', e.target.value)} placeholder="TechFest 2025, Smart India Hackathon…" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Event Level">
                      <select className="input" value={form.eventLevel} onChange={e => F('eventLevel', e.target.value)}>
                        {['College', 'Inter-College', 'District', 'State', 'National', 'International'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Outcome">
                      <input className="input" value={form.eventOutcome} onChange={e => F('eventOutcome', e.target.value)} placeholder="Winner, Finalist…" />
                    </FormField>
                  </div>
                </FieldGroup>
              )}

              {selectedCat.id === 'social' && (
                <FieldGroup label="🌍 Social Service" color={catMeta?.color}>
                  <FormField label="Organization / Initiative">
                    <input className="input" value={form.organization} onChange={e => F('organization', e.target.value)} placeholder="Red Cross, NSS…" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Service Hours"><input type="number" className="input" value={form.serviceHours} onChange={e => F('serviceHours', e.target.value)} placeholder="8" /></FormField>
                    <FormField label="Beneficiaries"><input className="input" value={form.beneficiaries} onChange={e => F('beneficiaries', e.target.value)} placeholder="50 students" /></FormField>
                  </div>
                </FieldGroup>
              )}

              {/* Common extras */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Your Role"><input className="input" value={form.role} onChange={e => F('role', e.target.value)} placeholder="Participant / Organizer" /></FormField>
                <FormField label="Achievement"><input className="input" value={form.achievement} onChange={e => F('achievement', e.target.value)} placeholder="Winner / Completed" /></FormField>
                <FormField label="Duration (hours)"><input type="number" className="input" value={form.durationHours} onChange={e => F('durationHours', e.target.value)} placeholder="3" /></FormField>
              </div>
              <FormField label="Description (optional)">
                <textarea className="input" rows={2} value={form.description}
                  onChange={e => F('description', e.target.value)} placeholder="Brief description…" />
              </FormField>
            </div>

            {error && <ErrMsg text={error} />}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />Back
              </button>
              <button onClick={goNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                Review & Submit <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="px-4 sm:px-5 py-4 flex items-center gap-3"
                style={{ background: `${catMeta?.color || '#6366f1'}10`, borderBottom: '1px solid var(--border)' }}>
                {CatIcon && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: catMeta?.bg }}>
                    <CatIcon className="w-4 h-4" style={{ color: catMeta?.color }} />
                  </div>
                )}
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{catMeta?.label} — Review</p>
              </div>
              <div className="p-4 sm:p-5 space-y-2.5">
                {reviewRows.map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-1.5"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span className="text-xs font-bold text-right max-w-[60%] break-words" style={{ color: 'var(--text-primary)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 sm:px-5 pb-5">
                <div className="p-3 rounded-xl text-xs flex items-start gap-2"
                  style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                  <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Activity will be submitted for <strong>faculty verification</strong> before AI scoring.
                </div>
              </div>
            </div>

            {error && <ErrMsg text={error} />}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />Edit
              </button>
              <button onClick={handleSubmit} disabled={busy}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                {busy
                  ? <><RefreshCw className="w-4 h-4 animate-spin" />Submitting…</>
                  : <><CheckCircle className="w-4 h-4" />Submit Activity</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════ ACTIVITY STATS ══════════════════════════════════ */

function ActivityStats({ activities }) {
  const approved  = activities.filter(a => a.verification_status === 'approved');
  const books     = activities.filter(a => a.details?.bookTitle);
  const libHours  = activities.filter(a => a.category_name === 'library').reduce((s, a) => s + (a.duration_hours || 0), 0);
  const sportsHrs = activities.filter(a => a.category_name === 'sports').reduce((s, a) => s + (a.duration_hours || 0), 0);
  const events    = activities.filter(a => a.category_name === 'events');
  const natEvts   = events.filter(a => ['national', 'international'].some(k => a.details?.eventLevel?.toLowerCase().includes(k)));
  const avgAtt    = (() => {
    const cls = activities.filter(a => (a.category_name === 'classroom' && a.details?.attendancePercent) || (a.category_name === 'academic' && a.details?.academicAttendance));
    if (!cls.length) return null;
    return Math.round(cls.reduce((s, a) => s + (a.details.attendancePercent || a.details.academicAttendance), 0) / cls.length);
  })();
  const socialHrs = activities.filter(a => a.category_name === 'social').reduce((s, a) => s + (+a.details?.serviceHours || 0), 0);

  const totalProjects = activities.filter(a => a.category_name === 'academic').reduce((s, a) => s + (a.details?.projectSubmissions || 0), 0);
  const totalCerts = activities.filter(a => a.category_name === 'learning' || a.category_name === 'library').reduce((s, a) => s + (a.details?.certifications || 0), 0);
  const booksRead = activities.filter(a => a.category_name === 'learning' || a.category_name === 'library').reduce((s, a) => s + (a.details?.booksCompleted || 0), 0);

  const byCat = CATEGORIES.map(cat => ({
    ...cat,
    count:    activities.filter(a => a.category_name === cat.id).length,
    approved: approved.filter(a => a.category_name === cat.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...byCat.map(c => c.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Activity Statistics</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Visual breakdown of your development journey</p>
      </div>

      {/* Key stats — 2 cols mobile, 4 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: BookOpen,    label: 'Books Read',      value: booksRead,               sub: 'Total',          color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
          { icon: School,      label: 'Avg Attendance',  value: avgAtt ? `${avgAtt}%` : '—', sub: 'Classroom',      color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
          { icon: Award,       label: 'Certifications',  value: totalCerts,              sub: 'Total',          color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
          { icon: FileText,    label: 'Projects',        value: totalProjects,           sub: 'Academic',       color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.2)' },
        ].map((s, i) => {
          const SIcon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-4 sm:p-5"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${s.color}20` }}>
                <SIcon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-xl sm:text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Category breakdown */}
      <SectionCard title="Activity Breakdown by Category" icon={BarChart3}>
        <div className="space-y-3.5">
          {byCat.map((cat, i) => {
            const CatIcon = cat.icon;
            return (
              <motion.div key={cat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: cat.bg }}>
                      <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[11px] hidden sm:block" style={{ color: 'var(--text-muted)' }}>{cat.approved} approved</span>
                    <span className="text-sm font-black w-5 text-right" style={{ color: cat.color }}>{cat.count}</span>
                  </div>
                </div>
                <div className="w-full rounded-full h-2.5 sm:h-3 overflow-hidden" style={{ background: 'var(--border)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.count / maxCount) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: i * 0.05 }}
                    className="h-full rounded-full" style={{ background: cat.color }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </SectionCard>

      {/* Books */}
      {books.length > 0 && (
        <SectionCard title={`Books & Reading — ${books.length} entries`} icon={Library}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {books.slice(0, 6).map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="p-4 rounded-xl flex items-start gap-3"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <BookOpen className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{a.details.bookTitle}</p>
                  {a.details.author && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.details.author}</p>}
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {a.details.topic && <InfoChip label={a.details.topic} prefix="📌" />}
                    {a.details.pagesRead && <InfoChip label={`${a.details.pagesRead} pages`} prefix="📄" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Events */}
      {events.length > 0 && (
        <SectionCard title={`Events — ${events.length} participated`} icon={CalendarDays}>
          <div className="space-y-2.5">
            {events.map((a, i) => {
              const isNat = ['national', 'international'].some(k => a.details?.eventLevel?.toLowerCase().includes(k));
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl"
                  style={{ background: 'var(--bg-base)', border: `1px solid ${isNat ? 'rgba(236,72,153,0.25)' : 'var(--border)'}` }}>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: isNat ? 'rgba(236,72,153,0.15)' : 'rgba(99,102,241,0.12)' }}>
                    {isNat ? <Trophy className="w-4 h-4 text-pink-400" /> : <CalendarDays className="w-4 h-4 text-brand-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {a.activity_date}{a.details?.outcome ? ` · ${a.details.outcome}` : ''}
                    </p>
                  </div>
                  {a.details?.eventLevel && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 hidden sm:block"
                      style={{ background: isNat ? 'rgba(236,72,153,0.15)' : 'var(--bg-card)', color: isNat ? '#f472b6' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      {a.details.eventLevel}
                    </span>
                  )}
                  <Badge status={a.verification_status} />
                </motion.div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Social service */}
      {socialHrs > 0 && (
        <SectionCard title="Social Service Contributions" icon={Heart}>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="text-center px-6 py-5 rounded-2xl"
              style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
              <p className="text-4xl font-black text-teal-400">{socialHrs}</p>
              <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Service Hours</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {activities.filter(a => a.category_name === 'social' && a.details?.organization).slice(0, 4).map((a, i) => (
                <div key={i} className="p-3 rounded-xl text-xs"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{a.details.organization}</p>
                  <p style={{ color: 'var(--text-muted)' }}>
                    {a.details.serviceHours ? `${a.details.serviceHours}h` : a.activity_date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ═══════════════════════ SMALL ATOMS ══════════════════════════════════════ */

function ScoreCard({ value, label, sub, grad, glow }) {
  return (
    <div className="rounded-2xl px-4 sm:px-6 py-4 sm:py-5 text-center min-w-[90px] sm:min-w-[110px] shrink-0"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: `0 4px 20px ${glow}` }}>
      <p className="text-2xl sm:text-3xl font-black"
        style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
    </div>
  );
}

function SectionCard({ title, icon: SIcon, children, className = '', action }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 ${className}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {title && (
        <div className="flex items-center justify-between mb-4 sm:mb-5 pb-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            {SIcon && <SIcon className="w-4 h-4 text-brand-400" />}{title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="label text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

function FieldGroup({ label, color, children }) {
  return (
    <div className="space-y-3 p-3.5 sm:p-4 rounded-xl"
      style={{ background: `${color || '#6366f1'}08`, border: `1px solid ${color || '#6366f1'}25` }}>
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: color || '#818cf8' }}>{label}</p>
      {children}
    </div>
  );
}

function EmptyState({ icon: EIcon, message, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
        <EIcon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
      </div>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{message}</p>
      {children}
    </div>
  );
}

function InfoChip({ prefix, label }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
      {prefix} {label}
    </span>
  );
}

function StatusMsg({ text }) {
  const [type, msg] = text.split(':');
  const ok = type === 'success';
  return (
    <div className="text-sm p-3.5 sm:p-4 rounded-xl flex items-center gap-2"
      style={{
        background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        color: ok ? '#34d399' : '#f87171',
      }}>
      {ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
      {msg || text}
    </div>
  );
}

function ErrMsg({ text }) {
  return (
    <div className="mt-3 p-3 rounded-xl text-xs"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
      {text}
    </div>
  );
}
