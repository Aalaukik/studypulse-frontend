import React, { useState } from 'react';
import { Brain, Plus, ChevronRight, RefreshCw, CheckCircle, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store';
import { Card, Modal, SectionHeader, Badge, EmptyState, SubjectSelector, ConfirmDialog } from '../shared';
import { ReviewRating } from '../../types';
import { format, parseISO, differenceInDays } from 'date-fns';

const RATING_COLORS: Record<ReviewRating, string> = {
  Again: '#ef4444',
  Hard:  '#f59e0b',
  Good:  '#3b82f6',
  Easy:  '#10b981',
};

const RATING_EMOJI: Record<ReviewRating, string> = {
  Again: '🔴',
  Hard:  '🟡',
  Good:  '🔵',
  Easy:  '🟢',
};

export function SpacedRepetition() {
  const { reviewCards, subjects, addReviewCard, rateReviewCard, deleteReviewCard, getDueCards } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [form, setForm] = useState({ subjectId: '', topic: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [sessionResults, setSessionResults] = useState<{ cardId: string; rating: ReviewRating }[]>([]);
  const [sessionDone, setSessionDone] = useState(false);

  const dueCards = getDueCards();
  const filteredCards = subjectFilter
    ? reviewCards.filter(c => c.subjectId === subjectFilter)
    : reviewCards;

  const startReview = () => {
    setReviewMode(true);
    setReviewIndex(0);
    setShowAnswer(false);
    setSessionResults([]);
    setSessionDone(false);
  };

  const handleRate = (rating: ReviewRating) => {
    const card = dueCards[reviewIndex];
    rateReviewCard(card.id, rating);
    setSessionResults(prev => [...prev, { cardId: card.id, rating }]);
    if (reviewIndex + 1 >= dueCards.length) {
      setSessionDone(true);
    } else {
      setReviewIndex(reviewIndex + 1);
      setShowAnswer(false);
    }
  };

  const handleAdd = () => {
    if (!form.topic.trim() || !form.subjectId) return;
    addReviewCard(form.subjectId, form.topic);
    setForm({ subjectId: '', topic: '' });
    setShowAdd(false);
  };

  if (reviewMode) {
    if (sessionDone) {
      const counts = sessionResults.reduce((acc, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      }, {} as Record<ReviewRating, number>);

      return (
        <div className="space-y-6 animate-fade-in">
          <SectionHeader title="Review Complete!" icon={<CheckCircle size={20} />} />
          <Card className="text-center py-10">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Session Done!</h2>
            <p className="text-slate-400 mb-8">You reviewed {sessionResults.length} cards</p>
            <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto mb-8">
              {(Object.entries(counts) as [ReviewRating, number][]).map(([rating, count]) => (
                <div key={rating} className="text-center">
                  <div className="text-2xl">{RATING_EMOJI[rating]}</div>
                  <div className="text-lg font-bold" style={{ color: RATING_COLORS[rating] }}>{count}</div>
                  <div className="text-xs text-slate-400">{rating}</div>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => { setReviewMode(false); setSessionDone(false); }}>
              Back to Deck
            </button>
          </Card>
        </div>
      );
    }

    const currentCard = dueCards[reviewIndex];
    const subject = subjects.find(s => s.id === currentCard?.subjectId);

    return (
      <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => setReviewMode(false)} className="btn-ghost text-sm">← Exit</button>
          <div className="text-sm text-slate-400">
            {reviewIndex + 1} / {dueCards.length}
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${((reviewIndex + 1) / dueCards.length) * 100}%` }} />
        </div>

        {/* Card */}
        <Card className="min-h-64 flex flex-col justify-between" glow="indigo">
          <div>
            <div className="flex items-center gap-2 mb-6">
              {subject && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: subject.color }} />
                  {subject.name}
                </span>
              )}
              <Badge label={`×${currentCard.repetitions} reviews`} color="#6366f1" />
            </div>
            <div className="text-center py-8">
              <h2 className="text-2xl font-display font-semibold text-white mb-4">{currentCard.topic}</h2>
              {showAnswer ? (
                <div className="animate-fade-in">
                  <div className="w-full h-px my-6" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <p className="text-slate-300 text-sm">
                    How well do you recall this topic? Rate your confidence below.
                  </p>
                  <div className="mt-4 text-xs text-slate-500">
                    Last rated: {currentCard.lastRating || 'Not yet'} ·
                    Next in: {currentCard.interval}d
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Think about this topic for a moment…</p>
              )}
            </div>
          </div>

          {!showAnswer ? (
            <button
              className="btn-primary w-full"
              onClick={() => setShowAnswer(true)}
            >
              Show Rating Options
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {(['Again', 'Hard', 'Good', 'Easy'] as ReviewRating[]).map(r => (
                <button
                  key={r}
                  onClick={() => handleRate(r)}
                  className="py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 tap-target"
                  style={{
                    background: `${RATING_COLORS[r]}18`,
                    color: RATING_COLORS[r],
                    border: `1px solid ${RATING_COLORS[r]}30`,
                  }}
                >
                  {RATING_EMOJI[r]}
                  <span className="block text-xs mt-0.5">{r}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Review Deck"
        subtitle={`${reviewCards.length} cards · ${dueCards.length} due today`}
        icon={<Brain size={20} />}
        action={
          <div className="flex gap-2">
            <button className="btn-ghost text-sm flex items-center gap-2" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Card
            </button>
            {dueCards.length > 0 && (
              <button className="btn-primary text-sm flex items-center gap-2" onClick={startReview}>
                <RefreshCw size={14} /> Review {dueCards.length} Due
              </button>
            )}
          </div>
        }
      />

      {/* Due Today Banner */}
      {dueCards.length > 0 && (
        <Card style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 font-semibold">{dueCards.length} cards due today</p>
              <p className="text-slate-400 text-sm">Reviewing on time boosts long-term retention</p>
            </div>
            <button className="btn-primary" onClick={startReview}
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
              Start Review
            </button>
          </div>
        </Card>
      )}

      {/* Subject filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSubjectFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all tap-target ${!subjectFilter ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white bg-white/5'}`}
        >
          All
        </button>
        {subjects.map(sub => (
          <button
            key={sub.id}
            onClick={() => setSubjectFilter(sub.id)}
            className="px-3 py-1.5 rounded-lg text-xs transition-all tap-target"
            style={subjectFilter === sub.id ? {
              background: `${sub.color}22`, color: sub.color, border: `1px solid ${sub.color}44`
            } : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
          >
            {sub.icon} {sub.name}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <EmptyState
          icon={<Brain />}
          title="No review cards yet"
          description="Add topics you're studying to start building your review deck"
          action={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add first card</button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map(card => {
            const subject = subjects.find(s => s.id === card.subjectId);
            const today = format(new Date(), 'yyyy-MM-dd');
            const isOverdue = card.dueDate < today;
            const isDueToday = card.dueDate === today;
            const daysUntil = differenceInDays(parseISO(card.dueDate), new Date());

            return (
              <Card key={card.id} className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {subject && (
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: subject.color }} />
                    )}
                    <span className="text-xs text-slate-400">{subject?.name}</span>
                  </div>
                  <button
                    onClick={() => setDeleteId(card.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <h4 className="font-medium text-white mb-3 leading-snug">{card.topic}</h4>

                <div className="flex items-center justify-between">
                  <div>
                    {isOverdue && <Badge label="Overdue" color="#ef4444" />}
                    {isDueToday && <Badge label="Due Today" color="#f59e0b" />}
                    {!isOverdue && !isDueToday && (
                      <Badge label={`In ${daysUntil}d`} color="#64748b" />
                    )}
                  </div>
                  {card.lastRating && (
                    <span className="text-xs" style={{ color: RATING_COLORS[card.lastRating] }}>
                      {RATING_EMOJI[card.lastRating]} {card.lastRating}
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-white/05 flex items-center gap-4 text-xs text-slate-500">
                  <span>EF: {card.easeFactor.toFixed(1)}</span>
                  <span>×{card.repetitions}</span>
                  <span>{card.interval}d interval</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Review Card">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Subject</label>
            <SubjectSelector value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Topic</label>
            <input
              className="input-dark"
              placeholder="e.g. Newton's second law"
              value={form.topic}
              onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleAdd}>Add Card</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => { if (deleteId) deleteReviewCard(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
        message="This review card will be permanently deleted."
      />
    </div>
  );
}
