"""
Feature engineering (Section 20 of the brief): converts raw activity counts into
the derived signals used by clustering/regression — learning_consistency,
technical_engagement, leadership_exposure, community_engagement,
extracurricular_balance, academic_discipline.
"""
import pandas as pd

BASE_FEATURES = [
    'attendance_rate', 'library_visits', 'books_completed', 'certifications',
    'workshops', 'projects', 'hackathons', 'sports_participation',
    'volunteer_hours', 'leadership_roles', 'team_projects', 'event_participation',
    'punctuality', 'assignment_completion'
]

DERIVED_FEATURES = [
    'learning_consistency', 'technical_engagement', 'leadership_exposure',
    'community_engagement', 'extracurricular_balance', 'academic_discipline'
]


def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['learning_consistency'] = (
        df['library_visits'] * 0.3 + df['books_completed'] * 2 + df['certifications'] * 3 + df['workshops'] * 2
    ).clip(upper=100)
    df['technical_engagement'] = (
        df['projects'] * 6 + df['hackathons'] * 8 + df['certifications'] * 2
    ).clip(upper=100)
    df['leadership_exposure'] = (df['leadership_roles'] * 12).clip(upper=100)
    df['community_engagement'] = (df['volunteer_hours'] * 2.5).clip(upper=100)
    df['extracurricular_balance'] = (
        df['event_participation'] * 4 + df['sports_participation'] * 5
    ).clip(upper=100)
    df['academic_discipline'] = (df['punctuality'] + df['attendance_rate']) / 2
    return df


def build_feature_matrix(df: pd.DataFrame):
    """Returns (X, feature_names) ready for clustering/regression."""
    df = add_derived_features(df)
    feature_cols = BASE_FEATURES + DERIVED_FEATURES
    feature_cols = [c for c in feature_cols if c in df.columns]
    return df[feature_cols], feature_cols
