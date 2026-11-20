import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudentLevel, groupLogsByDay } from '../lib/leaderboard';
import { resizeAvatarFile } from '../lib/firebase';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { PointsProgressChart } from '../components/PointsProgressChart';

export function DashboardPage() {
  const {
    session,
    students,
    rankedStudents,
    logs,
    selectedSeasonId,
    navigate,
    updateOwnPhoto,
  } = useApp();

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const currentStudent = useMemo(
    () => (session ? students.find((s) => s.id === session.uid) : undefined),
    [session, students]
  );

  const rankedSelf = useMemo(
    () => (session ? rankedStudents.find((s) => s.id === session.uid) : undefined),
    [rankedStudents, session]
  );

  const myLogs = useMemo(() => {
    if (!session) return [];
    return logs
      .filter((l) => l.studentId === session.uid && (selectedSeasonId === 'all' || l.seasonId === selectedSeasonId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [logs, selectedSeasonId, session]);

  const groupedDays = useMemo(() => groupLogsByDay(myLogs), [myLogs]);

  const isApproved = currentStudent?.approved ?? session?.approved ?? false;
  const myPoints = rankedSelf?.totalPoints ?? 0;
  const weeklyPts = rankedSelf?.weeklyPoints ?? 0;
  const myLevel = getStudentLevel(myPoints);
  const activePhotoUrl = currentStudent?.photoUrl ?? session?.photoUrl ?? '';
  const displayName = currentStudent?.name || session?.name || 'Student';

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const resized = await resizeAvatarFile(file);
      const res = await updateOwnPhoto(resized);
      if (!res.ok) {
        setPhotoError(res.error || 'Could not update photo.');
      }
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to process image.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoError(null);
    setPhotoBusy(true);
    const res = await updateOwnPhoto('');
    setPhotoBusy(false);
    if (!res.ok) {
      setPhotoError(res.error || 'Could not remove photo.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {!session ? (
        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
          <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-8 text-center space-y-5">
            <h1 className="font-display text-2xl font-bold text-white">Student Profile</h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Sign in to track your live class rank, weekly point gains, and update your profile photo.
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
        <main className="mx-auto max-w-4xl px-4 sm:px-6 py-4 sm:py-6 space-y-5">
          {/* Compact Single Hero Card */}
          <div className="space-y-2">
            <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <label
                  htmlFor="profile-photo-upload"
                  className="relative group cursor-pointer rounded-full shrink-0 focus-within:ring-2 focus-within:ring-indigo-400"
                  aria-label="Change profile photo"
                  title="Change profile photo"
                >
                  <Avatar name={displayName} src={activePhotoUrl} size="lg" />
                  <span className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-indigo-500 border-2 border-[#11182E] flex items-center justify-center shadow">
                    <Camera className="h-3 w-3 text-white" aria-hidden="true" />
                  </span>
                  <input
                    id="profile-photo-upload"
                    type="file"
                    accept="image/*"
                    disabled={photoBusy}
                    onChange={handlePhotoChange}
                    className="sr-only"
                  />
                </label>

                <div className="min-w-0">
                  <h1 className="font-display text-lg sm:text-2xl font-bold text-white truncate">
                    {displayName}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <span aria-hidden="true">{myLevel.icon}</span>
                    <span>{myLevel.name}</span>
                    <span aria-hidden="true" className="text-slate-500">·</span>
                    <span className="text-slate-400">Level {myLevel.level}</span>
                  </p>
                </div>
              </div>

              {isApproved && (
                <div className="grid grid-cols-3 gap-2 pt-3.5 border-t border-white/[0.07] text-center">
                  <div>
                    <p className="font-mono-tabular text-lg sm:text-2xl font-bold text-white">
                      {rankedSelf ? `#${rankedSelf.rank}` : '—'}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Rank</p>
                  </div>
                  <div>
                    <p className="font-mono-tabular text-lg sm:text-2xl font-bold text-indigo-300">
                      <AnimatedNumber value={myPoints} suffix=" pts" />
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Total</p>
                  </div>
                  <div>
                    <p className="font-mono-tabular text-lg sm:text-2xl font-bold text-emerald-400">
                      +{Math.max(0, weeklyPts)} pts
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">This Week</p>
                  </div>
                </div>
              )}

              {photoError && (
                <p role="alert" className="text-xs text-rose-300">
                  {photoError}
                </p>
              )}
            </section>

            {/* Quiet links below hero card */}
            {(isApproved || activePhotoUrl) && (
              <div className="flex items-center justify-between gap-4 px-1 text-xs">
                {activePhotoUrl ? (
                  <button
                    type="button"
                    disabled={photoBusy}
                    onClick={handleRemovePhoto}
                    className="text-slate-400 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Remove photo
                  </button>
                ) : (
                  <span />
                )}
                {isApproved && (
                  <a
                    href={`/student/${session.uid}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/student/${session.uid}`);
                    }}
                    className="text-indigo-300 hover:text-indigo-200 font-medium underline underline-offset-4"
                  >
                    View Public Profile
                  </a>
                )}
              </div>
            )}
          </div>

          {!isApproved ? (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-1.5">
              <p className="text-xs font-semibold text-amber-300">Pending Approval</p>
              <h2 className="font-display text-base sm:text-lg font-bold text-white">
                Your account is awaiting admin review
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Once your instructor approves your signup, your profile will appear on the public leaderboard and you can track your points here.
              </p>
            </section>
          ) : (
            <>
              {/* Points Progress Chart */}
              <PointsProgressChart logs={myLogs} />

              {/* My Points History Grouped by Day */}
              <section className="space-y-3">
                <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                  My Points History
                </h2>
                {groupedDays.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/70 p-6 text-center text-xs sm:text-sm text-slate-400">
                    No points logged for this season yet.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md divide-y divide-white/[0.06]">
                    {groupedDays.map((group) => {
                      if (group.items.length === 1) {
                        const item = group.items[0];
                        const isPos = item.points >= 0;
                        return (
                          <div
                            key={group.dateKey}
                            className="px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                          >
                            <p className="min-w-0 text-slate-200">
                              <span className="font-mono-tabular text-slate-400">{group.dateLabel}</span>
                              <span aria-hidden="true" className="text-slate-500"> · </span>
                              <span className="font-medium text-white">{item.action}</span>
                            </p>
                            <span
                              className={`font-mono-tabular font-bold whitespace-nowrap shrink-0 ${
                                isPos ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isPos ? `+${item.points} pts` : `${item.points} pts`}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={group.dateKey} className="px-4 py-3 space-y-2 text-xs sm:text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono-tabular text-slate-400">{group.dateLabel}</span>
                            <span
                              className={`font-mono-tabular text-xs font-semibold ${
                                group.dayTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {group.dayTotal >= 0 ? `+${group.dayTotal} pts` : `${group.dayTotal} pts`}
                            </span>
                          </div>
                          <ul className="pl-3 border-l border-white/10 space-y-1.5">
                            {group.items.map((item) => {
                              const isPos = item.points >= 0;
                              return (
                                <li
                                  key={item.id}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <span className="text-slate-200">{item.action}</span>
                                  <span
                                    className={`font-mono-tabular font-semibold whitespace-nowrap shrink-0 ${
                                      isPos ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    {isPos ? `+${item.points} pts` : `${item.points} pts`}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
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
