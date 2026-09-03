# CharactAI — Architecture

## 1. System overview

CharactAI has three cooperating systems that share one database (SQLite for this
reference build; the schema maps directly onto MongoDB collections or a managed
Postgres for production):

```
                         ┌─────────────────┐
                         │     Student     │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ React Frontend  │  (Vite + Tailwind + Recharts)
                         └────────┬────────┘
                                  │  REST (JSON) over HTTPS
                                  ▼
                         ┌─────────────────┐
                         │ Node/Express API│  JWT auth, RBAC, audit logging
                         └────────┬────────┘
                                  │
                ┌─────────────────┼──────────────────┐
                │                 │                  │
                ▼                 ▼                  ▼
        ┌──────────────┐  ┌──────────────┐   ┌───────────────┐
        │   SQLite DB   │  │ File Storage │   │  (optional)   │
        │ (better-sql3) │  │ evidence/    │   │ Python FastAPI│
        │               │  │ certificates │   │  ai-service   │
        └──────────────┘  └──────────────┘   └───────────────┘
```

1. **Student Development** — activity tracking, evidence verification, the
   explainable AI assessment engine, certificates, QR verification.
2. **AI Campus Recruitment** — JD upload, resume/JD matching, adaptive AI mock
   interviews, explainable candidate ranking.
3. **Placement Management** — the operational workflow layer: drives, eligibility,
   applications, round tracking, interview scheduling, offers, statistics/reports.
   This is deliberately a separate, simpler, more auditable system from (2) — a
   placement officer runs a drive with plain business rules and a full audit trail,
   while (2)'s AI signals (resume-match score, interview score) can optionally feed
   into a drive via `placement_drives.job_id`.

## 2. Why a rules+weights engine instead of a trained black box

The brief is explicit that the system must not claim to judge a person's moral
character, and that ML predictions must be clearly separated from
institution-defined scoring rules. `aiAssessment.service.js` therefore implements a
transparent, auditable formula:

1. Only **verified** (faculty-approved) activities count — this is the
   anti-manipulation guarantee (a student typing "500 library visits" does nothing;
   only approved `activities` rows count).
