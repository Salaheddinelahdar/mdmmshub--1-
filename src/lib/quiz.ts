import type { PointLog } from '../types';

/** Old exam entries from the retired exam system. They are hidden everywhere until the admin clears them. */
export const isLegacyExamLog = (l: PointLog) => /^exam/i.test(l.action.trim());

export const isQuizLog = (l: PointLog) => l.action === 'Quiz challenge';

/** Quiz score out of 20, derived from points (points = score x 10). */
export const quizScoreText = (l: PointLog) => `${Math.round((l.points / 10) * 10) / 10}/20`;

/**
 * Note to show for a log entry. Quiz entries never show a score, to anyone: only the points.
 * The real X / total is shown only in the student's own private result box.
 */
export function visibleNote(l: PointLog, _canSeePrivate?: boolean): string {
  if (!isQuizLog(l)) return l.note;
  return l.note.replace(/^Quiz \([\d.]+\/20\)\s*(·|-|—)?\s*/, '').replace(/^Quiz score [\d.]+\/20\s*(·|-|—)?\s*/, '').trim();
}
