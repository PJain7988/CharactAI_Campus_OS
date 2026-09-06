import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { LayoutDashboard, Activity, ShieldAlert, Users, Award, FileCheck, Building2, TerminalSquare } from 'lucide-react';
import api from '../../api/client';

const TABS = [
  { id: 'overview', label: 'Institution Overview', icon: LayoutDashboard },
  { id: 'verification', label: 'Verification Queue', icon: ShieldAlert },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'categories', label: 'Categories & Events', icon: Award },
  { id: 'config', label: 'AI Configuration', icon: Activity },
  { id: 'audit', label: 'Audit Logs', icon: TerminalSquare }
];

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [pending, setPending] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = () => {
    api.get('/admin/overview').then(({ data }) => setOverview(data));
    api.get('/admin/audit-logs').then(({ data }) => setLogs(data.logs.slice(0, 15)));
    api.get('/admin/pending-activities').then(({ data }) => setPending(data.activities));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/activities/${id}/status`, { status });
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error verifying activity.');
    }
  };

  if (!overview) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-20">
      
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border border-indigo-500/20"
        style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b)' }}
      >
        <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/30 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                <Building2 className="w-6 h-6 text-brand-300" />
              </div>
              <div>
                <p className="text-brand-200 text-xs font-black tracking-[0.2em] uppercase mb-1">Admin Console</p>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Institution Analytics</h1>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 flex items-center gap-5 shadow-inner">
            <div>
              <p className="text-brand-200 text-[10px] uppercase tracking-widest font-bold mb-1">Total Students</p>
              <p className="text-4xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-br from-white to-brand-300">
                {overview.totalStudents}
              </p>
            </div>
            <Users className="w-8 h-8 text-brand-400/80" />
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
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="admin-active-tab"
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatTile icon={FileCheck} label="Verified" value={overview.verifiedActivities} color="emerald" />
                  <StatTile icon={ShieldAlert} label="Pending Review" value={overview.pendingActivities} color="amber" />
                  <StatTile icon={Award} label="Certificates Issued" value={overview.certificatesIssued} color="brand" />
                  <StatTile icon={Activity} label="Avg Dev Score" value={overview.averageDevelopmentScore ?? '—'} color="cyan" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Chart Bento */}
                  <div className="card flex flex-col">
                    <h2 className="font-bold text-base mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Activity className="w-5 h-5 text-brand-400" /> Activity by Category
                    </h2>
                    <div className="rounded-2xl p-4 flex-1 flex flex-col" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <ResponsiveContainer width="100%" height={260}>
                        <RechartsBarChart data={overview.activityByCategory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}
                            cursor={{ fill: 'var(--bg-card-hover)' }}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {overview.activityByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(245, 80%, ${65 - (index % 4) * 8}%)`} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Department Comparison Bento */}
                  <div className="card flex flex-col">
                    <h2 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Building2 className="w-5 h-5 text-brand-400" /> Department Comparison
                    </h2>
                    <div className="rounded-2xl overflow-hidden flex-1" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                      <table className="w-full text-sm text-left">
                        <thead className="uppercase tracking-wider text-[10px] font-black" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                          <tr>
                            <th className="px-5 py-3">Department</th>
                            <th className="px-5 py-3 text-right">Students</th>
                            <th className="px-5 py-3 text-right">Avg Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
                          {overview.departmentComparison.map((d) => (
                            <tr key={d.department} className="transition-colors hover:bg-white/5">
                              <td className="px-5 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{d.department}</td>
                              <td className="px-5 py-3 text-right text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{d.students}</td>
                              <td className="px-5 py-3 text-right text-brand-400 font-black">{d.avg_score ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] font-bold mt-4 flex items-center gap-1.5 justify-center py-2 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <ShieldAlert className="w-3.5 h-3.5" /> Shown for insight only — not a high-stakes ranking.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VERIFICATION TAB */}
            {activeTab === 'verification' && (
              <div className="card">
                <h2 className="font-bold text-base mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <ShieldAlert className="w-5 h-5 text-amber-400" /> Pending Verification Queue ({pending.length})
                </h2>
                {pending.length === 0 ? (
                  <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                    <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No activities pending verification.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden shadow-inner" style={{ border: '1px solid var(--border)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          <tr>
                            <th className="py-3 px-4 font-bold text-xs uppercase">Date</th>
                            <th className="py-3 px-4 font-bold text-xs uppercase">Student</th>
                            <th className="py-3 px-4 font-bold text-xs uppercase">Activity Details</th>
                            <th className="py-3 px-4 font-bold text-xs uppercase text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
                          {pending.map((p) => (
                            <tr key={p.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 whitespace-nowrap text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{p.activity_date}</td>
                              <td className="py-3 px-4">
                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.student_name}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.department}</p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] uppercase font-black tracking-wider text-brand-400">{p.category_name}</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/10">{p.duration_hours}h</span>
                                </div>
                                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.title}</p>
                                <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button onClick={() => handleVerify(p.id, 'approved')} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-500/30 mr-2">
                                  Approve
                                </button>
                                <button onClick={() => handleVerify(p.id, 'rejected')} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-rose-500/30">
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && <AdminUsersTab />}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && <AdminCategoriesTab />}

            {/* CONFIG TAB */}
            {activeTab === 'config' && <AdminConfigTab />}

            {/* AUDIT TAB */}
            {activeTab === 'audit' && (
              <div className="card">
                <h2 className="font-bold text-base mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <TerminalSquare className="w-5 h-5 text-brand-400" /> Recent System Audit Log
                </h2>
                <div className="rounded-2xl overflow-hidden font-mono text-xs shadow-inner" style={{ border: '1px solid #334155', background: '#0f172a' }}>
                  <div className="px-4 py-3 flex gap-2" style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                    <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr style={{ color: '#64748b', borderBottom: '1px solid #334155' }}>
                          <th className="py-2 pr-4 font-normal">Timestamp</th>
                          <th className="py-2 pr-4 font-normal">Action</th>
                          <th className="py-2 pr-4 font-normal">Entity</th>
                        </tr>
                      </thead>
                      <tbody style={{ divideColor: 'rgba(51,65,85,0.5)', borderTop: '1px solid rgba(51,65,85,0.5)' }} className="divide-y">
                        {logs.map((l, i) => (
                          <motion.tr 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={l.id} 
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 pr-4 text-slate-400">{l.created_at}</td>
                            <td className="py-3 pr-4 text-brand-400 font-semibold">{l.action}</td>
                            <td className="py-3 pr-4 text-emerald-400">{l.entity}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, color }) {
  const colorMap = {
    brand:   { bg: 'rgba(99,102,241,0.1)',   border: 'rgba(99,102,241,0.25)', text: '#818cf8' },
    emerald: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#34d399' },
    amber:   { bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)', text: '#fbbf24' },
    cyan:    { bg: 'rgba(6,182,212,0.1)',    border: 'rgba(6,182,212,0.25)',  text: '#22d3ee' },
  };
  const theme = colorMap[color] || colorMap.brand;
  
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="rounded-3xl p-5 border transition-all cursor-default relative overflow-hidden group"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${theme.bg}, transparent)` }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: theme.bg, borderColor: theme.border }}>
            <Icon className="w-5 h-5" style={{ color: theme.text }} />
          </div>
        </div>
        <p className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </motion.div>
  );
}

function AdminUsersTab() {
  const [users, setUsers] = useState([]);
  
  const load = () => api.get('/admin/users').then(({data}) => setUsers(data.users));
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (confirm('Delete this user?')) {
      await api.delete(`/admin/users/${id}`);
      load();
    }
  };

  return (
    <div className="card">
      <h2 className="font-bold text-base mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Users className="w-5 h-5 text-brand-400" /> User Management
      </h2>
      <div className="rounded-2xl overflow-hidden shadow-inner" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-left text-sm">
          <thead style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <tr>
              <th className="py-3 px-4 uppercase text-xs">Name</th>
              <th className="py-3 px-4 uppercase text-xs">Email</th>
              <th className="py-3 px-4 uppercase text-xs">Role</th>
              <th className="py-3 px-4 text-right uppercase text-xs">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-bold" style={{ color: 'var(--text-primary)' }}>{u.name}</td>
                <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td className="py-3 px-4"><span className="text-[10px] uppercase font-black text-brand-400 bg-brand-500/10 px-2 py-1 rounded">{u.role}</span></td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => del(u.id)} className="text-xs font-bold text-rose-400 hover:text-rose-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  
  const loadC = () => api.get('/admin/categories').then(({data}) => setCategories(data.categories));
  const loadE = () => api.get('/admin/events').then(({data}) => setEvents(data.events));
  
  useEffect(() => { loadC(); loadE(); }, []);

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-bold text-base mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Award className="w-5 h-5 text-emerald-400" /> Activity Categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <div key={c.id} className="px-4 py-2 rounded-xl text-xs font-bold border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              {c.name}
            </div>
          ))}
        </div>
      </div>
      
      <div className="card">
        <h2 className="font-bold text-base mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Activity className="w-5 h-5 text-amber-400" /> Global Events
        </h2>
        <div className="rounded-2xl overflow-hidden shadow-inner" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-left text-sm">
            <thead style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <tr>
                <th className="py-3 px-4 uppercase text-xs">Title</th>
                <th className="py-3 px-4 uppercase text-xs">Date</th>
                <th className="py-3 px-4 uppercase text-xs">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
              {events.length === 0 && <tr><td colSpan="3" className="py-6 text-center text-xs text-slate-500">No events defined.</td></tr>}
              {events.map(e => (
                <tr key={e.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold" style={{ color: 'var(--text-primary)' }}>{e.title}</td>
                  <td className="py-3 px-4 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{e.event_date}</td>
                  <td className="py-3 px-4 text-xs font-bold text-brand-400">{e.category_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminConfigTab() {
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/settings').then(({data}) => {
      setWeights(data.settings.ai_dimension_weights || {});
      setLoading(false);
    });
  }, []);

  const save = async () => {
    await api.put('/admin/settings', { key: 'ai_dimension_weights', value: weights });
    alert('AI Weights updated successfully');
  };

  if (loading) return null;

  return (
    <div className="card">
      <h2 className="font-bold text-base mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Activity className="w-5 h-5 text-brand-400" /> AI Scoring Weights Configuration
      </h2>
      <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>Adjust the impact of each dimension on the final holistic score.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.entries(weights).map(([dim, val]) => (
          <div key={dim}>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
              {dim.replace(/_/g, ' ')} ({val}%)
            </label>
            <input 
              type="range" min="0" max="30" value={val} 
              onChange={e => setWeights({...weights, [dim]: parseInt(e.target.value)})}
              className="w-full accent-brand-500" 
            />
          </div>
        ))}
      </div>
      
      <button onClick={save} className="btn py-2.5 px-6 text-sm font-bold text-white shadow-lg bg-brand-500 hover:bg-brand-400 transition-all">
        Save AI Configuration
      </button>
    </div>
  );
}
