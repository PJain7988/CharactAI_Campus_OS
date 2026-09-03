"""
Data cleaning (Section 19 of the brief: "Clean: Missing values, Duplicate
activities, Invalid dates, Duplicate certificates, Inconsistent records").

This module works on the tabular feature representation (one row per student)
that `feature_engineering.py` produces, rather than raw activity logs directly —
raw-log deduplication is handled at the Node API layer (verification workflow),
so by the time data reaches this service it is one clean row per student.
"""
import pandas as pd
import numpy as np


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Drop exact duplicate rows (e.g. a student record ingested twice)
    df = df.drop_duplicates()

    # Numeric columns: clip negative noise to zero, fill missing with column median
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        df[col] = df[col].clip(lower=0)
        if df[col].isna().any():
            df[col] = df[col].fillna(df[col].median())

    # Percentage-like columns should never exceed 100
    for col in ['attendance_rate', 'punctuality', 'assignment_completion']:
        if col in df.columns:
            df[col] = df[col].clip(upper=100)

    return df
