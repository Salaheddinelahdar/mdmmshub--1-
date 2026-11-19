import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Award, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  filterRankedStudents,
  getStudentLevel,
  getWeeklyWinnersRevealState,
} from '../lib/leaderboard';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { LeaderboardSkeleton } from '../components/Skeletons';
import { WeeklyWinnersCountdown } from '../components/WeeklyWinnersCountdown';

const PODIUM_STYLES: Record<1 | 2 | 3, { ring: string; glow: string; label: string; rankColor: string }> = {
  1: {
    ring: 'border-amber-400/35 bg-[#121933]/85',
    glow: 'shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]',
    label: '1st Place',
    rankColor: 'text-amber-300',
  },
  2: {
    ring: 'border-slate-300/30 bg-[#11182E]/80',
    glow: 'shadow-[0_0_36px_-12px_rgba(148,163,184,0.28)]',
    label: '2nd Place',
    rankColor: 'text-slate-200',
  },
  3: {
    ring: 'border-orange-500/30 bg-[#11182E]/80',
    glow: 'shadow-[0_0_36px_-12px_rgba(217,119,6,0.28)]',
    label: '3rd Place',
    rankColor: 'text-orange-300',
  },
};

export function LeaderboardPage() {
  const {
    loading,
    students,
    seasons,
    selectedSeasonId,
    rankedStudents,
    weeklyMvp,
    hallOfFame,
    navigate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [previewTargetMs] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = Number(params.get('revealInSec'));
    return Number.isFinite(sec) && sec > 0 ? Date.now() + sec * 1000 : null;
  });

  const revealState = useMemo(
    () => getWeeklyWinnersRevealState(students, nowMs),
    [students, nowMs]
  );

  const effectiveTargetMs = previewTargetMs ?? revealState.targetMs;
  const hasRevealed = previewTargetMs ? nowMs >= previewTargetMs : revealState.hasRevealed;
  const remainingMs = Math.max(0, effectiveTargetMs - nowMs);

  useEffect(() => {
    if (hasRevealed) return;
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [hasRevealed]);

  const filteredStudents = useMemo(
    () => filterRankedStudents(rankedStudents, searchQuery),
    [rankedStudents, searchQuery]
  );

  const activeSeason = seasons.find((s) => s.active) ?? seasons.find((s) => s.id === selectedSeasonId);
  const topThree = rankedStudents.slice(0, 3);
  const showPodium = !searchQuery.trim() && topThree.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <section className="space-y-1.5">
        <p className="text-xs font-medium tracking-wide text-indigo-300">
          Marketing Digital Cohort · {rankedStudents.length} Active Students
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
          Class Leaderboard
        </h1>
      </section>

      {loading ? (
        <LeaderboardSkeleton />
      ) : rankedStudents.length === 0 ? (
        /* Friendly Empty State */
        <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 backdrop-blur-md px-6 py-16 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
            <Award className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-display text-2xl font-bold text-white">
              No students yet, be the first!
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Approved Marketing Digital students will appear here once an instructor approves their profile or seeds the semester cohort.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign Up as Student
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Weekly Winners Section: Countdown Placeholder (Week 1) or Real Winners Reveal */}
          <AnimatePresence mode="wait">
            {!hasRevealed ? (
              <WeeklyWinnersCountdown key="countdown" remainingMs={remainingMs} />
            ) : (
              <motion.div
                key="winners-revealed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Weekly MVP Banner */}
                {weeklyMvp && (
                  <section
                    aria-label="Weekly MVP"
                    className="rounded-2xl border border-indigo-400/25 bg-indigo-500/[0.11] backdrop-blur-md p-5 sm:p-6 shadow-[0_0_40px_-14px_rgba(99,102,241,0.45)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar name={weeklyMvp.name} src={weeklyMvp.photoUrl} size="lg" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                            <span className="animate-rocket" aria-hidden="true">🚀</span>
                            <span>Weekly MVP · Top Mover This Week</span>
                          </div>
                          <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                            {weeklyMvp.name}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-300">
                            Gained{' '}
                            <span className="font-semibold text-emerald-400">
                              <span className="font-mono-tabular">+{weeklyMvp.weeklyPoints}</span> pts
                            </span>{' '}
                            in the last 7 days · Rank #{weeklyMvp.rank} overall
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/student/${weeklyMvp.id}`)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/20 px-4 py-2.5 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>View History</span>
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </section>
                )}

                {/* Top 3 Podium (sequential 0.5s reveal: Gold #1 -> Silver #2 -> Bronze #3) */}
                {showPodium && (
                  <section aria-label="Top 3 Podium" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topThree.map((student, index) => {
                      const rankKey = student.rank as 1 | 2 | 3;
                      const style = PODIUM_STYLES[rankKey] ?? PODIUM_STYLES[3];
                      const isMvp = weeklyMvp?.id === student.id;
                      const level = getStudentLevel(student.totalPoints);
                      return (
                        <motion.button
                          key={student.id}
                          type="button"
                          initial={{ opacity: 0, y: 18, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.5,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          onClick={() => navigate(`/student/${student.id}`)}
                          className={`group text-left rounded-2xl border backdrop-blur-md p-6 transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${style.ring} ${style.glow}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className={`font-mono-tabular text-2xl font-bold ${style.rankColor}`}>
                              #{student.rank}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                              {style.label}
                              {isMvp ? ' · 🚀 MVP' : ''}
                            </span>
                          </div>

                          <div className="mt-5 flex items-center gap-4">
                            <Avatar name={student.name} src={student.photoUrl} size="lg" />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-display text-lg font-bold text-white truncate group-hover:text-indigo-200 transition-colors">
                                {student.name}
                              </h3>
                              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                                <span aria-hidden="true">{level.icon}</span>
                                <span>
                                  Level {level.level} · {level.name}
                                </span>
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 font-mono-tabular">
                                {student.weeklyPoints >= 0 ? `+${student.weeklyPoints}` : student.weeklyPoints} pts this week
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-white/[0.07] flex items-baseline justify-between">
                            <span className="text-xs text-slate-400">Total Score</span>
                            <span className="text-2xl font-bold text-white">
                              <AnimatedNumber value={student.totalPoints} suffix=" pts" />
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </section>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Bar & Full Leaderboard List */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-white">
                {activeSeason ? `${activeSeason.name} Standings` : 'All-Time Standings'}
              </h2>
              <div className="relative w-full sm:w-80">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Search student by name"
                  placeholder="Search student by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#11182E]/85 pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/70 p-10 text-center space-y-3">
                <p className="text-sm text-slate-300">
                  No students matched &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white hover:bg-white/[0.12] cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 backdrop-blur-md overflow-hidden">
                <ul className="divide-y divide-white/[0.06]" data-testid="leaderboard-list">
                  {filteredStudents.map((student) => {
                    const isMvp = weeklyMvp?.id === student.id;
                    const level = getStudentLevel(student.totalPoints);
                    const rankHighlight =
                      student.rank === 1
                        ? 'text-amber-300'
                        : student.rank === 2
                          ? 'text-slate-200'
                          : student.rank === 3
                            ? 'text-orange-300'
                            : 'text-slate-400';

                    return (
                      <motion.li
                        key={student.id}
                        layout
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className={isMvp ? 'bg-indigo-500/[0.11]' : ''}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/student/${student.id}`)}
                          className="w-full flex items-center justify-between gap-4 px-4 sm:px-6 py-4 text-left hover:bg-white/[0.04] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                        >
                          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                            <span
                              className={`font-mono-tabular text-lg sm:text-xl font-bold w-9 sm:w-10 shrink-0 ${rankHighlight}`}
                            >
                              #{student.rank}
                            </span>
                            <Avatar name={student.name} src={student.photoUrl} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-base text-white truncate">
                                  {student.name}
                                </span>
                                <span
                                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-slate-300 shrink-0"
                                  title={`Level ${level.level}: ${level.name}`}
                                >
                                  <span aria-hidden="true">{level.icon}</span>
                                  <span>{level.name}</span>
                                </span>
                                {isMvp && (
                                  <span
                                    title="Weekly MVP"
                                    className="animate-rocket text-base shrink-0"
                                    aria-label="Weekly MVP"
                                  >
                                    🚀
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-mono-tabular mt-0.5">
                                {student.weeklyPoints > 0
                                  ? `+${student.weeklyPoints} pts this week`
                                  : student.weeklyPoints < 0
                                    ? `${student.weeklyPoints} pts this week`
                                    : 'No change this week'}{' '}
                                · {student.logCount} {student.logCount === 1 ? 'entry' : 'entries'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-base sm:text-lg font-bold text-white">
                              <AnimatedNumber value={student.totalPoints} suffix=" pts" />
                            </div>
                          </div>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* Hall of Fame (Archived Seasons Top 3) */}
          {hallOfFame.length > 0 && (
            <section aria-label="Hall of Fame" className="pt-4 space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold text-white">Hall of Fame</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  All-time top 3 podium leaders preserved from completed semesters.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {hallOfFame.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => navigate(`/student/${entry.studentId}`)}
                    className="rounded-2xl border border-white/[0.08] bg-[#11182E]/65 p-5 text-left hover:bg-[#11182E]/90 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{entry.seasonName}</span>
                      <span className="font-mono-tabular font-semibold text-amber-300">
                        Rank #{entry.rank}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-3.5">
                      <Avatar name={entry.studentName} src={entry.photoUrl} size="md" />
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-white truncate">
                          {entry.studentName}
                        </p>
                        <p className="text-xs font-mono-tabular text-slate-300 mt-0.5">
                          {entry.totalPoints} pts
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      </main>
    </motion.div>
  );
}
