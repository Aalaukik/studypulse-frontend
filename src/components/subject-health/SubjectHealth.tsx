import React, { useState } from 'react';
import { Activity, Plus, Trash2, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../store';
import { Card, Modal, SectionHeader, Badge, ProgressBar } from '../shared';
import { computeSubjectHealth, getHealthColor, SUBJECT_COLORS, SUBJECT_ICONS } from '../../utils';
import { Subject } from '../../types';

export function SubjectHealth() {
  const { subjects, goals, sessions, reviewCards, addSubject, removeSubject } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const healthData = subjects.map(sub => ({
    subject: sub,
    health: computeSubjectHealth(sub.id, goals, sessions, reviewCards),
  })).sort((a, b) => b.health.score - a.health.score);

  const selectedHealth = selected ? healthData.find(h => h.subject.id === selected) : null;

  const handleAdd = () => {
    if (!newSubjectName.trim()) return;
    addSubject(newSubjectName.trim());
    setNewSubjectName('');
    setShowAdd(false);
  };

  const statusIcon = (status: string) => {
    if (status === 'Healthy') return <CheckCircle size={16} className="text-emerald-400" />;
    if (status === 'At Risk') return <AlertCircle size={16} className="text-amber-400" />;
    return <TrendingDown size={16} className="text-red-400" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Subject Health"
        subtitle="Track the health of each subject based on recency, goals, and reviews"
        icon={<Activity size={20} />}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Subject
          </button>
        }
      />

      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthData.map(({ subject, health }) => {
          const color = getHealthColor(health.status);
          return (
            <Card
              key={subject.id}
              className="cursor-pointer glass-hover"
              onClick={() => setSelected(subject.id === selected ? null : subject.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${subject.color}18` }}>
                    {subject.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white">{subject.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {statusIcon(health.status)}
                      <span className="text-xs font-medium" style={{ color }}>
                        {health.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative w-14 h-14">
                  <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - health.score / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color }}>{health.score}</span>
                  </div>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Recency</span>
                    <span style={{ color }}>{health.recencyScore}</span>
                  </div>
                  <ProgressBar value={health.recencyScore} color={color} height={3} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Goal Completion</span>
                    <span style={{ color }}>{health.completionScore}</span>
                  </div>
                  <ProgressBar value={health.completionScore} color={color} height={3} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Review Performance</span>
                    <span style={{ color }}>{health.srScore}</span>
                  </div>
                  <ProgressBar value={health.srScore} color={color} height={3} />
                </div>
              </div>

              {/* Status pill */}
              <div className="mt-4 pt-3 border-t border-white/05 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {health.lastStudied
                    ? `Last studied: ${new Date(health.lastStudied).toLocaleDateString()}`
                    : 'Not studied yet'}
                </span>
                <Badge label={subject.masteryLevel} color={subject.color} />
              </div>

              {/* Detail expand arrow */}
              <div className="text-center mt-2">
                <span className="text-xs text-slate-500">{selected === subject.id ? '▲ less' : '▼ details'}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selectedHealth && (
        <Card className="animate-slide-up" glow="emerald">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedHealth.subject.icon}</span>
              <div>
                <h3 className="text-lg font-display font-semibold text-white">{selectedHealth.subject.name}</h3>
                <p className="text-xs text-slate-400">Detailed breakdown</p>
              </div>
            </div>
            <button onClick={() => removeSubject(selectedHealth.subject.id)}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-slate-400 mb-1">Active Goals</p>
              <p className="text-2xl font-display font-bold text-white">
                {goals.filter(g => g.subjectId === selectedHealth.subject.id && g.status === 'active').length}
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-slate-400 mb-1">Completed Goals</p>
              <p className="text-2xl font-display font-bold text-emerald-400">
                {goals.filter(g => g.subjectId === selectedHealth.subject.id && g.status === 'completed').length}
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-slate-400 mb-1">Review Cards</p>
              <p className="text-2xl font-display font-bold text-purple-400">
                {reviewCards.filter(c => c.subjectId === selectedHealth.subject.id).length}
              </p>
            </div>
          </div>

          {selectedHealth.health.status !== 'Healthy' && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-amber-400 font-semibold text-sm mb-1">💡 Improvement Tips</p>
              <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                {selectedHealth.health.recencyScore < 40 && <li>Study this subject today — it hasn't been touched recently</li>}
                {selectedHealth.health.completionScore < 50 && <li>Complete some pending goals to boost the completion score</li>}
                {selectedHealth.health.srScore < 60 && <li>Review overdue flashcards to improve retention</li>}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Add Subject Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Subject" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Subject Name *</label>
            <input className="input-dark" placeholder="e.g. Biology"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleAdd}>Add Subject</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
