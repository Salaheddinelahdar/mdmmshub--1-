import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHallOfFameTop3,
  buildStudentProgressSeries,
  calculateExamPoints,
  canClaimAction,
  casablancaWallTimeToUtcMs,
  categorizePointActions,
  computeLeaderboard,
  computeNextRankGap,
  filterRankedStudents,
  findWeeklyMvp,
  formatActionFrequency,
  formatLevelRange,
  getCasablancaDateParts,
  getCountdownParts,
  getNextMondayCasablancaMs,
  getProgressChartDomain,
  getStudentLevel,
  getWeeklyWinnersRevealState,
  groupLogsByDay,
  POINT_ACTIONS,
  STUDENT_LEVELS,
} from './leaderboard';
import type { PointLog, Season, StudentProfile } from '../types';

const NOW = 1_760_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

const sampleStudents: StudentProfile[] = [
  { id: 's1', name: 'Salma Bennani', photoUrl: '', role: 'student', approved: true, createdAt: NOW - 30 * DAY },
  { id: 's2', name: 'Youssef El Amrani', photoUrl: '', role: 'student', approved: true, createdAt: NOW - 30 * DAY },
  { id: 's3', name: 'Kenza Tazi', photoUrl: '', role: 'student', approved: true, createdAt: NOW - 30 * DAY },
  { id: 's4', name: 'Pending Student', photoUrl: '', role: 'student', approved: false, createdAt: NOW - 2 * DAY },
];

const sampleLogs: PointLog[] = [
  { id: 'l1', studentId: 's1', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'SEO audit', createdAt: NOW - 10 * DAY },
  { id: 'l2', studentId: 's1', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 4', createdAt: NOW - 2 * DAY },
  { id: 'l3', studentId: 's2', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'Digital Marketers Club', createdAt: NOW - 3 * DAY },
  { id: 'l4', studentId: 's2', seasonId: 'fall-2026', action: 'Absent without reason', points: -5, note: 'Missed Tuesday workshop', createdAt: NOW - 1 * DAY },
  { id: 'l5', studentId: 's3', seasonId: 'fall-2026', action: 'Exam score', points: 160, note: 'Midterm (16/20)', createdAt: NOW - 12 * DAY },
  { id: 'l6', studentId: 's4', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'Ignored because unapproved', createdAt: NOW - 1 * DAY },
];

test('computeLeaderboard excludes unapproved students and sorts by total points', () => {
  const ranked = computeLeaderboard(sampleStudents, sampleLogs, 'fall-2026', NOW);
  assert.equal(ranked.length, 3);
  assert.equal(ranked[0].id, 's3');
  assert.equal(ranked[0].totalPoints, 160);
  assert.equal(ranked[0].rank, 1);

  assert.equal(ranked[1].id, 's2');
  assert.equal(ranked[1].totalPoints, 25);
  assert.equal(ranked[1].weeklyPoints, 25);

  assert.equal(ranked[2].id, 's1');
  assert.equal(ranked[2].totalPoints, 25);
  assert.equal(ranked[2].weeklyPoints, 10);
});

test('tie-breaker ranks higher weeklyPoints ahead when totalPoints match', () => {
  const ranked = computeLeaderboard(sampleStudents, sampleLogs, 'fall-2026', NOW);
  // Both s1 and s2 have 25 totalPoints, s2 has 25 weeklyPoints vs s1's 10 weeklyPoints
  assert.equal(ranked[1].id, 's2');
  assert.equal(ranked[2].id, 's1');
});

test('findWeeklyMvp picks highest positive weekly point gainer', () => {
  const ranked = computeLeaderboard(sampleStudents, sampleLogs, 'fall-2026', NOW);
  const mvp = findWeeklyMvp(ranked);
  assert.ok(mvp);
  assert.equal(mvp.id, 's2');
  assert.equal(mvp.weeklyPoints, 25);
});

test('computeNextRankGap computes motivational gap line accurately', () => {
  const ranked = computeLeaderboard(sampleStudents, sampleLogs, 'fall-2026', NOW);
  const gapTop = computeNextRankGap(ranked, 's3');
  assert.equal(gapTop.targetRank, 1);
  assert.equal(gapTop.pointsAway, 0);

  const gapSecond = computeNextRankGap(ranked, 's2');
  assert.equal(gapSecond.targetRank, 1);
  assert.equal(gapSecond.pointsAway, 135);
  assert.equal(gapSecond.message, 'You are 135 points away from rank #1');
});

test('canClaimAction enforces once_per_student for LinkedIn and once_per_club for clubs', () => {
  const logs: PointLog[] = [
    { id: 'a', studentId: 's1', seasonId: 'fall-2026', action: 'LinkedIn profile completed & active', points: 20, note: '', createdAt: NOW },
    { id: 'b', studentId: 's1', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'Growth Lab Club', createdAt: NOW },
  ];

  assert.equal(canClaimAction('linkedin_complete', logs).allowed, false);
  assert.equal(canClaimAction('joined_club', logs, '  growth lab club ').allowed, false);
  assert.equal(canClaimAction('joined_club', logs, 'Brand Studio Club').allowed, true);
  assert.equal(canClaimAction('present_class', logs).allowed, true);
});

test('calculateExamPoints multiplies score by 10 and validates range', () => {
  assert.equal(calculateExamPoints(17.5), 175);
  assert.throws(() => calculateExamPoints(-1));
  assert.throws(() => calculateExamPoints(21));
});

test('buildHallOfFameTop3 archives top 3 and filterRankedStudents matches case-insensitively', () => {
  const ranked = computeLeaderboard(sampleStudents, sampleLogs, 'fall-2026', NOW);
  const season: Season = { id: 'fall-2026', name: 'Fall 2026', startDate: '2026-09-01', endDate: '2026-12-20', active: true, createdAt: NOW };
  const hof = buildHallOfFameTop3(ranked, season, NOW);
  assert.equal(hof.length, 3);
  assert.equal(hof[0].rank, 1);
  assert.equal(hof[0].studentName, 'Kenza Tazi');

  const filtered = filterRankedStudents(ranked, 'salma');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 's1');
});

