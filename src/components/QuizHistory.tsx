import { useQuizzes } from '../lib/useQuizzes';

export function QuizHistory() {
  const { quizzes, attempts } = useQuizzes();
  const rows = quizzes
    .map((q) => ({ q, a: attempts[q.id] }))
    .filter((r) => r.a && r.a.status === 'submitted')
    .sort((x, y) => (y.a!.submittedAt ?? 0) - (x.a!.submittedAt ?? 0));
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg sm:text-xl font-bold text-(color:--c-ink)">Quiz History</h2>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-6 text-center text-xs sm:text-sm text-(color:--c-muted)">
          No quiz taken yet.
        </div>
      ) : (
        <ul className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) divide-y divide-(color:--c-ink)/[0.10]">
          {rows.map(({ q, a }) => (
            <li key={q.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-(color:--c-ink) truncate">{q.title}</p>
                <p className="text-xs text-(color:--c-muted)">
                  {a!.submittedAt ? new Date(a!.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </p>
              </div>
              <p className="font-mono-tabular shrink-0 text-(color:--c-ink)">
                +{a!.points ?? 0} pts
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
