import { useApp } from '../context/AppContext';
import { countdown, useQuizzes } from '../lib/useQuizzes';

export function QuizBanner() {
  const { navigate, session } = useApp();
  const { openQuiz, now } = useQuizzes();
  if (!openQuiz || session?.role === 'admin') return null;
  return (
    <section
      aria-label="Weekly quiz is open"
      className="rounded-xl border border-(color:--c-accent)/35 bg-(color:--c-accent)/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div>
        <p className="font-display text-lg text-(color:--c-ink)">Weekly Quiz is open</p>
        <p className="text-sm text-(color:--c-sub)">
          {openQuiz.title}. Closes in <strong className="font-mono-tabular">{countdown(openQuiz.closesAt - now)}</strong>
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/quiz')}
        className="rounded-xl bg-(color:--c-accent) px-5 py-3 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer min-h-12"
      >
        Take the quiz
      </button>
    </section>
  );
}
