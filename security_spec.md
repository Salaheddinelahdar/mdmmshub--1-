# Security Specification — MDMMS space

## 1. Data Invariants
1. **PII Isolation**: Student email addresses are stored exclusively in `/users_private/{userId}` and are readable only by the owning authenticated user (`request.auth.uid == userId`) or a verified admin. `/students/{studentId}` contains no PII.
2. **Approval Gate**: Newly registered students default to `approved: false` and `role: 'student'`. Students cannot self-approve (`approved: true`) or escalate `role` on creation or update.
3. **Public Transparency**: Approved student profiles (`/students/{studentId}` with `approved == true`), `/point_logs`, `/seasons`, `/exams`, `/exam_scores`, and `/hall_of_fame` are publicly readable so rankings are auditable without login.
4. **Admin-Only Points & Seasons**: Only verified admins (`isAdmin()`) may create/update/delete `point_logs`, `seasons`, `exams`, `exam_scores`, `hall_of_fame`, or approve/reject student accounts.
5. **Relational & Temporal Integrity**: All `point_logs` must reference an existing `/students/{studentId}` and `/seasons/{seasonId}`. Every `createdAt` timestamp must equal `request.time`.
6. **UCA Email Domain Gate**: Non-admin student creation on `/students/{studentId}` and `/users_private/{userId}` requires an authenticated `@uca.ac.ma` email (`request.auth.token.email`). Verified admins (`isAdmin()`) are exempt from this domain restriction.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Approval on Signup**: Student creates `/students/{uid}` with `approved: true` -> `PERMISSION_DENIED`.
2. **Role Escalation on Signup**: Student creates `/users_private/{uid}` with `role: "admin"` -> `PERMISSION_DENIED`.
3. **Shadow Ghost Field Injection**: Student creates `/students/{uid}` with extra key `isAdmin: true` -> `PERMISSION_DENIED`.
4. **Student Modifying Points**: Signed-in student attempts to create `/point_logs/fake` -> `PERMISSION_DENIED`.
5. **Student Modifying Another Profile**: Signed-in student updates `/students/otherUid` -> `PERMISSION_DENIED`.
6. **Student Approving Self via Update**: Signed-in student updates `/students/{uid}` changing `approved` from `false` to `true` -> `PERMISSION_DENIED`.
7. **PII Scrape Attempt**: Unauthenticated or non-owner user reads `/users_private/otherUid` -> `PERMISSION_DENIED`.
8. **Unapproved Student Listing**: Unauthenticated user queries `/students` without `where('approved', '==', true)` -> `PERMISSION_DENIED`.
9. **ID Poisoning**: Creating `/students/` with a 500-char or invalid-char ID -> `PERMISSION_DENIED`.
10. **Value Poisoning**: Admin/student writes `/students/{uid}` with `name` of length 1 or 500 chars -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: Creating `/point_logs/{id}` with backdated `createdAt` not equal to `request.time` -> `PERMISSION_DENIED`.
12. **Orphan Point Log**: Creating `/point_logs/{id}` referencing a non-existent `studentId` -> `PERMISSION_DENIED`.
13. **Non-UCA Email Student Signup**: Non-admin user with `request.auth.token.email = "student@gmail.com"` creates `/students/{uid}` -> `PERMISSION_DENIED`.
