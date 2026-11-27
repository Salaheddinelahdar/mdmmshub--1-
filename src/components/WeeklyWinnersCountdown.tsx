import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { getCountdownParts } from '../lib/leaderboard';

interface WeeklyWinnersCountdownProps {
  remainingMs: number;
}

export function WeeklyWinnersCountdown({ remainingMs }: WeeklyWinnersCountdownProps) {
  const { days, hours, minutes, seconds } = getCountdownParts(remainingMs);

  const units = [
    { label: 'Days', value: String(days) },
    { label: 'Hours', value: String(hours).padStart(2, '0') },
    { label: 'Minutes', value: String(minutes).padStart(2, '0') },
    { label: 'Seconds', value: String(seconds).padStart(2, '0') },
  ];

  return (
    <motion.section
      key="weekly-winners-countdown"
      aria-label="First weekly winners reveal Countdown"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Countdown Card */}
      <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-6 sm:p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 shadow-sm">
          <Trophy className="h-7 w-7 text-(color:--c-accent-d)" strokeWidth={1.75} aria-hidden="true" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-(color:--c-ink) [text-wrap:balance]">
            First weekly winners reveal
          </h2>
          <p className="text-sm sm:text-base text-(color:--c-sub) leading-relaxed">
            Earn points this week to claim a spot in the first top 3
          </p>
        </div>

        {/* Live Countdown */}
        <div
          aria-live="off"
          data-testid="weekly-countdown"
          className="grid grid-cols-4 sm:inline-flex items-center justify-center gap-2 sm:gap-5 pt-1"
        >
          {units.map((unit, idx) => (
            <div key={unit.label} className="contents">
              <div className="flex flex-col items-center min-w-0 sm:min-w-[4.5rem]">
                <span className="font-mono-tabular text-3xl sm:text-5xl font-bold tracking-tight text-(color:--c-accent)">
                  {unit.value}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-(color:--c-muted) mt-1">
                  {unit.label}
                </span>
              </div>
              {idx < units.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden sm:inline-block text-2xl font-bold text-(color:--c-faint) -mt-5 select-none"
                >
                  ·
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-(color:--c-muted)">
          Reveals Monday at 00:01 (Morocco time · Africa/Casablanca)
        </p>
      </div>
    </motion.section>
  );
}
