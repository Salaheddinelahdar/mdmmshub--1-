import { motion } from 'motion/react';
import { Award, MinusCircle, PlusCircle } from 'lucide-react';
import {
  POINT_ACTIONS,
  STUDENT_LEVELS,
  categorizePointActions,
  formatLevelRange,
} from '../lib/leaderboard';
import type { PointActionDefinition } from '../types';

function getFriendlyHint(action: PointActionDefinition): string | null {
  switch (action.frequency) {
    case 'once_per_student':
      return 'One-time bonus';
    case 'once_per_club':
      return 'Once per club';
    case 'per_exam':
      return 'Your exam grade (/20) × 10';
    case 'manual':
      return 'Custom instructor bonus or deduction';
    default:
      return null;
  }
}

export function RulesPage() {
  const { earning, penalties, manual } = categorizePointActions(POINT_ACTIONS);
  const penaltiesAndExtras = [...penalties, ...manual];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Friendly Header */}
        <section className="space-y-1.5 max-w-3xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            How Points Work
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Points are awarded by your instructor. Every action is logged and visible on your public profile.
          </p>
        </section>

        {/* Compact Two-Column Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Card 1: Ways to Earn */}
          <article className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 backdrop-blur-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                <PlusCircle className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                Ways to Earn
              </h2>
            </div>

            <ul className="divide-y divide-white/[0.06]">
              {earning.map((action) => {
                const hint = getFriendlyHint(action);
                return (
                  <li
                    key={action.id}
                    className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{action.label}</p>
                      {hint && (
                        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
                      )}
                    </div>
                    <span className="font-mono-tabular text-sm font-bold text-emerald-400 whitespace-nowrap shrink-0">
                      {action.frequency === 'per_exam' ? 'score × 10' : `+${action.points} pts`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </article>

          {/* Right Column: Penalties & Student Levels */}
          <div className="space-y-5">
            {/* Card 2: Penalties & Adjustments */}
            <article className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 backdrop-blur-md p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-300">
                  <MinusCircle className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                  Penalties &amp; Adjustments
                </h2>
              </div>

              <ul className="divide-y divide-white/[0.06]">
                {penaltiesAndExtras.map((action) => {
                  const isManual = action.frequency === 'manual';
                  const hint = getFriendlyHint(action);
                  return (
                    <li
                      key={action.id}
                      className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{action.label}</p>
                        {hint && (
                          <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
                        )}
                      </div>
                      <span
                        className={`font-mono-tabular text-sm font-bold whitespace-nowrap shrink-0 ${
                          isManual ? 'text-indigo-300' : 'text-rose-400'
                        }`}
                      >
                        {isManual ? 'Custom' : `${action.points} pts`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>

            {/* Card 3: Student Levels */}
            <article className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 backdrop-blur-md p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-300">
                  <Award className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                    Student Levels
                  </h2>
                  <p className="text-xs text-slate-400">Unlocked automatically as you earn points</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-white/[0.06] text-sm">
                  {STUDENT_LEVELS.map((tier) => (
                    <tr key={tier.level}>
                      <td className="py-2.5 pr-3 font-medium text-white whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden="true">{tier.icon}</span>
                          <span>{tier.name}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-400 whitespace-nowrap">
                        Level {tier.level}
                      </td>
                      <td className="py-2.5 pl-3 font-mono-tabular text-right text-slate-200 whitespace-nowrap">
                        {formatLevelRange(tier)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
