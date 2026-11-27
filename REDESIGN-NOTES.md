# MDMMSspace v3
Run: npm install && npm run dev

New on top of v2:
- This week's top 3 + "Student of the week" badge (leaderboard)
- Share top 3: makes a PNG card (Share on phones, Download elsewhere)
- Badges + attendance streak (profile and dashboard), computed from the points log, no backend change
- Exam countdown on the dashboard (needs an exam date, see below)
- Dashboard shows your rank first
- Short Rules page
- Class code on signup (optional)
- Lighter animation on phones (and none if the phone asks for reduced motion)
- Points history with reasons on profile and dashboard (from v2)

## Your Firebase / Render side
1. Exam countdown: the instructor can now enter an exam date when creating an exam (Admin > Exams & Seasons).
   Saving a date needs the updated firestore.rules in this folder (allows an optional examDate field).
   Deploy it: firebase deploy --only firestore:rules   (or paste it in the Firebase console > Firestore > Rules).
   Without the new rules, leave the date empty and exams save as before.
2. Class code: in Render > Environment add VITE_CLASS_CODE = your code, then redeploy (it is read at build time).
   Leave it unset to keep signup open. It is a front-end check only: someone who reads the site code can find it.
   Signup already requires an @uca.ac.ma email and instructor approval, which is the stronger gate.

## v4: exams removed
- Removed exams everywhere (Admin tab, exam score entry, countdown, Exam ace badge, Rules line).
- Old "Exam score" point logs and exams / exam_scores collections are untouched and still count in totals.

## v5: quiz challenge and dark mode
- Quiz challenge is the only exam replacement: score out of 20, points = score x 10 (max 200). Project of the month removed.
- Limit: one quiz award per student per rolling 7 days. This is checked in the admin app only. Firestore rules cannot count a student's earlier entries, so a second admin device or a direct database write would bypass it. Only admins can write point logs.
- Top contributor badge: help a classmate 3 times.
- Dark mode (Claude style). Toggle in the navbar cycles device / light / dark and remembers the choice (localStorage). Default follows the device. Colors are CSS variables in src/index.css. The share card follows the current mode.
- No Firestore rule changes needed.

## v6: old exam data cleanup and private quiz scores
- Old "Exam score" point entries are hidden from every view (standings, history, audit log, badges). Admin > Seasons > "Clear old exam data" shows the counts, then permanently deletes the old exam entries, exams and exam_scores after typing DELETE. Rankings do not change when you run it, because those entries are already excluded.
- Quiz scores are private. The score is not saved in the note: it is points / 10 and shown as "Quiz score 14/20" only to the student (dashboard) and admin (dashboard, audit log). The public profile and leaderboard show only "Quiz challenge" and the points.
- No Firestore rule changes needed (admins can already delete point_logs, exams and exam_scores).