test('getStudentLevel computes level automatically from totalPoints across all tiers', () => {
  assert.deepEqual(
    { level: getStudentLevel(-5).level, name: getStudentLevel(-5).name, icon: getStudentLevel(-5).icon },
    { level: 1, name: 'Starter', icon: '🌱' }
  );
  assert.deepEqual(
    { level: getStudentLevel(0).level, name: getStudentLevel(0).name },
    { level: 1, name: 'Starter' }
  );
  assert.deepEqual(
    { level: getStudentLevel(49).level, name: getStudentLevel(49).name },
    { level: 1, name: 'Starter' }
  );
  assert.deepEqual(
    { level: getStudentLevel(50).level, name: getStudentLevel(50).name, icon: getStudentLevel(50).icon },
    { level: 2, name: 'Learner', icon: '📚' }
  );
  assert.deepEqual(
    { level: getStudentLevel(149).level, name: getStudentLevel(149).name },
    { level: 2, name: 'Learner' }
  );
  assert.deepEqual(
    { level: getStudentLevel(150).level, name: getStudentLevel(150).name, icon: getStudentLevel(150).icon },
    { level: 3, name: 'Active', icon: '⚡' }
  );
  assert.deepEqual(
    { level: getStudentLevel(299).level, name: getStudentLevel(299).name },
    { level: 3, name: 'Active' }
  );
  assert.deepEqual(
    { level: getStudentLevel(300).level, name: getStudentLevel(300).name, icon: getStudentLevel(300).icon },
    { level: 4, name: 'Skilled', icon: '🔥' }
  );
  assert.deepEqual(
    { level: getStudentLevel(499).level, name: getStudentLevel(499).name },
    { level: 4, name: 'Skilled' }
  );
  assert.deepEqual(
    { level: getStudentLevel(500).level, name: getStudentLevel(500).name, icon: getStudentLevel(500).icon },
    { level: 5, name: 'Elite', icon: '👑' }
  );
  assert.deepEqual(
    { level: getStudentLevel(920).level, name: getStudentLevel(920).name },
    { level: 5, name: 'Elite' }
  );
});

