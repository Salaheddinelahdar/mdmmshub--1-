import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHallOfFameTop3,
  calculateExamPoints,
  canClaimAction,
  computeLeaderboard,
  computeNextRankGap,
  filterRankedStudents,
  findWeeklyMvp,
  getStudentLevel,
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
