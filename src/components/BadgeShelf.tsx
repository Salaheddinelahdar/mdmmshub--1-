import { useMemo } from 'react';
import { Award, Briefcase, CalendarCheck, Flame, Handshake, Landmark, Lock, Mic, Sprout, type LucideIcon } from 'lucide-react';
import type { PointLog } from '../types';
import { computeBadges, type BadgeId } from '../lib/badges';

const ICONS: Record<BadgeId, LucideIcon> = {
  first: Sprout,
  streak: Flame,
  presenter: Mic,
  helper: Handshake,
  linkedin: Briefcase,
  club: Landmark,
  contributor: Award,
};

export function BadgeShelf({ logs, title = 'Badges' }: { logs: PointLog[]; title?: string }) {
  const badges = useMemo(() => computeBadges(logs), [logs]);
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section aria-label={title} className="space-y-3" data-testid="badge-shelf">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl text-(color:--c-ink)">{title}</h2>
        <span className="text-xs text-(color:--c-muted)">{earned} of {badges.length} earned</span>
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {badges.map((b) => {
          const Icon = ICONS[b.id] ?? Award;
          return (
            <li
              key={b.id}
              title={b.earned ? b.label : `Locked: ${b.hint}`}
              className={`rounded-xl border p-3 flex flex-col items-start gap-2 ${
                b.earned ? 'border-(color:--c-accent)/30 bg-(color:--c-surface)' : 'border-(color:--c-ink)/10 bg-(color:--c-soft)/60'
              }`}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                  b.earned ? 'bg-(color:--c-accent)/10 text-(color:--c-accent-d)' : 'bg-(color:--c-ink)/5 text-(color:--c-faint)'
                }`}
              >
                {b.earned ? <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> : <Lock className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
              </span>
              <div>
                <p className={`text-sm font-medium ${b.earned ? 'text-(color:--c-ink)' : 'text-(color:--c-muted)'}`}>{b.label}</p>
                <p className="text-xs text-(color:--c-muted) leading-snug">{b.earned ? 'Earned' : b.hint}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
