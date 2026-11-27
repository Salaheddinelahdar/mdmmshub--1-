import React, { useMemo, useState } from 'react';
import { visibleNote } from '../lib/quiz';
import { motion } from 'motion/react';
import { ArrowRight, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudentLevel, groupLogsByDay } from '../lib/leaderboard';
import { resizeAvatarFile } from '../lib/firebase';
import { LevelIcon } from '../components/LevelIcon';
import { NextLevelBar } from '../components/NextLevelBar';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { BadgeShelf } from '../components/BadgeShelf';
import { QuizHistory } from '../components/QuizHistory';
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
          <section className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-8 text-center space-y-5">
            <h1 className="font-display text-2xl font-bold text-(color:--c-ink)">Student Profile</h1>
            <p className="text-sm text-(color:--c-muted) max-w-md mx-auto leading-relaxed">
              Sign in to track your live class rank, weekly point gains, and update your profile photo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl bg-(color:--c-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-5 py-2.5 text-sm font-medium text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.045] transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </section>
        </main>
      ) : session.role === 'admin' ? (
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
          <section className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-8 space-y-4">
            <p className="text-xs font-medium text-(color:--c-accent-d)">Instructor Account</p>
            <h1 className="font-display text-2xl font-bold text-(color:--c-ink)">Welcome, {session.name}</h1>
            <p className="text-sm text-(color:--c-muted)">
              You are signed in with Admin privileges. Manage student approvals, award points, and review the audit log from the Admin Panel.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-2 rounded-xl bg-(color:--c-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer"
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
            <section className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-4 sm:p-5 space-y-4">
              {isApproved && (
                <div className="flex items-end justify-between gap-3 pb-4 border-b border-(color:--c-ink)/[0.10]" data-testid="rank-hero">
                  <div>
                    <p className="text-xs text-(color:--c-muted) mb-1">Your rank</p>
                    <p className="font-display text-5xl sm:text-6xl leading-none text-(color:--c-ink)">
                      {rankedSelf ? `#${rankedSelf.rank}` : '—'}
                      <span className="ml-2 text-base sm:text-lg text-(color:--c-muted) font-sans">of {rankedStudents.length}</span>
                    </p>
                  </div>
                  <p className="text-right text-sm text-(color:--c-sub)">
                    <span className="font-semibold text-(color:--c-accent-d)">{myPoints} pts</span>
                    <span className="block text-xs text-(color:--c-green)">+{Math.max(0, weeklyPts)} this week</span>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3.5 sm:gap-4">
                <label
                  htmlFor="profile-photo-upload"
                  className="relative group cursor-pointer rounded-full shrink-0 focus-within:ring-2 focus-within:ring-(color:--c-accent)"
                  aria-label="Change profile photo"
                  title="Change profile photo"
                >
                  <Avatar name={displayName} src={activePhotoUrl} size="lg" />
                  <span className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-(color:--c-accent) border-2 border-(color:--c-surface) flex items-center justify-center shadow">
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
                  <h1 className="font-display text-lg sm:text-2xl font-bold text-(color:--c-ink) truncate">
                    {displayName}
                  </h1>
                  <p className="text-xs sm:text-sm text-(color:--c-sub) mt-0.5 flex items-center gap-1.5">
                    <LevelIcon level={myLevel.level} />
                    <span>{myLevel.name}</span>
                    <span aria-hidden="true" className="text-(color:--c-faint)">·</span>
                    <span className="text-(color:--c-muted)">Level {myLevel.level}</span>
                  </p>
                </div>
              </div>

              {isApproved && <NextLevelBar points={myPoints} />}

              {photoError && (
                <p role="alert" className="text-xs text-(color:--c-red)">
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
                    className="text-(color:--c-muted) hover:text-(color:--c-red) transition-colors cursor-pointer disabled:opacity-50"
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
                    className="text-(color:--c-accent-d) hover:text-(color:--c-accent-d) font-medium underline underline-offset-4"
                  >
                    View Public Profile
                  </a>
                )}
              </div>
            )}
          </div>

          {!isApproved ? (
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-1.5">
              <p className="text-xs font-semibold text-(color:--c-amber)">Pending Approval</p>
              <h2 className="font-display text-base sm:text-lg font-bold text-(color:--c-ink)">
                Your account is awaiting admin review
              </h2>
              <p className="text-xs sm:text-sm text-(color:--c-sub) leading-relaxed">
                Once your instructor approves your signup, your profile will appear on the public leaderboard and you can track your points here.
              </p>
            </section>
          ) : (
            <>
              {/* Points Progress Chart */}
              
              {isApproved && <BadgeShelf logs={myLogs} title="My badges" />}
              <PointsProgressChart logs={myLogs} />
              <QuizHistory />

              {/* My Points History Grouped by Day */}
              <section className="space-y-3">
                <h2 className="font-display text-lg sm:text-xl font-bold text-(color:--c-ink)">
                  My Points History
                </h2>
                {groupedDays.length === 0 ? (
                  <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-6 text-center text-xs sm:text-sm text-(color:--c-muted)">
                    No points logged for this season yet.
                  </div>
                ) : (
                  <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) divide-y divide-(color:--c-ink)/[0.10]">
                    {groupedDays.map((group) => {
                      if (group.items.length === 1) {
                        const item = group.items[0];
                        const isPos = item.points >= 0;
                        return (
                          <div
                            key={group.dateKey}
                            className="px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                          >
                            <p className="min-w-0 text-(color:--c-ink2)">
                              <span className="font-mono-tabular text-(color:--c-muted)">{group.dateLabel}</span>
                              <span aria-hidden="true" className="text-(color:--c-faint)"> · </span>
                              <span className="font-medium text-(color:--c-ink)">{item.action}</span>
                              {visibleNote(item, true) ? <span className="block text-(color:--c-muted) mt-0.5">Reason: {visibleNote(item, true)}</span> : null}
                            </p>
                            <span
                              className={`font-mono-tabular font-bold whitespace-nowrap shrink-0 ${
                                isPos ? 'text-(color:--c-green)' : 'text-(color:--c-red)'
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
                            <span className="font-mono-tabular text-(color:--c-muted)">{group.dateLabel}</span>
                            <span
                              className={`font-mono-tabular text-xs font-semibold ${
                                group.dayTotal >= 0 ? 'text-(color:--c-green)' : 'text-(color:--c-red)'
                              }`}
                            >
                              {group.dayTotal >= 0 ? `+${group.dayTotal} pts` : `${group.dayTotal} pts`}
                            </span>
                          </div>
                          <ul className="pl-3 border-l border-(color:--c-ink)/[0.10] space-y-1.5">
                            {group.items.map((item) => {
                              const isPos = item.points >= 0;
                              return (
                                <li
                                  key={item.id}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <span className="text-(color:--c-ink2)">
                                    {item.action}
                                    {visibleNote(item, true) ? <span className="block text-xs text-(color:--c-muted)">Reason: {visibleNote(item, true)}</span> : null}
                                  </span>
                                  <span
                                    className={`font-mono-tabular font-semibold whitespace-nowrap shrink-0 ${
                                      isPos ? 'text-(color:--c-green)' : 'text-(color:--c-red)'
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
