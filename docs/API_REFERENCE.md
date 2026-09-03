# CharactAI — API Reference

Base URL (dev): `http://localhost:5000/api`
Auth: `Authorization: Bearer <JWT>` header on every route except `POST /auth/login`,
`POST /auth/register`, and `GET /certificates/verify/:code`.

Roles: `student`, `faculty`, `admin`, `recruiter`, `placement_officer`.

---

## Auth

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/auth/login` | public | `{ email, password }` → `{ token, user }` |
| POST | `/auth/register` | public | Student self-registration |
| GET | `/auth/me` | any | Current user from JWT |

## Students & activities

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/students/me` | student | Own profile |
| PUT | `/students/me` | student | Update department/program/batch/cgpa/visibility |
| GET | `/students` | faculty, admin, recruiter | List all students |
| GET | `/students/:id` | any (self or staff) | Get a student profile |
| GET | `/students/:id/timeline` | any (self or staff) | Year-wise activity counts by category |
| GET | `/activities/categories` | any | List the 8 activity categories |
| POST | `/activities` | student, faculty, admin | Create an activity (multipart, field `evidence`) |
| GET | `/activities` | any | List activities (`?studentId=` for staff) |
| GET | `/activities/:id` | any (self or staff) | Get one activity |
| DELETE | `/activities/:id` | any (self or staff) | Delete (students can't delete approved ones) |

## Verification (faculty)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/verification/pending` | faculty, admin | All pending activities |
| PUT | `/verification/:id/approve` | faculty, admin | Approve an activity |
| PUT | `/verification/:id/reject` | faculty, admin | Reject, `{ reason }` |

## AI Development Assessment

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/ai/assessment/:studentId` | student, faculty, admin | Compute & persist a fresh assessment |
| GET | `/ai/assessment/:studentId` | any (self or staff) | Latest persisted assessment |
| GET | `/ai/insights/:studentId` | any (self or staff) | Live assessment + narrative (not persisted) |
| GET | `/ai/recommendations/:studentId` | any (self or staff) | Strengths/gaps + suggestions |
| GET | `/ai/growth/:studentId` | any (self or staff) | Year 1–4 overall score trend |

## Certificates

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/certificates/:studentId/generate` | student, admin | Generates PDF + QR, returns `certificateCode` |
| GET | `/certificates/mine` | any | Own certificates (staff: `?studentId=`) |
| GET | `/certificates/:code/download` | any | Download the PDF |
| GET | `/certificates/verify/:code` | **public** | Privacy-safe verification payload |

## Admin analytics

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/admin/overview` | admin | Institution-wide counts + category/department stats |
| GET | `/admin/audit-logs` | admin | Last 200 audit log entries |

## AI Campus Recruitment

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/recruitment/jobs` | recruiter, admin | Create a job from a JD; auto-extracts skills |
| GET | `/recruitment/jobs` | any | List jobs |
| GET | `/recruitment/jobs/:id` | any | Get one job |
| POST | `/recruitment/jobs/:id/run-matching` | recruiter, admin | Eligibility filter + resume/JD match + shortlist |
| GET | `/recruitment/jobs/:id/candidates` | recruiter, admin, faculty | Ranked candidate list (`?stage=`) |
| GET | `/recruitment/jobs/:id/candidates/:studentId/explain` | any | "Why recommended?" breakdown |
| POST | `/recruitment/jobs/:id/candidates/:studentId/start-interview` | any | Generates a personalized question set |
| POST | `/recruitment/interviews/:interviewId/answer` | any | Submit + score one answer |
| POST | `/recruitment/interviews/:interviewId/complete` | any | Aggregate scores, roll into candidate ranking |
| POST | `/recruitment/jobs/:id/finalize` | recruiter, admin | Mark top N as `recommended` |
| POST | `/recruitment/resume` | student, admin | Save/update resume text (skills auto-extracted) |

## Placement Management

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/placement/drives` | placement_officer, admin, recruiter | Create a drive (eligibility + rounds plan) |
| GET | `/placement/drives` | any | List drives (`?status=open`) |
| GET | `/placement/drives/:id` | any | Get one drive |
| PUT | `/placement/drives/:id` | placement_officer, admin, recruiter | Update status/description/dates |
| POST | `/placement/drives/:id/apply` | student | Apply (server-enforced eligibility) |
| GET | `/placement/drives/:id/applications` | placement_officer, admin, recruiter | List applications (`?status=`) |
| GET | `/placement/applications/mine` | student | Own applications |
| PUT | `/placement/applications/:id/status` | staff (or student → `withdrawn` only) | Update application status |
| GET | `/placement/applications/:applicationId/rounds` | any (self or staff) | Rounds + schedules for an application |
| PUT | `/placement/rounds/:id` | placement_officer, admin, recruiter | Record round outcome (score/status/remarks) |
| POST | `/placement/rounds/:id/schedule` | placement_officer, admin, recruiter | Schedule an interview for a round |
| PUT | `/placement/schedules/:id` | placement_officer, admin, recruiter | Reschedule/cancel |
| POST | `/placement/applications/:id/offer` | placement_officer, admin, recruiter | Extend an offer |
| PUT | `/placement/offers/:id` | staff or the offered student | Accept/decline/withdraw |
| GET | `/placement/offers` | placement_officer, admin, recruiter | List offers (`?driveId=`) |
| GET | `/placement/stats/overview` | placement_officer, admin | Headline placement statistics |
| GET | `/placement/stats/by-company` | placement_officer, admin | Company-wise report |
| GET | `/placement/stats/by-department` | placement_officer, admin | Department-wise report |

---

## Example: end-to-end curl walkthrough

```bash
# 1. Login
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.jain@charactai.edu","password":"Student@123"}' | jq -r .token)

# 2. Run the AI assessment
curl -s -X POST localhost:5000/api/ai/assessment/<studentId> \
  -H "Authorization: Bearer $TOKEN"

# 3. Generate the certificate
curl -s -X POST localhost:5000/api/certificates/<studentId>/generate \
  -H "Authorization: Bearer $TOKEN"

# 4. Publicly verify it (no auth)
curl -s localhost:5000/api/certificates/verify/CHAI-2027-XXXXXXXX
```

See `README.md § Demo script` for the full guided walkthrough across all five roles.
