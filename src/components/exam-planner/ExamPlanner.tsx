import React, { useState } from 'react';
import { CalendarDays, Plus, Trash2, Clock } from 'lucide-react';
import { useAppStore } from '../../store';
import { Card, Modal, SectionHeader, Badge, EmptyState, ConfirmDialog } from '../shared';
import { format, parseISO, differenceInDays } from 'date-fns';
import { getTopicsForToday, SUBJECT_COLORS } from '../../utils';

// FIX: backend stores examDate, but old code used e.date (undefined).
// This helper normalises both field names for safety.
const getExamDate = (exam: any): string => exam.examDate || exam.date || '';

export function ExamPlanner() {
  const { exams, subjects, addExam, deleteExam, reviewCards } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', date: '', subjectIds: [] as string[], topicsText: '' });

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleAdd = () => {
    if (!form.name.trim() || !form.date) return;
    const topics = form.topicsText
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);
    addExam({ name: form.name, date: form.date, subjectIds: form.subjectIds, topics });
    setForm({ name: '', date: '', subjectIds: [], topicsText: '' });
    setShowAdd(false);
  };

  // FIX: use getExamDate() so sorting and filtering work correctly
  const upcomingExams = exams
    .filter(e => getExamDate(e) >= today)
    .sort((a, b) => getExamDate(a).localeCompare(getExamDate(b)));

  const pastExams = exams.filter(e => getExamDate(e) < today);

  const urgencyColor = (daysLeft: number) => {
    if (daysLeft <= 3)  return '#ef4444';
    if (daysLeft <= 7)  return '#f59e0b';
    if (daysLeft <= 14) return '#3b82f6';
    return '#10b981';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Exam Planner"
        subtitle={`${upcomingExams.length} upcoming exams`}
        icon={<CalendarDays size={20} />}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Exam
          </button>
        }
      />

      {upcomingExams.length === 0 && pastExams.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="No exams scheduled"
          description="Add your upcoming exams to get a personalised study plan"
          action={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add first exam</button>}
        />
      ) : (
        <>
          {upcomingExams.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Upcoming</h3>
              {upcomingExams.map(exam => {
                const examDate = getExamDate(exam);
                const daysLeft = differenceInDays(parseISO(examDate), new Date());
                const color    = urgencyColor(daysLeft);
                const todayTopics = getTopicsForToday(exam.topics, examDate, reviewCards);
                const progress    = Math.max(0, Math.round((1 - daysLeft / 60) * 100));

                return (
                  <Card key={exam.id} className="relative overflow-hidden">
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />
                    <div className="pl-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-display font-semibold text-white">{exam.name}</h3>
                          <p className="text-slate-400 text-sm">{format(parseISO(examDate), 'EEEE, MMMM d, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-3xl font-display font-bold" style={{ color }}>{daysLeft}</p>
                            <p className="text-xs text-slate-400">days left</p>
                          </div>
                          <button
                            onClick={() => setDeleteId(exam.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Prep progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                        </div>
                      </div>

                      {/* Today's recommended topics */}
                      {todayTopics.length > 0 && (
                        <div className="mb-4 p-3 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                          <p className="text-xs font-semibold mb-2" style={{ color }}>📚 Study today:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {todayTopics.map(t => (
                              <Badge key={t} label={t} color={color} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All topics */}
                      <div>
                        <p className="text-xs text-slate-500 mb-2">All topics ({exam.topics.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {exam.topics.map((t: string) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full text-slate-400"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Countdown alert */}
                      {daysLeft <= 7 && (
                        <div className="mt-4 p-3 rounded-xl flex items-center gap-2"
                          style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                          <Clock size={14} style={{ color }} />
                          <p className="text-xs" style={{ color }}>
                            {daysLeft <= 1 ? '🚨 Exam is tomorrow!' :
                             daysLeft <= 3 ? `⚠️ Only ${daysLeft} days left — focus on weak areas!` :
                             `📅 ${daysLeft} days — increase daily review time`}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {pastExams.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Past</h3>
              {pastExams.map(exam => (
                <div key={exam.id} className="glass rounded-xl p-4 opacity-50 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{exam.name}</p>
                    <p className="text-slate-400 text-sm">{format(parseISO(getExamDate(exam)), 'MMM d, yyyy')}</p>
                  </div>
                  <button onClick={() => setDeleteId(exam.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Exam Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Exam" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Exam Name *</label>
              <input className="input-dark" placeholder="e.g. Physics Final Exam"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Exam Date *</label>
              <input type="date" className="input-dark" value={form.date}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Topics (one per line)</label>
            <textarea
              className="input-dark resize-none"
              rows={6}
              placeholder={"Kinematics\nNewton's Laws\nWork & Energy\nMomentum\nCircular Motion"}
              value={form.topicsText}
              onChange={e => setForm(p => ({ ...p, topicsText: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleAdd}>Add Exam</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => { if (deleteId) deleteExam(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
        message="This exam will be permanently deleted."
      />
    </div>
  );
}
