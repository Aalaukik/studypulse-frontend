import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

type AuthMode = 'login' | 'register';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ email: '', name: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    clearError();
    setFieldError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');

    if (mode === 'register') {
      if (!form.name.trim()) { setFieldError('Name is required'); return; }
      if (form.password.length < 6) { setFieldError('Password must be at least 6 characters'); return; }
      if (form.password !== form.confirmPassword) { setFieldError('Passwords do not match'); return; }
      try { await register(form.email, form.name.trim(), form.password); }
      catch { /* error shown from store */ }
    } else {
      try { await login(form.email, form.password); }
      catch { /* error shown from store */ }
    }
  };

  const displayError = fieldError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>

      {/* Ambient bg blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: 'linear-gradient(135deg,#10b981,#6366f1)' }} />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-3xl opacity-8"
          style={{ background: '#8b5cf6' }} />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#10b981,#6366f1)', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
            <BookOpen size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">
            Study<span className="gradient-text">Pulse</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Your personal study operating system</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>

          {/* Tab switch */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(['login', 'register'] as AuthMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); clearError(); setFieldError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
                style={mode === m
                  ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }
                  : { color: '#64748b' }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all mb-5 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            {/* Google SVG icon — coloured, small */}
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.1-6.1C34.46 3.1 29.5 1 24 1 14.82 1 7.07 6.48 3.72 14.26l7.1 5.52C12.43 13.67 17.76 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.68c-.55 2.95-2.2 5.45-4.68 7.13l7.18 5.58C43.38 37.32 46.52 31.38 46.52 24.5z"/>
              <path fill="#FBBC05" d="M10.82 28.22A14.6 14.6 0 0 1 9.5 24c0-1.47.25-2.89.7-4.22l-7.1-5.52A23.94 23.94 0 0 0 0 24c0 3.86.93 7.5 2.57 10.72l8.25-6.5z"/>
              <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.95l-7.18-5.58c-1.88 1.26-4.3 2.03-6.32 2.03-6.24 0-11.57-4.17-13.18-9.78l-8.25 6.5C7.07 41.52 14.82 47 24 47z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs text-slate-500">or continue with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Error banner */}
          {displayError && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              <AlertCircle size={15} className="flex-shrink-0" />
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Full Name</label>
                <input
                  className="input-dark"
                  placeholder="Your name"
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Email</label>
              <input
                type="email"
                className="input-dark"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-dark pr-10"
                  placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Confirm Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-dark"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading
                ? <><Loader2 size={18} className="animate-spin" /> Please wait…</>
                : <>{mode === 'login' ? 'Sign In' : 'Create Account'}<ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            {mode === 'login'
              ? <>Don't have an account? <button onClick={() => setMode('register')} className="text-emerald-400 hover:text-emerald-300">Sign up free</button></>
              : <>Already have an account? <button onClick={() => setMode('login')} className="text-emerald-400 hover:text-emerald-300">Sign in</button></>
            }
          </p>
        </div>

        {/* Features teaser */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { emoji: '🧠', label: 'Spaced Repetition' },
            { emoji: '🔥', label: 'Streak Tracking' },
            { emoji: '📊', label: 'Deep Analytics' },
          ].map(f => (
            <div key={f.label} className="glass rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{f.emoji}</div>
              <p className="text-xs text-slate-400">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
