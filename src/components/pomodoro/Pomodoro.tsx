import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Clock, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../store';
import { Card, SectionHeader, StarRating, SubjectSelector, Modal } from '../shared';
import { TimerMode } from '../../types';
import { format } from 'date-fns';

const DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Focus',
  short_break: 'Short Break',
  long_break: 'Long Break',
};

const MODE_COLORS: Record<TimerMode, string> = {
  focus: '#10b981',
  short_break: '#3b82f6',
  long_break: '#8b5cf6',
};

export function PomodoroTimer() {
  const { sessions, startSession, endSession, logDistraction, activeSession, getSessionsToday } = useAppStore();

  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [focusRating, setFocusRating] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [customDuration, setCustomDuration] = useState(false);
  const [customMins, setCustomMins] = useState(25);

  const intervalRef = useRef<number | null>(null);
  const totalDuration = customDuration ? customMins * 60 : DURATIONS[mode];
  const progress = (timeLeft / totalDuration) * 100;
  const circumference = 2 * Math.PI * 88;
  const color = MODE_COLORS[mode];

  const todaySessions = getSessionsToday();
  const todayFocusSessions = todaySessions.filter(s => s.mode === 'focus');
  const todayMinutes = todayFocusSessions.reduce((a, s) => a + s.duration, 0);
  const avgFocus = todayFocusSessions.length > 0
    ? todayFocusSessions.reduce((a, s) => a + (s.focusRating || 3), 0) / todayFocusSessions.length
    : 0;

  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        setIsRunning(false);
        setSessionCount(c => c + 1);
        if (mode === 'focus') {
          setShowRating(true);
        } else {
          switchMode('focus');
        }
        return 0;
      }
      return prev - 1;
    });
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleStart = () => {
    if (!isRunning && timeLeft === totalDuration) {
      startSession(mode, selectedSubject || undefined);
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleRatingSubmit = () => {
    endSession(focusRating, activeSession?.distractions);
    setShowRating(false);
    setFocusRating(0);
    setTimeLeft(totalDuration);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Focus Timer" subtitle="Deep work sessions with Pomodoro technique" icon={<Clock size={20} />} />

      {/* Mode Selector */}
      <div className="flex gap-2">
        {(Object.entries(MODE_LABELS) as [TimerMode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => { if (!isRunning) switchMode(m); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all tap-target"
            style={mode === m ? {
              background: `${MODE_COLORS[m]}20`,
              color: MODE_COLORS[m],
              border: `1px solid ${MODE_COLORS[m]}40`,
            } : {
              background: 'rgba(255,255,255,0.04)',
              color: '#64748b',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timer Circle */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col items-center py-10">
            {/* Subject selector */}
            <div className="w-full max-w-xs mb-8">
              <SubjectSelector value={selectedSubject} onChange={setSelectedSubject} />
            </div>

            {/* Circle */}
            <div className="relative mb-8">
              <svg width="210" height="210" viewBox="0 0 210 210">
                {/* Background glow */}
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {/* Track */}
                <circle cx="105" cy="105" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                {/* Progress */}
                <circle
                  cx="105" cy="105" r="88"
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress / 100)}
                  transform="rotate(-90 105 105)"
                  filter="url(#glow)"
                  style={{ transition: isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease' }}
                />
                {/* Dot at end */}
                <circle
                  cx={105 + 88 * Math.cos(-Math.PI / 2 + (1 - progress / 100) * 2 * Math.PI)}
                  cy={105 + 88 * Math.sin(-Math.PI / 2 + (1 - progress / 100) * 2 * Math.PI)}
                  r="6"
                  fill={color}
                  filter="url(#glow)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-mono font-bold text-white tracking-tight">{mins}:{secs}</span>
                <span className="text-slate-400 text-sm mt-1">{MODE_LABELS[mode]}</span>
                {isRunning && activeSession && (
                  <span className="text-xs text-slate-500 mt-1">
                    {activeSession.distractions} distraction{activeSession.distractions !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleReset}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 tap-target"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <RotateCcw size={18} className="text-slate-400" />
              </button>

              <button
                onClick={isRunning ? handlePause : handleStart}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 tap-target"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  boxShadow: `0 0 24px ${color}40`,
                }}
              >
                {isRunning ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white ml-1" />}
              </button>

              {isRunning && (
                <button
                  onClick={logDistraction}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 tap-target"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}
                  title="Log distraction"
                >
                  <Zap size={18} className="text-amber-400" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-4">
              {isRunning ? '⚡ Tap lightning bolt to log a distraction' : 'Press play to start your session'}
            </p>
          </Card>
        </div>

        {/* Stats Panel */}
        <div className="space-y-4">
          {/* Today's stats */}
          <Card>
            <h3 className="font-display font-semibold text-white text-sm mb-4">Today</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Sessions</p>
                <div className="flex gap-1.5">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="w-6 h-6 rounded"
                      style={{ background: i < sessionCount ? color : 'rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">{sessionCount} completed today</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Focus Minutes</p>
                <p className="text-2xl font-display font-bold" style={{ color }}>{todayMinutes}</p>
              </div>
              {avgFocus > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Avg Focus Quality</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-display font-bold text-amber-400">{avgFocus.toFixed(1)}</p>
                    <span className="text-xs text-slate-500">/ 5</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Recent sessions */}
          <Card>
            <h3 className="font-display font-semibold text-white text-sm mb-3">Recent Sessions</h3>
            {todaySessions.length === 0 ? (
              <p className="text-xs text-slate-400">No sessions yet today.</p>
            ) : (
              <div className="space-y-2">
                {todaySessions.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: MODE_COLORS[s.mode] }} />
                      <span className="text-slate-300">{s.duration}m {MODE_LABELS[s.mode]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      {s.focusRating && <span>{'★'.repeat(s.focusRating)}</span>}
                      <span>{format(new Date(s.startTime), 'h:mm a')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Custom duration */}
          <Card>
            <h3 className="font-display font-semibold text-white text-sm mb-3">Custom Duration</h3>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={180}
                className="input-dark text-sm flex-1"
                value={customMins}
                onChange={e => setCustomMins(Number(e.target.value))}
              />
              <span className="text-slate-400 text-sm">min</span>
            </div>
            <button
              onClick={() => { setCustomDuration(!customDuration); setTimeLeft(customMins * 60); setIsRunning(false); }}
              className={`btn-ghost w-full mt-2 text-xs ${customDuration ? 'text-emerald-400' : ''}`}
              style={customDuration ? { borderColor: '#10b981', color: '#10b981' } : {}}
            >
              {customDuration ? '✓ Using custom' : 'Use custom duration'}
            </button>
          </Card>
        </div>
      </div>

      {/* Focus Rating Modal */}
      <Modal isOpen={showRating} onClose={() => setShowRating(false)} title="Session Complete! 🎉" size="sm">
        <div className="text-center space-y-6">
          <div>
            <p className="text-4xl mb-2">🎯</p>
            <p className="text-slate-300 text-sm">Great work! How was your focus?</p>
          </div>
          <div className="flex justify-center">
            <StarRating value={focusRating} onChange={setFocusRating} />
          </div>
          <div className="text-xs text-slate-500 space-y-0.5">
            <p>1 = Barely focused · 5 = Deep focus</p>
          </div>
          <button
            className="btn-primary w-full"
            onClick={handleRatingSubmit}
            disabled={focusRating === 0}
            style={{ opacity: focusRating === 0 ? 0.5 : 1 }}
          >
            <CheckCircle size={16} className="inline mr-2" />
            Save Session
          </button>
        </div>
      </Modal>
    </div>
  );
}
