export type UserRole = 'student' | 'admin';

export interface StudentProfile {
  id: string;
  name: string;
  photoUrl: string;
  role: 'student';
  approved: boolean;
  createdAt: number; // epoch ms
}

export interface PointLog {
  id: string;
  studentId: string;
  seasonId: string;
  action: string;
  points: number;
  note: string;
  createdAt: number; // epoch ms
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: number;
}

export interface Exam {
  id: string;
  name: string;
  seasonId: string;
  createdAt: number;
}

export interface ExamScore {
  id: string;
  studentId: string;
  examId: string;
  seasonId: string;
  score: number;
  pointsAwarded: number;
  createdAt: number;
}

export interface HallOfFameEntry {
  id: string;
  seasonId: string;
  seasonName: string;
  studentId: string;
  studentName: string;
  photoUrl: string;
  rank: 1 | 2 | 3;
  totalPoints: number;
  createdAt: number;
}

export interface RankedStudent extends StudentProfile {
  rank: number;
  totalPoints: number;
  weeklyPoints: number;
  logCount: number;
}

export interface StudentLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  icon: string;
  minPoints: number;
  nextLevelPoints: number | null;
}

export type PointActionFrequency = 'repeatable' | 'once_per_student' | 'once_per_club' | 'per_exam' | 'manual';

export interface PointActionDefinition {
  id: string;
  label: string;
  points: number;
  frequency: PointActionFrequency;
  description: string;
}

export interface AuthSession {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  approved: boolean;
  photoUrl?: string;
}
