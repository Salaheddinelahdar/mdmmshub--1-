import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Rocket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudentLevel, groupLogsByDay } from '../lib/leaderboard';
import { LevelIcon } from '../components/LevelIcon';
import { BadgeShelf } from '../components/BadgeShelf';
import { NextLevelBar } from '../components/NextLevelBar';
import { visibleNote } from '../lib/quiz';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';

export function StudentProfilePage({ studentId }: { studentId: string }) {
  const { students, rankedStudents, logs, selectedSeasonId, navigate, weeklyMvp, session } = useApp();
  // Quiz scores are private: only the student and the instructor see them.
  const canSeePrivate = !!session && (session.role === 'admin' || session.uid === studentId);

  const student = students.find((s) => s.id === studentId);
  const ranked = rankedStudents.find((s) => s.id === studentId);

  const studentLogs = useMemo(() => {
    return logs
      .filter((l) => l.studentId === studentId && (selectedSeasonId === 'all' || l.seasonId === selectedSeasonId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [logs, selectedSeasonId, studentId]);

  const groupedDays = useMemo(() => groupLogsByDay(studentLogs), [studentLogs]);

  const isMvp = student ? weeklyMvp?.id === student.id : false;
  const totalPoints = ranked?.totalPoints ?? 0;
  const weeklyPoints = ranked?.weeklyPoints ?? 0;
  const studentLevel = getStudentLevel(totalPoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {!student ? (
        <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
          <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-10 text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-(color:--c-ink)">Student Profile Not Found</h1>
            <p className="text-sm text-(color:--c-muted)">
              This student profile does not exist or has not been approved yet.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-xl bg-(color:--c-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Leaderboard</span>
            </button>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-10 space-y-8">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm font-medium text-(color:--c-muted) hover:text-(color:--c-ink) transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Leaderboard</span>
            </button>
          </div>

          {/* Full-width Hero */}
          <section className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-5 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <Avatar name={student.name} src={student.photoUrl} size="xl" />
              <div className="space-y-1 min-w-0">
                {isMvp && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-(color:--c-accent-d)"><Rocket className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> Weekly MVP</p>
                )}
                <h1 className="font-display text-xl sm:text-3xl font-bold text-(color:--c-ink) break-words">
                  {student.name}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-5 border-t border-(color:--c-ink)/[0.10] text-center sm:text-left">
              <div>
                <p className="font-mono-tabular text-xl sm:text-2xl font-bold text-(color:--c-ink) leading-tight">
                  {ranked ? `#${ranked.rank}` : '—'}
                </p>
                <p className="text-xs text-(color:--c-muted) mt-1">Rank</p>
              </div>
              <div>
                <p className="font-display text-lg sm:text-2xl font-bold text-(color:--c-ink) leading-tight flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap">
                  <LevelIcon level={studentLevel.level} className="h-5 w-5 text-(color:--c-accent-d)" />
                  <span>{studentLevel.name}</span>
                </p>
                <p className="text-xs text-(color:--c-muted) mt-1">Level</p>
              </div>
              <div>
                <p className="font-mono-tabular text-xl sm:text-2xl font-bold text-(color:--c-accent-d) leading-tight whitespace-nowrap">
                  <AnimatedNumber value={totalPoints} suffix=" pts" />
                </p>
                <p className="text-xs text-(color:--c-muted) mt-1">Total</p>
              </div>
              <div>
                <p className="font-mono-tabular text-xl sm:text-2xl font-bold text-(color:--c-green) leading-tight whitespace-nowrap">
                  +{Math.max(0, weeklyPoints)} pts
                </p>
                <p className="text-xs text-(color:--c-muted) mt-1">This Week</p>
              </div>
            </div>
            <NextLevelBar points={totalPoints} />
          </section>

          <BadgeShelf logs={studentLogs} />

          {/* Day-Grouped Points History */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold text-(color:--c-ink)">Points History</h2>
              <span className="text-xs font-mono-tabular text-(color:--c-muted)">
                {studentLogs.length} {studentLogs.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {groupedDays.length === 0 ? (
              <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-10 text-center text-sm text-(color:--c-muted)">
                No points yet. The first entry will show up here with the reason it was given.
              </div>
            ) : (
              <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) divide-y divide-(color:--c-ink)/[0.10]">
                {groupedDays.map((group) => (
                  <div key={group.dateKey} className="p-4 sm:p-5 space-y-2.5">
                    <p className="font-mono-tabular text-xs font-semibold text-(color:--c-muted)">
                      {group.dateLabel}
                    </p>
                    <ul className="space-y-2 pl-1">
                      {group.items.map((log) => {
                        const isPositive = log.points >= 0;
                        return (
                          <li
                            key={log.id}
                            className="flex items-start justify-between gap-3 text-sm sm:text-base"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span
                                aria-hidden="true"
                                className={`mt-2 h-2 w-2 rounded-full shrink-0 ${
                                  isPositive ? 'bg-(color:--c-green)' : 'bg-(color:--c-red)'
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-(color:--c-ink)">{log.action}</p>
                                <p className="text-xs text-(color:--c-muted) mt-0.5">
                                  {visibleNote(log, canSeePrivate) ? `Reason: ${visibleNote(log, canSeePrivate)}` : isPositive ? 'Added by your instructor' : 'Deducted by your instructor'}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`font-mono-tabular text-sm sm:text-base font-bold whitespace-nowrap shrink-0 ${
                                isPositive ? 'text-(color:--c-green)' : 'text-(color:--c-red)'
                              }`}
                            >
                              {isPositive ? `+${log.points} pts` : `${log.points} pts`}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </motion.div>
  );
}
