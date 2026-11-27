WEEKLY QUIZ - SPARK (FREE) VERSION
No Blaze, no card, no Cloud Functions, no AI key. Everything stays free.

SETUP (test project mdmms-test-4947b)
1. Firebase console (mdmms-test) > Firestore Database > Règles (Rules).
   Select all, paste the content of the file firestore.rules from this project, click Publier.
2. In the terminal inside site6local: npm install (only if new folder), then npm run dev.
3. Admin > Weekly Quiz: create the quiz (default: the coming Sunday 00:00 to 23:59, 15 min, 20 questions per student).
   Add questions: one by one, or paste many (see below), or use the AI prompt helper.
   For a same-day test: set Opens to now and Closes later today.
4. Student: Quiz menu > Start quiz.

ADD QUESTIONS WITH ANY AI CHAT
Admin > Weekly Quiz > open the quiz > "Make questions with any AI chat". Type the topic, press Copy prompt,
paste it in ChatGPT / Claude / Gemini, copy the answer, paste it in "Import many questions", press Import.
Always read the questions and answers before you publish, AI makes mistakes.

PASTE FORMAT (blank line between questions)
   What does CTR stand for?
   A) Click-through rate
   B) Cost to reach
   C) Customer total revenue
   D) Content tracking report
   Answer: A

HOW IT WORKS AND ITS LIMITS (honest)
The answers are checked in the student's browser. The questions, with the correct answer, are sent to the
student's browser once they press Start. A determined student who opens the browser tools can:
 - see the correct answers for their own quiz during the timer, and share them with friends who have not started yet (finished students also see the answers right away, so a finished student can pass them on while the quiz is still open);
 - claim a higher score than they really got (the rules check that the points match the claimed score,
   that the score is not above the number of questions, and that it is submitted once and on time,
   but they cannot check the real answers).
What is blocked by the rules: one attempt per student per quiz, only approved students, only while the quiz is open,
submitting after the timer ends, points that do not match the score, points for another student or another quiz,
reading questions before pressing Start, and any student writing points directly.
The 7-day rule between two quiz awards is checked by the app only, not by the rules.
If cheating becomes a problem, upgrade later to the Blaze version (server grading). Nothing else changes.
