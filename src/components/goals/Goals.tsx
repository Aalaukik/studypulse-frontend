import React, { useState } from 'react';
import { Plus, CheckCircle2, Trash2, Filter, Target, Calendar, Flag } from 'lucide-react';
import { useAppStore } from '../../store';
import { Card, Modal, Badge, SectionHeader, EmptyState, SubjectSelector, ConfirmDialog } from '../shared';
import { Priority, GoalStatus } from '../../types';
import { format, parseISO } from 'date-fns';
import { getPriorityColor } from '../../utils';

type FilterType = 'all' | 'active' | 'completed' | 'High' | 'Medium' | 'Low';

export function Goals() {
  const { goals, subjects, addGoal, completeGoal, deleteGoal, editGoal } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<FilterType>('active');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', subjectId: '', priority: 'Medium' as Priority, deadline: '' });

  const filtered = goals.filter(g => {
    if (filter === 'all') {}
    else if (filter === 'active' || filter === 'completed') { if (g.status !== filter) return false; }
    else { if (g.priority !== filter) return false; }
    if (subjectFilter && g.subjectId !== subjectFilter) return false;
    return true;
  }).sort((a, b) => {
    const pOrder = { High: 0, Medium: 1, Low: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  });

  const handleAdd = () => {
    if (!form.title.trim() || !form.subjectId) return;
    if (editId) {
      editGoal(editId, { title: form.title, priority: form.priority, deadline: form.deadline || undefined, subjectId: form.subjectId });
      setEditId(null);
    } else {
      addGoal({ title: form.title, subjectId: form.subjectId, priority: form.priority, deadline: form.deadline || undefined });
    }
    setForm({ title: '', subjectId: '', priority: 'Medium', deadline: '' });
    setShowAdd(false);
  };

  const openEdit = (id: string) => {
    const g = goals.find(x => x.id === id);
    if (!g) return;
    setForm({ title: g.title, subjectId: g.subjectId, priority: g.priority, deadline: g.deadline || '' });
    setEditId(id);
    setShowAdd(true);
  };

  const activeCount = goals.filter(g => g.status === 'active').length;
  const completedCount = goals.filter(g => g.status === 'completed').length;

  const filterBtns: { label: string; value: FilterType; color?: string }[] = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'All', value: 'all' },
    { label: 'High', value: 'High', color: '#ef4444' },
    { label: 'Medium', value: 'Medium', color: '#f59e0b' },
    { label: 'Low', value: 'Low', color: '#10b981' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Goals"
        subtitle={`${activeCount} active · ${completedCount} completed`}
        icon={<Target size={20} />}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => { setEditId(null); setShowAdd(true); }}>
            <Plus size={16} /> Add Goal
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-slate-400" />
        {filterBtns.map(btn => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-target ${filter === btn.value ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            style={filter === btn.value ? {
              background: `${btn.color || '#6366f1'}22`,
              color: btn.color || '#6366f1',
              border: `1px solid ${btn.color || '#6366f1'}44`
            } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {btn.label}
          </button>
        ))}
        <select
          className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-white/05 ml-auto"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
        >
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
        </select>
      </div>

      {/* Goals List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Target />}
          title="No goals here"
          description="Create your first goal to start tracking your progress"
          action={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add goal</button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(goal => {
            const subject = subjects.find(s => s.id === goal.subjectId);
            const isDone = goal.status === 'completed';
            const isOverdue = goal.deadline && !isDone && new Date(goal.deadline) < new Date();

            return (
              <div
                key={goal.id}
                className={`glass glass-hover rounded-xl p-4 flex items-start gap-3 transition-all animate-slide-up ${isDone ? 'opacity-60' : ''}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => !isDone && completeGoal(goal.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 transition-all hover:scale-110"
                  style={{
                    background: isDone ? '#10b981' : 'transparent',
                    border: `2px solid ${isDone ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                  }}
                >
                  {isDone && <CheckCircle2 size={14} className="text-white" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isDone && openEdit(goal.id)}>
                  <p className={`font-medium ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                    {goal.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {subject && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full" style={{ background: subject.color }} />
                        {subject.name}
                      </span>
                    )}
                    {goal.deadline && (
                      <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                        <Calendar size={11} />
                        {isOverdue ? 'Overdue — ' : ''}
                        {format(parseISO(goal.deadline), 'MMM d')}
                      </span>
                    )}
                    {goal.completedAt && (
                      <span className="text-xs text-slate-500">
                        Done {format(parseISO(goal.completedAt), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: priority + delete */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge label={goal.priority} color={getPriorityColor(goal.priority)} />
                  <button
                    onClick={() => setDeleteId(goal.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditId(null); setForm({ title: '', subjectId: '', priority: 'Medium', deadline: '' }); }}
        title={editId ? 'Edit Goal' : 'New Goal'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Goal Title *</label>
            <input
              className="input-dark"
              placeholder="e.g. Complete Chapter 3 exercises"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Subject *</label>
            <SubjectSelector value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Priority</label>
              <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all tap-target"
                    style={form.priority === p ? {
                      background: `${getPriorityColor(p)}22`,
                      color: getPriorityColor(p),
                      border: `1px solid ${getPriorityColor(p)}44`,
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      color: '#64748b',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Deadline</label>
              <input type="date" className="input-dark text-sm" value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleAdd}>
              {editId ? 'Save Changes' : 'Add Goal'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteGoal(deleteId); setDeleteId(null); }}
        message="This goal will be permanently deleted."
      />
    </div>
  );
}
