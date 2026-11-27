import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { CheckCircle2, Clock, ListChecks, XCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { getQuizReview, startQuiz, submitQuiz, type QuizQuestionView, type ReviewItem } from '../lib/quizApi';

interface QuizMeta {
  id: string;
  title: string;
  opensAt: number;
  closesAt: number;
  durationMin: number;
  questionCount: number;
}
interface AttemptMeta {
  quizId: string;
  status: 'started' | 'submitted';
  deadline: number;
  points?: number;
}

const card = 'rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-5';
const btn =
  'min-h-12 rounded-xl bg-(color:--c-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer disabled:opacity-50';
const btn2 =
  'min-h-12 rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-4 py-2.5 text-sm font-medium text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.08] transition-colors cursor-pointer disabled:opacity-50';

function fmt(ms: number) {
  return new Date(ms).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
const toMs = (v: unknown) => (v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : 0);

export function QuizPage() {
  const { session, navigate, seasons } = useApp();
  const uid = session?.uid;
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [attempts, setAttempts] = useState<Record<string, AttemptMeta>>({});
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [running, setRunning] = useState<{ quizId: string; title: string; deadline: number; questions: QuizQuestionView[] } | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState<{ points: number; score: number; total: number; quizId: string } | null>(null);
  const [review, setReview] = useState<{ title: string; points: number; items: ReviewItem[] } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'quizzes'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            title: String(x.title || 'Weekly quiz'),
            opensAt: toMs(x.opensAt),
            closesAt: toMs(x.closesAt),
            durationMin: Number(x.durationMin) || 15,
            questionCount: Number(x.questionCount) || 20,
          };
        });
        list.sort((a, b) => b.opensAt - a.opensAt);
        setQuizzes(list);
      },
      () => {}
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      query(collection(db, 'quiz_attempts'), where('uid', '==', uid)),
      (snap) => {
        const m: Record<string, AttemptMeta> = {};
        snap.docs.forEach((d) => {
          const x = d.data();
          m[String(x.quizId)] = {
            quizId: String(x.quizId),
            status: x.status === 'submitted' ? 'submitted' : 'started',
            deadline: toMs(x.startedAt), // start time; the timer end is start + duration
            points: typeof x.points === 'number' ? x.points : undefined,
          };
        });
        setAttempts(m);
      },
      () => {}
    );
    return unsub;
  }, [uid]);

  const begin = async (q: QuizMeta) => {
    setError(null);
    setBusy(q.id);
    try {
      const r = await startQuiz(q, uid!);
      setRunning({ quizId: q.id, title: q.title, deadline: r.deadlineMs, questions: r.questions });
      setIdx(0);
      setAnswers({});
      setDone(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the quiz.');
    } finally {
      setBusy(null);
    }
  };

  const finish = useCallback(
    async (auto = false) => {
      if (!running) return;
      setBusy('submit');
      setError(null);
      try {
        const season = seasons.find((x) => x.active) || seasons[0];
        if (!season) throw new Error('No season exists yet. Ask your instructor.');
        const r = await submitQuiz(running.quizId, uid!, season.id, running.questions, answers);
        setDone({ points: r.points, score: r.score, total: r.total, quizId: running.quizId });
        setRunning(null);
      } catch (e) {
        setError((e instanceof Error ? e.message : 'Could not submit.') + (auto ? ' (time ran out)' : ''));
        if (auto) setRunning(null);
      } finally {
        setBusy(null);
      }
    },
    [running, answers, uid, seasons]
  );

  // the result box disappears by itself after 10 seconds
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setDone(null), 10000);
    return () => window.clearTimeout(t);
  }, [done]);

  // auto-submit when the timer ends
  useEffect(() => {
    if (running && now >= running.deadline && busy !== 'submit') {
      void finish(true);
    }
  }, [now, running, busy, finish]);

  const openReview = async (q: QuizMeta) => {
    setError(null);
    setBusy(q.id);
    try {
      const r = await getQuizReview(q, uid!);
      setReview({ title: q.title, points: r.points, items: r.items });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the answers.');
    } finally {
      setBusy(null);
    }
  };

  const shell = (children: React.ReactNode) => (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-10 space-y-6"
    >
      {children}
    </motion.main>
  );

  const remaining = useMemo(() => (running ? Math.max(0, Math.ceil((running.deadline - now) / 1000)) : 0), [running, now]);

  if (running) {
    const q = running.questions[idx];
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    const answered = Object.keys(answers).length;
    return shell(
      <>
        <div className="flex items-center justify-between">
          <p className="text-sm text-(color:--c-muted)">
            Question {idx + 1} of {running.questions.length}
          </p>
          <p className={`inline-flex items-center gap-1.5 font-mono-tabular text-sm font-semibold ${remaining < 60 ? 'text-red-600' : 'text-(color:--c-ink)'}`}>
            <Clock className="h-4 w-4" aria-hidden="true" /> {mm}:{ss}
          </p>
        </div>
        <div
          className="h-2 w-full rounded-full bg-(color:--c-ink)/[0.08] overflow-hidden"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={running.questions.length}
          aria-valuenow={idx + 1}
          aria-label={`Question ${idx + 1} of ${running.questions.length}`}
        >
          <div className="h-full bg-(color:--c-accent) transition-all" style={{ width: `${((idx + 1) / running.questions.length) * 100}%` }} />
        </div>
        <section className={`${card} space-y-4`}>
          <h2 className="font-display text-xl text-(color:--c-ink)">{q.text}</h2>
          <div className="space-y-2.5">
            {q.choices.map((c, i) => {
              const sel = answers[q.id] === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 min-h-12 text-base sm:text-sm cursor-pointer transition-colors ${
                    sel
                      ? 'border-(color:--c-accent) bg-(color:--c-accent)/10 text-(color:--c-ink)'
                      : 'border-(color:--c-ink)/[0.10] hover:bg-(color:--c-ink)/[0.045] text-(color:--c-ink2)'
                  }`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}</span>
                  {c}
                </button>
              );
            })}
          </div>
        </section>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <button type="button" className={btn2} disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
            Back
          </button>
          <p className="text-xs text-(color:--c-muted)">{answered} of {running.questions.length} answered</p>
          {idx < running.questions.length - 1 ? (
            <button type="button" className={btn} onClick={() => setIdx((i) => i + 1)}>
              Next
            </button>
          ) : (
            <button
              type="button"
              className={btn}
              disabled={busy === 'submit'}
              onClick={() => {
                if (answered < running.questions.length && !window.confirm(`You answered ${answered} of ${running.questions.length}. Submit anyway? You cannot retry.`)) return;
                void finish();
              }}
            >
              {busy === 'submit' ? 'Sending...' : 'Submit'}
            </button>
          )}
        </div>
      </>
    );
  }

  if (review) {
    return shell(
      <>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-(color:--c-ink)">{review.title}: correct answers</h1>
          <button type="button" className={btn2} onClick={() => setReview(null)}>
            Back
          </button>
        </div>
        <p className="text-sm text-(color:--c-sub)">You earned {review.points} points.</p>
        <div className="space-y-3">
          {review.items.map((it, n) => {
            const right = it.yourPosition === it.correctPosition;
            return (
              <section key={n} className={`${card} space-y-2`}>
                <p className="flex items-start gap-2 font-medium text-(color:--c-ink)">
                  {right ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                  )}
                  <span>
                    {n + 1}. {it.text}
                  </span>
                </p>
                <ul className="text-sm space-y-1 pl-7">
                  {it.choices.map((c, i) => (
                    <li
                      key={i}
                      className={
                        i === it.correctPosition
                          ? 'font-semibold text-emerald-700'
                          : i === it.yourPosition
                          ? 'text-red-600 line-through'
                          : 'text-(color:--c-sub)'
                      }
                    >
                      {String.fromCharCode(65 + i)}. {c}
                      {i === it.yourPosition && i !== it.correctPosition ? ' (your answer)' : ''}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </>
    );
  }

  return shell(
    <>
      <div>
        <p className="text-xs font-medium text-(color:--c-accent-d)">Every Sunday</p>
        <h1 className="font-display text-2xl font-bold text-(color:--c-ink)">Weekly quiz</h1>
        <p className="text-sm text-(color:--c-muted) mt-1">One attempt per quiz. Your points are added to the leaderboard automatically.</p>
      </div>

      {done && (
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="font-display text-xl text-(color:--c-ink)">Done! {done.score} / {done.total} correct, {done.points} points.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={btn}
              disabled={busy === done.quizId}
              onClick={() => {
                const q = quizzes.find((x) => x.id === done.quizId);
                if (q) void openReview(q);
              }}
            >
              See correct answers
            </button>
            <button type="button" className={btn2} onClick={() => navigate('/')}>
              View leaderboard
            </button>
          </div>
        </section>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {quizzes.length === 0 ? (
        <section className={`${card} text-sm text-(color:--c-muted) text-center`}>No quiz yet. Your instructor will publish the next one.</section>
      ) : (
        quizzes.map((q) => {
          const a = attempts[q.id];
          const isOpen = now >= q.opensAt && now <= q.closesAt;
          const upcoming = now < q.opensAt;
          const closed = now > q.closesAt;
          const resumable = a?.status === 'started' && now < Math.min(a.deadline + q.durationMin * 60000, q.closesAt) + 15000 && !closed;
          return (
            <section key={q.id} className={`${card} space-y-3`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg text-(color:--c-ink)">{q.title}</h2>
                  <p className="text-xs text-(color:--c-muted)">
                    {fmt(q.opensAt)} to {fmt(q.closesAt)}
                  </p>
                </div>
                <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-(color:--c-ink)/[0.06] text-(color:--c-ink2)">
                  {upcoming ? 'Upcoming' : isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="text-sm text-(color:--c-sub) inline-flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" aria-hidden="true" /> {q.questionCount} questions, {q.durationMin} minutes
              </p>
              {a?.status === 'submitted' ? (
                <div className="flex flex-wrap items-center gap-3">
                  {done?.quizId !== q.id && <p className="text-sm font-semibold text-(color:--c-ink)">You earned {a.points ?? 0} points.</p>}
                  <button type="button" className={btn2} disabled={busy === q.id} onClick={() => openReview(q)}>
                    See correct answers
                  </button>
                </div>
              ) : resumable ? (
                <button type="button" className={btn} disabled={busy === q.id} onClick={() => begin(q)}>
                  Resume quiz
                </button>
              ) : isOpen ? (
                <button
                  type="button"
                  className={btn}
                  disabled={busy === q.id}
                  onClick={() => {
                    if (window.confirm(`Start now? You get ${q.durationMin} minutes and only one attempt.`)) void begin(q);
                  }}
                >
                  {busy === q.id ? 'Starting...' : 'Start quiz'}
                </button>
              ) : closed ? (
                <p className="text-xs text-(color:--c-muted)">You did not take this quiz.</p>
              ) : null}
            </section>
          );
        })
      )}
    </>
  );
}
