import React, { useState } from 'react';
import { ChevronRight, Target, Brain, Timer, Zap } from 'lucide-react';
import { useAppStore } from '../../store';
import { useAuthStore } from '../../lib/auth';

const steps = [
  { id: 'welcome',  emoji: '🎯', title: 'Welcome to StudyPulse',   subtitle: 'Your personal study operating system' },
  { id: 'target',   emoji: '⚡', title: 'Set your daily goal',     subtitle: 'This defines your streak target' },
  { id: 'subjects', emoji: '📚', title: 'Add your first subjects', subtitle: 'You can add more any time in Settings' },
  { id: 'done',     emoji: '🚀', title: "You're all set!",          subtitle: 'Time to start your first session' },
];

export function Onboarding() {
  const { addSubject, completeOnboarding } = useAppStore();
  const { user, updateProfile } = useAuthStore();

  const [step, setStep] = useState(0);
  const [target, setTarget]       = useState(3);
  const [targetType, setTargetType] = useState<'goals' | 'minutes'>('goals');
  const [subjectInputs, setSubjectInputs] = useState(['', '', '']);

  const current = steps[step];
  const isLast  = step === steps.length - 1;

  const handleNext = async () => {
    if (current.id === 'target') {
      await updateProfile({ dailyTargetType: targetType, dailyTargetValue: target });
    }
    if (current.id === 'subjects') {
      const nonEmpty = subjectInputs.filter(s => s.trim());
      for (const name of nonEmpty) await addSubject(name.trim());
    }
    if (isLast) {
      completeOnboarding();
    } else {
      setStep(s => s + 1);
    }
  };

  const canProgress = () => {
    if (current.id === 'subjects') return subjectInputs.some(s => s.trim());
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: '#10b981' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-8"  style={{ background: '#6366f1' }} />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{ width: i === step ? 24 : 8, height: 8,
                background: i <= step ? '#10b981' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        <div className="glass rounded-3xl p-8 text-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-6xl mb-4 animate-float">{current.emoji}</div>
          <h1 className="text-2xl font-display font-bold text-white mb-2">{current.title}</h1>
          <p className="text-slate-400 mb-8">{current.subtitle}</p>

          {current.id === 'welcome' && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: <Target size={18} />, label: 'Goal Tracking',  color: '#6366f1' },
                { icon: <Brain  size={18} />, label: 'Smart Reviews',  color: '#8b5cf6' },
                { icon: <Timer  size={18} />, label: 'Focus Timer',    color: '#f59e0b' },
                { icon: <Zap    size={18} />, label: 'XP & Streaks',   color: '#ef4444' },
              ].map(f => (
                <div key={f.label} className="p-3 rounded-xl flex items-center gap-2"
                  style={{ background: `${f.color}12`, border: `1px solid ${f.color}20` }}>
                  <span style={{ color: f.color }}>{f.icon}</span>
                  <span className="text-sm text-slate-300">{f.label}</span>
                </div>
              ))}
            </div>
          )}

          {current.id === 'target' && (
            <div className="mb-6 space-y-4">
              <div className="flex gap-3 justify-center">
                {(['goals', 'minutes'] as const).map(t => (
                  <button key={t} onClick={() => setTargetType(t)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={targetType === t
                      ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {t === 'goals' ? '🎯 Goals / day' : '⏱️ Minutes / day'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <input type="range" min={targetType === 'goals' ? 1 : 15} max={targetType === 'goals' ? 15 : 240}
                  value={target} onChange={e => setTarget(Number(e.target.value))} className="flex-1" />
                <span className="text-2xl font-display font-bold text-emerald-400 w-20 text-center">
                  {target} {targetType === 'goals' ? 'goals' : 'min'}
                </span>
              </div>
            </div>
          )}

          {current.id === 'subjects' && (
            <div className="mb-6 space-y-3">
              {subjectInputs.map((val, i) => (
                <input key={i} className="input-dark text-center"
                  placeholder={['e.g. Mathematics', 'e.g. Physics', 'e.g. Chemistry'][i]}
                  value={val}
                  onChange={e => {
                    const updated = [...subjectInputs];
                    updated[i] = e.target.value;
                    setSubjectInputs(updated);
                  }} />
              ))}
            </div>
          )}

          {current.id === 'done' && (
            <div className="mb-6 space-y-2 text-left">
              {[`👋 Hi, ${user?.name || 'Scholar'}!`, '⚡ Daily target is set', '📚 Subjects are ready', '🔥 Let\'s build your streak'].map(item => (
                <div key={item} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.07)' }}>
                  <span className="text-sm text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
            onClick={handleNext}
            disabled={!canProgress()}
            style={{ opacity: canProgress() ? 1 : 0.5 }}
          >
            {isLast ? '🚀 Start Studying' : 'Continue'}
            {!isLast && <ChevronRight size={18} />}
          </button>

          {step > 0 && !isLast && (
            <button className="text-slate-500 text-sm mt-3 hover:text-slate-400" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
        </div>
      </div>
    </div>
  );
}
