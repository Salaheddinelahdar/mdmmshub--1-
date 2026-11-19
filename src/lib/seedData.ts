import type {
  Exam,
  ExamScore,
  HallOfFameEntry,
  PointLog,
  Season,
  StudentProfile,
} from '../types';

export const SEED_AVATARS = [
  '/src/assets/images/avatar_student_one_1794511608592.jpg',
  '/src/assets/images/avatar_student_two_1794511608805.jpg',
  '/src/assets/images/avatar_student_three_1794511609003.jpg',
  '/src/assets/images/avatar_student_four_1794511610298.jpg',
];

export interface SampleDataset {
  seasons: Season[];
  students: StudentProfile[];
  exams: Exam[];
  examScores: ExamScore[];
  logs: PointLog[];
  hallOfFame: HallOfFameEntry[];
}

export function createSampleDataset(nowMs: number = Date.now()): SampleDataset {
  const day = 24 * 60 * 60 * 1000;

  const seasons: Season[] = [
    {
      id: 'fall-2026',
      name: 'Fall 2026',
      startDate: '2026-09-14',
      endDate: '2026-12-20',
      active: true,
      createdAt: nowMs - 60 * day,
    },
    {
      id: 'spring-2026',
      name: 'Spring 2026',
      startDate: '2026-02-02',
      endDate: '2026-06-15',
      active: false,
      createdAt: nowMs - 220 * day,
    },
  ];

  const roster: Array<{ id: string; name: string; approved: boolean; avatarIdx?: number; daysAgo: number }> = [
    { id: 'stu_salma_bennani', name: 'Salma Bennani', approved: true, avatarIdx: 0, daysAgo: 55 },
    { id: 'stu_youssef_amrani', name: 'Youssef El Amrani', approved: true, avatarIdx: 1, daysAgo: 55 },
    { id: 'stu_kenza_tazi', name: 'Kenza Tazi', approved: true, avatarIdx: 2, daysAgo: 54 },
    { id: 'stu_mehdi_chraibi', name: 'Mehdi Chraibi', approved: true, avatarIdx: 3, daysAgo: 54 },
    { id: 'stu_ines_filali', name: 'Ines Filali', approved: true, daysAgo: 53 },
    { id: 'stu_omar_berrada', name: 'Omar Berrada', approved: true, daysAgo: 52 },
    { id: 'stu_nadia_sqalli', name: 'Nadia Sqalli', approved: true, daysAgo: 51 },
    { id: 'stu_karim_alaoui', name: 'Karim Alaoui', approved: true, daysAgo: 50 },
    { id: 'stu_lina_kettani', name: 'Lina Kettani', approved: true, daysAgo: 49 },
    { id: 'stu_adam_mansouri', name: 'Adam Mansouri', approved: true, daysAgo: 48 },
    { id: 'stu_zaynab_idrissi', name: 'Zaynab El Idrissi', approved: true, daysAgo: 47 },
    { id: 'stu_hamza_benjelloun', name: 'Hamza Benjelloun', approved: true, daysAgo: 46 },
    { id: 'stu_aya_lachgar', name: 'Aya Lachgar', approved: true, daysAgo: 45 },
    { id: 'stu_rayane_toumi', name: 'Rayane Toumi', approved: true, daysAgo: 44 },
    { id: 'stu_marwa_hakimi', name: 'Marwa Hakimi', approved: true, daysAgo: 43 },
    { id: 'stu_taha_lamrani', name: 'Taha Lamrani', approved: true, daysAgo: 42 },
    { id: 'stu_sofia_benali', name: 'Sofia Benali', approved: true, daysAgo: 41 },
    { id: 'stu_ismail_naciri', name: 'Ismail Naciri', approved: true, daysAgo: 40 },
    { id: 'stu_chaimae_ouazzani', name: 'Chaimae Ouazzani', approved: true, daysAgo: 39 },
    { id: 'stu_amine_zahidi', name: 'Amine Zahidi', approved: true, daysAgo: 38 },
    { id: 'stu_rim_benkirane', name: 'Rim Benkirane', approved: true, daysAgo: 37 },
    { id: 'stu_bilal_moukrim', name: 'Bilal Moukrim', approved: true, daysAgo: 36 },
    { id: 'stu_ghita_alami', name: 'Ghita Alami', approved: false, daysAgo: 1 },
    { id: 'stu_walid_fahmi', name: 'Walid Fahmi', approved: false, daysAgo: 0 },
  ];

  const students: StudentProfile[] = roster.map((r) => ({
    id: r.id,
    name: r.name,
    photoUrl: r.avatarIdx !== undefined ? SEED_AVATARS[r.avatarIdx] : '',
    role: 'student',
    approved: r.approved,
    createdAt: nowMs - r.daysAgo * day,
  }));

  const exams: Exam[] = [
    {
      id: 'exam_seo_midterm',
      name: 'SEO & Growth Strategy Midterm',
      seasonId: 'fall-2026',
      createdAt: nowMs - 14 * day,
    },
    {
      id: 'exam_paid_social',
      name: 'Paid Social & Attribution Lab',
      seasonId: 'fall-2026',
      createdAt: nowMs - 5 * day,
    },
  ];

  const rawLogs: Array<{
    id: string;
    studentId: string;
    seasonId: string;
    action: string;
    points: number;
    note: string;
    daysAgo: number;
  }> = [
    // #1 Salma Bennani (total 275, weekly 35)
    { id: 'log_01', studentId: 'stu_salma_bennani', seasonId: 'fall-2026', action: 'Exam score', points: 180, note: 'SEO & Growth Strategy Midterm (18/20)', daysAgo: 14 },
    { id: 'log_02', studentId: 'stu_salma_bennani', seasonId: 'fall-2026', action: 'LinkedIn profile completed & active', points: 20, note: 'Portfolio & analytics case study live', daysAgo: 30 },
    { id: 'log_03', studentId: 'stu_salma_bennani', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'MDMMS Growth Lab', daysAgo: 25 },
    { id: 'log_04', studentId: 'stu_salma_bennani', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'B2B Funnel teardown', daysAgo: 4 },
    { id: 'log_05', studentId: 'stu_salma_bennani', seasonId: 'fall-2026', action: 'Help a classmate with a project', points: 10, note: 'GA4 event debugging', daysAgo: 2 },
    { id: 'log_06', studentId: 'stu_salma_bennani', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 8 full attendance', daysAgo: 1 },
    { id: 'log_07', studentId: 'stu_salma_bennani', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 7 full attendance', daysAgo: 9 },

    // #2 Youssef El Amrani (total 255, weekly 60 -> Weekly MVP!)
    { id: 'log_08', studentId: 'stu_youssef_amrani', seasonId: 'fall-2026', action: 'Exam score', points: 165, note: 'SEO & Growth Strategy Midterm (16.5/20)', daysAgo: 14 },
    { id: 'log_09', studentId: 'stu_youssef_amrani', seasonId: 'fall-2026', action: 'LinkedIn profile completed & active', points: 20, note: 'Verified profile & weekly posts', daysAgo: 28 },
    { id: 'log_10', studentId: 'stu_youssef_amrani', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 7 full attendance', daysAgo: 9 },
    { id: 'log_11', studentId: 'stu_youssef_amrani', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'Performance Media Club', daysAgo: 3 },
    { id: 'log_12', studentId: 'stu_youssef_amrani', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'Meta Ads ROAS breakdown', daysAgo: 2 },
    { id: 'log_13', studentId: 'stu_youssef_amrani', seasonId: 'fall-2026', action: 'Help a classmate with a project', points: 10, note: 'Looker Studio attribution template', daysAgo: 1 },
    { id: 'log_14', studentId: 'stu_youssef_amrani', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 8 full attendance', daysAgo: 1 },
    { id: 'log_15', studentId: 'stu_youssef_amrani', seasonId: 'fall-2026', action: 'Late submission', points: -5, note: 'Landing page wireframe uploaded 2h late', daysAgo: 5 },

    // #3 Kenza Tazi (total 235, weekly 25)
    { id: 'log_16', studentId: 'stu_kenza_tazi', seasonId: 'fall-2026', action: 'Exam score', points: 170, note: 'SEO & Growth Strategy Midterm (17/20)', daysAgo: 14 },
    { id: 'log_17', studentId: 'stu_kenza_tazi', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'Content & Brand Guild', daysAgo: 22 },
    { id: 'log_18', studentId: 'stu_kenza_tazi', seasonId: 'fall-2026', action: 'LinkedIn profile completed & active', points: 20, note: 'Case study carousel', daysAgo: 18 },
    { id: 'log_19', studentId: 'stu_kenza_tazi', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'TikTok creator seeding strategy', daysAgo: 3 },
    { id: 'log_20', studentId: 'stu_kenza_tazi', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 8 full attendance', daysAgo: 1 },
    { id: 'log_21', studentId: 'stu_kenza_tazi', seasonId: 'fall-2026', action: 'Absent without reason', points: -5, note: 'Missed morning lab', daysAgo: 16 },
    { id: 'log_22', studentId: 'stu_kenza_tazi', seasonId: 'fall-2026', action: 'Late submission', points: -5, note: 'Keyword map late', daysAgo: 20 },

    // #4 Mehdi Chraibi (total 210, weekly 20)
    { id: 'log_23', studentId: 'stu_mehdi_chraibi', seasonId: 'fall-2026', action: 'Exam score', points: 155, note: 'SEO & Growth Strategy Midterm (15.5/20)', daysAgo: 14 },
    { id: 'log_24', studentId: 'stu_mehdi_chraibi', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'MDMMS Growth Lab', daysAgo: 26 },
    { id: 'log_25', studentId: 'stu_mehdi_chraibi', seasonId: 'fall-2026', action: 'Help a classmate with a project', points: 10, note: 'Technical SEO crawl fix', daysAgo: 4 },
    { id: 'log_26', studentId: 'stu_mehdi_chraibi', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 8 full attendance', daysAgo: 1 },
    { id: 'log_27', studentId: 'stu_mehdi_chraibi', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'Email lifecycle audit', daysAgo: 11 },
    { id: 'log_28', studentId: 'stu_mehdi_chraibi', seasonId: 'fall-2026', action: 'Absent without reason', points: -5, note: 'Unexcused absence', daysAgo: 24 },
    { id: 'log_29', studentId: 'stu_mehdi_chraibi', seasonId: 'fall-2026', action: 'Absent without reason', points: -5, note: 'Unexcused absence', daysAgo: 21 },

    // #5-#22 cohort members
    { id: 'log_30', studentId: 'stu_ines_filali', seasonId: 'fall-2026', action: 'Exam score', points: 150, note: 'SEO & Growth Strategy Midterm (15/20)', daysAgo: 14 },
    { id: 'log_31', studentId: 'stu_ines_filali', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'Content & Brand Guild', daysAgo: 20 },
    { id: 'log_32', studentId: 'stu_ines_filali', seasonId: 'fall-2026', action: 'LinkedIn profile completed & active', points: 20, note: 'Completed profile', daysAgo: 16 },

    { id: 'log_33', studentId: 'stu_omar_berrada', seasonId: 'fall-2026', action: 'Exam score', points: 145, note: 'SEO & Growth Strategy Midterm (14.5/20)', daysAgo: 14 },
    { id: 'log_34', studentId: 'stu_omar_berrada', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'Landing page CRO critique', daysAgo: 4 },
    { id: 'log_35', studentId: 'stu_omar_berrada', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'Performance Media Club', daysAgo: 18 },

    { id: 'log_36', studentId: 'stu_nadia_sqalli', seasonId: 'fall-2026', action: 'Exam score', points: 140, note: 'SEO & Growth Strategy Midterm (14/20)', daysAgo: 14 },
    { id: 'log_37', studentId: 'stu_nadia_sqalli', seasonId: 'fall-2026', action: 'LinkedIn profile completed & active', points: 20, note: 'Active weekly articles', daysAgo: 19 },
    { id: 'log_38', studentId: 'stu_nadia_sqalli', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'Email deliverability case', daysAgo: 2 },

    { id: 'log_39', studentId: 'stu_karim_alaoui', seasonId: 'fall-2026', action: 'Exam score', points: 135, note: 'SEO & Growth Strategy Midterm (13.5/20)', daysAgo: 14 },
    { id: 'log_40', studentId: 'stu_karim_alaoui', seasonId: 'fall-2026', action: 'Joined a club', points: 30, note: 'MDMMS Growth Lab', daysAgo: 23 },

    { id: 'log_41', studentId: 'stu_lina_kettani', seasonId: 'fall-2026', action: 'Exam score', points: 130, note: 'SEO & Growth Strategy Midterm (13/20)', daysAgo: 14 },
    { id: 'log_42', studentId: 'stu_lina_kettani', seasonId: 'fall-2026', action: 'LinkedIn profile completed & active', points: 20, note: 'LinkedIn optimization', daysAgo: 12 },
    { id: 'log_43', studentId: 'stu_lina_kettani', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 8 full attendance', daysAgo: 1 },

    { id: 'log_44', studentId: 'stu_adam_mansouri', seasonId: 'fall-2026', action: 'Exam score', points: 135, note: 'SEO & Growth Strategy Midterm (13.5/20)', daysAgo: 14 },
    { id: 'log_45', studentId: 'stu_adam_mansouri', seasonId: 'fall-2026', action: 'Help a classmate with a project', points: 10, note: 'SQL cohort analysis help', daysAgo: 3 },

    { id: 'log_46', studentId: 'stu_zaynab_idrissi', seasonId: 'fall-2026', action: 'Exam score', points: 125, note: 'SEO & Growth Strategy Midterm (12.5/20)', daysAgo: 14 },
    { id: 'log_47', studentId: 'stu_zaynab_idrissi', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'UGC brief breakdown', daysAgo: 5 },

    { id: 'log_48', studentId: 'stu_hamza_benjelloun', seasonId: 'fall-2026', action: 'Exam score', points: 120, note: 'SEO & Growth Strategy Midterm (12/20)', daysAgo: 14 },
    { id: 'log_49', studentId: 'stu_hamza_benjelloun', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 8 full attendance', daysAgo: 1 },

    { id: 'log_50', studentId: 'stu_aya_lachgar', seasonId: 'fall-2026', action: 'Exam score', points: 115, note: 'SEO & Growth Strategy Midterm (11.5/20)', daysAgo: 14 },
    { id: 'log_51', studentId: 'stu_aya_lachgar', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 8 full attendance', daysAgo: 1 },

    { id: 'log_52', studentId: 'stu_rayane_toumi', seasonId: 'fall-2026', action: 'Exam score', points: 110, note: 'SEO & Growth Strategy Midterm (11/20)', daysAgo: 14 },
    { id: 'log_53', studentId: 'stu_rayane_toumi', seasonId: 'fall-2026', action: 'Help a classmate with a project', points: 10, note: 'Figma ad creative review', daysAgo: 6 },

    { id: 'log_54', studentId: 'stu_marwa_hakimi', seasonId: 'fall-2026', action: 'Exam score', points: 115, note: 'SEO & Growth Strategy Midterm (11.5/20)', daysAgo: 14 },
    { id: 'log_55', studentId: 'stu_marwa_hakimi', seasonId: 'fall-2026', action: 'Late submission', points: -5, note: 'Brief uploaded after cutoff', daysAgo: 4 },

    { id: 'log_56', studentId: 'stu_taha_lamrani', seasonId: 'fall-2026', action: 'Exam score', points: 105, note: 'SEO & Growth Strategy Midterm (10.5/20)', daysAgo: 14 },
    { id: 'log_57', studentId: 'stu_sofia_benali', seasonId: 'fall-2026', action: 'Exam score', points: 100, note: 'SEO & Growth Strategy Midterm (10/20)', daysAgo: 14 },
    { id: 'log_58', studentId: 'stu_ismail_naciri', seasonId: 'fall-2026', action: 'Exam score', points: 95, note: 'SEO & Growth Strategy Midterm (9.5/20)', daysAgo: 14 },
    { id: 'log_59', studentId: 'stu_chaimae_ouazzani', seasonId: 'fall-2026', action: 'Exam score', points: 90, note: 'SEO & Growth Strategy Midterm (9/20)', daysAgo: 14 },
    { id: 'log_60', studentId: 'stu_amine_zahidi', seasonId: 'fall-2026', action: 'Exam score', points: 85, note: 'SEO & Growth Strategy Midterm (8.5/20)', daysAgo: 14 },
    { id: 'log_61', studentId: 'stu_rim_benkirane', seasonId: 'fall-2026', action: 'Present in front of class', points: 15, note: 'Competitor benchmark', daysAgo: 3 },
    { id: 'log_62', studentId: 'stu_bilal_moukrim', seasonId: 'fall-2026', action: '100% attendance that week', points: 10, note: 'Week 8 full attendance', daysAgo: 1 },

    // Archived Spring 2026 logs
    { id: 'log_sp1', studentId: 'stu_kenza_tazi', seasonId: 'spring-2026', action: 'Exam score', points: 185, note: 'Final Digital Strategy (18.5/20)', daysAgo: 160 },
    { id: 'log_sp2', studentId: 'stu_salma_bennani', seasonId: 'spring-2026', action: 'Exam score', points: 175, note: 'Final Digital Strategy (17.5/20)', daysAgo: 160 },
    { id: 'log_sp3', studentId: 'stu_mehdi_chraibi', seasonId: 'spring-2026', action: 'Exam score', points: 165, note: 'Final Digital Strategy (16.5/20)', daysAgo: 160 },
  ];

  const logs: PointLog[] = rawLogs.map((l) => ({
    id: l.id,
    studentId: l.studentId,
    seasonId: l.seasonId,
    action: l.action,
    points: l.points,
    note: l.note,
    createdAt: nowMs - l.daysAgo * day,
  }));

  const examScores: ExamScore[] = [
    { id: 'es_1', studentId: 'stu_salma_bennani', examId: 'exam_seo_midterm', seasonId: 'fall-2026', score: 18, pointsAwarded: 180, createdAt: nowMs - 14 * day },
    { id: 'es_2', studentId: 'stu_youssef_amrani', examId: 'exam_seo_midterm', seasonId: 'fall-2026', score: 16.5, pointsAwarded: 165, createdAt: nowMs - 14 * day },
    { id: 'es_3', studentId: 'stu_kenza_tazi', examId: 'exam_seo_midterm', seasonId: 'fall-2026', score: 17, pointsAwarded: 170, createdAt: nowMs - 14 * day },
    { id: 'es_4', studentId: 'stu_mehdi_chraibi', examId: 'exam_seo_midterm', seasonId: 'fall-2026', score: 15.5, pointsAwarded: 155, createdAt: nowMs - 14 * day },
  ];

  const hallOfFame: HallOfFameEntry[] = [
    {
      id: 'hof_spring-2026_1',
      seasonId: 'spring-2026',
      seasonName: 'Spring 2026',
      studentId: 'stu_kenza_tazi',
      studentName: 'Kenza Tazi',
      photoUrl: SEED_AVATARS[2],
      rank: 1,
      totalPoints: 185,
      createdAt: nowMs - 150 * day,
    },
    {
      id: 'hof_spring-2026_2',
      seasonId: 'spring-2026',
      seasonName: 'Spring 2026',
      studentId: 'stu_salma_bennani',
      studentName: 'Salma Bennani',
      photoUrl: SEED_AVATARS[0],
      rank: 2,
      totalPoints: 175,
      createdAt: nowMs - 150 * day,
    },
    {
      id: 'hof_spring-2026_3',
      seasonId: 'spring-2026',
      seasonName: 'Spring 2026',
      studentId: 'stu_mehdi_chraibi',
      studentName: 'Mehdi Chraibi',
      photoUrl: SEED_AVATARS[3],
      rank: 3,
      totalPoints: 165,
      createdAt: nowMs - 150 * day,
    },
  ];

  return { seasons, students, exams, examScores, logs, hallOfFame };
}
