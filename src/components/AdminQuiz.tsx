import { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { parseQuestions, type ParsedQuestion } from '../lib/quizApi';

interface Quiz {
  id: string;
  title: string;
  opensAt: number;
  closesAt: number;
  durationMin: number;
  questionCount: number;
}
interface Q extends ParsedQuestion {
  id: string;
}

const card = 'rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-5 space-y-3';
const input =
  'w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm text-(color:--c-ink) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30';
const btn =
  'rounded-xl bg-(color:--c-accent) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer disabled:opacity-50';
const btn2 =
  'rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-3.5 py-2 text-sm font-medium text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.08] cursor-pointer disabled:opacity-50';
const toMs = (v: unknown) => (v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : 0);

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// Default window: the coming Sunday (today if it is Sunday), 00:00 to 23:59
function sundayDefaults() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59);
  return { start: toLocalInput(start), end: toLocalInput(end), label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) };
}
function fmt(ms: number) {
  return new Date(ms).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const SAMPLE = `What does CTR stand for?
A) Click-through rate
B) Cost to reach
C) Customer total revenue
D) Content tracking report
Answer: A

Which metric shows the share of visitors who leave after one page?
A) Reach
B) Bounce rate
C) Impressions
D) Conversion rate
Answer: B`;

export function AdminQuiz() {
  const { students } = useApp();
  const def = useMemo(sundayDefaults, []);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // create form
  const [title, setTitle] = useState(`Weekly Quiz ${def.label}`);
  const [opens, setOpens] = useState(def.start);
  const [closes, setCloses] = useState(def.end);
  const [duration, setDuration] = useState('15');
  const [perStudent, setPerStudent] = useState('20');

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'quizzes'),
        (snap) => {
          const list = snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              title: String(x.title || ''),
              opensAt: toMs(x.opensAt),
              closesAt: toMs(x.closesAt),
              durationMin: Number(x.durationMin) || 15,
              questionCount: Number(x.questionCount) || 20,
            };
          });
          list.sort((a, b) => b.opensAt - a.opensAt);
          setQuizzes(list);
        },
        (e) => setMsg({ type: 'err', text: e.message })
      ),
    []
  );

  const createQuiz = async () => {
    setMsg(null);
    const o = new Date(opens).getTime();
    const c = new Date(closes).getTime();
    const dur = Number(duration);
    const per = Number(perStudent);
    if (title.trim().length < 2) return setMsg({ type: 'err', text: 'Give the quiz a title.' });
    if (!(o > 0) || !(c > o)) return setMsg({ type: 'err', text: 'The closing time must be after the opening time.' });
    if (!(dur >= 1 && dur <= 180)) return setMsg({ type: 'err', text: 'Timer must be between 1 and 180 minutes.' });
    if (!(per >= 1 && per <= 100)) return setMsg({ type: 'err', text: 'Questions per student must be between 1 and 100.' });
    const id = `quiz_${Date.now()}`;
    try {
      await setDoc(doc(db, 'quizzes', id), {
        title: title.trim(),
        opensAt: Timestamp.fromMillis(o),
        closesAt: Timestamp.fromMillis(c),
        durationMin: dur,
        questionCount: per,
        createdAt: serverTimestamp(),
      });
      setSelected(id);
      setMsg({ type: 'ok', text: 'Quiz created. Now add the questions.' });
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Could not create the quiz.' });
    }
  };

  const current = quizzes.find((q) => q.id === selected) || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-(color:--c-ink)">Weekly Quiz</h2>
        <p className="text-xs text-(color:--c-muted)">Held every Sunday. Answers are graded in the student's browser and points are added automatically.</p>
      </div>
      {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}

      <section className={card}>
        <h3 className="font-semibold text-(color:--c-ink) text-sm">New quiz</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-(color:--c-muted) space-y-1 sm:col-span-2">
            Title
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="text-xs text-(color:--c-muted) space-y-1">
            Opens (default: Sunday 00:00)
            <input type="datetime-local" className={input} value={opens} onChange={(e) => setOpens(e.target.value)} />
          </label>
          <label className="text-xs text-(color:--c-muted) space-y-1">
            Closes (default: Sunday 23:59)
            <input type="datetime-local" className={input} value={closes} onChange={(e) => setCloses(e.target.value)} />
          </label>
          <label className="text-xs text-(color:--c-muted) space-y-1">
            Timer (minutes)
            <input type="number" min="1" max="180" className={input} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>
          <label className="text-xs text-(color:--c-muted) space-y-1">
            Questions per student (random from the bank)
            <input type="number" min="1" max="100" className={input} value={perStudent} onChange={(e) => setPerStudent(e.target.value)} />
          </label>
        </div>
        <button type="button" className={btn} onClick={createQuiz}>
          Create quiz
        </button>
      </section>

      <section className={card}>
        <h3 className="font-semibold text-(color:--c-ink) text-sm">Quizzes</h3>
        {quizzes.length === 0 ? (
          <p className="text-sm text-(color:--c-muted)">No quiz yet.</p>
        ) : (
          <ul className="space-y-2">
            {quizzes.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setSelected(q.id === selected ? null : q.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm cursor-pointer ${
                    q.id === selected ? 'border-(color:--c-accent) bg-(color:--c-accent)/10' : 'border-(color:--c-ink)/[0.10] hover:bg-(color:--c-ink)/[0.045]'
                  }`}
                >
                  <span className="font-medium text-(color:--c-ink)">{q.title}</span>
                  <span className="block text-xs text-(color:--c-muted)">
                    {fmt(q.opensAt)} to {fmt(q.closesAt)}, {q.durationMin} min, {q.questionCount} per student
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {current && <QuizManager key={current.id} quiz={current} studentNames={new Map(students.filter((s) => s.approved).map((s) => [s.id, s.name]))} onDeleted={() => setSelected(null)} />}
    </div>
  );
}

function QuizManager({ quiz, studentNames, onDeleted }: { quiz: Quiz; studentNames: Map<string, string>; onDeleted: () => void }) {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [paste, setPaste] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [qText, setQText] = useState('');
  const [qChoices, setQChoices] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [attempts, setAttempts] = useState<{ uid: string; points: number; status: string; score: number; total: number }[]>([]);
  const [results, setResults] = useState<Record<string, { right: number; total: number }>>({});
  const [editCount, setEditCount] = useState(String(quiz.questionCount));
  const [topic, setTopic] = useState('');
  const [genCount, setGenCount] = useState('20');
  const [copied, setCopied] = useState(false);

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'quizzes', quiz.id, 'questions'),
        (snap) =>
          setQuestions(
            snap.docs.map((d) => {
              const x = d.data();
              return { id: d.id, text: String(x.text || ''), choices: (x.choices as string[]) || [], correctIndex: Number(x.correctIndex) || 0 };
            })
          ),
        (e) => setMsg({ type: 'err', text: e.message })
      ),
    [quiz.id]
  );

  const loadStats = async () => {
    try {
      const a = await getDocs(query(collection(db, 'quiz_attempts'), where('quizId', '==', quiz.id)));
      setAttempts(
        a.docs.map((d) => ({ uid: String(d.data().uid), points: Number(d.data().points || 0), status: String(d.data().status), score: Number(d.data().score || 0), total: Number(d.data().total || 0) }))
      );
      const agg: Record<string, { right: number; total: number }> = {};
      a.docs.forEach((d) => {
        const r = (d.data().results || {}) as Record<string, boolean>;
        Object.entries(r).forEach(([qid, ok]) => {
          agg[qid] = agg[qid] || { right: 0, total: 0 };
          agg[qid].total += 1;
          if (ok) agg[qid].right += 1;
        });
      });
      setResults(agg);
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Could not load stats.' });
    }
  };
  useEffect(() => {
    void loadStats();
  }, [quiz.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveQuestions = async (list: ParsedQuestion[]) => {
    setBusy(true);
    try {
      for (const q of list) {
        const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await setDoc(doc(db, 'quizzes', quiz.id, 'questions', id), { ...q, createdAt: serverTimestamp() });
      }
      setMsg({ type: 'ok', text: `${list.length} question${list.length > 1 ? 's' : ''} added.` });
      return true;
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Could not save.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    const { questions: qs, errors } = parseQuestions(paste);
    setParseErrors(errors);
    if (qs.length === 0) return setMsg({ type: 'err', text: 'No valid question found.' });
    if (errors.length > 0 && !window.confirm(`${errors.length} block(s) have problems and will be skipped. Import the ${qs.length} valid question(s)?`)) return;
    if (await saveQuestions(qs)) setPaste('');
  };

  const addOne = async () => {
    if (!qText.trim() || qChoices.some((c) => !c.trim())) return setMsg({ type: 'err', text: 'Write the question and all 4 choices.' });
    if (await saveQuestions([{ text: qText.trim(), choices: qChoices.map((c) => c.trim()), correctIndex: qCorrect }])) {
      setQText('');
      setQChoices(['', '', '', '']);
      setQCorrect(0);
    }
  };

  const saveCount = async () => {
    const n = Number(editCount);
    if (!(n >= 1 && n <= 100)) return setMsg({ type: 'err', text: 'Between 1 and 100.' });
    try {
      await updateDoc(doc(db, 'quizzes', quiz.id), {
        title: quiz.title,
        opensAt: Timestamp.fromMillis(quiz.opensAt),
        closesAt: Timestamp.fromMillis(quiz.closesAt),
        durationMin: quiz.durationMin,
        questionCount: n,
      });
      setMsg({ type: 'ok', text: 'Saved.' });
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Could not save.' });
    }
  };

  const closeEarly = async () => {
    if (!window.confirm('Close this quiz now? Students can no longer start or submit, and they can see the correct answers.')) return;
    try {
      await updateDoc(doc(db, 'quizzes', quiz.id), {
        title: quiz.title,
        opensAt: Timestamp.fromMillis(Math.min(quiz.opensAt, Date.now() - 1000)),
        closesAt: Timestamp.fromMillis(Date.now()),
        durationMin: quiz.durationMin,
        questionCount: quiz.questionCount,
      });
      setMsg({ type: 'ok', text: 'Quiz closed.' });
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Could not close.' });
    }
  };

  const exportCsv = async () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    let emails = new Map<string, string>();
    try {
      const snap = await getDocs(collection(db, 'users_private'));
      emails = new Map(snap.docs.map((d) => [d.id, String(d.data().email || '')]));
    } catch {
      /* names only */
    }
    const rows = [['Student', 'Email', 'Score /20', 'Points', 'Status']];
    attempts.forEach((a) => {
      rows.push([studentNames.get(a.uid) || a.uid, emails.get(a.uid) || '', a.status === 'submitted' ? String(a.total ? Math.round((a.score / a.total) * 20) : 0) : '', String(a.points), a.status]);
    });
    const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${quiz.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeQuiz = async () => {
    if (!window.confirm('Delete this quiz and all its questions? Points already awarded stay.')) return;
    for (const q of questions) await deleteDoc(doc(db, 'quizzes', quiz.id, 'questions', q.id));
    await deleteDoc(doc(db, 'quizzes', quiz.id));
    onDeleted();
  };

  const aiPrompt = `Write exactly ${Number(genCount) || 20} multiple choice questions for a university Digital Marketing course (Morocco) about: ${topic.trim() || '[TOPIC]'}.
Rules: each question has exactly 4 different choices and exactly one correct choice. Clear, factual, no trick questions. Spread the correct answer across A, B, C and D.
Reply with plain text only, in exactly this format, with a blank line between questions, no numbering, no extra text:

Question text here?
A) first choice
B) second choice
C) third choice
D) fourth choice
Answer: B`;
  const approvedCount = studentNames.size;
  const submitted = attempts.filter((a) => a.status === 'submitted');
  const avgPoints = submitted.length ? Math.round(submitted.reduce((s, a) => s + a.points, 0) / submitted.length) : 0;
  const hardest = questions
    .map((q) => ({ q, r: results[q.id] }))
    .filter((x) => x.r && x.r.total > 0)
    .sort((a, b) => a.r.right / a.r.total - b.r.right / b.r.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-(color:--c-ink)">{quiz.title}</h3>
            <p className="text-xs text-(color:--c-muted)">
              Bank: {questions.length} question{questions.length === 1 ? '' : 's'}. Each student gets {Math.min(quiz.questionCount, Math.max(questions.length, 0))} random ones.
              {questions.length < quiz.questionCount && ' Add more questions to reach the number per student.'}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" className={btn2} onClick={closeEarly}>
              Close early
            </button>
            <button type="button" className={btn2} onClick={removeQuiz}>
              Delete
            </button>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <label className="text-xs text-(color:--c-muted) space-y-1">
            Questions per student
            <input type="number" min="1" max="100" className={`${input} w-28`} value={editCount} onChange={(e) => setEditCount(e.target.value)} />
          </label>
          <button type="button" className={btn2} onClick={saveCount}>
            Save
          </button>
        </div>
        {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
      </section>

      <section className={card}>
        <h3 className="font-semibold text-(color:--c-ink) text-sm">Make questions with any AI chat</h3>
        <p className="text-xs text-(color:--c-muted)">
          Type a topic, copy the prompt, paste it in ChatGPT, Claude or Gemini, then paste the answer in the box below and press Import. Check the answers first, AI can be wrong.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className={input} placeholder='Topic, e.g. "SEO and content marketing"' value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120} />
          <input type="number" min="1" max="40" className={`${input} sm:w-24`} value={genCount} onChange={(e) => setGenCount(e.target.value)} aria-label="Number of questions" />
        </div>
        <pre className="whitespace-pre-wrap rounded-xl bg-(color:--c-ink)/[0.045] p-3 text-xs text-(color:--c-ink2)">{aiPrompt}</pre>
        <button
          type="button"
          className={btn}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(aiPrompt);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              setMsg({ type: 'err', text: 'Could not copy. Select the text above and copy it by hand.' });
            }
          }}
        >
          {copied ? 'Copied!' : 'Copy prompt'}
        </button>
      </section>

      <section className={card}>
        <h3 className="font-semibold text-(color:--c-ink) text-sm">Import many questions (paste)</h3>
        <p className="text-xs text-(color:--c-muted)">One question per block, blank line between blocks. Choices A) B) C) D), then a line "Answer: B".</p>
        <textarea className={`${input} font-mono min-h-40`} placeholder={SAMPLE} value={paste} onChange={(e) => setPaste(e.target.value)} />
        {parseErrors.length > 0 && (
          <ul className="text-xs text-red-600 list-disc pl-5 space-y-0.5">
            {parseErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        <button type="button" className={btn} disabled={busy || !paste.trim()} onClick={doImport}>
          Import questions
        </button>
      </section>

      <section className={card}>
        <h3 className="font-semibold text-(color:--c-ink) text-sm">Add one question</h3>
        <input className={input} placeholder="Question" value={qText} onChange={(e) => setQText(e.target.value)} />
        {qChoices.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={qCorrect === i} onChange={() => setQCorrect(i)} aria-label={`Correct answer is ${String.fromCharCode(65 + i)}`} />
            <input
              className={input}
              placeholder={`Choice ${String.fromCharCode(65 + i)}${qCorrect === i ? ' (correct)' : ''}`}
              value={c}
              onChange={(e) => setQChoices((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
            />
          </div>
        ))}
        <button type="button" className={btn} disabled={busy} onClick={addOne}>
          Add question
        </button>
      </section>

      <section className={card}>
        <h3 className="font-semibold text-(color:--c-ink) text-sm">Question bank ({questions.length})</h3>
        {questions.length === 0 ? (
          <p className="text-sm text-(color:--c-muted)">No questions yet.</p>
        ) : (
          <ol className="space-y-3">
            {questions.map((q, n) => (
              <li key={q.id} className="text-sm space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-(color:--c-ink)">
                    {n + 1}. {q.text}
                  </p>
                  <button
                    type="button"
                    className="text-xs text-red-600 cursor-pointer shrink-0"
                    onClick={() => deleteDoc(doc(db, 'quizzes', quiz.id, 'questions', q.id))}
                  >
                    Delete
                  </button>
                </div>
                <ul className="pl-4 text-xs text-(color:--c-sub)">
                  {q.choices.map((c, i) => (
                    <li key={i} className={i === q.correctIndex ? 'font-semibold text-emerald-700' : ''}>
                      {String.fromCharCode(65 + i)}. {c}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-(color:--c-ink) text-sm">Stats</h3>
          <div className="flex gap-2">
            <button type="button" className={btn2} onClick={loadStats}>
              Refresh
            </button>
            <button type="button" className={btn2} disabled={attempts.length === 0} onClick={exportCsv}>
              Export CSV
            </button>
          </div>
        </div>
        <p className="text-sm text-(color:--c-sub)">
          Took the quiz: <strong>{submitted.length}</strong> of {approvedCount} approved students. Average: <strong>{avgPoints}</strong> points.
        </p>
        {submitted.length > 0 && (
          <ul className="text-sm space-y-1">
            {[...submitted]
              .sort((a, b) => b.points - a.points)
              .map((a) => (
                <li key={a.uid} className="flex justify-between">
                  <span>{studentNames.get(a.uid) || a.uid}</span>
                  <span className="font-mono-tabular">{a.points} pts ({a.total ? Math.round((a.score / a.total) * 20) : 0}/20)</span>
                </li>
              ))}
          </ul>
        )}
        {hardest.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-(color:--c-ink)">Hardest questions</p>
            <ul className="text-sm space-y-1">
              {hardest.map(({ q, r }) => (
                <li key={q.id} className="flex justify-between gap-3">
                  <span className="truncate">{q.text}</span>
                  <span className="font-mono-tabular shrink-0">{Math.round((r.right / r.total) * 100)}% right ({r.total})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
