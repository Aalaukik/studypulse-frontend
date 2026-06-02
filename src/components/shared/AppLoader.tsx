import React from 'react';
import { BookOpen } from 'lucide-react';

export function AppLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center animate-fade-in">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse-slow"
          style={{ background: 'linear-gradient(135deg,#10b981,#6366f1)', boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}
        >
          <BookOpen size={28} className="text-white" />
        </div>
        <p className="text-slate-400 text-sm font-medium">Loading StudyPulse…</p>
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
