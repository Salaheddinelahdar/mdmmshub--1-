v11: navbar without Sign in/up, Remember me checkbox, sticky header on mobile. See CHANGES-v11.txt
# MDMMS space v6, local test (test Firebase project)

This copy is already pointed at the test project mdmms-test-4947b (see firebase-applet-config.json). Your live class project is not used.

1. Unzip, open the folder in VS Code (File > Open Folder).
2. Terminal > New Terminal, run: npm install
3. Run: npm run dev
4. Open http://localhost:3000

The test project starts empty. Make yourself admin:
1. Firebase console > Authentication > Users > Add user. Use your email and a password you choose. Copy the User UID shown in the list.
2. Firestore Database > Data > the "admins" collection > Add document. Document ID = your UID. Field: ok = true (boolean).
   (Fine if the admins collection already has a document from earlier; just add yours.)
3. On the site: Sign In with that email and password. The Admin tab appears.
4. In Admin > Seasons, start a season (name, dates). Without a season, awarding points will not work.
5. Make test students: Sign up on the site with any fake name and an email like test1@uca.ac.ma (only the @uca.ac.ma ending is checked). Then in Admin > Students & Approvals, press Approve.
6. Admin > Award Points: pick the student, Quiz challenge, type a score out of 20.
7. See it: Admin > Audit Log ("Quiz score 14/20"), the student's own Profile page, and the public profile (points only).
8. Old exam cleanup: Admin > Seasons > Clear old exam data (nothing to delete in an empty test project).
