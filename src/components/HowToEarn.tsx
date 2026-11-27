import { CalendarCheck, Handshake, Mic } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ITEMS = [
  { Icon: Mic, name: 'Present in class', points: '+15' },
  { Icon: CalendarCheck, name: '100% attendance this week', points: '+10' },
  { Icon: Handshake, name: 'Help a classmate', points: '+10' },
];

export function HowToEarn() {
  const { navigate } = useApp();
  return (
    <section aria-label="How to earn points" className="rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-surface) p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="font-display text-lg text-(color:--c-ink)">Earn your first points</h2>
        <button
          type="button"
          onClick={() => navigate('/rules')}
          className="text-sm font-medium text-(color:--c-accent-d) hover:underline cursor-pointer"
        >
          See all rules
        </button>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ITEMS.map(({ Icon, name, points }) => (
          <li key={name} className="flex items-center justify-between gap-3 rounded-lg bg-(color:--c-page) px-4 py-3">
            <span className="flex items-center gap-2.5 text-sm text-(color:--c-ink2)">
              <Icon className="h-4 w-4 text-(color:--c-accent-d)" strokeWidth={1.75} aria-hidden="true" />
              {name}
            </span>
            <span className="text-sm font-semibold text-(color:--c-green)">{points}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
