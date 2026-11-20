import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  buildHallOfFameTop3,
  calculateExamPoints,
  canClaimAction,
  computeLeaderboard,
  findWeeklyMvp,
  getActionDefinition,
} from '../lib/leaderboard';
import { createSampleDataset } from '../lib/seedData';
import type {
  AuthSession,
  Exam,
  ExamScore,
  HallOfFameEntry,
  PointLog,
  RankedStudent,
  Season,
  StudentProfile,
} from '../types';

function tsToMs(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val instanceof Timestamp) return val.toMillis();
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  photoUrl: string;
}

interface AddPointsPayload {
  studentId: string;
  actionId: string;
  note: string;
  clubName?: string;
  examId?: string;
  examScore?: number;
  customPoints?: number;
}

export interface AppContextValue {
  pathname: string;
  navigate: (to: string) => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  session: AuthSession | null;
  students: StudentProfile[];
  logs: PointLog[];
  seasons: Season[];
  exams: Exam[];
  examScores: ExamScore[];
  hallOfFame: HallOfFameEntry[];
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  rankedStudents: RankedStudent[];
  weeklyMvp: RankedStudent | null;
  pendingStudents: StudentProfile[];
  loginWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: string }>;
  signupStudent: (payload: SignupPayload) => Promise<{ ok: boolean; error?: string; pending?: boolean }>;
  logout: () => Promise<void>;
  approveStudent: (studentId: string) => Promise<void>;
  rejectStudent: (studentId: string) => Promise<void>;
  updateStudentProfile: (
    studentId: string,
    payload: { name: string; photoUrl: string }
  ) => Promise<{ ok: boolean; error?: string }>;
  updateOwnPhoto: (photoUrl: string) => Promise<{ ok: boolean; error?: string }>;
  deleteStudent: (studentId: string) => Promise<{ ok: boolean; error?: string }>;
  awardPoints: (payload: AddPointsPayload) => Promise<{ ok: boolean; error?: string }>;
  createExam: (name: string, seasonId: string) => Promise<{ ok: boolean; error?: string }>;
  createAndResetSeason: (name: string, startDate: string, endDate: string) => Promise<{ ok: boolean; error?: string }>;
  seedFirestoreCohort: () => Promise<{ ok: boolean; error?: string }>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Live Firestore state
  const [fsStudents, setFsStudents] = useState<StudentProfile[]>([]);
  const [fsOwnStudent, setFsOwnStudent] = useState<StudentProfile | null>(null);
  const [fsLogs, setFsLogs] = useState<PointLog[]>([]);
  const [fsSeasons, setFsSeasons] = useState<Season[]>([]);
  const [fsExams, setFsExams] = useState<Exam[]>([]);
  const [fsExamScores, setFsExamScores] = useState<ExamScore[]>([]);
  const [fsHallOfFame, setFsHallOfFame] = useState<HallOfFameEntry[]>([]);

  const [firebaseSession, setFirebaseSession] = useState<AuthSession | null>(null);

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('fall-2026');

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, '', to);
    setPathname(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || '/');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Auth listener
  useEffect(() => {
    testFirestoreConnection();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseSession(null);
        setFsOwnStudent(null);
        return;
      }

      const email = (user.email || '').toLowerCase();
      let isAdmin = email === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() && user.emailVerified;

      if (!isAdmin) {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          if (adminSnap.exists()) isAdmin = true;
        } catch {
          // Non-admin user
        }
      }

      let studentProfile: StudentProfile | null = null;
      try {
        const stuSnap = await getDoc(doc(db, 'students', user.uid));
        if (stuSnap.exists()) {
          const d = stuSnap.data();
          studentProfile = {
            id: String(d.id || user.uid),
            name: String(d.name || user.displayName || 'Student'),
            photoUrl: String(d.photoUrl || ''),
            role: 'student',
            approved: Boolean(d.approved),
            createdAt: tsToMs(d.createdAt),
          };
          setFsOwnStudent(studentProfile);
        }
      } catch {
        setFsOwnStudent(null);
      }

      setFirebaseSession({
        uid: user.uid,
        email: user.email || '',
        name: studentProfile?.name || user.displayName || (isAdmin ? 'Class Instructor' : 'Student'),
        role: isAdmin ? 'admin' : 'student',
        approved: isAdmin ? true : Boolean(studentProfile?.approved),
        photoUrl: studentProfile?.photoUrl || user.photoURL || '',
      });
    });

    return () => unsub();
  }, []);

  const session = firebaseSession;
  const isAdminSession = session?.role === 'admin';

  // Real-time Firestore listeners
  useEffect(() => {
    setLoading(true);
    const studentsQuery = isAdminSession
      ? collection(db, 'students')
      : query(collection(db, 'students'), where('approved', '==', true));

    const unsubStudents = onSnapshot(
      studentsQuery,
      (snap) => {
        const list: StudentProfile[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            name: String(data.name || ''),
            photoUrl: String(data.photoUrl || ''),
            role: 'student',
            approved: Boolean(data.approved),
            createdAt: tsToMs(data.createdAt),
          };
        });
        setFsStudents(list);
        setLoading(false);
      },
      (err) => {
        console.error('Students subscription error:', err);
        setLoading(false);
      }
    );

    const unsubLogs = onSnapshot(
      collection(db, 'point_logs'),
      (snap) => {
        const list: PointLog[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            studentId: String(data.studentId || ''),
            seasonId: String(data.seasonId || ''),
            action: String(data.action || ''),
            points: Number(data.points || 0),
            note: String(data.note || ''),
            createdAt: tsToMs(data.createdAt),
          };
        });
        setFsLogs(list);
      },
      (err) => console.error('Logs subscription error:', err)
    );

    const unsubSeasons = onSnapshot(
      collection(db, 'seasons'),
      (snap) => {
        const list: Season[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            name: String(data.name || ''),
            startDate: String(data.startDate || ''),
            endDate: String(data.endDate || ''),
            active: Boolean(data.active),
            createdAt: tsToMs(data.createdAt),
          };
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setFsSeasons(list);
      },
      (err) => console.error('Seasons subscription error:', err)
    );

    const unsubExams = onSnapshot(
      collection(db, 'exams'),
      (snap) => {
        const list: Exam[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            name: String(data.name || ''),
            seasonId: String(data.seasonId || ''),
            createdAt: tsToMs(data.createdAt),
          };
        });
        setFsExams(list);
      },
      (err) => console.error('Exams subscription error:', err)
    );

    const unsubExamScores = onSnapshot(
      collection(db, 'exam_scores'),
      (snap) => {
        const list: ExamScore[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            studentId: String(data.studentId || ''),
            examId: String(data.examId || ''),
            seasonId: String(data.seasonId || ''),
            score: Number(data.score || 0),
            pointsAwarded: Number(data.pointsAwarded || 0),
            createdAt: tsToMs(data.createdAt),
          };
        });
        setFsExamScores(list);
      },
      (err) => console.error('Exam scores subscription error:', err)
    );

    const unsubHof = onSnapshot(
      collection(db, 'hall_of_fame'),
      (snap) => {
        const list: HallOfFameEntry[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            seasonId: String(data.seasonId || ''),
            seasonName: String(data.seasonName || ''),
            studentId: String(data.studentId || ''),
            studentName: String(data.studentName || ''),
            photoUrl: String(data.photoUrl || ''),
            rank: (Number(data.rank) as 1 | 2 | 3) || 1,
            totalPoints: Number(data.totalPoints || 0),
            createdAt: tsToMs(data.createdAt),
          };
        });
        setFsHallOfFame(list);
      },
      (err) => console.error('Hall of fame subscription error:', err)
    );

    return () => {
      unsubStudents();
      unsubLogs();
      unsubSeasons();
      unsubExams();
      unsubExamScores();
      unsubHof();
    };
  }, [isAdminSession]);

  // Combine live vs preview data
  const mergedFsStudents = useMemo(() => {
    if (!fsOwnStudent) return fsStudents;
    if (fsStudents.some((s) => s.id === fsOwnStudent.id)) return fsStudents;
    return [...fsStudents, fsOwnStudent];
  }, [fsStudents, fsOwnStudent]);

  const students = mergedFsStudents;
  const logs = fsLogs;
  const seasons = fsSeasons;
  const exams = fsExams;
  const examScores = fsExamScores;
  const hallOfFame = fsHallOfFame;

  // Keep selectedSeasonId aligned with the single active season by default
  useEffect(() => {
    if (seasons.length === 0) return;
    const active = seasons.find((s) => s.active) ?? seasons[0];
    const exists = seasons.some((s) => s.id === selectedSeasonId);
    if (!exists || (selectedSeasonId === 'fall-2026' && active.id !== 'fall-2026')) {
      setSelectedSeasonId(active.id);
    }
  }, [seasons, selectedSeasonId]);

  const rankedStudents = useMemo(
    () => computeLeaderboard(students, logs, selectedSeasonId),
    [students, logs, selectedSeasonId]
  );

  const weeklyMvp = useMemo(() => findWeeklyMvp(rankedStudents), [rankedStudents]);

  const pendingStudents = useMemo(
    () => students.filter((s) => !s.approved).sort((a, b) => b.createdAt - a.createdAt),
    [students]
  );

  const loginWithEmail = useCallback(
    async (emailInput: string, password: string): Promise<{ ok: boolean; error?: string; role?: string }> => {
      const email = emailInput.trim().toLowerCase();
      if (!email || !password) {
        return { ok: false, error: 'Please enter both your email and password.' };
      }

      // Check server-configured ADMIN_EMAIL / ADMIN_PASSWORD first
      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
          try {
            await signInWithEmailAndPassword(auth, email, password);
            return { ok: true, role: 'admin' };
          } catch {
            return {
              ok: false,
              error:
                'Admin credentials matched server config, but this email/password account is not yet enabled or created in Firebase Authentication.',
            };
          }
        }
      } catch {
        // Continue to Firebase client auth
      }

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const isBootstrappedAdmin =
          (cred.user.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
          cred.user.emailVerified;
        return { ok: true, role: isBootstrappedAdmin ? 'admin' : 'student' };
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          return {
            ok: false,
            error:
              'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method).',
          };
        }
        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
          return { ok: false, error: 'Invalid email or password.' };
        }
        return { ok: false, error: err instanceof Error ? err.message : 'Unable to sign in.' };
      }
    },
    []
  );

  const signupStudent = useCallback(
    async ({ name, email, password, photoUrl }: SignupPayload): Promise<{ ok: boolean; error?: string; pending?: boolean }> => {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (trimmedName.length < 2) {
        return { ok: false, error: 'Full name must be at least 2 characters.' };
      }
      if (!trimmedEmail.includes('@')) {
        return { ok: false, error: 'Please enter a valid university email address.' };
      }
      if (!trimmedEmail.endsWith('@uca.ac.ma') || trimmedEmail === '@uca.ac.ma') {
        return { ok: false, error: 'Only UCA university emails are accepted (@uca.ac.ma)' };
      }
      if (password.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' };
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(cred.user, { displayName: trimmedName });
        await setDoc(doc(db, 'students', cred.user.uid), {
          id: cred.user.uid,
          name: trimmedName,
          photoUrl,
          role: 'student',
          approved: false,
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, 'users_private', cred.user.uid), {
          uid: cred.user.uid,
          email: trimmedEmail,
          role: 'student',
          createdAt: serverTimestamp(),
        });
        return { ok: true, pending: true };
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          return {
            ok: false,
            error:
              'Email/Password sign-up is not yet enabled in Firebase Console (Authentication → Sign-in method).',
          };
        }
        if (code === 'auth/email-already-in-use') {
          return { ok: false, error: 'An account with this email already exists.' };
        }
        return { ok: false, error: err instanceof Error ? err.message : 'Registration failed.' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
    navigate('/');
  }, [navigate]);

  const approveStudent = useCallback(async (studentId: string) => {
    await updateDoc(doc(db, 'students', studentId), { approved: true });
  }, []);

  const rejectStudent = useCallback(async (studentId: string) => {
    await deleteDoc(doc(db, 'students', studentId));
  }, []);

  const updateStudentProfile = useCallback(
    async (
      studentId: string,
      payload: { name: string; photoUrl: string }
    ): Promise<{ ok: boolean; error?: string }> => {
      const trimmedName = payload.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 80) {
        return { ok: false, error: 'Student name must be between 2 and 80 characters.' };
      }
      if (payload.photoUrl.length > 120000) {
        return { ok: false, error: 'Profile image is too large. Please choose a smaller photo.' };
      }
      try {
        await updateDoc(doc(db, 'students', studentId), {
          name: trimmedName,
          photoUrl: payload.photoUrl,
        });
        setFsOwnStudent((prev) =>
          prev && prev.id === studentId ? { ...prev, name: trimmedName, photoUrl: payload.photoUrl } : prev
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Failed to update student.' };
      }
    },
    []
  );

  const updateOwnPhoto = useCallback(
    async (photoUrl: string): Promise<{ ok: boolean; error?: string }> => {
      if (!session || session.role !== 'student') {
        return { ok: false, error: 'Only signed-in students can update their profile photo.' };
      }
      if (photoUrl.length > 120000) {
        return { ok: false, error: 'Profile image is too large. Please choose a smaller photo.' };
      }
      try {
        await updateDoc(doc(db, 'students', session.uid), { photoUrl });
        setFsOwnStudent((prev) => (prev && prev.id === session.uid ? { ...prev, photoUrl } : prev));
        setFirebaseSession((prev) => (prev && prev.uid === session.uid ? { ...prev, photoUrl } : prev));
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Failed to update profile photo.' };
      }
    },
    [session]
  );

  const deleteStudent = useCallback(async (studentId: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const [logsSnap, scoresSnap, hofSnap] = await Promise.all([
        getDocs(query(collection(db, 'point_logs'), where('studentId', '==', studentId))),
        getDocs(query(collection(db, 'exam_scores'), where('studentId', '==', studentId))),
        getDocs(query(collection(db, 'hall_of_fame'), where('studentId', '==', studentId))),
      ]);

      const refs = [
        ...logsSnap.docs.map((d) => d.ref),
        ...scoresSnap.docs.map((d) => d.ref),
        ...hofSnap.docs.map((d) => d.ref),
        doc(db, 'users_private', studentId),
        doc(db, 'students', studentId),
      ];

      // Firestore writeBatch supports up to 500 operations per commit
      for (let i = 0; i < refs.length; i += 400) {
        const batch = writeBatch(db);
        for (const ref of refs.slice(i, i + 400)) {
          batch.delete(ref);
        }
        await batch.commit();
      }

      setFsOwnStudent((prev) => (prev && prev.id === studentId ? null : prev));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete student.' };
    }
  }, []);

  const awardPoints = useCallback(
    async (payload: AddPointsPayload): Promise<{ ok: boolean; error?: string }> => {
      const def = getActionDefinition(payload.actionId);
      if (!def) return { ok: false, error: 'Please select a valid action.' };
      if (!payload.studentId) return { ok: false, error: 'Please select a student.' };

      const targetSeason = selectedSeasonId || seasons.find((s) => s.active)?.id || 'fall-2026';
      const studentLogs = logs.filter((l) => l.studentId === payload.studentId && l.seasonId === targetSeason);

      const eligibility = canClaimAction(payload.actionId, studentLogs, payload.clubName);
      if (!eligibility.allowed) {
        return { ok: false, error: eligibility.reason };
      }

      let finalPoints = def.points;
      let finalNote = payload.note.trim();

      if (def.frequency === 'once_per_club') {
        finalNote = payload.clubName?.trim() || finalNote;
      } else if (def.frequency === 'per_exam') {
        if (!payload.examId) return { ok: false, error: 'Please select an exam.' };
        const scoreVal = Number(payload.examScore);
        try {
          finalPoints = calculateExamPoints(scoreVal);
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Invalid exam score.' };
        }
        const exam = exams.find((e) => e.id === payload.examId);
        finalNote = `${exam?.name || 'Exam'} (${scoreVal}/20)${finalNote ? ` — ${finalNote}` : ''}`;
      } else if (def.frequency === 'manual') {
        const pts = Number(payload.customPoints);
        if (!Number.isFinite(pts) || pts === 0) {
          return { ok: false, error: 'Enter a non-zero integer for manual adjustment.' };
        }
        if (!finalNote) {
          return { ok: false, error: 'A custom reason note is required for manual point adjustments.' };
        }
        finalPoints = Math.round(pts);
      }

      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      try {
        await setDoc(doc(db, 'point_logs', logId), {
          id: logId,
          studentId: payload.studentId,
          seasonId: targetSeason,
          action: def.label,
          points: finalPoints,
          note: finalNote,
          createdAt: serverTimestamp(),
        });
        if (def.frequency === 'per_exam' && payload.examId) {
          const scoreId = `es_${Date.now()}`;
          await setDoc(doc(db, 'exam_scores', scoreId), {
            id: scoreId,
            studentId: payload.studentId,
            examId: payload.examId,
            seasonId: targetSeason,
            score: Number(payload.examScore),
            pointsAwarded: finalPoints,
            createdAt: serverTimestamp(),
          });
        }
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Failed to save points.' };
      }
    },
    [exams, logs, seasons, selectedSeasonId]
  );

  const createExam = useCallback(async (name: string, seasonId: string): Promise<{ ok: boolean; error?: string }> => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return { ok: false, error: 'Exam name must be at least 2 characters.' };
    const id = `exam_${Date.now()}`;

    try {
      await setDoc(doc(db, 'exams', id), {
        id,
        name: trimmed,
        seasonId,
        createdAt: serverTimestamp(),
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to create exam.' };
    }
  }, []);

  const createAndResetSeason = useCallback(
    async (name: string, startDate: string, endDate: string): Promise<{ ok: boolean; error?: string }> => {
      const trimmed = name.trim();
      if (trimmed.length < 2) return { ok: false, error: 'Season name is required.' };
      const newId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `season_${Date.now()}`;

      const currentActive = seasons.find((s) => s.active);
      const top3 = currentActive
        ? buildHallOfFameTop3(computeLeaderboard(students, logs, currentActive.id), currentActive)
        : [];

      try {
        const batch = writeBatch(db);
        if (currentActive) {
          batch.update(doc(db, 'seasons', currentActive.id), { active: false });
        }
        batch.set(doc(db, 'seasons', newId), {
          id: newId,
          name: trimmed,
          startDate,
          endDate,
          active: true,
          createdAt: serverTimestamp(),
        });
        for (const entry of top3) {
          batch.set(doc(db, 'hall_of_fame', entry.id), {
            ...entry,
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
        setSelectedSeasonId(newId);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Failed to reset season.' };
      }
    },
    [logs, seasons, students]
  );

  const seedFirestoreCohort = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const dataset = createSampleDataset();
      const batch1 = writeBatch(db);
      for (const s of dataset.seasons) {
        batch1.set(doc(db, 'seasons', s.id), { ...s, createdAt: serverTimestamp() });
      }
      for (const st of dataset.students) {
        batch1.set(doc(db, 'students', st.id), { ...st, createdAt: serverTimestamp() });
      }
      for (const ex of dataset.exams) {
        batch1.set(doc(db, 'exams', ex.id), { ...ex, createdAt: serverTimestamp() });
      }
      await batch1.commit();

      const batch2 = writeBatch(db);
      for (const l of dataset.logs) {
        batch2.set(doc(db, 'point_logs', l.id), { ...l, createdAt: serverTimestamp() });
      }
      for (const es of dataset.examScores) {
        batch2.set(doc(db, 'exam_scores', es.id), { ...es, createdAt: serverTimestamp() });
      }
      for (const h of dataset.hallOfFame) {
        batch2.set(doc(db, 'hall_of_fame', h.id), { ...h, createdAt: serverTimestamp() });
      }
      await batch2.commit();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to seed Firestore.' };
    }
  }, []);

  const value: AppContextValue = {
    pathname,
    navigate,
    loading,
    error,
    clearError: () => setError(null),
    session,
    students,
    logs,
    seasons,
    exams,
    examScores,
    hallOfFame,
    selectedSeasonId,
    setSelectedSeasonId,
    rankedStudents,
    weeklyMvp,
    pendingStudents,
    loginWithEmail,
    signupStudent,
    logout,
    approveStudent,
    rejectStudent,
    updateStudentProfile,
    updateOwnPhoto,
    deleteStudent,
    awardPoints,
    createExam,
    createAndResetSeason,
    seedFirestoreCohort,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
