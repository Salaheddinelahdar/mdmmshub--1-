import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Award, Rocket, Search, Trophy, X } from 'lucide-react';
import { LevelIcon } from '../components/LevelIcon';
import { HowItWorks } from '../components/HowItWorks';
import { HowToEarn } from '../components/HowToEarn';
import { WeeklyTop3 } from '../components/WeeklyTop3';
import { QuizBanner } from '../components/QuizBanner';
import { ShareLeaderboard } from '../components/ShareLeaderboard';

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 640;
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
  1: { ring: 'border-(color:--c-accent)/40 bg-(color:--c-surface)', glow: 'shadow-sm', label: '1st place', rankColor: 'text-(color:--c-accent)' },
  2: { ring: 'border-(color:--c-ink)/10 bg-(color:--c-surface)', glow: 'shadow-sm', label: '2nd place', rankColor: 'text-(color:--c-muted)' },
  3: { ring: 'border-(color:--c-ink)/10 bg-(color:--c-surface)', glow: 'shadow-sm', label: '3rd place', rankColor: 'text-(color:--c-bronze)' },
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
      <QuizBanner />
      {/* Header */}
      <section className="space-y-1.5 relative">
        <div className="sm:absolute sm:right-0 sm:top-0 pb-2 sm:pb-0">
          <ShareLeaderboard top={topThree} seasonName={activeSeason?.name ?? 'All time'} total={rankedStudents.length} />
        </div>
        <p className="text-sm text-(color:--c-muted)">
          Marketing Digital Cohort · {rankedStudents.length} active students
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-(color:--c-ink) [text-wrap:balance]">
          Class Leaderboard
        </h1>
        <p className="text-base text-(color:--c-muted) max-w-xl pt-1">See who is earning points this week. Every point is logged by your instructor and visible to the class.</p>
      </section>

      <HowItWorks />

      {loading ? (
        <LeaderboardSkeleton />
      ) : rankedStudents.length === 0 ? (
        /* Friendly Empty State */
        <section className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-6 py-16 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-(color:--c-accent)/20 bg-(color:--c-accent)/10 text-(color:--c-accent-d)">
            <Award className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-display text-2xl font-bold text-(color:--c-ink)">
              No students yet. Be the first.
            </h2>
            <p className="text-sm text-(color:--c-muted) leading-relaxed">
              Approved Marketing Digital students will appear here once an instructor approves their profile.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="rounded-xl bg-(color:--c-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer whitespace-nowrap"
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
                <WeeklyTop3 />

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
                          initial={{ opacity: 0, y: IS_MOBILE ? 0 : 18, scale: 1 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: IS_MOBILE ? 0.15 : 0.4,
                            delay: IS_MOBILE ? 0 : index * 0.5,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          onClick={() => navigate(`/student/${student.id}`)}
                          className={`group text-left rounded-xl border p-6 transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(color:--c-accent) ${style.ring} ${style.glow}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className={`font-mono-tabular text-2xl font-bold ${style.rankColor}`}>
                              #{student.rank}
                            </span>
                            <span className="text-xs font-medium text-(color:--c-muted)">
                              {style.label}
                              {isMvp ? ' · MVP' : ''}
                            </span>
                          </div>

                          <div className="mt-5 flex items-center gap-4">
                            <Avatar name={student.name} src={student.photoUrl} size="lg" />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-display text-lg font-bold text-(color:--c-ink) truncate group-hover:text-(color:--c-accent-d) transition-colors">
                                {student.name}
                              </h3>
                              <p className="text-xs text-(color:--c-sub) mt-0.5 flex items-center gap-1.5">
                                <LevelIcon level={level.level} />
                                <span>
                                  Level {level.level} · {level.name}
                                </span>
                              </p>
                              <p className="text-xs text-(color:--c-muted) mt-0.5 font-mono-tabular">
                                {student.weeklyPoints >= 0 ? `+${student.weeklyPoints}` : student.weeklyPoints} pts this week
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-(color:--c-ink)/[0.10] flex items-baseline justify-between">
                            <span className="text-xs text-(color:--c-muted)">Total Score</span>
                            <span className="text-2xl font-bold text-(color:--c-ink)">
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

          <HowToEarn />

          {/* Search Bar & Full Leaderboard List */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-(color:--c-ink)">
                {activeSeason ? `${activeSeason.name} Standings` : 'All-Time Standings'}
              </h2>
              <div className="relative w-full sm:w-80">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-(color:--c-muted)"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Search student by name"
                  placeholder="Search student by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) pl-10 pr-9 py-2.5 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-(color:--c-muted) hover:text-(color:--c-ink) cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-10 text-center space-y-3">
                <p className="text-sm text-(color:--c-sub)">
                  No students matched &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-lg border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-4 py-2 text-xs font-medium text-(color:--c-ink) hover:bg-(color:--c-ink)/[0.045] cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) overflow-hidden">
                <ul className="divide-y divide-(color:--c-ink)/[0.10]" data-testid="leaderboard-list">
                  {filteredStudents.map((student) => {
                    const isMvp = weeklyMvp?.id === student.id;
                    const level = getStudentLevel(student.totalPoints);
                    const rankHighlight =
                      student.rank === 1
                        ? 'text-(color:--c-amber)'
                        : student.rank === 2
                          ? 'text-(color:--c-ink2)'
                          : student.rank === 3
                            ? 'text-(color:--c-bronze)'
                            : 'text-(color:--c-muted)';

                    return (
                      <motion.li
                        key={student.id}
                        layout
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className={isMvp ? 'bg-(color:--c-accent)/[0.11]' : ''}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/student/${student.id}`)}
                          className="w-full flex items-center justify-between gap-4 px-4 sm:px-6 py-4 text-left hover:bg-(color:--c-ink)/[0.045] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(color:--c-accent)"
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
                                <span className="font-medium text-base text-(color:--c-ink) truncate">
                                  {student.name}
                                </span>
                                <span
                                  className="inline-flex items-center gap-1 rounded-md border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-2 py-0.5 text-xs font-medium text-(color:--c-sub) shrink-0"
                                  title={`Level ${level.level}: ${level.name}`}
                                >
                                  <LevelIcon level={level.level} />
                                  <span>{level.name}</span>
                                </span>
                                {isMvp && (
                                  <span title="Student of the week" className="text-(color:--c-accent-d) shrink-0" aria-label="Student of the week"><Rocket className="h-4 w-4" strokeWidth={1.75} /></span>
                                )}
                              </div>
                              <p className="text-xs text-(color:--c-muted) font-mono-tabular mt-0.5">
                                {student.weeklyPoints > 0
                                  ? `+${student.weeklyPoints} pts this week`
                                  : student.weeklyPoints < 0
                                    ? `${student.weeklyPoints} pts this week`
                                    : 'No points yet this week'}{' '}
                                · {student.logCount} {student.logCount === 1 ? 'entry' : 'entries'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-base sm:text-lg font-bold text-(color:--c-ink)">
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
                <h2 className="font-display text-xl font-bold text-(color:--c-ink)">Hall of Fame</h2>
                <p className="text-xs sm:text-sm text-(color:--c-muted)">
                  All-time top 3 podium leaders preserved from completed semesters.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {hallOfFame.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => navigate(`/student/${entry.studentId}`)}
                    className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-5 text-left hover:bg-(color:--c-surface) transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs text-(color:--c-muted)">
                      <span>{entry.seasonName}</span>
                      <span className="font-mono-tabular font-semibold text-(color:--c-amber)">
                        Rank #{entry.rank}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-3.5">
                      <Avatar name={entry.studentName} src={entry.photoUrl} size="md" />
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-(color:--c-ink) truncate">
                          {entry.studentName}
                        </p>
                        <p className="text-xs font-mono-tabular text-(color:--c-sub) mt-0.5">
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
