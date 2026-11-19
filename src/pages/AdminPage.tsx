import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, Calendar, Check, ClipboardList, Pencil, PlusCircle, Shield, Trash2, Upload, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resizeAvatarFile } from '../lib/firebase';
import { POINT_ACTIONS, getActionDefinition } from '../lib/leaderboard';
import { Avatar } from '../components/Avatar';
import { AnimatedNumber } from '../components/AnimatedNumber';
import type { StudentProfile } from '../types';

type AdminTab = 'students' | 'points' | 'seasons' | 'logs';
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
    exams,
    selectedSeasonId,
    setSelectedSeasonId,
    navigate,
    approveStudent,
    rejectStudent,
    updateStudentProfile,
    deleteStudent,
    awardPoints,
    createExam,
    createAndResetSeason,
    seedFirestoreCohort,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('students');

  // Add points form state
  const [targetStudentId, setTargetStudentId] = useState('');
  const [actionId, setActionId] = useState(POINT_ACTIONS[0].id);
  const [clubName, setClubName] = useState('');
  const [examId, setExamId] = useState('');
  const [examScore, setExamScore] = useState('15');
  const [customPoints, setCustomPoints] = useState('10');
  const [note, setNote] = useState('');
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingPoints, setSubmittingPoints] = useState(false);

  // Exam & Season form state
  const [newExamName, setNewExamName] = useState('');
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStart, setNewSeasonStart] = useState('2027-02-01');
  const [newSeasonEnd, setNewSeasonEnd] = useState('2027-06-15');
  const [seasonFeedback, setSeasonFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [seeding, setSeeding] = useState(false);

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
      examId: examId || exams[0]?.id || '',
      examScore: Number(examScore),
      customPoints: Number(customPoints),
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
          <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/85 backdrop-blur-md p-8 text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300">
              <Shield className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-white">Admin Access Required</h1>
              <p className="text-sm text-slate-400">
                Sign in with your instructor account to approve students, award points, or manage academic seasons.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer"
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
            <p className="text-xs font-medium text-indigo-300">Instructor Console</p>
            <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
          </div>

          <nav aria-label="Admin sections" className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === 'students'
                  ? 'bg-indigo-500/20 text-white border border-indigo-400/35'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>Students & Approvals</span>
              </span>
              {pendingStudents.length > 0 && (
                <span className="font-mono-tabular text-xs font-bold text-amber-300">
                  {pendingStudents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('points')}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === 'points'
                  ? 'bg-indigo-500/20 text-white border border-indigo-400/35'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>Award Points</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seasons')}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === 'seasons'
                  ? 'bg-indigo-500/20 text-white border border-indigo-400/35'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Exams & Seasons</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === 'logs'
                  ? 'bg-indigo-500/20 text-white border border-indigo-400/35'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              <span>Audit Log</span>
            </button>
          </nav>

          {students.length === 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 p-4 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Firestore is currently empty. Seed 24 sample Marketing Digital students and Fall 2026 logs?
              </p>
              <button
                type="button"
                disabled={seeding}
                onClick={async () => {
                  setSeeding(true);
                  await seedFirestoreCohort();
                  setSeeding(false);
                }}
                className="w-full rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-400 transition-colors cursor-pointer"
              >
                {seeding ? 'Seeding...' : 'Seed Sample Class'}
              </button>
            </div>
          )}
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Tab 1: Students & Pending Approvals */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Pending Approvals at Top */}
              <section className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-bold text-white">
                    Pending Approvals
                  </h2>
                  <span className="text-xs font-mono-tabular text-amber-300">
                    {pendingStudents.length} awaiting review
                  </span>
                </div>

                {pendingStudents.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/70 p-6 text-sm text-slate-400">
                    All student signups have been reviewed.
                  </div>
                ) : (
                  <ul className="space-y-2.5" data-testid="pending-approvals-list">
                    {pendingStudents.map((stu) => (
                      <li
                        key={stu.id}
                        className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.09] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Avatar name={stu.name} src={stu.photoUrl} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{stu.name}</p>
                            <p className="text-xs text-amber-300 font-medium mt-0.5">
                              Pending Approval · Signed up {formatDateTime(stu.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => approveStudent(stu.id)}
                            aria-label={`Approve ${stu.name}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectStudent(stu.id)}
                            aria-label={`Reject ${stu.name}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-400/25 px-3.5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/25 transition-colors cursor-pointer"
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
                  <h2 className="font-display text-lg font-bold text-white">
                    Approved Students
                  </h2>
                  <span className="text-xs font-mono-tabular text-slate-400">
                    {approvedStudents.length} active
                  </span>
                </div>

                {rosterFeedback && (
                  <div
                    role={rosterFeedback.type === 'error' ? 'alert' : 'status'}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      rosterFeedback.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                    }`}
                  >
                    {rosterFeedback.text}
                  </div>
                )}

                {approvedStudents.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/70 p-8 text-center text-sm text-slate-400">
                    No approved students yet.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/75 overflow-hidden">
                    <ul className="divide-y divide-white/[0.06]">
                      {rankedStudents.map((stu) => (
                        <li
                          key={stu.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.03]"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="font-mono-tabular text-sm font-bold text-slate-400 w-8 shrink-0">
                              #{stu.rank}
                            </span>
                            <Avatar name={stu.name} src={stu.photoUrl} size="sm" />
                            <button
                              type="button"
                              onClick={() => navigate(`/student/${stu.id}`)}
                              className="text-sm font-medium text-white hover:text-indigo-300 truncate text-left cursor-pointer"
                            >
                              {stu.name}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 shrink-0">
                            <span className="text-sm font-bold text-slate-200 mr-1">
                              <AnimatedNumber value={stu.totalPoints} suffix=" pts" />
                            </span>
                            <button
                              type="button"
                              aria-label={`Award points to ${stu.name}`}
                              onClick={() => {
                                setTargetStudentId(stu.id);
                                setActiveTab('points');
                              }}
                              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-500/20 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Award Points
                            </button>
                            <button
                              type="button"
                              aria-label={`Edit ${stu.name}`}
                              onClick={() => openEditModal(stu)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/[0.12] transition-colors cursor-pointer whitespace-nowrap"
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
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/20 transition-colors cursor-pointer whitespace-nowrap"
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
            <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold text-white">Award or Deduct Points</h2>
                <p className="text-sm text-slate-400">
                  Select a student and a standardized action. Points and rank standings update immediately.
                </p>
              </div>

              {formFeedback && (
                <div
                  role={formFeedback.type === 'error' ? 'alert' : 'status'}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    formFeedback.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  {formFeedback.text}
                </div>
              )}

              {approvedStudents.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Approve at least one student first before awarding points.
                </p>
              ) : (
                <form onSubmit={handlePointsSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="admin-student-select" className="block text-xs font-medium text-slate-300">
                        Student
                      </label>
                      <select
                        id="admin-student-select"
                        value={targetStudentId || approvedStudents[0]?.id || ''}
                        onChange={(e) => setTargetStudentId(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
                      <label htmlFor="admin-action-select" className="block text-xs font-medium text-slate-300">
                        Action
                      </label>
                      <select
                        id="admin-action-select"
                        value={actionId}
                        onChange={(e) => setActionId(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        {POINT_ACTIONS.map((act) => (
                          <option key={act.id} value={act.id}>
                            {act.label} (
                            {act.frequency === 'per_exam'
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
                    <p className="text-xs text-slate-400">{selectedActionDef.description}</p>
                  )}

                  {selectedActionDef?.frequency === 'once_per_club' && (
                    <div className="space-y-1.5">
                      <label htmlFor="club-name-input" className="block text-xs font-medium text-slate-300">
                        Club Name (once per club)
                      </label>
                      <input
                        id="club-name-input"
                        type="text"
                        required
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                        placeholder="e.g. MDMMS Growth Lab"
                        className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedActionDef?.frequency === 'per_exam' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="exam-select" className="block text-xs font-medium text-slate-300">
                          Exam
                        </label>
                        <select
                          id="exam-select"
                          value={examId || exams[0]?.id || ''}
                          onChange={(e) => setExamId(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                        >
                          {exams.length === 0 ? (
                            <option value="">No exams created yet</option>
                          ) : (
                            exams.map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="exam-score-input" className="block text-xs font-medium text-slate-300">
                          Score (0 – 20, awards score × 10 = {Math.round((Number(examScore) || 0) * 10)} pts)
                        </label>
                        <input
                          id="exam-score-input"
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          required
                          value={examScore}
                          onChange={(e) => setExamScore(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm font-mono-tabular text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedActionDef?.frequency === 'manual' && (
                    <div className="space-y-1.5">
                      <label htmlFor="custom-points-input" className="block text-xs font-medium text-slate-300">
                        Custom Points (positive or negative)
                      </label>
                      <input
                        id="custom-points-input"
                        type="number"
                        step="1"
                        required
                        value={customPoints}
                        onChange={(e) => setCustomPoints(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm font-mono-tabular text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="admin-note-input" className="block text-xs font-medium text-slate-300">
                      Admin Note {selectedActionDef?.frequency === 'manual' ? '(Required)' : '(Optional)'}
                    </label>
                    <input
                      id="admin-note-input"
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Delivered Google Ads ROAS case study in class"
                      className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPoints}
                    className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {submittingPoints ? 'Saving Points...' : 'Submit Point Entry'}
                  </button>
                </form>
              )}
            </section>
          )}

          {/* Tab 3: Exams & Seasons */}
          {activeTab === 'seasons' && (
            <div className="space-y-6">
              {seasonFeedback && (
                <div
                  role={seasonFeedback.type === 'error' ? 'alert' : 'status'}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    seasonFeedback.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  {seasonFeedback.text}
                </div>
              )}

              {/* Create Exam */}
              <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-white">Create Exam</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSeasonFeedback(null);
                    const targetSeason = selectedSeasonId === 'all' ? seasons.find((s) => s.active)?.id || 'fall-2026' : selectedSeasonId;
                    const res = await createExam(newExamName, targetSeason);
                    if (!res.ok) setSeasonFeedback({ type: 'error', text: res.error || 'Error creating exam.' });
                    else {
                      setSeasonFeedback({ type: 'success', text: `Exam "${newExamName}" created.` });
                      setNewExamName('');
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    aria-label="New exam name"
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    placeholder="e.g. CRM & Lifecycle Marketing Final"
                    className="flex-1 rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Add Exam
                  </button>
                </form>
              </section>

              {/* Reset & Start New Season */}
              <section className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-bold text-white">
                    Start New Season & Archive Hall of Fame
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
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
                    className="rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="date"
                    aria-label="Season start date"
                    value={newSeasonStart}
                    onChange={(e) => setNewSeasonStart(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm font-mono-tabular text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="date"
                    aria-label="Season end date"
                    value={newSeasonEnd}
                    onChange={(e) => setNewSeasonEnd(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm font-mono-tabular text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="rounded-xl border border-indigo-400/30 bg-indigo-500/20 px-5 py-2.5 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                    >
                      Archive Current Top 3 & Start Season
                    </button>
                  </div>
                </form>

                <div className="pt-4 border-t border-white/[0.07] space-y-2">
                  <p className="text-xs font-medium text-slate-400">Configured Seasons</p>
                  <ul className="divide-y divide-white/[0.06]">
                    {seasons.map((s) => (
                      <li key={s.id} className="py-2.5 flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-white">{s.name}</span>
                          <span className="text-xs text-slate-400 font-mono-tabular ml-2">
                            {s.startDate} → {s.endDate}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedSeasonId(s.id)}
                          className={`text-xs font-medium cursor-pointer ${
                            s.active ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
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
                <h2 className="font-display text-xl font-bold text-white">Audit Log</h2>
                <span className="text-xs font-mono-tabular text-slate-400">
                  {sortedLogs.length} entries
                </span>
              </div>

              {sortedLogs.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/70 p-10 text-center text-sm text-slate-400">
                  No point audit entries yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-xs font-medium text-slate-400">
                        <th className="px-4 py-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleSort('student')}
                            className="inline-flex items-center gap-1.5 hover:text-white cursor-pointer"
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
                            className="inline-flex items-center gap-1.5 hover:text-white cursor-pointer"
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
                            className="inline-flex items-center gap-1.5 hover:text-white cursor-pointer"
                          >
                            <span>Date</span>
                            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-sm">
                      {sortedLogs.map((log) => {
                        const stuName = studentNameMap.get(log.studentId) || log.studentId;
                        const isPositive = log.points >= 0;
                        return (
                          <tr key={log.id} className="hover:bg-white/[0.03]">
                            <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                              {stuName}
                            </td>
                            <td className="px-4 py-3 text-slate-300">{log.action}</td>
                            <td
                              className={`px-4 py-3 text-right font-mono-tabular font-semibold whitespace-nowrap ${
                                isPositive ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isPositive ? `+${log.points}` : log.points}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">
                              {log.note || '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono-tabular text-xs text-slate-400 whitespace-nowrap">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-student-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11182E] p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 id="edit-student-title" className="font-display text-lg font-bold text-white">
                  Edit Student
                </h2>
                <button
                  type="button"
                  aria-label="Close edit dialog"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {editError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                >
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar name={editName || editingStudent.name} src={editPhotoUrl} size="lg" />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.12] transition-colors cursor-pointer">
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
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-student-name" className="block text-xs font-medium text-slate-300">
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
                    className="w-full rounded-xl border border-white/10 bg-[#0A0F1E]/90 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-60 cursor-pointer"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md rounded-2xl border border-rose-500/25 bg-[#11182E] p-6 space-y-4 shadow-2xl"
            >
              <div className="space-y-1.5">
                <h2 id="delete-student-title" className="font-display text-lg font-bold text-white">
                  Delete {deletingStudent.name}?
                </h2>
                <p className="text-sm text-slate-300">
                  Are you sure? This will delete all their points history.
                </p>
              </div>

              {deleteError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                >
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeletingStudent(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60 cursor-pointer"
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
