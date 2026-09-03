# CharactAI

**AI-Powered Holistic Student Development, Employability Assessment & Smart Campus Recruitment Platform**

> Track → Analyze → Develop → Assess → Shortlist → Certify

CharactAI turns four years of scattered student activity records — academics, library
and learning, technical work, sports, culture, leadership, community service — into a
single **evidence-based, explainable, verifiable** development profile. At graduation
that profile powers a **QR-verifiable Holistic Development Certificate**. During
placement season, the same verified profile feeds an **AI campus recruitment pipeline**:
resume–JD matching, adaptive AI mock interviews, and explainable candidate shortlists —
with humans (faculty, recruiters, admins) always making the final call.

This repository is a complete, runnable reference implementation of the system
described in the project brief: full-stack web app + a Python AI/ML service for the
heavier modelling work (clustering, regression, explainability).

---

## Why this project is different from a normal ERP/college management system

A normal system stores `student + attendance + marks + activities`.
CharactAI adds an **intelligence layer** on top:

```
Raw Student Data → Activity History → Feature Engineering → AI/ML Analysis
→ Development Profile → Explainable Insights → Recommendations
→ AI-Generated Certificate → QR Verification
→ (Placement Season) Resume/JD Matching → Adaptive AI Interview
→ Explainable Candidate Ranking → Recruiter Shortlist
```

**Design principle (also the ethical core of this project):** AI *recommends and
explains* — it never issues unreviewable verdicts about a person's character or
employability. Every score is traceable to verified evidence, every certificate
statement is grounded in verified records, and every recruitment shortlist can be
audited by a human.

---

## Monorepo layout

```
CharactAI/
├── backend/          Node.js + Express + SQLite API (auth, activities, verification,
│                      AI scoring, certificates, recruitment) — the system of record
├── frontend/          React + Vite + Tailwind + Recharts — Student / Faculty / Admin /
│                      Recruiter dashboards + public certificate verification page
├── ai-service/        Python + FastAPI + scikit-learn — clustering, regression-based
│                      score prediction, explainability, resume/JD semantic matching
├── docs/               Architecture, ER diagram, API reference, report outline
└── scripts/            Synthetic dataset generator for ML experimentation
```

Each sub-project has its own README with setup instructions. Quick start below.

---

## Quick start (demo mode)

