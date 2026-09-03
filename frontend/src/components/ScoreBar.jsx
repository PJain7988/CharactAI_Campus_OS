import React from 'react';

export default function ScoreBar({ label, value, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value ?? 0}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