2. Each activity maps to one or more of the 10 development dimensions.
3. A **diminishing-returns curve** (`ceiling * (1 - e^-(count/saturation))`)
   converts activity counts into a 0–100 sub-score, so volume alone can't dominate
   substance (the brief's "200 library visits ≠ 200 productive sessions" warning).
4. Achievement/role bonuses (winner, finalist, coordinator, mentor) add a bounded
   bonus on top.
5. A weighted sum (admin-configurable, `DEFAULT_DIMENSION_WEIGHTS`) produces the
   overall score.
6. Every sub-score carries a **generated explanation string** referencing the exact
   evidence count and sample activity titles that produced it — this is the
   Explainable AI requirement.

The `model_version` field is stored with every persisted assessment
(`ai_assessments.model_version`), so if the formula changes later, historical
assessments remain traceable to the version that produced them.

**Where a trained ML model fits:** `ai-service/` (Python) demonstrates the
brief's classical-ML requirement — K-Means clustering into development "profiles"
(Section 21) and a Random Forest/Gradient Boosting regressor predicting the overall
score from the same feature vector, with permutation-importance-style
explainability. It's designed to sit *beside* the Node rules engine, not replace
it — a report can show both and discuss the trade-off (interpretability vs.
predictive power) for the viva.

## 3. AI Campus Recruitment pipeline

```
Job Description text
        │
        ▼
  Skill extraction (keyword/alias taxonomy) ──► required technical + soft skills
        │
        ▼
  Eligibility filter (CGPA, backlogs, batch, branch) — hard rule, not ML
        │
        ▼
  Resume × JD matching per eligible candidate:
    0.6 × (matched skills / required skills)  +  0.4 × TF-IDF cosine similarity
        │
        ▼
  Shortlist = top N eligible candidates by match score (N configurable)
        │
        ▼
  Adaptive AI interview: 7 slots (intro, resume, 2 technical, JD-specific,
  problem-solving, behavioral), each drawn from a topic-weighted question bank
  biased toward the candidate's matched skills
        │
        ▼
  Per-answer scoring = fraction of expected concepts mentioned (open questions
  score on substance/length instead) → aggregated into 5 dimensions
        │
        ▼
  Final ranking = weighted blend (resume match, interview, problem solving,
  academics, verified holistic-development score, communication) — weights are
  per-job and admin/recruiter configurable
        │
        ▼
  Explainable "why recommended / what's missing" breakdown, logged with
  model_version — final call always left to a human recruiter (`finalize`
  only marks candidates as *recommended*, never *hired*)
```

### Adaptive difficulty
`questionEngine.service.js`'s `nextDifficulty()` implements the brief's "Adaptive
Interview Difficulty" (Section 16): a high concept-hit-ratio on the current
question suggests the *next* question at one difficulty tier up; a low ratio steps
down. The reference frontend surfaces the suggestion but leaves the actual next
question selection to the recruiter for this demo build — a fully automated
adaptive loop is a natural extension (see `docs/PROJECT_REPORT_OUTLINE.md` § Future
Scope).

### Fairness
`resumeMatch.service.js`'s skill taxonomy and the TF-IDF vectorizer never see
gender, religion, caste, disability status, photographs, or family background —
those fields don't exist anywhere in the `students`/`resumes` schema, so they
literally cannot enter the ranking. Every ranking-affecting action is written to
`audit_logs` with the actor, action, entity, and a JSON payload of the inputs that
produced the result.

## 4. Placement Management workflow

```
Officer creates a Drive
  (company, JD, eligibility rules, rounds plan, package range)
        │
        ▼
Student applies  ──(server-side eligibility check: CGPA/backlogs/branch/batch)──►  rejected if ineligible
        │  (rounds are auto-created from the drive's rounds plan)
        ▼
applied → shortlisted → in_process
        │
        ▼   (officer records each round's outcome)
Aptitude round → Technical round → HR round → …
   score, remarks, cleared/rejected, optional interview scheduling
        │
        ▼
selected → offer_extended  (officer extends: designation + CTC)
        │
        ▼
offer_accepted / offer_declined  (student responds)
```

Every state transition writes a `notifications` row for the student (round
cleared/rejected, interview scheduled, offer extended, status changed) and an
`audit_logs` row for compliance. Statistics (`/api/placement/stats/*`) are computed
live from these tables — nothing is pre-aggregated or cached, so the officer
dashboard is always current.

## 5. LLM Integration point

`narrative.service.js` is a deterministic, dependency-free stand-in for an LLM
call. It receives exactly the structured payload an LLM prompt would receive
(scores + evidence counts) and returns prose. To wire in a real LLM (per Section 24
of the brief — "ML/Rules → Evidence-based assessment → LLM → Professional
narrative"), replace the body of `buildNarrative()` with an API call, e.g.:

```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Write a 2-3 sentence professional development summary from this
        verified evidence (do not invent achievements): ${JSON.stringify(assessment)}`
    }]
  })
});
```

Nothing upstream needs to change — the scoring pipeline is identical either way,
which is exactly the separation of concerns the brief asks for.

## 6. Security & privacy

- JWT auth (`utils/jwt.js`), bcrypt password hashing (`utils/password.js`), and
  role-based access control (`middleware/roleGuard.js`) on every non-public route.
- File uploads are restricted by MIME type and size (`middleware/upload.js`).
- Certificate verification (`GET /api/certificates/verify/:code`) is the *only*
  fully public endpoint and deliberately returns a minimal field set (name,
  program, period, score) — no email, no activity detail, no evidence.
- Every high-impact action (verify/reject an activity, generate an assessment,
  issue a certificate, run matching, extend an offer, update a round) is written to
  `audit_logs` with actor, action, entity, and a JSON snapshot of relevant inputs.
- `students.visibility` (`private` / `institution` / `public`) models the brief's
  three visibility tiers; the reference API currently enforces `institution` by
  default and is a natural place to add a public "digital portfolio" endpoint that
  filters on this column.

## 7. Anti-manipulation

A student's raw claims (an unverified `activities` row) never contribute to any
score. Only `verification_status = 'approved'` rows — meaning a faculty member has
looked at the uploaded evidence and approved it — feed the AI assessment engine,
the certificate, and (indirectly, via the "verified development" ranking factor)
the recruitment score. This directly implements the brief's Section 47 diagram
(`Student submits → Faculty verifies → Activity becomes valid`).