The backend ships with a seed script that creates a realistic 4-year demo student
(`Priya Jain`), a faculty verifier, an admin, a sample job description, a resume
database, and a question bank — so you can demo the *entire* flow in Section
["Demo script"](#demo-script) below without manually entering data.

### 1. Backend API

```bash
cd backend
npm install
cp .env.example .env
npm run seed      # creates ./data/charactai.db (SQLite) with demo data
npm run dev        # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Demo logins (created by the seed script):

| Role              | Email                     | Password    |
|-------------------|---------------------------|-------------|
| Student           | priya.jain@charactai.edu  | Student@123 |
| Faculty           | faculty@charactai.edu     | Faculty@123 |
| Admin             | admin@charactai.edu       | Admin@123   |
| Recruiter         | recruiter@abc-tech.com    | Recruit@123 |
| Placement Officer | placement@charactai.edu   | Officer@123 |

### 3. AI service (optional, advanced ML extension)

```bash
cd ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

This service demonstrates the classical-ML side of the brief (K-Means clustering into
development "profiles", a Random-Forest/Gradient-Boosting score predictor with
feature-importance explainability, and a lightweight TF-IDF resume↔JD matcher). The
Node backend's `services/aiAssessment.service.js` implements the same ideas as a
transparent rules+weights engine so the app is fully runnable even without the Python
service — the two are meant to be interchangeable/complementary, matching the brief's
instruction to *"clearly distinguish between institution-defined scoring rules and ML
predictions."*

---

## Demo script (matches the brief's "strongest demo flow")

1. **Login as student** → see 4 years of activities (14 → 27 → 42 → 51 per year).
2. **Open an activity** → see uploaded evidence (certificate/image).
3. **Login as faculty** → approve/reject pending activities with a reason.
4. **Run AI assessment** (student or admin triggers it) → Overall Development: **89/100**.
5. Click **"Why 89?"** → explainable breakdown per dimension, tied to specific verified
   evidence counts (library visits, hackathons, mentoring, etc.).
6. **Year-wise growth** → 61 → 72 → 81 → 89 across four years, with an AI narrative.
7. **AI recommendations** → strengths vs. development areas (e.g. "increase community
   participation").
8. **Generate certificate** → PDF with certificate ID `CHAI-2027-XXXXXXXX` + QR code.
9. **Scan QR / open verification link** → public page shows "✓ Certificate Verified"
   without exposing private data.
10. **Switch to Recruiter** → upload a Job Description → system parses required
    skills → matches against the resume database → eligibility filter → ranked
    shortlist → generate a personalized 7-minute AI interview → adaptive
    question flow → explainable "why recommended" breakdown → final ranked list,
    always ending in **recruiter review**, never an automatic hire.
11. **Switch to Placement Officer** → open the seeded "Trainee Software Engineer -
    Campus Drive 2027" drive → see three applications in different real stages
    (in-process with an HR round scheduled, an accepted offer, and a rejection
    after the technical round) → view **Placement Statistics** (placement rate,
    average/highest CTC) and the **company-wise / department-wise** reports.

---

## Core modules implemented

**Student development side**
- Authentication & role-based access (Student / Faculty / Admin / Recruiter, JWT)
- Activity tracking across 10 categories (academic, learning, technical, sports,
  cultural, leadership, social/community, teamwork, discipline, extracurricular)
- Evidence upload + faculty verification workflow (pending → approved/rejected)
- Explainable AI development assessment (10 scored dimensions + overall score)
- Year-wise growth analytics
- AI recommendation engine (strengths / development areas / suggested goals)
- AI-generated certificate (PDF) with QR verification (public, privacy-safe)
- Digital portfolio / shareable profile
- Admin analytics (institution-wide stats, category trends, verification queue)

**Campus recruitment side**
- Company/JD upload & automatic requirement extraction
- Eligibility engine (CGPA, backlog, batch/year, branch — configurable rules)
- Resume ↔ JD semantic-ish matching (TF-IDF + cosine similarity)
- Personalized, JD-aware **AI mock interview** question generation from a 2,000+
  capacity question bank, adaptive by difficulty
- Multi-dimensional interview evaluation (technical, problem solving, communication,
  behavioural, resume-knowledge)
- Weighted, **configurable** final ranking (resume match, interview, academics,
  verified development, communication)
- Explainable "why recommended / what's missing" breakdown per candidate
- Bias & fairness guardrails: protected attributes are excluded from ranking by
  design, and every score is logged with model version + feature contributions

**Student Recruiter & Placement Management side** (operational workflow layer)
- Student profile and academic record management (shared with the development side)
- Resume and portfolio management
- Recruiter and company management
- Job and **placement drive** creation, with configurable rounds plan (Aptitude →
  Technical → HR → …)
- **Eligibility criteria management** (min CGPA, max backlogs, graduation year,
  eligible branches) enforced server-side at the moment a student applies
- Student application & registration to drives, with duplicate/eligibility guards
- **Shortlisting and selection workflow** (`applied → shortlisted → in_process →
  selected/rejected → offer_extended → offer_accepted/declined → withdrawn`)
- **Aptitude, technical, and interview round tracking** — per-application round
  records with scores, remarks, and evaluators
- **Interview scheduling** — date/time/mode/link/interviewer per round, with
  reschedule/cancel support
- **Placement offer management** — extend offers with designation & CTC; students
  accept/decline; officers can withdraw
- **Placement statistics** — total drives, applications, offers, acceptance rate,
  placement rate, average/highest CTC
- **Company-wise and department-wise reports**
- **Notifications** at every workflow transition (round cleared/rejected, interview
  scheduled, offer extended, application status changes)
- **Placement officer and recruiter dashboards** (`placement_officer` role, separate
  from the AI-matching `recruiter` role — a drive can optionally link to an AI
  `job` record to pull in resume-match/interview scores as extra signal)

This module is the operational, audit-friendly counterpart to the AI matching engine
above: officers run drives end-to-end with full traceability, while the AI resume/JD
matching and adaptive interview modules can feed a drive's shortlist as an optional
extra signal via `placement_drives.job_id`.

See `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, `docs/ER_DIAGRAM.md`, and
`docs/PROJECT_REPORT_OUTLINE.md` for the full write-up you can adapt for a
project report / synopsis / viva.

## Ethical & academic framing (important for viva)

The system never claims to determine a person's "moral character." It evaluates
**observable, evidence-backed indicators** of development (discipline, consistency,
learning orientation, leadership, teamwork, technical engagement, etc.) and always
keeps a human in the loop for verification (faculty), certification (admin), and
hiring (recruiter). Protected attributes (gender, religion, caste, race, disability,
photographs, family background) are never used as ranking features. See
`docs/ARCHITECTURE.md § Ethics, Privacy & Anti-manipulation`.
