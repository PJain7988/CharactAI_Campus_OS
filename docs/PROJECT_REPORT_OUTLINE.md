# CharactAI — Project Report Outline

Use this as a starting skeleton for a formal major-project report, synopsis, or
viva presentation. Section numbers below correspond to the implementation, not a
fixed university template — reorder to match your institution's format.

## Suggested title

**"CharactAI: An AI-Powered Holistic Student Development, Employability Assessment
and Smart Campus Recruitment & Placement Management Platform"**

Short name: **CharactAI**
Tagline: *"From Student Journey to Career Readiness."*

## 1. Introduction
- 1.1 Problem statement (traditional character certificates carry no evidence)
- 1.2 Motivation
- 1.3 Objectives
- 1.4 Scope of the project

## 2. Literature Survey / Related Work
- Existing college ERP / LMS systems and their limitations
- Applicant Tracking Systems (ATS) and their keyword-matching limitations
- Explainable AI in educational and HR contexts
- Gap this project addresses: a single, verified, longitudinal profile spanning
  development *and* employability, with explainability and human oversight built in
  rather than bolted on.

## 3. System Requirements
- 3.1 Functional requirements (map to the 3 user roles × modules, see § 5)
- 3.2 Non-functional requirements (security, privacy, explainability, auditability,
  scalability, usability)
- 3.3 Hardware/software requirements

## 4. System Design
- 4.1 Architecture diagram — see `docs/ARCHITECTURE.md`
- 4.2 ER diagram — see `docs/ER_DIAGRAM.md`
- 4.3 Data flow diagrams (Level 0/1) for: activity submission → verification →
  scoring → certificate; and JD upload → matching → interview → ranking; and
  drive creation → application → rounds → offer
