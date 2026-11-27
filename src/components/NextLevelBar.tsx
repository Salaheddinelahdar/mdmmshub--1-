import { getStudentLevel, STUDENT_LEVELS } from '../lib/leaderboard';
import { LevelIcon } from './LevelIcon';

export function NextLevelBar({ points }: { points: number }) {
  const current = getStudentLevel(points);
  const next = STUDENT_LEVELS.find((l) => l.level === current.level + 1);

  if (!next) {
    return (
      <div className="rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-page) p-4 flex items-center gap-3">
        <LevelIcon level={5} className="h-5 w-5 text-(color:--c-accent)" />
        <p className="text-sm text-(color:--c-ink2)">You reached the top level. Keep it up.</p>
      </div>
    );
  }

  const span = next.minPoints - current.minPoints;
  const done = Math.min(Math.max(points - current.minPoints, 0), span);
  const pct = Math.round((done / span) * 100);
  const remaining = next.minPoints - points;

  return (
    <div className="rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-page) p-4 space-y-2.5" data-testid="next-level-bar">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-(color:--c-ink2)">
          <span className="font-semibold">{remaining} more {remaining === 1 ? 'point' : 'points'}</span> to reach {next.name}
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs text-(color:--c-muted) whitespace-nowrap">
          <LevelIcon level={current.level} />
          {current.name}
          <span aria-hidden="true">→</span>
          <LevelIcon level={next.level} />
          {next.name}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2 w-full rounded-full bg-(color:--c-ink)/10 overflow-hidden"
      >
        <div className="h-full rounded-full bg-(color:--c-accent)" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
