import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudentLevel } from '../lib/leaderboard';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ms));
}

export function StudentProfilePage({ studentId }: { studentId: string }) {
  const { students, rankedStudents, logs, selectedSeasonId, navigate, weeklyMvp } = useApp();

  const student = students.find((s) => s.id === studentId);
  const ranked = rankedStudents.find((s) => s.id === studentId);

  const studentLogs = useMemo(() => {
    return logs
      .filter((l) => l.studentId === studentId && (selectedSeasonId === 'all' || l.seasonId === selectedSeasonId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [logs, selectedSeasonId, studentId]);

  const isMvp = student ? weeklyMvp?.id === student.id : false;
  const studentLevel = getStudentLevel(ranked?.totalPoints ?? 0);

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
      <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-6 sm:p-8 shadow-[0_0_50px_-20px_rgba(99,102,241,0.35)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar name={student.name} src={student.photoUrl} size="xl" />
            <div className="space-y-1.5">
              {isMvp && (
                <p className="text-xs font-semibold text-indigo-200">🚀 Weekly MVP</p>
              )}
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {student.name}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-8 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/[0.07]">
            <div>
              <p className="text-xs text-slate-400">Class Rank</p>
              <p className="font-mono-tabular text-2xl sm:text-3xl font-bold text-white mt-0.5">
                {ranked ? `#${ranked.rank}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Level {studentLevel.level}</p>
              <p className="font-display text-lg sm:text-2xl font-bold text-white mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                <span aria-hidden="true">{studentLevel.icon}</span>
                <span>{studentLevel.name}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Points</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-300 mt-0.5">
                <AnimatedNumber value={ranked?.totalPoints ?? 0} suffix=" pts" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Points History Timeline */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold text-white">Points History</h2>
          <span className="text-xs font-mono-tabular text-slate-400">
            {studentLogs.length} {studentLogs.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {studentLogs.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/70 p-10 text-center text-sm text-slate-400">
            No point entries recorded yet for this season.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 backdrop-blur-md p-5 sm:p-6">
            <ol className="relative border-l border-white/10 ml-3 space-y-6">
              {studentLogs.map((log) => {
                const isPositive = log.points >= 0;
                return (
                  <li key={log.id} className="pl-6 relative">
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#0A0F1E] ${
                        isPositive ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm sm:text-base font-semibold text-white">
                          {log.action}
                        </p>
                        <p className="text-xs text-slate-400">
                          <span className="font-mono-tabular">{formatDate(log.createdAt)}</span>
                          {log.note ? (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="text-slate-300">{log.note}</span>
                            </>
                          ) : null}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`font-mono-tabular text-sm sm:text-base font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? `+${log.points} pts` : `${log.points} pts`}{' '}
                          <span className="text-xs font-normal text-slate-400">
                            ({isPositive ? 'Earned' : 'Penalty'})
                          </span>
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
        </main>
      )}
    </motion.div>
  );
}
