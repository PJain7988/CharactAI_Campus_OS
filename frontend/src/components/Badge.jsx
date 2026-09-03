import React from 'react';

const STATUS_CONFIG = {
  pending:        { label: 'Pending Review', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  approved:       { label: 'Verified',       color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  rejected:       { label: 'Rejected',       color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
  scheduled:      { label: 'Scheduled',      color: 'text-sky-400 bg-sky-500/15 border-sky-500/30' },
  cleared:        { label: 'Cleared',        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  completed:      { label: 'Completed',      color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
  applied:        { label: 'Applied',        color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' },
  shortlisted:    { label: 'Shortlisted',    color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  in_process:     { label: 'In Process',     color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
  selected:       { label: 'Selected',       color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  offer_extended: { label: 'Offer Extended', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' },
  offer_accepted: { label: 'Offer Accepted', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  offer_declined: { label: 'Offer Declined', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
  withdrawn:      { label: 'Withdrawn',      color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' },
  open:           { label: 'Open',           color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  closed:         { label: 'Closed',         color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' },
  draft:          { label: 'Draft',          color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' }
};

export default function Badge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: (status || '').replace(/_/g, ' '),
    color: 'text-slate-300 bg-slate-500/15 border-slate-500/30'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide shadow-sm capitalize ${config.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}
