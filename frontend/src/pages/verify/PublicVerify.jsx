import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { ShieldCheck, XCircle, Sparkles, Loader2 } from 'lucide-react';

export default function PublicVerify() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/certificates/verify/${code}`)
      .then(({ data }) => setResult(data))
      .catch((err) => setResult(err.response?.data || { verified: false }))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Background Decorative Blobs */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] animate-fade-in pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[100px] animate-fade-in pointer-events-none" style={{ animationDelay: '0.2s' }} />

      <div className="w-full max-w-lg shadow-2xl rounded-3xl overflow-hidden z-10 border animate-slide-up" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        
        {/* Header */}
        <div className="p-8 text-center relative overflow-hidden" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Charact<span className="text-brand-400">AI</span></h1>
          <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>Credential Verification Portal</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-muted)' }}>
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-400" />
              <p className="text-sm font-semibold">Verifying secure ledger...</p>
            </div>
          )}

          {!loading && result?.verified && (
            <div className="animate-fade-in">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-emerald-500 mb-1">Authentic Credential</h2>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>This digital certificate is officially verified.</p>
              </div>

              <div className="space-y-4 p-5 rounded-2xl shadow-inner" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Student Name</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{result.studentName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Program</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{result.program}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Academic Period</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{result.academicPeriod}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Issued Year</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{result.issuedYear}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Certificate ID</p>
                    <p className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{result.certificateId}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Holistic Dev Score</p>
                  <p className="text-xl font-black text-brand-500">{result.overallScore} <span className="text-sm text-brand-300 opacity-50">/ 100</span></p>
                </div>
              </div>
            </div>
          )}

          {!loading && !result?.verified && (
            <div className="flex flex-col items-center text-center py-8 animate-fade-in">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-red-500 mb-2">Invalid Credential</h2>
              <p className="text-sm font-semibold max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
                We could not verify this certificate. It may be invalid, expired, or tampered with.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-xs font-semibold mt-8 opacity-60" style={{ color: 'var(--text-muted)' }}>Powered by CharactAI Secure Ledger</p>
    </div>
  );
}
