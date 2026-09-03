import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import Badge from '../../components/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Building2, UserCircle, Briefcase, FileText, Bot, Cpu, CheckCircle2, AlertCircle, PlayCircle, ChevronRight } from 'lucide-react';

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showNewJob, setShowNewJob] = useState(false);
  const [interview, setInterview] = useState(null); // { interviewId, questions, studentId }
  const [answers, setAnswers] = useState({});
  const [answerResults, setAnswerResults] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(0);

  const loadJobs = useCallback(async () => {
    const { data } = await api.get('/recruitment/jobs');
    setJobs(data.jobs);
    if (!selectedJobId && data.jobs.length) setSelectedJobId(data.jobs[0].id);
  }, [selectedJobId]);

  const loadCandidates = useCallback(async (jobId) => {
    if (!jobId) return;
    const { data } = await api.get(`/recruitment/jobs/${jobId}/candidates`);
    setCandidates(data.candidates);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { if (selectedJobId) loadCandidates(selectedJobId); }, [selectedJobId, loadCandidates]);

  const runMatching = async () => {
    setBusy(true);
    setMessage('');
    try {
      const { data } = await api.post(`/recruitment/jobs/${selectedJobId}/run-matching`);
      setMessage(`AI screened ${data.totalCandidates} resumes → ${data.eligibleCount} met criteria → ${data.shortlistedCount} matched & ranked.`);
      await loadCandidates(selectedJobId);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setBusy(false);
    }
  };

  const startInterview = async (studentId) => {
    setBusy(true);
    setMessage('');
    setAnswers({});
    setAnswerResults({});
    setActiveQuestion(0);
    try {
      const { data } = await api.post(`/recruitment/jobs/${selectedJobId}/candidates/${studentId}/start-interview`);
      setInterview({ interviewId: data.interviewId, questions: data.questions, studentId, studentName: candidates.find(c => c.studentId === studentId)?.name });
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async (q, seq) => {
    const answerText = answers[q.questionId] || '';
    if (!answerText.trim()) return;
    const { data } = await api.post(`/recruitment/interviews/${interview.interviewId}/answer`, {
      questionId: q.questionId, difficulty: q.difficulty, slot: q.slot, topic: q.topic,
      answerText, sequence: seq, expectedConcepts: q.expectedConcepts
    });
    setAnswerResults(prev => ({ ...prev, [q.questionId]: data }));
    if (activeQuestion < interview.questions.length - 1) setActiveQuestion(prev => prev + 1);
  };

  const completeInterview = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/recruitment/interviews/${interview.interviewId}/complete`, {});
      setMessage(`Interview finalized. Candidate scored ${data.scores.overall}/100.`);
      setInterview(null);
      await loadCandidates(selectedJobId);
    } finally {
      setBusy(false);
    }
  };

  const finalize = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/recruitment/jobs/${selectedJobId}/finalize`, { topN: 25 });
      setMessage(data.message);
      await loadCandidates(selectedJobId);
    } finally {
      setBusy(false);
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  if (interview) {
    const q = interview.questions[activeQuestion];
    const isLast = activeQuestion === interview.questions.length - 1;
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">7-Minute AI Mock Interview</p>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Evaluating {interview.studentName}</h1>
            </div>
          </div>
          <button className="btn text-xs hover:bg-white/5" onClick={() => setInterview(null)}>Cancel</button>
        </div>

        {/* Progress Tracker */}
        <div className="flex gap-2 mb-6">
          {interview.questions.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full transition-all" style={{ background: i < activeQuestion ? '#22d3ee' : i === activeQuestion ? '#0891b2' : 'var(--border)' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card border-cyan-500/30 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-card))' }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-wider border border-cyan-500/20">{q.slot.replace('_', ' ')}</span>
              <span className="px-2 py-1 rounded bg-brand-500/10 text-brand-400 text-[10px] font-bold tracking-wider border border-brand-500/20">{q.topic}</span>
              <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold tracking-wider border border-purple-500/20">{q.difficulty} Level</span>
            </div>
            
            <h2 className="text-xl font-bold mb-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{q.question}</h2>
            
            <textarea
              className="input text-sm min-h-[120px] mb-4"
              placeholder="Record candidate's verbal response here..."
              value={answers[q.questionId] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.questionId]: e.target.value })}
            />
            
            <div className="flex items-center justify-between">
              {answerResults[q.questionId] ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" /> AI Scored: {answerResults[q.questionId].score}/100
                </div>
              ) : (
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>AI evaluates concepts like: {q.expectedConcepts.slice(0,2).join(', ')}...</span>
              )}
              
              {!answerResults[q.questionId] ? (
                <button className="btn text-white text-xs px-5 shadow-lg shadow-cyan-500/20 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }} onClick={() => submitAnswer(q, activeQuestion + 1)}>
                  <Cpu className="w-4 h-4" /> Analyze Response
                </button>
              ) : isLast ? (
                <button className="btn-primary text-xs px-5" onClick={completeInterview}>Complete Interview</button>
              ) : (
                <button className="btn text-xs px-5 bg-white/10 hover:bg-white/15 border border-white/20" onClick={() => setActiveQuestion(prev => prev + 1)}>Next Question <ChevronRight className="w-4 h-4" /></button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner" style={{ background: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.3)' }}>
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Campus Recruitment</h1>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Resume Matching & Mock Interviews</p>
          </div>
        </div>
        <button 
          className="btn text-white text-xs px-5 py-2.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all" 
          onClick={() => setShowNewJob(!showNewJob)}
          style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 8px 24px rgba(6,182,212,0.3)' }}
        >
          {showNewJob ? 'Cancel Form' : '+ New Job Description'}
        </button>
      </div>

      <AnimatePresence>
        {showNewJob && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <NewJobForm onCreated={() => { setShowNewJob(false); loadJobs(); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {message && <div className="p-4 rounded-xl text-sm font-semibold border flex items-center gap-3" style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', borderColor: 'rgba(6,182,212,0.2)' }}><Sparkles className="w-5 h-5 shrink-0" />{message}</div>}

      <div className="card grid md:grid-cols-3 gap-6 relative overflow-hidden border-cyan-500/20" style={{ background: 'var(--bg-surface)' }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/5 blur-3xl rounded-full" />
        <div className="md:col-span-2 relative z-10">
          <label className="label">Active Requisition</label>
          <select className="input mb-4 font-semibold text-sm py-3" style={{ background: 'var(--bg-card)' }} value={selectedJobId || ''} onChange={(e) => setSelectedJobId(e.target.value)}>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.companyName}</option>)}
          </select>
          {selectedJob && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <p className="text-[10px] uppercase font-bold tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Required Hard Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.requiredSkills.map((s, i) => <span key={i} className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">{s}</span>)}
                  {!selectedJob.requiredSkills.length && <span className="text-xs text-slate-500">None extracted</span>}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <p className="text-[10px] uppercase font-bold tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Expected Soft Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.softSkills.map((s, i) => <span key={i} className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">{s}</span>)}
                  {!selectedJob.softSkills.length && <span className="text-xs text-slate-500">None extracted</span>}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="md:col-span-1 flex flex-col justify-end gap-3 relative z-10">
          <button className="btn w-full text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 py-3.5" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }} onClick={runMatching} disabled={busy || !selectedJobId}>
            <Cpu className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            {busy ? 'AI Processing...' : 'Run JD/Resume Matching'}
          </button>
          <button className="btn-secondary w-full py-3.5 flex items-center justify-center gap-2" onClick={finalize} disabled={busy || !selectedJobId}>
            <CheckCircle2 className="w-4 h-4" /> Finalize Top 25
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Users className="w-5 h-5 text-cyan-400" /> Screened Candidates</h2>
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <table className="w-full text-sm">
            <thead className="uppercase tracking-wider text-[10px] font-black" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              <tr className="text-left">
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">AI Resume Match</th>
                <th className="py-3 px-4">Interview Score</th>
                <th className="py-3 px-4">Overall Score</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
              {candidates.map(c => (
                <tr key={c.id} className="transition-colors hover:bg-white/5">
                  <td className="py-3 px-4 font-bold" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                  <td className="py-3 px-4 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{c.cgpa}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-cyan-400 rounded-full" style={{ width: `${c.resumeMatchScore}%` }} /></div>
                      <span className="text-[11px] font-black text-cyan-400">{c.resumeMatchScore}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-brand-400 font-bold">{c.interviewScore ?? '—'}</td>
                  <td className="py-3 px-4 text-lg font-black text-emerald-400">{c.overallScore ?? '—'}</td>
                  <td className="py-3 px-4"><Badge status={c.stage} /></td>
                  <td className="py-3 px-4">
                    {c.eligible && (
                      <button className="btn text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 flex items-center gap-1.5 px-3 py-1.5" onClick={() => startInterview(c.studentId)}>
                        <PlayCircle className="w-3.5 h-3.5" /> Start Interview
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!candidates.length && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No candidates processed. Click 'Run JD/Resume Matching' to start AI screening.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NewJobForm({ onCreated }) {
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minCgpa, setMinCgpa] = useState(7);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/recruitment/jobs', { companyName, title, description, minCgpa: Number(minCgpa) });
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 mb-8 border-cyan-500/30 relative overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}><Building2 className="w-5 h-5 text-cyan-400" /> Draft Job Description</h2>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Company Name</label>
          <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Job Title / Role</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="label flex justify-between">
          <span>Job Description (AI will auto-extract required skills)</span>
          <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 rounded border border-cyan-500/20">Powered by Gemini</span>
        </label>
        <textarea className="input" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="w-40">
        <label className="label">Min CGPA Filter</label>
        <input className="input text-cyan-400 font-mono font-bold" type="number" step="0.1" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} />
      </div>
      <div className="pt-2">
        <button className="btn text-white text-sm px-8 shadow-lg shadow-cyan-500/25" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }} disabled={busy}>{busy ? 'Processing NLP...' : 'Extract Skills & Save JD'}</button>
      </div>
    </form>
  );
}