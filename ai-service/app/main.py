"""
CharactAI AI Service (Python / FastAPI)

Demonstrates the classical-ML side of the brief that sits alongside the Node
backend's transparent rules+weights engine:
  - K-Means clustering into development "profiles"          (Section 21)
  - Random Forest / Gradient Boosting score prediction        (Section 22)
  - Feature-importance explainability                          (Section 18)

Run:
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

Then, e.g.:
    curl -X POST localhost:8000/train -H "Content-Type: application/json" -d '{"n_samples": 400}'
    curl localhost:8000/health
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import pandas as pd

from app.preprocessing import clean_dataframe
from app.feature_engineering import build_feature_matrix
from app.clustering import run_clustering
from app.scoring_model import train_and_compare, feature_importances
from app.explainability import explain_prediction, explain_cluster_assignment

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'scripts'))
from generate_synthetic_dataset import generate as generate_synthetic  # noqa: E402

app = FastAPI(
    title='CharactAI AI Service',
    description='Classical ML demonstrations: clustering, score prediction, explainability, resume/JD matching.',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# In-memory model cache (reference implementation only — a production service
# would persist trained models to disk/object storage with versioning).
_STATE = {}


class TrainRequest(BaseModel):
    n_samples: int = Field(default=400, ge=50, le=5000)
    n_clusters: int = Field(default=5, ge=2, le=10)
    seed: int = 42


class PredictRequest(BaseModel):
    attendance_rate: float
    library_visits: float
    books_completed: float
    certifications: float
    workshops: float
    projects: float
    hackathons: float
    sports_participation: float
    volunteer_hours: float
    leadership_roles: float
    team_projects: float
    event_participation: float
    punctuality: float
    assignment_completion: float


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'charactai-ai-service', 'trained': bool(_STATE)}


@app.post('/train')
def train(req: TrainRequest):
    """
    Generates a synthetic dataset (see scripts/generate_synthetic_dataset.py),
    cleans it, engineers features, runs K-Means clustering, and trains/compares
    the three regression models from Section 51 of the brief.
    """
    raw_df = generate_synthetic(n=req.n_samples, seed=req.seed)
    df = clean_dataframe(raw_df)
    X, feature_names = build_feature_matrix(df)
    y = df['overall_development_score']

    cluster_result = run_clustering(X.values, feature_names, n_clusters=req.n_clusters, random_state=req.seed)

    comparison, fitted_models = train_and_compare(X.values, y.values)
    best_model = fitted_models[comparison['best_model']]
    importances = feature_importances(best_model, feature_names)

    _STATE['feature_names'] = feature_names
    _STATE['best_model_name'] = comparison['best_model']
    _STATE['best_model'] = best_model
    _STATE['importances'] = importances

    return {
        'datasetSize': len(df),
        'clustering': {
            'silhouetteScore': cluster_result['silhouette_score'],
            'clusterProfiles': cluster_result['cluster_profiles'],
            'clusterSizes': pd.Series(cluster_result['labels']).value_counts().sort_index().to_dict()
        },
        'regression': comparison,
        'topFeatureImportances': importances[:8],
        'note': 'MAE/RMSE are computed on a synthetic dataset for demonstration. '
                'Retrain on real, anonymized, verified institutional data before any production use.'
    }


@app.post('/predict')
def predict(req: PredictRequest):
    """
    Predicts the overall development score for a single student's feature vector
    using the best model from the most recent /train call, with an explanation.
    """
    if 'best_model' not in _STATE:
        return {'error': 'Model not trained yet. Call POST /train first.'}

    row = pd.DataFrame([req.dict()])
    from app.feature_engineering import add_derived_features
    row = add_derived_features(row)
    feature_names = _STATE['feature_names']
    X = row[feature_names].values

    prediction = float(_STATE['best_model'].predict(X)[0])
    explanation = explain_prediction(feature_names, X[0].tolist(), _STATE['importances'])

    return {
        'predictedOverallScore': round(prediction, 1),
        'modelUsed': _STATE['best_model_name'],
        'explanation': explanation
    }


class MatchRequest(BaseModel):
    resume_text: str
    jd_text: str


@app.post('/match')
def match(req: MatchRequest):
    """
    Lightweight TF-IDF + cosine similarity resume/JD matcher — a Python-side
    equivalent of the Node backend's resumeMatch.service.js, useful if you want
    to run matching as a standalone microservice or experiment with
    scikit-learn's TfidfVectorizer instead of the dependency-free JS version.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf = vectorizer.fit_transform([req.resume_text, req.jd_text])
    similarity = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]

    return {'semanticSimilarity': round(float(similarity) * 100, 1)}


@app.get('/')
def root():
    return {
        'service': 'CharactAI AI Service',
        'endpoints': ['/health', 'POST /train', 'POST /predict', 'POST /match'],
        'docs': '/docs'
    }
