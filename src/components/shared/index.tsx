import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Zap } from 'lucide-react';
import { useAppStore } from '../../store';
import { Subject } from '../../types';

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: 'emerald' | 'indigo' | 'amber';
  animate?: boolean;
  style?: React.CSSProperties;
}
export function Card({ children, className = '', onClick, glow, animate = true, style }: CardProps) {
  const glowClass = glow === 'emerald' ? 'glow-emerald' : glow === 'indigo' ? 'glow-indigo' : glow === 'amber' ? 'glow-amber' : '';
  return (
    <div
      className={`glass rounded-2xl p-5 ${glowClass} ${animate ? 'animate-fade-in' : ''} ${onClick ? 'cursor-pointer glass-hover' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass rounded-2xl p-6 w-full ${sizeClass} animate-slide-up shadow-2xl`} style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-display font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
}
export function Badge({ label, color = '#10b981', size = 'sm' }: BadgeProps) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`badge ${pad} rounded-full font-semibold`}
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
  height?: number;
}
export function ProgressBar({ value, max = 100, color = '#10b981', className = '', showLabel, height = 4 }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`relative ${className}`}>
      <div className="rounded-full overflow-hidden" style={{ height, background: 'rgba(255,255,255,0.08)' }}>
        <div className="rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
      </div>
      {showLabel && <span className="text-xs text-slate-400 mt-1 block">{pct}%</span>}
    </div>
  );
}

// ─── Subject Selector ─────────────────────────────────────────────────────────

interface SubjectSelectorProps {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}
export function SubjectSelector({ value, onChange, className = '' }: SubjectSelectorProps) {
  const subjects = useAppStore(s => s.subjects);
  return (
    <select
      className={`input-dark ${className}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">Select subject…</option>
      {subjects.map(sub => (
        <option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>
      ))}
    </select>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="text-5xl mb-4 animate-float">{icon}</div>
      <h3 className="text-lg font-display font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}
export function SectionHeader({ title, subtitle, action, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && <div className="p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>{icon}</div>}
        <div>
          <h2 className="text-2xl font-display font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  color?: string;
}
export function StarRating({ value, onChange, max = 5, color = '#f59e0b' }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-125 tap-target"
          style={{ color: (hover || value) >= star ? color : 'rgba(255,255,255,0.15)' }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastItem { id: string; message: string; type: 'success' | 'error' | 'info' | 'xp'; xp?: number; }

let addToast: (toast: Omit<ToastItem, 'id'>) => void = () => {};

export function useToast() {
  return {
    success: (message: string) => addToast({ message, type: 'success' }),
    error:   (message: string) => addToast({ message, type: 'error' }),
    info:    (message: string) => addToast({ message, type: 'info' }),
    xp:      (xp: number, message: string) => addToast({ message, type: 'xp', xp }),
  };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToast = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { ...t, id }]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3000);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(toast => {
        const icon = toast.type === 'success' ? <CheckCircle size={16} /> :
                     toast.type === 'error'   ? <AlertCircle size={16} /> :
                     toast.type === 'xp'      ? <Zap size={16} /> :
                     <Info size={16} />;
        const color = toast.type === 'success' ? '#10b981' :
                      toast.type === 'error'   ? '#ef4444' :
                      toast.type === 'xp'      ? '#f59e0b' :
                      '#3b82f6';
        return (
          <div key={toast.id} className="glass rounded-xl px-4 py-3 flex items-center gap-2 animate-slide-up shadow-lg min-w-64"
            style={{ borderColor: `${color}33`, color }}>
            {icon}
            <span className="text-sm font-medium text-white">{toast.message}</span>
            {toast.xp && <span className="text-xs font-bold ml-auto" style={{ color }}>+{toast.xp} XP</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: number; label: string };
  subtitle?: string;
}
export function StatCard({ label, value, icon, color = '#10b981', trend, subtitle }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-display font-bold" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Subject Color Dot ────────────────────────────────────────────────────────

export function SubjectDot({ subject, showName = false }: { subject: Subject | undefined; showName?: boolean }) {
  if (!subject) return null;
  return (
    <span className="flex items-center gap-1.5">
      <span className="status-dot flex-shrink-0" style={{ background: subject.color }} />
      {showName && <span className="text-sm text-slate-300">{subject.name}</span>}
    </span>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
}
export function ConfirmDialog({ isOpen, onConfirm, onCancel, message }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Are you sure?" size="sm">
      <p className="text-slate-300 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }} onClick={onConfirm}>Delete</button>
      </div>
    </Modal>
  );
}
