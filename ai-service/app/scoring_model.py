"""
Model 2: Development Score Prediction (Section 22 of the brief).

Trains and compares Linear Regression, Random Forest, and Gradient Boosting
regressors on the synthetic feature set, predicting `overall_development_score`.
Mirrors the brief's Section 51 experiment structure exactly:

    Model                  MAE
    ────────────────────────────
    Linear Regression       ...
    Random Forest           ...
    Gradient Boosting       ...

These are ILLUSTRATIVE numbers computed on synthetic data — a real deployment
should retrain on the institution's own verified, anonymized historical records
and report those numbers instead.

This is deliberately kept separate from and complementary to the Node backend's
transparent rules+weights engine (see docs/ARCHITECTURE.md § 2) — the brief asks
for institution-defined rules and ML predictions to be clearly distinguished, not
blended into one opaque number.
"""
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

# Note: plain (unregularized) Linear Regression is numerically unstable here because
# several engineered features (e.g. academic_discipline) are near-exact linear
# combinations of base features (e.g. attendance_rate, punctuality) — a textbook
# multicollinearity case. Ridge regression (L2-regularized linear regression) keeps
# the "simple linear baseline" comparison point from the brief's Section 51 table
# meaningful instead of producing exploding coefficients.
MODELS = {
    'Linear Regression (Ridge)': Ridge(alpha=1.0),
    'Random Forest': RandomForestRegressor(n_estimators=200, random_state=42),
    'Gradient Boosting': GradientBoostingRegressor(random_state=42),
}


def train_and_compare(X, y, test_size=0.2, random_state=42):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)

    results = {}
    fitted_models = {}
    for name, model in MODELS.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        results[name] = {'mae': round(float(mae), 2), 'rmse': round(float(rmse), 2)}
        fitted_models[name] = model

    best_name = min(results, key=lambda k: results[k]['mae'])
    return {
        'results': results,
        'best_model': best_name,
        'test_size': len(X_test)
    }, fitted_models


def feature_importances(model, feature_names):
    """Returns a sorted list of (feature, importance) for tree-based models,
    or absolute coefficients for linear models — the Explainable AI layer for
    Model 2 (analogous to the Node engine's per-dimension explanation strings)."""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    elif hasattr(model, 'coef_'):
        importances = np.abs(model.coef_)
    else:
        return []

    pairs = list(zip(feature_names, [round(float(v), 4) for v in importances]))
    return sorted(pairs, key=lambda p: p[1], reverse=True)
