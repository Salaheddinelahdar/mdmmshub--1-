import { Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';

export function WeeklyTop3() {
  const { rankedStudents, navigate } = useApp();
  const top = [...rankedStudents]
    .filter((s) => s.weeklyPoints > 0)
    .sort((a, b) => b.weeklyPoints - a.weeklyPoints || a.rank - b.rank)
    .slice(0, 3);

  return (
    <section aria-label="This week's top 3" className="rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-surface) p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl text-(color:--c-ink)">This week's top 3</h2>
        <p className="text-sm text-(color:--c-muted)">Most points gained in the last 7 days.</p>
      </div>
      {top.length === 0 ? (
        <p className="rounded-lg bg-(color:--c-page) px-4 py-6 text-center text-sm text-(color:--c-muted)">
          No points this week yet. Be the first on this list.
        </p>
      ) : (
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => navigate(`/student/${s.id}`)}
                className={`w-full text-left rounded-lg border p-4 flex items-center gap-3 cursor-pointer hover:bg-(color:--c-page) transition-colors ${
                  i === 0 ? 'border-(color:--c-accent)/40 bg-(color:--c-accent)/[0.06]' : 'border-(color:--c-ink)/10'
                }`}
              >
                <Avatar name={s.name} src={s.photoUrl} size="md" />
                <div className="min-w-0 flex-1">
                  {i === 0 && (
                    <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-(color:--c-accent-d) mb-0.5">
                      <Award className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> Student of the week
                    </p>
                  )}
                  <p className="font-medium text-(color:--c-ink) truncate">{s.name}</p>
                  <p className="text-xs text-(color:--c-muted)">#{i + 1} this week</p>
                </div>
                <span className="text-sm font-semibold text-(color:--c-green) whitespace-nowrap">+{s.weeklyPoints} pts</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
