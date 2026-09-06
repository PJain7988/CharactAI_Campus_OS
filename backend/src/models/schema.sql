-- CharactAI database schema (SQLite)
-- Collections from the brief are modelled as relational tables for a runnable demo;
-- the same shape maps 1:1 onto MongoDB collections for a production deployment.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student','faculty','admin')),
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

CREATE TABLE IF NOT EXISTS global_events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  TEXT NOT NULL,
  location    TEXT,
  category_id TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES activity_categories(id)
);

CREATE TABLE IF NOT EXISTS system_settings (
  key         TEXT PRIMARY KEY,
  value_json  TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