- 4.4 API design — see `docs/API_REFERENCE.md`
- 4.5 UML diagrams (use-case, sequence for "generate certificate" and "run AI
  interview", class/component diagram of the backend services)

## 5. Modules Implemented

### 5.1 Student Development
1. Authentication & Authorization (JWT, RBAC)
2. Student Profile Management
3. Activity Management (8 categories, evidence upload)
4. Evidence Verification (faculty workflow)
5. AI/ML Development Assessment (explainable rules+weights engine)
6. Explainable AI (per-dimension, evidence-linked explanations)
7. AI Recommendation Engine
8. Student Growth Analytics (year-wise trend)
9. Certificate Generation (PDF)
10. QR-Based Certificate Verification (public, privacy-safe)
11. Digital Portfolio (visibility tiers)
12. Institution/Admin Analytics

### 5.2 AI Campus Recruitment
13. Company/JD Management (skill extraction)
14. Resume Database & Matching (TF-IDF + cosine similarity)
15. Eligibility Engine
16. AI Question Engine (JD- and resume-aware, adaptive difficulty)
17. AI Mock Interview & Multi-dimensional Evaluation
18. Explainable Candidate Ranking (configurable weights)
19. Bias & Fairness Guardrails

### 5.3 Student Recruiter & Placement Management
20. Placement Drive Creation (with rounds plan & eligibility criteria)
21. Student Application & Registration
22. Shortlisting & Selection Workflow
23. Aptitude / Technical / Interview Round Tracking
24. Interview Scheduling
25. Placement Offer Management
26. Placement Statistics
27. Company-wise & Department-wise Reports
28. Notifications
29. Placement Officer & Recruiter Dashboards

## 6. AI/ML Methodology

### 6.1 The scoring pipeline and why it's explainable-by-construction
Describe the diminishing-returns saturation curve, the achievement/role bonus
system, and why this beats a naive linear "activity count" score (ties into the
brief's "200 library visits" caution). Cite `aiAssessment.service.js`.

### 6.2 Classical ML extension (Python `ai-service/`)
- K-Means clustering into development "profiles" (Academic Focused / Technical
  Innovator / Leadership Oriented / Balanced Performer / Extracurricular Focused)
- Regression models (Linear Regression, Random Forest, Gradient Boosting) predicting
  the overall score from the same feature vector, compared by MAE
- Feature importances as a second, complementary explainability lens

### 6.3 NLP / resume matching
TF-IDF vectorization + cosine similarity, blended with explicit skill-taxonomy
matching for a hybrid precision/recall trade-off. Discuss how this could be
upgraded to sentence-embedding-based semantic matching.

### 6.4 Evaluation
Report actual metrics from your own dataset/run — do not reuse the illustrative
numbers below, they are structure examples only:

| Model | MAE (illustrative structure only) |
|---|---|
| Linear Regression | — |
| Random Forest | — |
| Gradient Boosting | — |
| XGBoost | — |

For clustering: report silhouette score. For the recommendation/ranking system:
report recommendation relevance / acceptance rate if you collect any user feedback
during testing. For the application: report API response time, certificate
generation time, and interview-completion latency from your own load tests.

## 7. Implementation
- 7.1 Technology stack (React/Vite/Tailwind, Node/Express, SQLite, Python/FastAPI/
  scikit-learn, PDFKit, QRCode)
- 7.2 Key algorithms (pseudocode or excerpts for the diminishing-returns score,
  eligibility filter, adaptive difficulty, TF-IDF matching)
- 7.3 Screenshots of each dashboard (student, faculty, admin, recruiter,
  placement officer) and the certificate PDF / QR verification page

## 8. Testing
- 8.1 Unit-level checks performed during development (see `README.md § Quick start`
  and the curl-based smoke tests used to validate every endpoint)
- 8.2 Test cases table: eligibility rejection, duplicate application prevention,
  round status transitions, offer accept/decline, certificate verification with an
  invalid code, RBAC enforcement (e.g. a student attempting to approve their own
  activity should be rejected)
- 8.3 Known limitations (see § 10)

## 9. Ethical & Academic Framing (important for viva)
- The system never claims to determine a person's moral character — only
  observable, evidence-backed development indicators.
- Human-in-the-loop at every consequential step: faculty verify evidence, admins
  issue certificates, recruiters make hiring decisions, placement officers run
  drives — AI recommends and explains, never auto-decides.
- Protected attributes (gender, religion, caste, race, disability, photographs,
  family background) are excluded from the schema entirely, not merely
  down-weighted, so they cannot enter any ranking.
- Every AI-influenced action is written to an audit log with actor, inputs, and
  model version, per the brief's "Bias & Fairness Module" requirement.

## 10. Limitations & Future Scope
- Real attendance/LMS/library-system integration (currently manual/faculty entry)
- Sentence-embedding-based semantic resume matching (currently TF-IDF + skill
  taxonomy)
- A production LLM call for narrative generation (currently a deterministic
  template, by design, to keep the demo runnable offline — see
  `docs/ARCHITECTURE.md § LLM Integration point` for the drop-in replacement)
- Mobile app for activity logging on the go
- Wearable integration for verified sports/activity data
- Employer verification portal with student-consent-gated sharing
- A/B testing and calibration of the diminishing-returns saturation constants
  against real longitudinal data once available

## 11. Conclusion
Summarize how the platform demonstrates full-stack development, applied AI/ML,
explainable AI, security engineering, and a defensible ethical design — the full
breadth expected of a B.Tech major project — while remaining a genuinely usable,
end-to-end system rather than a collection of disconnected demos.

## 12. References
Cite the specific papers/docs you use for TF-IDF, K-Means, Random Forest/Gradient
Boosting, and any fairness-in-ML sources you draw on for § 9.

## Appendix
- Full API reference: `docs/API_REFERENCE.md`
- Full ER diagram: `docs/ER_DIAGRAM.md`
- Full architecture notes: `docs/ARCHITECTURE.md`
- Demo login credentials and script: `README.md`
