# CharactAI — Entity Relationship Diagram

This reference implementation uses SQLite (see `backend/src/models/schema.sql` for
the authoritative DDL). The shape maps directly onto MongoDB collections for a
production deployment, per the brief's `Section 33 Database Design`.

```
users (id PK)
  ├─< students (id PK/FK → users.id)          1:1
  │     ├─< activities (student_id FK)         1:N
  │     ├─< ai_assessments (student_id FK)     1:N
  │     ├─< certificates (student_id FK)       1:N
  │     ├─< resumes (student_id FK)            1:1
  │     ├─< candidate_matches (student_id FK)  1:N
  │     ├─< interviews (student_id FK)         1:N
  │     ├─< placement_applications (student_id FK) 1:N
  │     └─< placement_offers (student_id FK)   1:N
  ├─< notifications (user_id FK)                1:N
  ├─< companies (recruiter_user_id FK)          1:N
  └─< audit_logs (actor_id FK)                  1:N

activity_categories (id PK)
  └─< activities (category_id FK)               1:N

activities (id PK)
  ├── student_id FK → students.id
  ├── category_id FK → activity_categories.id
  └── verified_by FK → users.id (nullable)

ai_assessments (id PK)
  └── student_id FK → students.id
      (10 dimension scores + overall + strengths/developmentAreas/explanation JSON)

certificates (id PK, certificate_code UNIQUE)
  └── student_id FK → students.id

companies (id PK)
  ├── recruiter_user_id FK → users.id
  ├─< jobs (company_id FK)                      1:N
  └─< placement_drives (company_id FK)          1:N

jobs (id PK)
  ├── company_id FK → companies.id
  ├─< candidate_matches (job_id FK)              1:N
  ├─< interviews (job_id FK)                     1:N
  └─< placement_drives (job_id FK, nullable)     1:N   -- optional link into placement workflow

resumes (id PK)
  └── student_id FK → students.id (1:1, enforced by application logic)

candidate_matches (id PK, UNIQUE(job_id, student_id))
  ├── job_id FK → jobs.id
  ├── student_id FK → students.id
  └── interview_id FK → interviews.id (nullable)

question_bank (id PK)
  └─< interview_answers (question_id FK)          1:N

interviews (id PK)
  ├── job_id FK → jobs.id
  ├── student_id FK → students.id
  └─< interview_answers (interview_id FK)          1:N

interview_answers (id PK)
  ├── interview_id FK → interviews.id
  └── question_id FK → question_bank.id

placement_drives (id PK)
  ├── company_id FK → companies.id
  ├── job_id FK → jobs.id (nullable)
  ├── created_by FK → users.id
  └─< placement_applications (drive_id FK)         1:N

placement_applications (id PK, UNIQUE(drive_id, student_id))
  ├── drive_id FK → placement_drives.id
  ├── student_id FK → students.id
  ├─< placement_rounds (application_id FK)          1:N
  └─< placement_offers (application_id FK, 1:1 via UNIQUE)

placement_rounds (id PK)
  ├── application_id FK → placement_applications.id
  ├── evaluated_by FK → users.id (nullable)
  └─< interview_schedules (round_id FK)              1:N

interview_schedules (id PK)
  └── round_id FK → placement_rounds.id

placement_offers (id PK, UNIQUE(application_id))
  ├── application_id FK → placement_applications.id
  ├── student_id FK → students.id
  └── drive_id FK → placement_drives.id

notifications (id PK)
  └── user_id FK → users.id

audit_logs (id PK)
  └── actor_id FK → users.id (nullable, e.g. system-triggered events)
```

## Key design notes

- **`users` + `students` is a supertype/subtype split**: every student is a user,
  but faculty/admin/recruiter/placement_officer accounts don't need the extra
  student-only columns (CGPA, backlogs, batch, etc.), so those live in a separate
  1:1 table keyed by the same `id`.
- **`activities.verification_status`** is the single gate between "student claims"
  and "AI-scoreable evidence" — see `docs/ARCHITECTURE.md § Anti-manipulation`.
- **`candidate_matches` vs. `placement_applications`** are intentionally two
  different tables: the former is the AI-driven resume/JD matching + adaptive
  interview pipeline (Section "Campus Recruitment" of the brief); the latter is the
  operational, officer-run drive workflow (Section 15, "Student Recruiter &
  Placement Management System"). `placement_drives.job_id` is the optional bridge
  between them — a drive can be created directly, or created *from* an AI-matched
  job to inherit its extracted skills and shortlist as a starting signal.
- **`model_version`** on `ai_assessments` (and implicitly via `audit_logs.meta_json`
  on recruitment scoring) makes every AI-influenced decision traceable to the
  scoring logic that produced it, which the brief calls out as "a good
  professional touch."