test('categorizePointActions partitions all POINT_ACTIONS without omitting entries', () => {
  const grouped = categorizePointActions(POINT_ACTIONS);
  const totalCategorized =
    grouped.earning.length + grouped.penalties.length + grouped.manual.length;
  assert.equal(totalCategorized, POINT_ACTIONS.length);
  assert.ok(grouped.earning.some((a) => a.id === 'present_class' && a.points === 15));
  assert.ok(grouped.earning.some((a) => a.id === 'exam_score' && a.frequency === 'per_exam'));
  assert.ok(grouped.penalties.every((a) => a.points < 0));
  assert.equal(grouped.penalties.length, 2);
  assert.equal(grouped.manual.length, 1);
  assert.equal(grouped.manual[0].id, 'manual_adjustment');
});

test('formatActionFrequency and formatLevelRange return clean readable labels', () => {
  assert.equal(formatActionFrequency('once_per_club'), 'Once per club');
  assert.equal(formatActionFrequency('per_exam'), 'Per exam');
  assert.equal(formatLevelRange(STUDENT_LEVELS[0]), '0 – 49 pts');
  assert.equal(formatLevelRange(STUDENT_LEVELS[3]), '300 – 499 pts');
  assert.equal(formatLevelRange(STUDENT_LEVELS[4]), '500+ pts');
});

test('getNextMondayCasablancaMs targets next Monday 00:01 Africa/Casablanca across weekdays and Monday boundary', () => {
  // Thursday 2026-11-19 12:00 Casablanca -> next Monday 2026-11-23 00:01 Casablanca
  const thuMs = casablancaWallTimeToUtcMs(2026, 11, 19, 12, 0, 0);
  const nextMonMs = getNextMondayCasablancaMs(thuMs);
  const nextMonParts = getCasablancaDateParts(nextMonMs);
  assert.deepEqual(
    {
      year: nextMonParts.year,
      month: nextMonParts.month,
      day: nextMonParts.day,
      weekdayIndex: nextMonParts.weekdayIndex,
      hour: nextMonParts.hour,
      minute: nextMonParts.minute,
    },
    { year: 2026, month: 11, day: 23, weekdayIndex: 1, hour: 0, minute: 1 }
  );

  // Monday 00:00:30 Casablanca -> same day 00:01:00
  const monBeforeReveal = casablancaWallTimeToUtcMs(2026, 11, 23, 0, 0, 30);
  assert.equal(getNextMondayCasablancaMs(monBeforeReveal), nextMonMs);

  // Monday 00:01:00 Casablanca -> jumps to following Monday 2026-11-30 00:01:00
  const monAfterReveal = casablancaWallTimeToUtcMs(2026, 11, 23, 0, 1, 0);
  const followingMonParts = getCasablancaDateParts(getNextMondayCasablancaMs(monAfterReveal));
  assert.equal(followingMonParts.day, 30);
  assert.equal(followingMonParts.weekdayIndex, 1);
});

test('getWeeklyWinnersRevealState shows placeholder before first Monday passes and reveals at Monday 00:01', () => {
  const approvedThu = casablancaWallTimeToUtcMs(2026, 11, 19, 10, 0, 0);
  const students: StudentProfile[] = [
    { id: 's1', name: 'Salma', photoUrl: '', role: 'student', approved: true, createdAt: approvedThu },
  ];

  const sundayNight = casablancaWallTimeToUtcMs(2026, 11, 22, 23, 59, 0);
  const before = getWeeklyWinnersRevealState(students, sundayNight);
  assert.equal(before.hasRevealed, false);

  const mondayReveal = casablancaWallTimeToUtcMs(2026, 11, 23, 0, 1, 0);
  const atReveal = getWeeklyWinnersRevealState(students, mondayReveal);
  assert.equal(atReveal.hasRevealed, true);
});

test('getCountdownParts breaks milliseconds into days, hours, minutes, and seconds cleanly', () => {
  const ms = (3 * 86400 + 5 * 3600 + 42 * 60 + 9) * 1000;
  assert.deepEqual(getCountdownParts(ms), {
    days: 3,
    hours: 5,
    minutes: 42,
    seconds: 9,
    totalSeconds: 3 * 86400 + 5 * 3600 + 42 * 60 + 9,
  });
  assert.deepEqual(getCountdownParts(-5000), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });
});

