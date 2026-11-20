import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CalendarX, ChevronDown, Clock, type LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STUDENT_LEVELS, formatLevelRange } from '../lib/leaderboard';

interface ClaimActionItem {
  id: string;
  icon: string;
  name: string;
  howToClaim: string;
  points: string;
}

interface PenaltyItem {
  id: string;
  Icon: LucideIcon;
  name: string;
  points: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const CLAIM_ACTIONS: ClaimActionItem[] = [
  {
    id: 'present_class',
    icon: '🎤',
    name: 'Present in front of class',
    howToClaim: 'Instructor logs it automatically',
    points: '+15',
  },
  {
    id: 'weekly_attendance',
    icon: '📅',
    name: '100% attendance that week',
    howToClaim: 'Logged every week',
    points: '+10',
  },
  {
    id: 'help_classmate',
    icon: '🤝',
    name: 'Help a classmate',
    howToClaim: 'Send proof via WhatsApp',
    points: '+10',
  },
  {
    id: 'linkedin_complete',
    icon: '💼',
    name: 'LinkedIn completed & active',
    howToClaim: 'Send profile link via WhatsApp',
    points: '+20 one-time',
  },
  {
    id: 'joined_club',
    icon: '🏛️',
    name: 'Joined a club',
    howToClaim: 'Send membership proof via WhatsApp',
    points: '+30 per club',
  },
  {
    id: 'exam_score',
    icon: '📝',
    name: 'Exam score',
    howToClaim: 'Logged after results released',
    points: 'score × 10',
  },
];

const PENALTY_ACTIONS: PenaltyItem[] = [
  {
    id: 'absent_unexcused',
    Icon: CalendarX,
    name: 'Absent without reason',
    points: '-5',
  },
  {
    id: 'late_submission',
    Icon: Clock,
    name: 'Late submission',
    points: '-5',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'updated',
    question: 'When are points updated?',
    answer: 'After each class or activity, same day',
  },
  {
    id: 'proof',
    question: 'How do I send proof?',
    answer: 'Via WhatsApp on the Contact page',
  },
  {
    id: 'reset',
    question: 'Do points reset each semester?',
    answer: 'Yes, top 3 go to Hall of Fame',
  },
];

export function RulesPage() {
  const { navigate } = useApp();
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        {/* Header */}
        <section className="space-y-2 max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            How Points Work
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Points are awarded by your instructor. Every action is logged and visible on your public profile.
          </p>
        </section>

        {/* Section 1 — How to Claim */}
        <section aria-labelledby="how-to-claim-heading" className="space-y-4">
          <h2 id="how-to-claim-heading" className="font-display text-xl font-bold text-white">
            How to Claim
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLAIM_ACTIONS.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xl"
                  >
                    {item.icon}
                  </span>
                  <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono-tabular text-xs font-bold text-emerald-300 whitespace-nowrap shrink-0">
                    {item.points}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-semibold text-white">
                    {item.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.howToClaim}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section 2 — Penalties */}
        <section aria-labelledby="penalties-heading" className="space-y-4">
          <h2 id="penalties-heading" className="font-display text-xl font-bold text-white">
            Penalties
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PENALTY_ACTIONS.map((item) => {
              const Icon = item.Icon;
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/10"
                    >
                      <Icon className="h-5 w-5 text-[#EF4444]" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-base font-semibold text-white">
                      {item.name}
                    </h3>
                  </div>
                  <span className="rounded-lg bg-[#EF4444]/15 px-2.5 py-1 font-mono-tabular text-sm font-bold text-[#EF4444] whitespace-nowrap shrink-0">
                    {item.points}
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        {/* Section 3 — Levels (horizontal visual progress bar) */}
        <section aria-labelledby="levels-heading" className="space-y-4">
          <h2 id="levels-heading" className="font-display text-xl font-bold text-white">
            Levels
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-4 sm:p-6">
            <div className="relative">
              {/* Continuous horizontal track behind milestone nodes */}
              <div
                aria-hidden="true"
                className="absolute top-[12px] sm:top-[13px] left-[9%] right-[7%] sm:left-[8%] sm:right-[6%] h-1 rounded-full bg-gradient-to-r from-emerald-500/70 via-indigo-500/75 to-amber-400/85"
              />
              <ArrowRight
                aria-hidden="true"
                className="hidden sm:block absolute top-[5px] right-[3%] h-5 w-5 text-amber-400"
              />

              <ol className="relative grid grid-cols-5 gap-1 sm:gap-3">
                {STUDENT_LEVELS.map((tier) => {
                  const fullRange = formatLevelRange(tier);
                  const compactNumbers =
                    tier.nextLevelPoints === null
                      ? `${tier.minPoints}+`
                      : `${tier.minPoints}–${tier.nextLevelPoints - 1}`;
                  return (
                    <li key={tier.level} className="flex flex-col items-center text-center min-w-0">
                      <span className="relative z-10 inline-flex items-center justify-center rounded-lg border border-white/15 bg-[#0A0F1E] px-1.5 sm:px-2 py-1 font-mono-tabular text-[10px] sm:text-xs font-bold text-indigo-200 shadow-sm">
                        {tier.minPoints}
                      </span>
                      <span aria-hidden="true" className="mt-2.5 sm:mt-3 text-lg sm:text-2xl leading-none">
                        {tier.icon}
                      </span>
                      <span className="mt-1.5 font-display text-[11px] sm:text-sm font-semibold text-white">
                        {tier.name}
                      </span>
                      <span className="mt-0.5 font-mono-tabular text-[10px] sm:text-xs text-slate-400 leading-tight">
                        <span className="sm:hidden">
                          {compactNumbers}
                          <br />
                          pts
                        </span>
                        <span className="hidden sm:inline whitespace-nowrap">{fullRange}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* Section 4 — FAQ (accordion) */}
        <section aria-labelledby="faq-heading" className="space-y-4">
          <h2 id="faq-heading" className="font-display text-xl font-bold text-white">
            FAQ
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md divide-y divide-white/[0.07]">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <span className="font-display text-sm sm:text-base font-semibold text-white">
                      {item.question}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-300' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-slate-300 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Actions */}
        <section className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            View Leaderboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/[0.12] transition-colors whitespace-nowrap cursor-pointer"
          >
            Contact Instructor
          </button>
        </section>
      </main>
    </motion.div>
  );
}
