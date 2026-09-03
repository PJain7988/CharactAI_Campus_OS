# CharactAI AI Service (Python)

A FastAPI microservice demonstrating the classical machine-learning side of the
brief: K-Means clustering into development "profiles", regression-based score
prediction with model comparison, feature-importance explainability, and a
scikit-learn-based resume/JD matcher.

This is **complementary** to the Node backend's `aiAssessment.service.js`, not a
replacement for it — see `docs/ARCHITECTURE.md § 2` for why the primary scoring
engine is a transparent rules+weights formula rather than a trained model, and how
this service fits in as the ML-coursework/experimentation counterpart.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service + trained-model status |
| POST | `/train` | Generates a synthetic dataset, runs K-Means clustering + trains/compares 3 regressors |
| POST | `/predict` | Predicts a single student's overall score using the best model from the last `/train` call |
| POST | `/match` | TF-IDF + cosine similarity resume/JD semantic similarity |

### Example

```bash
curl -X POST localhost:8000/train -H "Content-Type: application/json" \
  -d '{"n_samples": 400, "n_clusters": 5}'

curl -X POST localhost:8000/predict -H "Content-Type: application/json" -d '{
  "attendance_rate": 94, "library_visits": 184, "books_completed": 32, "certifications": 9,
  "workshops": 14, "projects": 8, "hackathons": 5, "sports_participation": 2,
  "volunteer_hours": 84, "leadership_roles": 3, "team_projects": 6, "event_participation": 12,
  "punctuality": 95, "assignment_completion": 97
}'
```

## Module map

| File | Brief section | Purpose |
|---|---|---|
| `app/preprocessing.py` | §19 Data Processing | Cleans missing values, clips out-of-range percentages, dedupes |
| `app/feature_engineering.py` | §20 Feature Engineering | Derives `learning_consistency`, `technical_engagement`, etc. |
| `app/clustering.py` | §21 Model 1 (Clustering) | K-Means + post-hoc profile-name assignment + silhouette score |
| `app/scoring_model.py` | §22 Model 2 (Score Prediction) | Ridge / Random Forest / Gradient Boosting comparison |
| `app/explainability.py` | §18 Explainable AI | Turns feature importances into a plain-English explanation |
| `app/main.py` | — | FastAPI wiring |
| `../scripts/generate_synthetic_dataset.py` | §49 Training Dataset | Synthetic, clearly-labelled data (never real "character" labels) |

## A note on the synthetic dataset

Per the brief's Section 49 warning, this service **never** trains on or predicts a
"character" or "goodness" label. The synthetic generator produces plausible
*development indicator* feature vectors (attendance, library visits, projects,
leadership roles, etc.) and a transparently-computed `overall_development_score`
target — the same kind of weighted formula the Node backend uses, so the ML
"label" itself stays explainable rather than being an opaque human rating. Replace
`generate_synthetic_dataset.py`'s output with your institution's own anonymized,
verified historical records before any real deployment, and re-run `/train`.

## Why Ridge instead of plain Linear Regression

Several engineered features (e.g. `academic_discipline`) are near-exact linear
combinations of base features (`attendance_rate`, `punctuality`), which makes
unregularized Linear Regression numerically unstable (huge, unstable
coefficients). Ridge regression (L2-regularized) keeps the "simple linear
baseline" comparison point in the Section 51-style results table meaningful. This
is a good discussion point for a viva on real-world feature engineering pitfalls.
