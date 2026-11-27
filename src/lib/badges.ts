import type { PointLog } from '../types';

export const WEEK_MS_BADGE = 7 * 24 * 60 * 60 * 1000;

export type BadgeId = 'first' | 'streak' | 'presenter' | 'helper' | 'linkedin' | 'club' | 'contributor';

export interface Badge {
  id: BadgeId;
  label: string;
  hint: string;
  earned: boolean;
}

function has(log: PointLog, word: string) {
  return log.action.toLowerCase().includes(word);
}

/** Consecutive weeks (ending at the latest attendance week) with a "100% attendance" entry. */
export function attendanceStreak(logs: PointLog[], nowMs: number = Date.now()): number {
  const weeks = new Set(
    logs
      .filter((l) => l.points > 0 && has(l, 'attendance'))
      .map((l) => Math.floor(l.createdAt / WEEK_MS_BADGE))
  );
  if (weeks.size === 0) return 0;
  const latest = Math.max(...weeks);
  const thisWeek = Math.floor(nowMs / WEEK_MS_BADGE);
  if (latest < thisWeek - 1) return 0; // streak is over
  let n = 0;
  for (let w = latest; weeks.has(w); w--) n++;
  return n;
}

export function computeBadges(logs: PointLog[], nowMs: number = Date.now()): Badge[] {
  const pos = logs.filter((l) => l.points > 0);
  const streak = attendanceStreak(logs, nowMs);
  return [
    { id: 'first', label: 'First points', hint: 'Earn any points', earned: pos.length > 0 },
    {
      id: 'streak',
      label: streak >= 2 ? `${streak}-week streak` : 'Attendance streak',
      hint: 'Full attendance 2 weeks in a row',
      earned: streak >= 2,
    },
    { id: 'presenter', label: 'Presenter', hint: 'Present in front of class', earned: pos.some((l) => has(l, 'present')) },
    { id: 'helper', label: 'Team player', hint: 'Help a classmate', earned: pos.some((l) => has(l, 'help')) },
    { id: 'linkedin', label: 'LinkedIn ready', hint: 'Complete your LinkedIn profile', earned: pos.some((l) => has(l, 'linkedin')) },
    { id: 'club', label: 'Club member', hint: 'Join a club', earned: pos.some((l) => has(l, 'club')) },
    {
      id: 'contributor',
      label: 'Top contributor',
      hint: 'Help classmates 3 times',
      earned: pos.filter((l) => has(l, 'help')).length >= 3,
    },
  ];
}
