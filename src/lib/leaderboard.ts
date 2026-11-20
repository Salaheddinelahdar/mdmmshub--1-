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

export function categorizePointActions(
  actions: PointActionDefinition[] = POINT_ACTIONS
): {
  earning: PointActionDefinition[];
  penalties: PointActionDefinition[];
  manual: PointActionDefinition[];
} {
  return {
    earning: actions.filter((a) => a.points > 0 || a.frequency === 'per_exam'),
    penalties: actions.filter((a) => a.points < 0),
    manual: actions.filter((a) => a.frequency === 'manual'),
  };
}

export function formatActionFrequency(frequency: PointActionDefinition['frequency']): string {
  switch (frequency) {
    case 'repeatable':
      return 'Repeatable';
    case 'once_per_student':
      return 'Once per student';
    case 'once_per_club':
      return 'Once per club';
    case 'per_exam':
      return 'Per exam';
    case 'manual':
      return 'Instructor discretion';
  }
}

export function formatLevelRange(level: StudentLevel): string {
  if (level.nextLevelPoints === null) {
    return `${level.minPoints}+ pts`;
  }
  return `${level.minPoints} – ${level.nextLevelPoints - 1} pts`;
}

export const MOROCCO_TIMEZONE = 'Africa/Casablanca';

const WEEKDAY_INDEX_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const casablancaFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MOROCCO_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export interface CasablancaDateParts {
  year: number;
  month: number;
  day: number;
  weekdayIndex: number; // 0 = Sun, 1 = Mon, ...
  hour: number;
  minute: number;
  second: number;
}

export function getCasablancaDateParts(epochMs: number): CasablancaDateParts {
  const parts = casablancaFormatter.formatToParts(new Date(epochMs));
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    weekdayIndex: WEEKDAY_INDEX_MAP[map.weekday] ?? 0,
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

export function casablancaWallTimeToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number = 0
): number {
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  let guess = desiredAsUtc;
  for (let i = 0; i < 2; i++) {
    const actual = getCasablancaDateParts(guess);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
      0
    );
    const diff = desiredAsUtc - actualAsUtc;
    if (diff === 0) break;
    guess += diff;
  }
  return guess;
}

export function getNextMondayCasablancaMs(fromMs: number): number {
  const parts = getCasablancaDateParts(fromMs);
  const daysSinceMonday = (parts.weekdayIndex + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const daysToAdd = daysSinceMonday === 0 ? 0 : 7 - daysSinceMonday;

  const targetCal = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + daysToAdd));
  let candidateMs = casablancaWallTimeToUtcMs(
    targetCal.getUTCFullYear(),
    targetCal.getUTCMonth() + 1,
    targetCal.getUTCDate(),
    0,
    1,
    0
  );

  if (candidateMs <= fromMs) {
    const nextWeekCal = new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day + daysToAdd + 7)
    );
    candidateMs = casablancaWallTimeToUtcMs(
      nextWeekCal.getUTCFullYear(),
      nextWeekCal.getUTCMonth() + 1,
      nextWeekCal.getUTCDate(),
      0,
      1,
      0
    );
  }

  return candidateMs;
}

export function getWeeklyWinnersRevealState(
  students: StudentProfile[],
  nowMs: number = Date.now()
): {
  hasRevealed: boolean;
  targetMs: number;
  firstApprovedAt: number | null;
} {
  const approved = students.filter((s) => s.approved);
  if (approved.length === 0) {
    return {
      hasRevealed: false,
      targetMs: getNextMondayCasablancaMs(nowMs),
      firstApprovedAt: null,
    };
  }

  const firstApprovedAt = Math.min(...approved.map((s) => s.createdAt));
  const firstRevealMondayMs = getNextMondayCasablancaMs(firstApprovedAt);

  return {
    hasRevealed: nowMs >= firstRevealMondayMs,
    targetMs: firstRevealMondayMs,
    firstApprovedAt,
  };
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function getCountdownParts(remainingMs: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
}

export interface ProgressChartAction {
  id: string;
  action: string;
  points: number;
}

export interface ProgressChartPoint {
  key: string;
  dateKey: string;
  dateLabel: string;
  fullDateLabel: string;
  dayPoints: number;
  cumulativePoints: number;
  actions: ProgressChartAction[];
  tooltipSummary: string;
  createdAt: number;
}

export const LEVEL_CHART_MARKERS: Array<{
  points: number;
  icon: string;
  shortLabel: string;
  color: string;
}> = [
  { points: 50, icon: '🌱', shortLabel: '🌱 50', color: '#94A3B8' },
  { points: 150, icon: '📚', shortLabel: '📚 150', color: '#818CF8' },
  { points: 300, icon: '⚡', shortLabel: '⚡ 300', color: '#A78BFA' },
  { points: 500, icon: '🔥', shortLabel: '🔥 500', color: '#FBBF24' },
];

const shortDateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: MOROCCO_TIMEZONE,
});

const fullDateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: MOROCCO_TIMEZONE,
});

export function getCasablancaDayKey(epochMs: number): string {
  const parts = getCasablancaDateParts(epochMs);
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  return `${parts.year}-${mm}-${dd}`;
}

export function buildStudentProgressSeries(logs: PointLog[]): ProgressChartPoint[] {
  if (logs.length === 0) return [];
  const chronological = [...logs].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id.localeCompare(b.id);
  });

  const dayMap = new Map<
    string,
    {
      dateKey: string;
      dateLabel: string;
      fullDateLabel: string;
      dayPoints: number;
      actions: ProgressChartAction[];
      createdAt: number;
    }
  >();

  for (const log of chronological) {
    const dateKey = getCasablancaDayKey(log.createdAt);
    const existing = dayMap.get(dateKey);
    if (existing) {
      existing.dayPoints += log.points;
      existing.actions.push({ id: log.id, action: log.action, points: log.points });
      existing.createdAt = Math.max(existing.createdAt, log.createdAt);
    } else {
      const d = new Date(log.createdAt);
      dayMap.set(dateKey, {
        dateKey,
        dateLabel: shortDateFmt.format(d),
        fullDateLabel: fullDateFmt.format(d),
        dayPoints: log.points,
        actions: [{ id: log.id, action: log.action, points: log.points }],
        createdAt: log.createdAt,
      });
    }
  }

  let cumulative = 0;
  const result: ProgressChartPoint[] = [];
  for (const day of dayMap.values()) {
    cumulative += day.dayPoints;
    const signedPts = day.dayPoints >= 0 ? `+${day.dayPoints} pts` : `${day.dayPoints} pts`;
    const actionNames = day.actions.map((a) => a.action).join(', ');
    result.push({
      key: day.dateKey,
      dateKey: day.dateKey,
      dateLabel: day.dateLabel,
      fullDateLabel: day.fullDateLabel,
      dayPoints: day.dayPoints,
      cumulativePoints: cumulative,
      actions: day.actions,
      tooltipSummary: `${day.dateLabel} · ${signedPts} · ${actionNames}`,
      createdAt: day.createdAt,
    });
  }

  return result;
}

export function getProgressChartDomain(series: ProgressChartPoint[]): [number, number] {
  if (series.length === 0) return [0, 560];
  const minCumulative = Math.min(0, ...series.map((p) => p.cumulativePoints));
  const maxCumulative = Math.max(0, ...series.map((p) => p.cumulativePoints));
  const minY = minCumulative < 0 ? Math.floor((minCumulative - 10) / 10) * 10 : 0;
  const maxY = Math.max(560, Math.ceil((maxCumulative + 50) / 50) * 50);
  return [minY, maxY];
}

export interface DayLogGroup {
  dateKey: string;
  dateLabel: string;
  dayTotal: number;
  items: PointLog[];
}

export function groupLogsByDay(logs: PointLog[]): DayLogGroup[] {
  if (logs.length === 0) return [];
  const sortedDesc = [...logs].sort((a, b) => {
    if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt;
    return b.id.localeCompare(a.id);
  });

  const groups: DayLogGroup[] = [];
  const byKey = new Map<string, DayLogGroup>();

  for (const log of sortedDesc) {
    const dateKey = getCasablancaDayKey(log.createdAt);
    let group = byKey.get(dateKey);
    if (!group) {
      group = {
        dateKey,
        dateLabel: fullDateFmt.format(new Date(log.createdAt)),
        dayTotal: 0,
        items: [],
      };
      byKey.set(dateKey, group);
      groups.push(group);
    }
    group.dayTotal += log.points;
    group.items.push(log);
  }

  return groups;
}
