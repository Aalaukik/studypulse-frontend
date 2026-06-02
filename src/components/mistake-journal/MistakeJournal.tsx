import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Search, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store';
import { Card, Modal, SectionHeader, Badge, EmptyState, SubjectSelector, ConfirmDialog } from '../shared';
import { format, parseISO } from 'date-fns';

export function MistakeJournal() {
  const { mistakes, subjects, addMistake, deleteMistake } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [form, setForm] = useState({ subjectId: '', description: '', concept: '', note: '' });

  const filtered = mistakes.filter(m => {
    if (subjectFilter && m.subjectId !== subjectFilter) return false;
    if (search && !m.description.toLowerCase().includes(search.toLowerCase()) && !m.concept.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Find repeat concepts (weak spots)
  const conceptCounts: Record<string, number> = {};
  mistakes.forEach(m => { conceptCounts[m.concept] = (conceptCounts[m.concept] || 0) + 1; });
  const weakSpots = Object.entries(conceptCounts).filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]);

  const handleAdd = () => {
    if (!form.description.trim() || !form.concept.trim() || !form.subjectId) return;
    addMistake({
      subjectId: form.subjectId,
      description: form.description,
      concept: form.concept,
      note: form.note || undefined,
    });
    setForm({ subjectId: '', description: '', concept: '', note: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Mistake Journal"
        subtitle={`${mistakes.length} mistakes logged · ${weakSpots.length} weak spots identified`}
        icon={<BookOpen size={20} />}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Log Mistake
          </button>
        }
      />

      {/* Weak spots */}
      {weakSpots.length > 0 && (
        <Card style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="font-display font-semibold text-white text-sm">Weak Spots</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakSpots.map(([concept, count]) => (
              <div key={concept} className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span className="text-sm text-red-300">{concept}</span>
                <span className="text-xs font-bold text-red-400 bg-red-400/20 px-1.5 py-0.5 rounded-full">{count}×</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-dark pl-9 text-sm" placeholder="Search mistakes…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-dark text-sm max-w-40" value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
        </select>
      </div>

      {/* Mistakes list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={mistakes.length === 0 ? "No mistakes logged yet" : "No results"}
          description="Log mistakes from practice papers and tests to identify patterns"
          action={mistakes.length === 0 ? (
            <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Log first mistake</button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(mistake => {
            const subject = subjects.find(s => s.id === mistake.subjectId);
            const repeatCount = conceptCounts[mistake.concept] || 1;
            return (
              <Card key={mistake.id} className={`relative ${repeatCount >= 2 ? 'border border-red-500/15' : ''}`}>
                {repeatCount >= 2 && (
                  <div className="absolute top-4 right-12">
                    <Badge label={`${repeatCount}× weak spot`} color="#ef4444" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <span className="text-red-400 text-lg">✗</span>
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-white font-medium">{mistake.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {subject && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <span className="w-2 h-2 rounded-full" style={{ background: subject.color }} />
                          {subject.name}
                        </span>
                      )}
                      <Badge label={mistake.concept} color="#8b5cf6" />
                      <span className="text-xs text-slate-500">
                        {format(parseISO(mistake.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {mistake.note && (
                      <p className="text-slate-400 text-sm mt-2 italic">"{mistake.note}"</p>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
                      <span>🧠</span>
                      <span>Auto-added to spaced repetition deck</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(mistake.id)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Log a Mistake">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Subject *</label>
            <SubjectSelector value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">What went wrong? *</label>
            <textarea className="input-dark resize-none" rows={3}
              placeholder="Describe the mistake or misconception…"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Concept / Topic *</label>
            <input className="input-dark" placeholder="e.g. Integration by parts"
              value={form.concept} onChange={e => setForm(p => ({ ...p, concept: e.target.value }))} />
            <p className="text-xs text-purple-400 mt-1">✨ This will automatically create a review card</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Notes (optional)</label>
            <input className="input-dark" placeholder="Correct method, reminder…"
              value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleAdd}>Log Mistake</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => { if (deleteId) deleteMistake(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
        message="This mistake entry will be permanently deleted."
      />
    </div>
  );
}
