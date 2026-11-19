import type {
  HallOfFameEntry,
  PointActionDefinition,
  PointLog,
  RankedStudent,
  Season,
  StudentLevel,
  StudentProfile,
} from '../types';

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const POINT_ACTIONS: PointActionDefinition[] = [
  {
    id: 'present_class',
    label: 'Present in front of class',
    points: 15,
    frequency: 'repeatable',
    description: 'Delivered a case study, campaign pitch, or presentation to the cohort.',
  },
  {
    id: 'weekly_attendance',
    label: '100% attendance that week',
    points: 10,
    frequency: 'repeatable',
    description: 'Attended all scheduled lectures and workshops for the week.',
  },
  {
    id: 'help_classmate',
    label: 'Help a classmate with a project',
    points: 10,
    frequency: 'repeatable',
    description: 'Supported a peer with analytics, copywriting, or campaign setup.',
  },
  {
    id: 'linkedin_complete',
    label: 'LinkedIn profile completed & active',
    points: 20,
    frequency: 'once_per_student',
    description: 'Optimized headline, portfolio projects, and weekly marketing insights.',
  },
  {
    id: 'joined_club',
    label: 'Joined a club',
    points: 30,
    frequency: 'once_per_club',
    description: 'Became an active member of a university marketing or tech club.',
  },
  {
    id: 'exam_score',
    label: 'Exam score',
    points: 0,
    frequency: 'per_exam',
    description: 'Calculated automatically as score × 10 points.',
  },
  {
    id: 'absent_unexcused',
    label: 'Absent without reason',
    points: -5,
    frequency: 'repeatable',
    description: 'Unexcused absence from a mandatory seminar or workshop.',
  },
  {
    id: 'late_submission',
    label: 'Late submission',
    points: -5,
    frequency: 'repeatable',
    description: 'Deliverable submitted past the published deadline.',
  },
  {
    id: 'manual_adjustment',
    label: 'Manual adjustment',
    points: 0,
    frequency: 'manual',
    description: 'Custom point adjustment with explicit instructor reason.',
  },
];

export function getActionDefinition(actionId: string): PointActionDefinition | undefined {
  return POINT_ACTIONS.find((a) => a.id === actionId || a.label === actionId);
}

export function calculateExamPoints(score: number): number {
  if (!Number.isFinite(score) || score < 0 || score > 20) {
    throw new Error('Exam score must be between 0 and 20.');
  }
  return Math.round(score * 10);
}

export function normalizeClubNote(clubName: string): string {
  return clubName.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function canClaimAction(
  actionId: string,
  studentLogs: PointLog[],
  clubName?: string
): { allowed: boolean; reason?: string } {
  const def = getActionDefinition(actionId);
  if (!def) {
    return { allowed: false, reason: 'Unknown point action.' };
  }

  if (def.frequency === 'once_per_student') {
    const alreadyClaimed = studentLogs.some((log) => log.action === def.label);
    if (alreadyClaimed) {
      return {
        allowed: false,
        reason: `"${def.label}" can only be awarded once per student.`,
      };
    }
  }

  if (def.frequency === 'once_per_club') {
    const normalizedClub = normalizeClubNote(clubName ?? '');
    if (!normalizedClub) {
      return {
        allowed: false,
        reason: 'Please specify the club name to prevent duplicate awards.',
      };
    }
    const alreadyInClub = studentLogs.some(
      (log) =>
        log.action === def.label &&
        normalizeClubNote(log.note) === normalizedClub
    );
    if (alreadyInClub) {
      return {
        allowed: false,
        reason: `Student has already received points for joining "${clubName?.trim()}".`,
      };
    }
  }

  return { allowed: true };
}

export function computeLeaderboard(
  students: StudentProfile[],
  logs: PointLog[],
  seasonId: string,
  nowMs: number = Date.now()
): RankedStudent[] {
  const approvedStudents = students.filter((s) => s.approved);
  const weekCutoff = nowMs - WEEK_MS;

  const totalsByStudent = new Map<string, { total: number; weekly: number; count: number }>();

  for (const log of logs) {
    if (seasonId !== 'all' && log.seasonId !== seasonId) continue;
    const prev = totalsByStudent.get(log.studentId) ?? { total: 0, weekly: 0, count: 0 };
    prev.total += log.points;
    prev.count += 1;
    if (log.createdAt >= weekCutoff && log.createdAt <= nowMs) {
      prev.weekly += log.points;
    }
    totalsByStudent.set(log.studentId, prev);
  }

  const combined = approvedStudents.map((student) => {
    const stats = totalsByStudent.get(student.id) ?? { total: 0, weekly: 0, count: 0 };
    return {
      ...student,
      rank: 0,
      totalPoints: stats.total,
      weeklyPoints: stats.weekly,
      logCount: stats.count,
    };
  });

  combined.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.weeklyPoints !== a.weeklyPoints) return b.weeklyPoints - a.weeklyPoints;
    return a.name.localeCompare(b.name);
  });

  return combined.map((student, index) => ({
    ...student,
    rank: index + 1,
  }));
}

