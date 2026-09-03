-- CharactAI database schema (SQLite)
-- Collections from the brief are modelled as relational tables for a runnable demo;
-- the same shape maps 1:1 onto MongoDB collections for a production deployment.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student','faculty','admin','recruiter','placement_officer')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id              TEXT PRIMARY KEY,          -- = users.id
  student_code    TEXT UNIQUE NOT NULL,
  department      TEXT NOT NULL,
  program         TEXT NOT NULL,
  batch           TEXT NOT NULL,
  admission_year  INTEGER NOT NULL,
  graduation_year INTEGER NOT NULL,
  cgpa            REAL DEFAULT 0,
  backlogs        INTEGER DEFAULT 0,
  visibility      TEXT NOT NULL DEFAULT 'institution' CHECK (visibility IN ('private','institution','public')),
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_categories (
  id          TEXT PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS activities (
  id                  TEXT PRIMARY KEY,
  student_id          TEXT NOT NULL,
  category_id         TEXT NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  activity_date       TEXT NOT NULL,
  academic_year       INTEGER NOT NULL,      -- 1,2,3,4
  duration_hours      REAL DEFAULT 0,
  details_json        TEXT,                  -- rich category-specific metadata (book title, event level, skills, etc.)
  role                TEXT,                  -- Participant / Organizer / Leader / Mentor ...
  achievement         TEXT,                  -- Finalist / Winner / Completed ...
  evidence_path       TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  verified_by         TEXT,
  rejection_reason    TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES activity_categories(id)
);

CREATE TABLE IF NOT EXISTS ai_assessments (
  id                     TEXT PRIMARY KEY,
  student_id             TEXT NOT NULL,
  academic_year          INTEGER NOT NULL,   -- snapshot year (0 = latest/cumulative)
  discipline_score                   REAL,
  consistency_score                  REAL,
  learning_orientation_score         REAL,
  leadership_score                   REAL,
  teamwork_score                     REAL,
  technical_engagement_score         REAL,
  academic_engagement_score          REAL,
  community_participation_score      REAL,
  creativity_score                   REAL,
  extracurricular_involvement_score  REAL,
  personal_development_score         REAL,
  overall_score          REAL,
  strengths_json         TEXT,
  development_areas_json TEXT,
  explanation_json       TEXT,
  model_version          TEXT NOT NULL,
  generated_at           TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certificates (
  id               TEXT PRIMARY KEY,
  certificate_code TEXT UNIQUE NOT NULL,     -- e.g. CHAI-2027-8F72A91C
  student_id       TEXT NOT NULL,
  overall_score    REAL,
  narrative        TEXT,
  file_path        TEXT,
  issued_at        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===================== Recruitment side =====================

CREATE TABLE IF NOT EXISTS companies (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  recruiter_user_id TEXT NOT NULL,
  FOREIGN KEY (recruiter_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  id               TEXT PRIMARY KEY,
  company_id       TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  required_skills_json TEXT NOT NULL,        -- extracted technical skills
  soft_skills_json TEXT,
  min_cgpa         REAL DEFAULT 0,
  max_backlogs     INTEGER DEFAULT 0,
  graduation_year  INTEGER,
  branches_json    TEXT,
  weights_json     TEXT NOT NULL,            -- configurable scoring weights
  shortlist_size   INTEGER DEFAULT 100,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resumes (
  id           TEXT PRIMARY KEY,
  student_id   TEXT NOT NULL,
  raw_text     TEXT NOT NULL,
  skills_json  TEXT,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidate_matches (
  id                 TEXT PRIMARY KEY,
  job_id             TEXT NOT NULL,
  student_id         TEXT NOT NULL,
  eligible           INTEGER NOT NULL DEFAULT 0,
  resume_match_score REAL DEFAULT 0,
  matched_skills_json TEXT,
  missing_skills_json TEXT,
  interview_id       TEXT,
  interview_score    REAL,
  overall_score      REAL,
  stage              TEXT NOT NULL DEFAULT 'screened' CHECK (
    stage IN ('screened','shortlisted','interviewed','recommended','rejected')
  ),
  explanation_json   TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (job_id, student_id),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_bank (
  id         TEXT PRIMARY KEY,
  topic      TEXT NOT NULL,            -- e.g. DSA, C++, React, HR, Behavioral
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  question   TEXT NOT NULL,
  expected_concepts_json TEXT
);

CREATE TABLE IF NOT EXISTS interviews (
  id           TEXT PRIMARY KEY,
  job_id       TEXT NOT NULL,
  student_id   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  technical_score REAL,
  problem_solving_score REAL,
  communication_score REAL,
  behavioral_score REAL,
  resume_knowledge_score REAL,
  overall_interview_score REAL,
  feedback_json TEXT,
  started_at   TEXT,
  completed_at TEXT,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interview_answers (
  id            TEXT PRIMARY KEY,
  interview_id  TEXT NOT NULL,
  question_id   TEXT NOT NULL,
  slot          TEXT,
  difficulty    TEXT NOT NULL,
  answer_text   TEXT,
  concept_hit_ratio REAL,
  score         REAL,
  sequence      INTEGER NOT NULL,
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES question_bank(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         TEXT PRIMARY KEY,
  actor_id   TEXT,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  meta_json  TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ===================== Placement Management (Student Recruiter & Placement Management System) =====================
-- This is the operational, workflow-driven counterpart to the AI matching/interview engine above:
-- placement officers run drives end-to-end (eligibility -> applications -> rounds -> interviews -> offers -> stats),
-- while the AI resume/JD matching and adaptive interview modules (candidate_matches, interviews, above) can feed
-- into a drive's shortlist. The two are linked via `placement_drives.job_id` (nullable).

CREATE TABLE IF NOT EXISTS placement_drives (
  id                  TEXT PRIMARY KEY,
  company_id          TEXT NOT NULL,
  job_id              TEXT,                      -- optional link to an AI-matching `jobs` row
  title               TEXT NOT NULL,              -- e.g. "Trainee Software Engineer - Campus Drive 2027"
  description         TEXT,
  drive_date           TEXT,
  application_deadline TEXT,
  mode                TEXT NOT NULL DEFAULT 'on-campus' CHECK (mode IN ('on-campus','virtual','hybrid')),
  rounds_plan_json     TEXT NOT NULL DEFAULT '[]', -- ordered list e.g. ["Aptitude","Technical","HR"]
  min_cgpa             REAL DEFAULT 0,
  max_backlogs         INTEGER DEFAULT 0,
  graduation_year      INTEGER,
  branches_json        TEXT DEFAULT '[]',
  package_min_lpa       REAL,
  package_max_lpa       REAL,
  status               TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed','completed','cancelled')),
  created_by            TEXT NOT NULL,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS placement_applications (
  id           TEXT PRIMARY KEY,
  drive_id     TEXT NOT NULL,
  student_id   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'applied' CHECK (
    status IN ('applied','shortlisted','in_process','rejected','selected','offer_extended','offer_accepted','offer_declined','withdrawn')
  ),
  applied_at   TEXT NOT NULL DEFAULT (datetime('now')),
  notes        TEXT,
  UNIQUE (drive_id, student_id),
  FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS placement_rounds (
  id              TEXT PRIMARY KEY,
  application_id  TEXT NOT NULL,
  round_name      TEXT NOT NULL,               -- e.g. "Aptitude Test", "Technical Round 1", "HR Round"
  round_type      TEXT NOT NULL DEFAULT 'other' CHECK (round_type IN ('aptitude','technical','group_discussion','hr','managerial','other')),
  sequence        INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scheduled','completed','cleared','rejected')),
  score           REAL,
  max_score       REAL,
  remarks         TEXT,
  evaluated_by    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES placement_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS interview_schedules (
  id               TEXT PRIMARY KEY,
  round_id         TEXT NOT NULL,
  scheduled_date   TEXT NOT NULL,
  scheduled_time   TEXT NOT NULL,
  mode             TEXT NOT NULL DEFAULT 'online' CHECK (mode IN ('online','offline')),
  location_or_link TEXT,
  interviewer_name TEXT,
  status           TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','rescheduled','cancelled')),
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (round_id) REFERENCES placement_rounds(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS placement_offers (
  id               TEXT PRIMARY KEY,
  application_id   TEXT NOT NULL UNIQUE,
  student_id       TEXT NOT NULL,
  drive_id         TEXT NOT NULL,
  designation      TEXT,
  ctc_lpa          REAL,
  offer_date       TEXT NOT NULL DEFAULT (datetime('now')),
  status           TEXT NOT NULL DEFAULT 'extended' CHECK (status IN ('extended','accepted','declined','withdrawn')),
  offer_letter_path TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES placement_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE
);

