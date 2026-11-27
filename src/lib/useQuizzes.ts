import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { useApp } from '../context/AppContext';

export interface QuizMeta {
  id: string;
  title: string;
  opensAt: number;
  closesAt: number;
  durationMin: number;
  questionCount: number;
}
export interface AttemptMeta {
  quizId: string;
  status: 'started' | 'submitted';
  deadline: number;
  points?: number;
  score?: number;
  total?: number;
  submittedAt?: number;
}

const toMs = (v: unknown) => (v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : 0);

/** Live quizzes + the signed-in student's own attempts. */
export function useQuizzes() {
  const { session } = useApp();
  const uid = session?.uid;
  const ok = Boolean(session && (session.role === 'admin' || session.approved));
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [attempts, setAttempts] = useState<Record<string, AttemptMeta>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!ok) {
      setQuizzes([]);
      return;
    }
    return onSnapshot(
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
  }, [ok]);

  useEffect(() => {
    if (!ok || !uid) {
      setAttempts({});
      return;
    }
    return onSnapshot(
      query(collection(db, 'quiz_attempts'), where('uid', '==', uid)),
      (snap) => {
        const m: Record<string, AttemptMeta> = {};
        snap.docs.forEach((d) => {
          const x = d.data();
          m[String(x.quizId)] = {
            quizId: String(x.quizId),
            status: x.status === 'submitted' ? 'submitted' : 'started',
            deadline: toMs(x.deadline),
            points: typeof x.points === 'number' ? x.points : undefined,
            score: typeof x.score === 'number' ? x.score : undefined,
            total: typeof x.total === 'number' ? x.total : undefined,
            submittedAt: toMs(x.submittedAt) || undefined,
          };
        });
        setAttempts(m);
      },
      () => {}
    );
  }, [ok, uid]);

  // An open quiz this student has not finished yet (closest to closing first)
  const openQuiz = useMemo(() => {
    return (
      quizzes
        .filter((q) => now >= q.opensAt && now <= q.closesAt && attempts[q.id]?.status !== 'submitted')
        .sort((a, b) => a.closesAt - b.closesAt)[0] || null
    );
  }, [quizzes, attempts, now]);

  return { quizzes, attempts, now, openQuiz };
}

export function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
}
