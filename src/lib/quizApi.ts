import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { QuizMeta } from './useQuizzes';

// Spark plan: the quiz is graded in the browser. The questions (with answers) are only
// readable by an approved student after their own attempt document exists.

export interface QuizQuestionView {
  id: string;
  text: string;
  choices: string[]; // shuffled for this student
  correctPosition: number; // position of the right choice in `choices`
}
export interface StartQuizResult {
  deadlineMs: number;
  questions: QuizQuestionView[];
}
export interface ReviewItem {
  text: string;
  choices: string[];
  yourPosition: number;
  correctPosition: number;
}

const toMs = (v: unknown) => (v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : 0);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function friendly(err: unknown, fallback: string): Error {
  const code = (err as { code?: string })?.code || '';
  if (code.includes('permission-denied')) return new Error('Not allowed. The quiz may be closed, not open yet, or you already took it.');
  return new Error(err instanceof Error ? err.message : fallback);
}

type QDoc = { text: string; choices: string[]; correctIndex: number };

function buildViews(ids: string[], byId: Map<string, QDoc>, orders: Record<string, number[]>): QuizQuestionView[] {
  return ids
    .filter((id) => byId.has(id) && orders[id])
    .map((id) => {
      const q = byId.get(id)!;
      const order = orders[id];
      return { id, text: q.text, choices: order.map((o) => q.choices[o]), correctPosition: order.indexOf(q.correctIndex) };
    });
}

async function loadQuestions(quizId: string) {
  const snap = await getDocs(collection(db, 'quizzes', quizId, 'questions'));
  const map = new Map<string, QDoc>();
  snap.docs.forEach((d) => {
    const x = d.data();
    if (typeof x.text === 'string' && Array.isArray(x.choices) && x.choices.length === 4 && Number.isInteger(x.correctIndex)) {
      map.set(d.id, { text: x.text, choices: x.choices as string[], correctIndex: x.correctIndex as number });
    }
  });
  return map;
}

export async function startQuiz(quiz: QuizMeta, uid: string): Promise<StartQuizResult> {
  const ref = doc(db, 'quiz_attempts', `${uid}_${quiz.id}`);
  try {
    let snap = await getDoc(ref);
    if (snap.exists() && snap.data().status === 'submitted') throw new Error('You already took this quiz.');
    if (!snap.exists()) {
      await setDoc(ref, { quizId: quiz.id, uid, status: 'started', startedAt: serverTimestamp() });
      snap = await getDoc(ref);
    }
    const a = snap.data()!;
    const startedMs = toMs(a.startedAt) || Date.now();
    const deadlineMs = Math.min(startedMs + quiz.durationMin * 60000, quiz.closesAt);
    if (Date.now() > deadlineMs + 15000) throw new Error('Your time is over for this quiz.');

    const bank = await loadQuestions(quiz.id);
    if (bank.size === 0) throw new Error('This quiz has no questions yet.');

    if (Array.isArray(a.qids) && a.orders) {
      return { deadlineMs, questions: buildViews(a.qids as string[], bank, a.orders as Record<string, number[]>) };
    }
    const picked = shuffle([...bank.keys()]).slice(0, Math.min(quiz.questionCount, bank.size));
    const orders: Record<string, number[]> = {};
    picked.forEach((id) => (orders[id] = shuffle([0, 1, 2, 3])));
    await updateDoc(ref, { qids: picked, orders });
    return { deadlineMs, questions: buildViews(picked, bank, orders) };
  } catch (e) {
    throw friendly(e, 'Could not start the quiz.');
  }
}

export async function submitQuiz(
  quizId: string,
  uid: string,
  seasonId: string,
  questions: QuizQuestionView[],
  answers: Record<string, number>
): Promise<{ points: number; score: number; total: number }> {
  const results: Record<string, boolean> = {};
  const given: Record<string, number> = {};
  let score = 0;
  for (const q of questions) {
    const p = answers[q.id];
    const ok = Number.isInteger(p) && p === q.correctPosition;
    results[q.id] = ok;
    given[q.id] = Number.isInteger(p) ? p : -1;
    if (ok) score += 1;
  }
  const total = questions.length;
  const points = Math.round((score * 200) / total); // score out of 20 x 10, max 200
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'quiz_attempts', `${uid}_${quizId}`), {
      status: 'submitted',
      submittedAt: serverTimestamp(),
      score,
      total,
      points,
      answers: given,
      results,
    });
    const logId = `quizlog_${uid}_${quizId}`;
    batch.set(doc(db, 'point_logs', logId), {
      id: logId,
      studentId: uid,
      seasonId,
      action: 'Quiz challenge',
      points,
      note: '',
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return { points, score, total };
  } catch (e) {
    throw friendly(e, 'Could not submit. If the time ran out, your answers were not accepted.');
  }
}

export async function getQuizReview(quiz: QuizMeta, uid: string): Promise<{ points: number; items: ReviewItem[] }> {
  try {
    const snap = await getDoc(doc(db, 'quiz_attempts', `${uid}_${quiz.id}`));
    const a = snap.data();
    if (!a || a.status !== 'submitted') throw new Error('You did not take this quiz.');
    const bank = await loadQuestions(quiz.id);
    const views = buildViews(a.qids as string[], bank, a.orders as Record<string, number[]>);
    const answers = (a.answers || {}) as Record<string, number>;
    return {
      points: Number(a.points || 0),
      items: views.map((v) => ({ text: v.text, choices: v.choices, yourPosition: answers[v.id] ?? -1, correctPosition: v.correctPosition })),
    };
  } catch (e) {
    throw friendly(e, 'Could not load the answers.');
  }
}

export { Timestamp };

export interface ParsedQuestion {
  text: string;
  choices: string[];
  correctIndex: number;
}

/**
 * Paste format, one question per block, blocks separated by a blank line:
 *   What does CTR mean?
 *   A) Click-through rate
 *   B) Cost to reach
 *   C) Customer total revenue
 *   D) Content tracking report
 *   Answer: A
 */
export function parseQuestions(raw: string): { questions: ParsedQuestion[]; errors: string[] } {
  const blocks = raw.replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];
  blocks.forEach((block, i) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const choices: Record<string, string> = {};
    let answer = '';
    const qLines: string[] = [];
    for (const line of lines) {
      const ans = line.match(/^(?:answer|ans|correct|réponse|reponse|الجواب)\s*[:=\-]?\s*([A-Da-d])\b/i);
      if (ans) {
        answer = ans[1].toUpperCase();
        continue;
      }
      const ch = line.match(/^\(?([A-Da-d])[\)\.\-:]\s*(.+)$/);
      if (ch) {
        choices[ch[1].toUpperCase()] = ch[2].trim();
        continue;
      }
      qLines.push(line);
    }
    const text = qLines.join(' ').replace(/^(?:q(?:uestion)?\s*)?\d+\s*[\.\)\-:]\s*/i, '').trim();
    const letters = ['A', 'B', 'C', 'D'];
    if (!text) errors.push(`Block ${i + 1}: no question text.`);
    else if (letters.some((l) => !choices[l])) errors.push(`Block ${i + 1} ("${text.slice(0, 40)}"): needs choices A, B, C and D.`);
    else if (!answer) errors.push(`Block ${i + 1} ("${text.slice(0, 40)}"): add a line like "Answer: B".`);
    else if (text.length > 500) errors.push(`Block ${i + 1}: question is too long.`);
    else questions.push({ text, choices: letters.map((l) => choices[l]), correctIndex: letters.indexOf(answer) });
  });
  return { questions, errors };
}

