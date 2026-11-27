import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarX,
  ChevronDown,
  Clock,
  Crown,
  Flame,
  Handshake,
  Landmark,
  Mic,
  Sprout,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STUDENT_LEVELS, formatLevelRange } from '../lib/leaderboard';

interface RuleRow {
  id: string;
  Icon: LucideIcon;
  name: string;
  points: string;
  negative?: boolean;
}

const EARN: RuleRow[] = [
  { id: 'present', Icon: Mic, name: 'Present in front of class', points: '+15' },
  { id: 'attendance', Icon: CalendarCheck, name: '100% attendance this week', points: '+10' },
  { id: 'help', Icon: Handshake, name: 'Help a classmate', points: '+10' },
  { id: 'linkedin', Icon: Briefcase, name: 'LinkedIn completed and active', points: '+20 once' },
  { id: 'club', Icon: Landmark, name: 'Join a club', points: '+30 each' },
  { id: 'quiz', Icon: Zap, name: 'Quiz challenge: score out of 20, once a week', points: 'score × 10' },
];

const LOSE: RuleRow[] = [
  { id: 'absent', Icon: CalendarX, name: 'Absent without reason', points: '-5', negative: true },
  { id: 'late', Icon: Clock, name: 'Late submission', points: '-5', negative: true },
];

const LEVEL_ICONS: Record<number, LucideIcon> = { 1: Sprout, 2: BookOpen, 3: Zap, 4: Flame, 5: Crown };

const FAQ_ITEMS = [
  {
    id: 'proof',
    question: 'How do I send proof?',
    answer:
      'Use WhatsApp on the Contact page. Send a photo or screenshot and one line. Example: "Hi, I joined the Marketing Club. Here is my card. Sara B."',
  },
  {
    id: 'when',
    question: 'When do I see my points?',
    answer: 'The same day. Every change shows on your profile with the reason.',
  },
  {
    id: 'reset',
    question: 'Do points reset each semester?',
    answer: 'Yes. A new board starts each semester. The top 3 go to the Hall of Fame.',
  },
];

function Row({ item }: { item: RuleRow }) {
  const { Icon } = item;
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex items-center gap-3 min-w-0">
        <span
          aria-hidden="true"
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            item.negative ? 'bg-(color:--c-red)/10 text-(color:--c-red)' : 'bg-(color:--c-accent)/10 text-(color:--c-accent-d)'
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="text-sm sm:text-base text-(color:--c-ink)">{item.name}</span>
      </span>
      <span
        className={`rounded-md px-2 py-0.5 text-xs sm:text-sm font-semibold whitespace-nowrap ${
          item.negative ? 'bg-(color:--c-red)/10 text-(color:--c-red)' : 'bg-(color:--c-green)/10 text-(color:--c-green)'
        }`}
      >
        {item.points}
      </span>
    </li>
  );
}

export function RulesPage() {
  const { navigate } = useApp();
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <section className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl text-(color:--c-ink)">How points work</h1>
          <p className="text-base text-(color:--c-muted)">
            Your instructor adds the points. Each one shows on your profile with a reason.
          </p>
        </section>

        <section aria-labelledby="earn-heading" className="space-y-3">
          <h2 id="earn-heading" className="font-display text-xl text-(color:--c-ink)">
            Earn points
          </h2>
          <ul className="rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-surface) divide-y divide-(color:--c-ink)/10">
            {EARN.map((r) => (
              <Row key={r.id} item={r} />
            ))}
          </ul>
          <p className="text-sm text-(color:--c-muted)">
            Helping, LinkedIn and clubs need proof.{' '}
            <button type="button" onClick={() => navigate('/contact')} className="font-medium text-(color:--c-accent-d) hover:underline cursor-pointer">
              Send it on WhatsApp
            </button>
            .
          </p>
        </section>

        <section aria-labelledby="lose-heading" className="space-y-3">
          <h2 id="lose-heading" className="font-display text-xl text-(color:--c-ink)">
            Lose points
          </h2>
          <ul className="rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-surface) divide-y divide-(color:--c-ink)/10">
            {LOSE.map((r) => (
              <Row key={r.id} item={r} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="levels-heading" className="space-y-3">
          <h2 id="levels-heading" className="font-display text-xl text-(color:--c-ink)">
            Levels
          </h2>
          <ol className="grid grid-cols-5 gap-2 rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-surface) p-3 sm:p-4">
            {STUDENT_LEVELS.map((tier) => {
              const Icon = LEVEL_ICONS[tier.level];
              const compact = tier.nextLevelPoints === null ? `${tier.minPoints}+` : `${tier.minPoints}-${tier.nextLevelPoints - 1}`;
              return (
                <li key={tier.level} className="flex flex-col items-center text-center min-w-0 gap-1.5">
                  <span aria-hidden="true" className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-(color:--c-accent)/10 text-(color:--c-accent-d)">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-(color:--c-ink)">{tier.name}</span>
                  <span className="text-[10px] sm:text-xs text-(color:--c-muted) leading-tight">
                    <span className="sm:hidden">{compact}</span>
                    <span className="hidden sm:inline whitespace-nowrap">{formatLevelRange(tier)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="faq-heading" className="space-y-3">
          <h2 id="faq-heading" className="font-display text-xl text-(color:--c-ink)">
            Questions
          </h2>
          <div className="rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-surface) divide-y divide-(color:--c-ink)/10">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-(color:--c-page) transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-medium text-(color:--c-ink)">{item.question}</span>
                    <ChevronDown aria-hidden="true" className={`h-4 w-4 text-(color:--c-muted) shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <div className="px-4 pb-4 text-sm text-(color:--c-sub) leading-relaxed">{item.answer}</div>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-lg bg-(color:--c-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer"
          >
            View leaderboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="rounded-lg border border-(color:--c-ink)/15 px-5 py-2.5 text-sm font-medium text-(color:--c-ink) hover:bg-(color:--c-soft) transition-colors cursor-pointer"
          >
            Contact instructor
          </button>
        </section>
      </main>
    </motion.div>
  );
}
