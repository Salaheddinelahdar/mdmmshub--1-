import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudentLevel, groupLogsByDay } from '../lib/leaderboard';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';

export function StudentProfilePage({ studentId }: { studentId: string }) {
  const { students, rankedStudents, logs, selectedSeasonId, navigate, weeklyMvp } = useApp();

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
          <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 p-10 text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-white">Student Profile Not Found</h1>
            <p className="text-sm text-slate-400">
              This student profile does not exist or has not been approved yet.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Leaderboard</span>
            </button>
          </div>

          {/* Full-width Hero */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-5 sm:p-7 shadow-[0_0_50px_-20px_rgba(99,102,241,0.35)] space-y-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <Avatar name={student.name} src={student.photoUrl} size="xl" />
              <div className="space-y-1 min-w-0">
                {isMvp && (
                  <p className="text-xs font-semibold text-indigo-200">🚀 Weekly MVP</p>
                )}
                <h1 className="font-display text-xl sm:text-3xl font-bold text-white break-words">
                  {student.name}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-5 border-t border-white/[0.07] text-center sm:text-left">
              <div>
                <p className="font-mono-tabular text-xl sm:text-2xl font-bold text-white leading-tight">
                  {ranked ? `#${ranked.rank}` : '—'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Rank</p>
              </div>
              <div>
                <p className="font-display text-lg sm:text-2xl font-bold text-white leading-tight flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap">
                  <span aria-hidden="true">{studentLevel.icon}</span>
                  <span>{studentLevel.name}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Level</p>
              </div>
              <div>
                <p className="font-mono-tabular text-xl sm:text-2xl font-bold text-indigo-300 leading-tight whitespace-nowrap">
                  <AnimatedNumber value={totalPoints} suffix=" pts" />
                </p>
                <p className="text-xs text-slate-400 mt-1">Total</p>
              </div>
              <div>
                <p className="font-mono-tabular text-xl sm:text-2xl font-bold text-emerald-400 leading-tight whitespace-nowrap">
                  +{Math.max(0, weeklyPoints)} pts
                </p>
                <p className="text-xs text-slate-400 mt-1">This Week</p>
              </div>
            </div>
          </section>

          {/* Day-Grouped Points History */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold text-white">Points History</h2>
              <span className="text-xs font-mono-tabular text-slate-400">
                {studentLogs.length} {studentLogs.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {groupedDays.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/70 p-10 text-center text-sm text-slate-400">
                No point entries recorded yet for this season.
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 backdrop-blur-md divide-y divide-white/[0.06]">
                {groupedDays.map((group) => (
                  <div key={group.dateKey} className="p-4 sm:p-5 space-y-2.5">
                    <p className="font-mono-tabular text-xs font-semibold text-slate-400">
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
                                  isPositive ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              <div className="min-w-0">
                                <span className="font-medium text-white">{log.action}</span>
                                {log.note ? (
                                  <span className="text-xs text-slate-400 ml-2">
                                    · {log.note}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <span
                              className={`font-mono-tabular text-sm sm:text-base font-bold whitespace-nowrap shrink-0 ${
                                isPositive ? 'text-emerald-400' : 'text-rose-400'
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
