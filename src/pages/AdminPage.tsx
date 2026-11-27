import React, { useMemo, useState } from 'react';
import { AdminQuiz } from '../components/AdminQuiz';
import { visibleNote } from '../lib/quiz';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, Calendar, Check, ClipboardList, Pencil, PlusCircle, Shield, Trash2, Upload, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resizeAvatarFile } from '../lib/firebase';
import { POINT_ACTIONS, getActionDefinition } from '../lib/leaderboard';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';
import type { StudentProfile } from '../types';

type AdminTab = 'students' | 'points' | 'quiz' | 'seasons' | 'logs';
type SortField = 'date' | 'points' | 'student';
type SortDir = 'asc' | 'desc';

function formatDateTime(ms: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

export function AdminPage() {
  const {
    session,
    students,
    pendingStudents,
    rankedStudents,
    logs,
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    navigate,
    approveStudent,
    rejectStudent,
    updateStudentProfile,
    deleteStudent,
    awardPoints,
    createAndResetSeason,
    getLegacyExamSummary,
    clearLegacyExamData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('students');

  // Add points form state
  const [targetStudentId, setTargetStudentId] = useState('');
  const [actionId, setActionId] = useState(POINT_ACTIONS[0].id);
  const [clubName, setClubName] = useState('');
  const [customPoints, setCustomPoints] = useState('10');
  const [quizScore, setQuizScore] = useState('15');
  const [note, setNote] = useState('');
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingPoints, setSubmittingPoints] = useState(false);

  // Season form state
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStart, setNewSeasonStart] = useState('2027-02-01');
  const [newSeasonEnd, setNewSeasonEnd] = useState('2027-06-15');
  const [seasonFeedback, setSeasonFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cleanup, setCleanup] = useState<{ logs: number; exams: number; scores: number } | null>(null);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupConfirm, setCleanupConfirm] = useState('');
  const [cleanupMsg, setCleanupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audit log sort state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Student management modal state
  const [rosterFeedback, setRosterFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingStudent, setDeletingStudent] = useState<StudentProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const approvedStudents = useMemo(
    () => students.filter((s) => s.approved).sort((a, b) => a.name.localeCompare(b.name)),
    [students]
  );

  const studentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) map.set(s.id, s.name);
    return map;
  }, [students]);

  const rankMap = useMemo(() => {
    const map = new Map<string, { rank: number; totalPoints: number }>();
    for (const r of rankedStudents) map.set(r.id, { rank: r.rank, totalPoints: r.totalPoints });
    return map;
  }, [rankedStudents]);

  const sortedLogs = useMemo(() => {
    const filtered = logs.filter((l) => selectedSeasonId === 'all' || l.seasonId === selectedSeasonId);
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.createdAt - b.createdAt;
      else if (sortField === 'points') cmp = a.points - b.points;
      else {
        const nameA = studentNameMap.get(a.studentId) || '';
        const nameB = studentNameMap.get(b.studentId) || '';
        cmp = nameA.localeCompare(nameB);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [logs, selectedSeasonId, sortDir, sortField, studentNameMap]);

  const selectedActionDef = getActionDefinition(actionId);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'student' ? 'asc' : 'desc');
    }
  };

  const handlePointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);
    setSubmittingPoints(true);

    const res = await awardPoints({
      studentId: targetStudentId || approvedStudents[0]?.id || '',
      actionId,
      note,
      clubName,
      customPoints: Number(customPoints),
      quizScore: Number(quizScore),
    });

    setSubmittingPoints(false);
    if (!res.ok) {
      setFormFeedback({ type: 'error', text: res.error || 'Could not record points.' });
      return;
    }

    const stuName = studentNameMap.get(targetStudentId || approvedStudents[0]?.id || '') || 'Student';
    setFormFeedback({ type: 'success', text: `Points updated for ${stuName}.` });
    setNote('');
    setClubName('');
  };

  const openEditModal = (stu: StudentProfile) => {
    setRosterFeedback(null);
    setEditError(null);
    setEditingStudent(stu);
    setEditName(stu.name);
    setEditPhotoUrl(stu.photoUrl);
  };

  const handleEditPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditError(null);
    try {
      const resized = await resizeAvatarFile(file);
      setEditPhotoUrl(resized);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unable to process image.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditError(null);
    setSavingEdit(true);
    const res = await updateStudentProfile(editingStudent.id, {
      name: editName,
      photoUrl: editPhotoUrl,
    });
    setSavingEdit(false);
    if (!res.ok) {
      setEditError(res.error || 'Could not update student.');
      return;
    }
    setRosterFeedback({ type: 'success', text: `Updated ${editName.trim()}'s profile.` });
    setEditingStudent(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setDeleteError(null);
    setDeleting(true);
    const res = await deleteStudent(deletingStudent.id);
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(res.error || 'Failed to delete student.');
      return;
    }
    const deletedName = deletingStudent.name;
    setDeletingStudent(null);
    setRosterFeedback({ type: 'success', text: `Deleted ${deletedName} and their points history.` });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {!session || session.role !== 'admin' ? (
        <main className="mx-auto max-w-xl px-4 sm:px-6 py-12">
          <section className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-8 text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-(color:--c-accent)/25 bg-(color:--c-accent)/10 text-(color:--c-accent-d)">
              <Shield className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-(color:--c-ink)">Admin Access Required</h1>
              <p className="text-sm text-(color:--c-muted)">
                Sign in with your instructor account to approve students, award points, or manage academic seasons.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl bg-(color:--c-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) transition-colors cursor-pointer"
              >
                Sign In as Admin
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Clean Minimal Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0 space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-(color:--c-accent-d)">Instructor Console</p>
            <h1 className="font-display text-2xl font-bold text-(color:--c-ink)">Admin Panel</h1>
          </div>

          <nav aria-label="Admin sections" className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === 'students'
                  ? 'bg-(color:--c-accent)/20 text-(color:--c-ink) border border-(color:--c-accent)/35'
                  : 'text-(color:--c-muted) hover:text-(color:--c-ink) hover:bg-(color:--c-ink)/[0.045] border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>Students & Approvals</span>
              </span>
              {pendingStudents.length > 0 && (
                <span className="font-mono-tabular text-xs font-bold text-(color:--c-amber)">
                  {pendingStudents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('points')}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === 'points'
                  ? 'bg-(color:--c-accent)/20 text-(color:--c-ink) border border-(color:--c-accent)/35'
                  : 'text-(color:--c-muted) hover:text-(color:--c-ink) hover:bg-(color:--c-ink)/[0.045] border border-transparent'
              }`}
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>Award Points</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === 'quiz'
                  ? 'bg-(color:--c-accent)/20 text-(color:--c-ink) border border-(color:--c-accent)/35'
                  : 'text-(color:--c-muted) hover:text-(color:--c-ink) hover:bg-(color:--c-ink)/[0.045] border border-transparent'
              }`}
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              <span>Weekly Quiz</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seasons')}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === 'seasons'
                  ? 'bg-(color:--c-accent)/20 text-(color:--c-ink) border border-(color:--c-accent)/35'
                  : 'text-(color:--c-muted) hover:text-(color:--c-ink) hover:bg-(color:--c-ink)/[0.045] border border-transparent'
              }`}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Seasons</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === 'logs'
                  ? 'bg-(color:--c-accent)/20 text-(color:--c-ink) border border-(color:--c-accent)/35'
                  : 'text-(color:--c-muted) hover:text-(color:--c-ink) hover:bg-(color:--c-ink)/[0.045] border border-transparent'
              }`}
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              <span>Audit Log</span>
            </button>
          </nav>

        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Tab 1: Students & Pending Approvals */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Pending Approvals at Top */}
              <section className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-bold text-(color:--c-ink)">
                    Pending Approvals
                  </h2>
                  <span className="text-xs font-mono-tabular text-(color:--c-amber)">
                    {pendingStudents.length} awaiting review
                  </span>
                </div>

                {pendingStudents.length === 0 ? (
                  <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-6 text-sm text-(color:--c-muted)">
                    All student signups have been reviewed.
                  </div>
                ) : (
                  <ul className="space-y-2.5" data-testid="pending-approvals-list">
                    {pendingStudents.map((stu) => (
                      <li
                        key={stu.id}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/[0.09] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Avatar name={stu.name} src={stu.photoUrl} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-(color:--c-ink) truncate">{stu.name}</p>
                            <p className="text-xs text-(color:--c-amber) font-medium mt-0.5">
                              Pending Approval · Signed up {formatDateTime(stu.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => approveStudent(stu.id)}
                            aria-label={`Approve ${stu.name}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-2 text-xs font-semibold text-(color:--c-green) hover:bg-emerald-500/30 transition-colors cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectStudent(stu.id)}
                            aria-label={`Reject ${stu.name}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-400/25 px-3.5 py-2 text-xs font-semibold text-(color:--c-red) hover:bg-rose-500/25 transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Approved Class Roster */}
              <section className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-bold text-(color:--c-ink)">
                    Approved Students
                  </h2>
                  <span className="text-xs font-mono-tabular text-(color:--c-muted)">
                    {approvedStudents.length} active
                  </span>
                </div>

                {rosterFeedback && (
                  <div
                    role={rosterFeedback.type === 'error' ? 'alert' : 'status'}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      rosterFeedback.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-(color:--c-green)'
                        : 'border-rose-500/30 bg-rose-500/10 text-(color:--c-red)'
                    }`}
                  >
                    {rosterFeedback.text}
                  </div>
                )}

                {approvedStudents.length === 0 ? (
                  <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-8 text-center text-sm text-(color:--c-muted)">
                    No approved students yet.
                  </div>
                ) : (
                  <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) overflow-hidden">
                    <ul className="divide-y divide-(color:--c-ink)/[0.10]">
                      {rankedStudents.map((stu) => (
                        <li
                          key={stu.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-(color:--c-ink)/[0.045]"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="font-mono-tabular text-sm font-bold text-(color:--c-muted) w-8 shrink-0">
                              #{stu.rank}
                            </span>
                            <Avatar name={stu.name} src={stu.photoUrl} size="sm" />
                            <button
                              type="button"
                              onClick={() => navigate(`/student/${stu.id}`)}
                              className="text-sm font-medium text-(color:--c-ink) hover:text-(color:--c-accent-d) truncate text-left cursor-pointer"
                            >
                              {stu.name}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 shrink-0">
                            <span className="text-sm font-bold text-(color:--c-ink2) mr-1">
                              <AnimatedNumber value={stu.totalPoints} suffix=" pts" />
                            </span>
                            <button
                              type="button"
                              aria-label={`Award points to ${stu.name}`}
                              onClick={() => {
                                setTargetStudentId(stu.id);
                                setActiveTab('points');
                              }}
                              className="rounded-lg border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-3 py-1.5 text-xs font-medium text-(color:--c-accent-d) hover:bg-(color:--c-accent)/20 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Award Points
                            </button>
                            <button
                              type="button"
                              aria-label={`Edit ${stu.name}`}
                              onClick={() => openEditModal(stu)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-2.5 py-1.5 text-xs font-medium text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.045] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${stu.name}`}
                              onClick={() => {
                                setDeleteError(null);
                                setDeletingStudent(stu);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-(color:--c-red) hover:bg-rose-500/20 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Tab 2: Add Points Form */}
          {activeTab === 'points' && (
            <section className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold text-(color:--c-ink)">Award or Deduct Points</h2>
                <p className="text-sm text-(color:--c-muted)">
                  Select a student and a standardized action. Points and rank standings update immediately.
                </p>
              </div>

              {formFeedback && (
                <div
                  role={formFeedback.type === 'error' ? 'alert' : 'status'}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    formFeedback.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-(color:--c-green)'
                      : 'border-rose-500/30 bg-rose-500/10 text-(color:--c-red)'
                  }`}
                >
                  {formFeedback.text}
                </div>
              )}

              {approvedStudents.length === 0 ? (
                <p className="text-sm text-(color:--c-muted)">
                  Approve at least one student first before awarding points.
                </p>
              ) : (
                <form onSubmit={handlePointsSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="admin-student-select" className="block text-xs font-medium text-(color:--c-sub)">
                        Student
                      </label>
                      <select
                        id="admin-student-select"
                        value={targetStudentId || approvedStudents[0]?.id || ''}
                        onChange={(e) => setTargetStudentId(e.target.value)}
                        className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm text-(color:--c-ink) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
                      >
                        {approvedStudents.map((stu) => {
                          const info = rankMap.get(stu.id);
                          return (
                            <option key={stu.id} value={stu.id}>
                              {stu.name} ({info ? `#${info.rank} · ${info.totalPoints} pts` : '0 pts'})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="admin-action-select" className="block text-xs font-medium text-(color:--c-sub)">
                        Action
                      </label>
                      <select
                        id="admin-action-select"
                        value={actionId}
                        onChange={(e) => setActionId(e.target.value)}
                        className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm text-(color:--c-ink) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
                      >
                        {POINT_ACTIONS.map((act) => (
                          <option key={act.id} value={act.id}>
                            {act.label} (
                            {act.frequency === 'weekly_quiz'
                              ? 'score × 10'
                              : act.frequency === 'manual'
                              ? 'custom'
                              : act.points > 0
                                ? `+${act.points}`
                                : act.points}
                            )
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedActionDef && (
                    <p className="text-xs text-(color:--c-muted)">{selectedActionDef.description}</p>
                  )}

                  {selectedActionDef?.frequency === 'once_per_club' && (
                    <div className="space-y-1.5">
                      <label htmlFor="club-name-input" className="block text-xs font-medium text-(color:--c-sub)">
                        Club Name (once per club)
                      </label>
                      <input
                        id="club-name-input"
                        type="text"
                        required
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                        placeholder="e.g. MDMMS Growth Lab"
                        className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedActionDef?.frequency === 'weekly_quiz' && (
                    <div className="space-y-1.5">
                      <label htmlFor="quiz-score-input" className="block text-xs font-medium text-(color:--c-sub)">
                        Quiz score (0 – 20, awards score × 10 = {Math.round((Number(quizScore) || 0) * 10)} pts). One quiz award per student per week.
                      </label>
                      <input
                        id="quiz-score-input"
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        required
                        value={quizScore}
                        onChange={(e) => setQuizScore(e.target.value)}
                        className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm font-mono-tabular text-(color:--c-ink) focus:border-(color:--c-accent)/40 focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedActionDef?.frequency === 'manual' && (
                    <div className="space-y-1.5">
                      <label htmlFor="custom-points-input" className="block text-xs font-medium text-(color:--c-sub)">
                        Custom Points (positive or negative)
                      </label>
                      <input
                        id="custom-points-input"
                        type="number"
                        step="1"
                        required
                        value={customPoints}
                        onChange={(e) => setCustomPoints(e.target.value)}
                        className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm font-mono-tabular text-(color:--c-ink) focus:border-(color:--c-accent)/40 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="admin-note-input" className="block text-xs font-medium text-(color:--c-sub)">
                      Admin Note {selectedActionDef?.frequency === 'manual' ? '(Required)' : '(Optional)'}
                    </label>
                    <input
                      id="admin-note-input"
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Delivered Google Ads ROAS case study in class"
                      className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPoints}
                    className="rounded-xl bg-(color:--c-accent) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {submittingPoints ? 'Saving Points...' : 'Submit Point Entry'}
                  </button>
                </form>
              )}
            </section>
          )}

          {/* Tab 3: Seasons */}
          {activeTab === 'quiz' && <AdminQuiz />}

          {activeTab === 'seasons' && (
            <div className="space-y-6">
              {seasonFeedback && (
                <div
                  role={seasonFeedback.type === 'error' ? 'alert' : 'status'}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    seasonFeedback.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-(color:--c-green)'
                      : 'border-rose-500/30 bg-rose-500/10 text-(color:--c-red)'
                  }`}
                >
                  {seasonFeedback.text}
                </div>
              )}

              {/* Clean up old exam data */}
              <section className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-bold text-(color:--c-ink)">Clear old exam data</h2>
                  <p className="text-xs sm:text-sm text-(color:--c-muted)">
                    The old exam system is hidden everywhere already. This permanently deletes the old exam point entries, exams and exam scores from the database.
                  </p>
                </div>
                {cleanupMsg && (
                  <div
                    role={cleanupMsg.type === 'error' ? 'alert' : 'status'}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      cleanupMsg.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-(color:--c-green)'
                        : 'border-rose-500/30 bg-rose-500/10 text-(color:--c-red)'
                    }`}
                  >
                    {cleanupMsg.text}
                  </div>
                )}
                {!cleanup ? (
                  <button
                    type="button"
                    disabled={cleanupBusy}
                    onClick={async () => {
                      setCleanupBusy(true);
                      setCleanupMsg(null);
                      try {
                        setCleanup(await getLegacyExamSummary());
                      } catch {
                        setCleanupMsg({ type: 'error', text: 'Could not read the old exam data.' });
                      }
                      setCleanupBusy(false);
                    }}
                    className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-5 py-2.5 text-sm font-semibold text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.09] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {cleanupBusy ? 'Checking...' : 'Check what will be deleted'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <ul className="rounded-xl border border-(color:--c-ink)/[0.10] divide-y divide-(color:--c-ink)/[0.10] text-sm">
                      <li className="flex justify-between px-4 py-2.5"><span>Old exam point entries</span><span className="font-mono-tabular font-semibold">{cleanup.logs}</span></li>
                      <li className="flex justify-between px-4 py-2.5"><span>Exams</span><span className="font-mono-tabular font-semibold">{cleanup.exams}</span></li>
                      <li className="flex justify-between px-4 py-2.5"><span>Exam scores</span><span className="font-mono-tabular font-semibold">{cleanup.scores}</span></li>
                    </ul>
                    <p className="text-sm text-(color:--c-red)">
                      This cannot be undone. Rankings and totals do not change, because these entries are already left out of the standings.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        aria-label="Type DELETE to confirm"
                        value={cleanupConfirm}
                        onChange={(e) => setCleanupConfirm(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className="flex-1 rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={cleanupBusy || cleanupConfirm !== 'DELETE' || cleanup.logs + cleanup.exams + cleanup.scores === 0}
                        onClick={async () => {
                          setCleanupBusy(true);
                          const res = await clearLegacyExamData();
                          setCleanupBusy(false);
                          if (res.ok && res.deleted) {
                            setCleanupMsg({ type: 'success', text: `Deleted ${res.deleted.logs} entries, ${res.deleted.exams} exams and ${res.deleted.scores} exam scores.` });
                            setCleanup(null);
                            setCleanupConfirm('');
                          } else setCleanupMsg({ type: 'error', text: res.error || 'Could not delete.' });
                        }}
                        className="rounded-xl bg-(color:--c-red) px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
                      >
                        {cleanupBusy ? 'Deleting...' : 'Delete old exam data'}
                      </button>
                      <button type="button" onClick={() => { setCleanup(null); setCleanupConfirm(''); }} className="rounded-xl px-4 py-2.5 text-sm font-medium text-(color:--c-muted) hover:text-(color:--c-ink) cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Reset & Start New Season */}
              <section className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-bold text-(color:--c-ink)">
                    Start New Season & Archive Hall of Fame
                  </h2>
                  <p className="text-xs sm:text-sm text-(color:--c-muted)">
                    Starting a new season automatically preserves the current season&rsquo;s Top 3 podium in the Hall of Fame and begins a fresh standings table.
                  </p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSeasonFeedback(null);
                    const res = await createAndResetSeason(newSeasonName, newSeasonStart, newSeasonEnd);
                    if (!res.ok) setSeasonFeedback({ type: 'error', text: res.error || 'Error resetting season.' });
                    else {
                      setSeasonFeedback({
                        type: 'success',
                        text: `Season "${newSeasonName}" is now active. Previous Top 3 archived to Hall of Fame.`,
                      });
                      setNewSeasonName('');
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <input
                    type="text"
                    aria-label="New season name"
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    placeholder="e.g. Spring 2027"
                    className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm text-(color:--c-ink) placeholder:text-(color:--c-faint) focus:border-(color:--c-accent)/40 focus:outline-none"
                  />
                  <input
                    type="date"
                    aria-label="Season start date"
                    value={newSeasonStart}
                    onChange={(e) => setNewSeasonStart(e.target.value)}
                    className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm font-mono-tabular text-(color:--c-ink) focus:border-(color:--c-accent)/40 focus:outline-none"
                  />
                  <input
                    type="date"
                    aria-label="Season end date"
                    value={newSeasonEnd}
                    onChange={(e) => setNewSeasonEnd(e.target.value)}
                    className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm font-mono-tabular text-(color:--c-ink) focus:border-(color:--c-accent)/40 focus:outline-none"
                  />
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="rounded-xl border border-(color:--c-accent)/30 bg-(color:--c-accent)/20 px-5 py-2.5 text-sm font-semibold text-(color:--c-accent-d) hover:bg-(color:--c-accent)/30 transition-colors cursor-pointer"
                    >
                      Archive Current Top 3 & Start Season
                    </button>
                  </div>
                </form>

                <div className="pt-4 border-t border-(color:--c-ink)/[0.10] space-y-2">
                  <p className="text-xs font-medium text-(color:--c-muted)">Configured Seasons</p>
                  <ul className="divide-y divide-(color:--c-ink)/[0.10]">
                    {seasons.map((s) => (
                      <li key={s.id} className="py-2.5 flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-(color:--c-ink)">{s.name}</span>
                          <span className="text-xs text-(color:--c-muted) font-mono-tabular ml-2">
                            {s.startDate} → {s.endDate}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedSeasonId(s.id)}
                          className={`text-xs font-medium cursor-pointer ${
                            s.active ? 'text-(color:--c-green)' : 'text-(color:--c-muted) hover:text-(color:--c-ink)'
                          }`}
                        >
                          {s.active ? 'Active Season' : 'View'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          )}

          {/* Tab 4: Audit Log Table */}
          {activeTab === 'logs' && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-(color:--c-ink)">Audit Log</h2>
                <span className="text-xs font-mono-tabular text-(color:--c-muted)">
                  {sortedLogs.length} entries
                </span>
              </div>

              {sortedLogs.length === 0 ? (
                <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-10 text-center text-sm text-(color:--c-muted)">
                  No point audit entries yet.
                </div>
              ) : (
                <div className="rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-(color:--c-ink)/[0.10] text-xs font-medium text-(color:--c-muted)">
                        <th className="px-4 py-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleSort('student')}
                            className="inline-flex items-center gap-1.5 hover:text-(color:--c-ink) cursor-pointer"
                          >
                            <span>Student</span>
                            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </th>
                        <th className="px-4 py-3.5">Action</th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleSort('points')}
                            className="inline-flex items-center gap-1.5 hover:text-(color:--c-ink) cursor-pointer"
                          >
                            <span>Points</span>
                            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </th>
                        <th className="px-4 py-3.5">Admin Note</th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleSort('date')}
                            className="inline-flex items-center gap-1.5 hover:text-(color:--c-ink) cursor-pointer"
                          >
                            <span>Date</span>
                            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(color:--c-ink)/[0.10] text-sm">
                      {sortedLogs.map((log) => {
                        const stuName = studentNameMap.get(log.studentId) || log.studentId;
                        const isPositive = log.points >= 0;
                        return (
                          <tr key={log.id} className="hover:bg-(color:--c-ink)/[0.045]">
                            <td className="px-4 py-3 font-medium text-(color:--c-ink) whitespace-nowrap">
                              {stuName}
                            </td>
                            <td className="px-4 py-3 text-(color:--c-sub)">{log.action}</td>
                            <td
                              className={`px-4 py-3 text-right font-mono-tabular font-semibold whitespace-nowrap ${
                                isPositive ? 'text-(color:--c-green)' : 'text-(color:--c-red)'
                              }`}
                            >
                              {isPositive ? `+${log.points}` : log.points}
                            </td>
                            <td className="px-4 py-3 text-xs text-(color:--c-muted) max-w-[200px] truncate">
                              {visibleNote(log, true) || '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono-tabular text-xs text-(color:--c-muted) whitespace-nowrap">
                              {formatDateTime(log.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {editingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-student-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) p-6 space-y-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 id="edit-student-title" className="font-display text-lg font-bold text-(color:--c-ink)">
                  Edit Student
                </h2>
                <button
                  type="button"
                  aria-label="Close edit dialog"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-lg p-1.5 text-(color:--c-muted) hover:bg-(color:--c-ink)/[0.045] hover:text-(color:--c-ink) cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {editError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-(color:--c-red)"
                >
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar name={editName || editingStudent.name} src={editPhotoUrl} size="lg" />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-ink)/[0.045] px-3.5 py-2 text-xs font-medium text-(color:--c-ink2) hover:bg-(color:--c-ink)/[0.045] transition-colors cursor-pointer">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditPhotoChange}
                        className="sr-only"
                      />
                    </label>
                    {editPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditPhotoUrl('')}
                        className="rounded-xl border border-(color:--c-ink)/[0.10] px-3 py-2 text-xs font-medium text-(color:--c-muted) hover:text-(color:--c-ink) hover:bg-(color:--c-ink)/[0.045] cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-student-name" className="block text-xs font-medium text-(color:--c-sub)">
                    Full Name
                  </label>
                  <input
                    id="edit-student-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3.5 py-2.5 text-sm text-(color:--c-ink) focus:border-(color:--c-accent)/40 focus:outline-none focus:ring-2 focus:ring-(color:--c-accent)/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="rounded-xl border border-(color:--c-ink)/[0.10] px-4 py-2 text-xs font-medium text-(color:--c-sub) hover:bg-(color:--c-ink)/[0.045] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="rounded-xl bg-(color:--c-accent) px-4 py-2 text-xs font-semibold text-white hover:bg-(color:--c-accent-d) disabled:opacity-60 cursor-pointer"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Student Confirmation Modal */}
      <AnimatePresence>
        {deletingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md rounded-xl border border-rose-500/25 bg-(color:--c-surface) p-6 space-y-4 shadow-sm"
            >
              <div className="space-y-1.5">
                <h2 id="delete-student-title" className="font-display text-lg font-bold text-(color:--c-ink)">
                  Delete {deletingStudent.name}?
                </h2>
                <p className="text-sm text-(color:--c-sub)">
                  Are you sure? This will delete all their points history.
                </p>
              </div>

              {deleteError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-(color:--c-red)"
                >
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeletingStudent(null)}
                  className="rounded-xl border border-(color:--c-ink)/[0.10] px-4 py-2 text-xs font-medium text-(color:--c-sub) hover:bg-(color:--c-ink)/[0.045] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-(color:--c-ink) hover:bg-rose-500 disabled:opacity-60 cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Delete Student'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </main>
      )}
    </motion.div>
  );
}
