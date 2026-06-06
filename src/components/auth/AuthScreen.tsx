import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, BookOpen, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

// ─── Google types ─────────────────────────────────────────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, options: object) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

type AuthMode = 'login' | 'register';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ email: '', name: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const { login, register, googleLogin, isLoading, error, clearError } = useAuthStore();

  // ─── Load Google GSI script and render button ────────────────────────────
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return; // Google login disabled if no client ID

    const existingScript = document.getElementById('google-gsi');
    if (existingScript) {
      initGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.id    = 'google-gsi';
    script.src   = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleButton;
    document.head.appendChild(script);
  }, []);

  // Re-render button when mode changes (DOM ref changes)
  useEffect(() => {
    if (window.google && googleBtnRef.current) {
      initGoogleButton();
    }
  }, [mode]);

  function initGoogleButton() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google || !googleBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback:  handleGoogleCredential,
      auto_select: false,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme:       'filled_black',
      size:        'large',
      text:        'continue_with',
      shape:       'rectangular',
      logo_alignment: 'left',
      width:       googleBtnRef.current.offsetWidth || 320,
    });
  }

  async function handleGoogleCredential(response: { credential: string }) {
    setGoogleLoading(true);
    clearError();
    setFieldError('');
    try {
      await googleLogin(response.credential);
    } catch (err: any) {
      setFieldError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  // ─── Field helpers ────────────────────────────────────────────────────────
  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    clearError();
    setFieldError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');

    if (mode === 'register') {
      if (!form.name.trim())          { setFieldError('Name is required'); return; }
      if (form.password.length < 6)   { setFieldError('Password must be at least 6 characters'); return; }
      if (form.password !== form.confirmPassword) { setFieldError('Passwords do not match'); return; }
      try { await register(form.email, form.name.trim(), form.password); } catch { /* shown from store */ }
    } else {
      try { await login(form.email, form.password); } catch { /* shown from store */ }
    }
  };

  const switchMode = (m: AuthMode) => {
    setMode(m);
    clearError();
    setFieldError('');
  };

  const displayError   = fieldError || error;
  const googleEnabled  = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const formLoading    = isLoading || googleLoading;

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
          <div className="flex bg-white/5 rounded-xl p-1 mb-7">
            {(['login', 'register'] as AuthMode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
                style={mode === m
                  ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }
                  : { color: '#64748b' }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Google Sign-In Button */}
          {googleEnabled && (
            <>
              <div
                ref={googleBtnRef}
                className="w-full mb-4"
                style={{ minHeight: 44, opacity: formLoading ? 0.6 : 1, pointerEvents: formLoading ? 'none' : 'auto' }}
              />

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs text-slate-500 font-medium">or continue with email</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
            </>
          )}

          {/* Error banner */}
          {displayError && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Full Name</label>
                <input
                  className="input-dark"
                  placeholder="Your name"
                  value={form.name}
                  onChange={setField('name')}
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
                onChange={setField('email')}
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
                  onChange={setField('password')}
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
                  onChange={setField('confirmPassword')}
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
              style={{ opacity: formLoading ? 0.7 : 1 }}
            >
              {formLoading
                ? <><Loader2 size={18} className="animate-spin" /> Please wait…</>
                : <>{mode === 'login' ? 'Sign In' : 'Create Account'}<ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            {mode === 'login'
              ? <>Don't have an account? <button onClick={() => switchMode('register')} className="text-emerald-400 hover:text-emerald-300">Sign up free</button></>
              : <>Already have an account? <button onClick={() => switchMode('login')} className="text-emerald-400 hover:text-emerald-300">Sign in</button></>
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
