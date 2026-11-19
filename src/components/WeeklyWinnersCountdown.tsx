import { motion } from 'motion/react';
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
      aria-label="First Weekly Winners Reveal Countdown"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Countdown Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 backdrop-blur-md p-6 sm:p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-500/10 shadow-[0_0_32px_-4px_rgba(245,158,11,0.45)]">
          <span className="text-3xl leading-none" aria-hidden="true">
            🏆
          </span>
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
            First Weekly Winners Reveal
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Earn points this week to claim your spot in the first Top 3 reveal
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
                <span className="font-mono-tabular text-3xl sm:text-5xl font-bold tracking-tight text-[#6366F1]">
                  {unit.value}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1">
                  {unit.label}
                </span>
              </div>
              {idx < units.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden sm:inline-block text-2xl font-bold text-slate-600 -mt-5 select-none"
                >
                  ·
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          Reveals Monday at 00:01 (Morocco time · Africa/Casablanca)
        </p>
      </div>
    </motion.section>
  );
}
