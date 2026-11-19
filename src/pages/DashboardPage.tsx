import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeNextRankGap, getStudentLevel } from '../lib/leaderboard';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ms));
}

export function DashboardPage() {
  const {
    session,
    students,
    rankedStudents,
    logs,
    selectedSeasonId,
    navigate,
  } = useApp();

  const currentStudent = useMemo(
    () => (session ? students.find((s) => s.id === session.uid) : undefined),
    [session, students]
  );

  const rankedSelf = useMemo(
    () => (session ? rankedStudents.find((s) => s.id === session.uid) : undefined),
    [rankedStudents, session]
  );

  const rankGap = useMemo(
    () => (session ? computeNextRankGap(rankedStudents, session.uid) : null),
    [rankedStudents, session]
  );

  const myLogs = useMemo(() => {
    if (!session) return [];
    return logs
      .filter((l) => l.studentId === session.uid && (selectedSeasonId === 'all' || l.seasonId === selectedSeasonId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [logs, selectedSeasonId, session]);

  const isApproved = currentStudent?.approved ?? session?.approved ?? false;
  const myPoints = rankedSelf?.totalPoints ?? 0;
  const myLevel = getStudentLevel(myPoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {!session ? (
        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
          <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-8 text-center space-y-5">
            <h1 className="font-display text-2xl font-bold text-white">Student Dashboard</h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Sign in to track your live class rank, weekly point gains, and see how close you are to the next position.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/[0.12] transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </section>
        </main>
      ) : session.role === 'admin' ? (
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
          <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-8 space-y-4">
            <p className="text-xs font-medium text-indigo-300">Instructor Account</p>
            <h1 className="font-display text-2xl font-bold text-white">Welcome, {session.name}</h1>
            <p className="text-sm text-slate-400">
              You are signed in with Admin privileges. Manage student approvals, award points, record exam scores, and review the audit log from the Admin Panel.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer"
              >
                <span>Open Admin Panel</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={session.name} src={currentStudent?.photoUrl || session.photoUrl} size="lg" />
          <div>
            <p className="text-xs font-medium text-indigo-300">My Student Dashboard</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {session.name}
            </h1>
          </div>
        </div>
        {isApproved && (
          <button
            type="button"
            onClick={() => navigate(`/student/${session.uid}`)}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs sm:text-sm font-medium text-slate-100 hover:bg-white/[0.12] transition-colors cursor-pointer self-start sm:self-auto"
          >
            View Public Profile
          </button>
        )}
      </section>

      {!isApproved ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-2">
          <p className="text-xs font-semibold text-amber-300">Pending Approval</p>
          <h2 className="font-display text-lg font-bold text-white">
            Your account is awaiting admin review
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Once your instructor approves your signup, your profile will appear on the public leaderboard and you can track your points here.
          </p>
        </section>
      ) : (
        <>
          {/* Personal Stats Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-6">
              <p className="text-xs text-slate-400">Current Rank</p>
              <p className="font-mono-tabular text-3xl font-bold text-white mt-2">
                {rankedSelf ? `#${rankedSelf.rank}` : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-6">
              <p className="text-xs text-slate-400">Level {myLevel.level}</p>
              <p className="font-display text-2xl sm:text-3xl font-bold text-white mt-2 flex items-center gap-2">
                <span aria-hidden="true">{myLevel.icon}</span>
                <span>{myLevel.name}</span>
              </p>
              <p className="text-xs text-slate-400 font-mono-tabular mt-1.5">
                {myLevel.nextLevelPoints !== null
                  ? `${Math.max(0, myLevel.nextLevelPoints - myPoints)} pts to Level ${myLevel.level + 1}`
                  : 'Max level reached'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-6">
              <p className="text-xs text-slate-400">Total Points</p>
              <p className="text-3xl font-bold text-indigo-300 mt-2">
                <AnimatedNumber value={myPoints} suffix=" pts" />
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-6">
              <p className="text-xs text-slate-400">Points This Week</p>
              <p className="font-mono-tabular text-3xl font-bold text-emerald-400 mt-2">
                {(rankedSelf?.weeklyPoints ?? 0) >= 0
                  ? `+${rankedSelf?.weeklyPoints ?? 0}`
                  : rankedSelf?.weeklyPoints}{' '}
                pts
              </p>
            </div>
          </section>

          {/* Motivational Line */}
          {rankGap && (
            <section className="rounded-2xl border border-indigo-400/25 bg-indigo-500/[0.1] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm sm:text-base font-medium text-indigo-100">
                {rankGap.message}
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs sm:text-sm font-semibold text-indigo-300 hover:text-indigo-200 whitespace-nowrap cursor-pointer text-left"
              >
                Check Full Leaderboard →
              </button>
            </section>
          )}

          {/* My Points History Timeline */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold text-white">My Points History</h2>
            {myLogs.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/70 p-10 text-center text-sm text-slate-400">
                No points logged for this season yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 backdrop-blur-md p-5 sm:p-6">
                <ol className="relative border-l border-white/10 ml-3 space-y-6">
                  {myLogs.map((log) => {
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
                          <div>
                            <p className="text-sm sm:text-base font-semibold text-white">
                              {log.action}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              <span className="font-mono-tabular">{formatDate(log.createdAt)}</span>
                              {log.note ? ` · ${log.note}` : ''}
                            </p>
                          </div>
                          <span
                            className={`font-mono-tabular text-sm sm:text-base font-bold ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? `+${log.points} pts` : `${log.points} pts`}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </section>
        </>
      )}
        </main>
      )}
    </motion.div>
  );
}