test('buildStudentProgressSeries merges same-day entries and tracks cumulative totals', () => {
  assert.deepEqual(buildStudentProgressSeries([]), []);

  const day1 = casablancaWallTimeToUtcMs(2026, 11, 15, 10, 0, 0);
  const day2Morning = casablancaWallTimeToUtcMs(2026, 11, 18, 9, 30, 0);
  const day2Afternoon = casablancaWallTimeToUtcMs(2026, 11, 18, 16, 15, 0);
  const day3 = casablancaWallTimeToUtcMs(2026, 11, 20, 11, 0, 0);

  const unordered: PointLog[] = [
    { id: 'l3', studentId: 's1', seasonId: 'fall-2026', action: 'Absent without reason', points: -5, note: 'Late', createdAt: day2Afternoon },
    { id: 'l1', studentId: 's1', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'Pitch', createdAt: day1 },
    { id: 'l2', studentId: 's1', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'Marketing Club', createdAt: day2Morning },
    { id: 'l4', studentId: 's1', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: '', createdAt: day3 },
  ];

  const series = buildStudentProgressSeries(unordered);
  // 4 logs across 3 unique days -> 3 merged dots (no repeated dates on X axis)
  assert.equal(series.length, 3);

  assert.equal(series[0].dateLabel, 'Nov 15');
  assert.equal(series[0].dayPoints, 15);
  assert.equal(series[0].cumulativePoints, 15);
  assert.equal(series[0].actions.length, 1);

  assert.equal(series[1].dateLabel, 'Nov 18');
  assert.equal(series[1].dayPoints, 25); // 30 + (-5)
  assert.equal(series[1].cumulativePoints, 40);
  assert.equal(series[1].actions.length, 2);

  assert.equal(series[2].dateLabel, 'Nov 20');
  assert.equal(series[2].dayPoints, 10);
  assert.equal(series[2].cumulativePoints, 50);
  assert.equal(series[2].tooltipSummary, 'Nov 20 · +10 pts · 100% attendance that week');

  const [minY, maxY] = getProgressChartDomain(series);
  assert.equal(minY, 0);
  assert.ok(maxY >= 560);

  const highSeries = buildStudentProgressSeries([
    { id: 'h1', studentId: 's1', seasonId: 'fall-2026', action: 'Exam score', points: 620, note: '', createdAt: NOW },
  ]);
  assert.deepEqual(getProgressChartDomain(highSeries), [0, 700]);
});

test('groupLogsByDay groups same-day logs in descending date order with accurate dayTotal', () => {
  assert.deepEqual(groupLogsByDay([]), []);

  const nov15 = casablancaWallTimeToUtcMs(2026, 11, 15, 10, 0, 0);
  const nov18Morning = casablancaWallTimeToUtcMs(2026, 11, 18, 9, 30, 0);
  const nov18Evening = casablancaWallTimeToUtcMs(2026, 11, 18, 17, 45, 0);
  const nov20 = casablancaWallTimeToUtcMs(2026, 11, 20, 14, 0, 0);

  const grouped = groupLogsByDay([
    { id: 'l1', studentId: 's1', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: '', createdAt: nov15 },
    { id: 'l2', studentId: 's1', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'Growth Lab', createdAt: nov18Morning },
    { id: 'l3', studentId: 's1', seasonId: 'fall-2026', action: 'Late submission', points: -5, note: 'Deck', createdAt: nov18Evening },
    { id: 'l4', studentId: 's1', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: '', createdAt: nov20 },
  ]);

  assert.equal(grouped.length, 3);
  assert.equal(grouped[0].dateLabel, 'Nov 20, 2026');
  assert.equal(grouped[0].items.length, 1);
  assert.equal(grouped[0].dayTotal, 10);

  assert.equal(grouped[1].dateLabel, 'Nov 18, 2026');
  assert.equal(grouped[1].items.length, 2);
  assert.equal(grouped[1].dayTotal, 25);
  assert.equal(grouped[1].items[0].id, 'l3');
  assert.equal(grouped[1].items[1].id, 'l2');

  assert.equal(grouped[2].dateLabel, 'Nov 15, 2026');
  assert.equal(grouped[2].items.length, 1);
  assert.equal(grouped[2].dayTotal, 15);
});