export function findWeeklyMvp(rankedStudents: RankedStudent[]): RankedStudent | null {
  const contenders = rankedStudents.filter((s) => s.weeklyPoints > 0);
  if (contenders.length === 0) return null;

  return [...contenders].sort((a, b) => {
    if (b.weeklyPoints !== a.weeklyPoints) return b.weeklyPoints - a.weeklyPoints;
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.name.localeCompare(b.name);
  })[0];
}

export function computeNextRankGap(
  rankedStudents: RankedStudent[],
  studentId: string
): { targetRank: number | null; pointsAway: number; message: string } {
  const index = rankedStudents.findIndex((s) => s.id === studentId);
  if (index === -1) {
    return {
      targetRank: null,
      pointsAway: 0,
      message: 'Your account is pending approval before ranking starts.',
    };
  }
  if (index === 0) {
    return {
      targetRank: 1,
      pointsAway: 0,
      message: 'You are leading the class at rank #1.',
    };
  }

  const current = rankedStudents[index];
  const above = rankedStudents[index - 1];
  const diff = Math.max(1, above.totalPoints - current.totalPoints + (above.totalPoints === current.totalPoints ? 1 : 0));

  return {
    targetRank: above.rank,
    pointsAway: diff,
    message: `You are ${diff} ${diff === 1 ? 'point' : 'points'} away from rank #${above.rank}`,
  };
}

export function buildHallOfFameTop3(
  rankedStudents: RankedStudent[],
  season: Season,
  createdAt: number = Date.now()
): HallOfFameEntry[] {
  return rankedStudents.slice(0, 3).map((student, idx) => ({
    id: `hof_${season.id}_${idx + 1}`,
    seasonId: season.id,
    seasonName: season.name,
    studentId: student.id,
    studentName: student.name,
    photoUrl: student.photoUrl,
    rank: (idx + 1) as 1 | 2 | 3,
    totalPoints: student.totalPoints,
    createdAt,
  }));
}

export function filterRankedStudents(
  rankedStudents: RankedStudent[],
  query: string
): RankedStudent[] {
  const q = query.trim().toLowerCase();
  if (!q) return rankedStudents;
  return rankedStudents.filter((s) => s.name.toLowerCase().includes(q));
}

export const STUDENT_LEVELS: StudentLevel[] = [
  { level: 1, name: 'Starter', icon: '🌱', minPoints: 0, nextLevelPoints: 50 },
  { level: 2, name: 'Learner', icon: '📚', minPoints: 50, nextLevelPoints: 150 },
  { level: 3, name: 'Active', icon: '⚡', minPoints: 150, nextLevelPoints: 300 },
  { level: 4, name: 'Skilled', icon: '🔥', minPoints: 300, nextLevelPoints: 500 },
  { level: 5, name: 'Elite', icon: '👑', minPoints: 500, nextLevelPoints: null },
];

export function getStudentLevel(points: number): StudentLevel {
  const safePoints = Number.isFinite(points) ? points : 0;
  if (safePoints >= 500) return STUDENT_LEVELS[4];
  if (safePoints >= 300) return STUDENT_LEVELS[3];
  if (safePoints >= 150) return STUDENT_LEVELS[2];
  if (safePoints >= 50) return STUDENT_LEVELS[1];
  return STUDENT_LEVELS[0];
}
