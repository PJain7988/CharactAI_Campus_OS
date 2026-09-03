"""
Explainable AI helpers (Section 18 of the brief) for the Python ML models — the
counterpart to the Node backend's evidence-count explanation strings. Turns raw
feature-importance numbers into a short, human-readable explanation.
"""


def explain_prediction(feature_names, feature_values, importances, top_k=4):
    """
    feature_names: list[str]
    feature_values: list[float] — the specific student's feature values
    importances: list[(feature, importance)] — from scoring_model.feature_importances
    """
    importance_map = dict(importances)
    ranked = sorted(
        zip(feature_names, feature_values),
        key=lambda pair: importance_map.get(pair[0], 0),
        reverse=True
    )[:top_k]

    parts = [f'{name.replace("_", " ")} ({value:.1f})' for name, value in ranked]
    return f"This prediction was most strongly influenced by: {', '.join(parts)}."


def explain_cluster_assignment(profile_name, feature_names, centroid, top_k=3):
    ranked = sorted(zip(feature_names, centroid), key=lambda p: p[1], reverse=True)[:top_k]
    parts = [f'{name.replace("_", " ")}' for name, _ in ranked]
    return f'Assigned to the "{profile_name}" profile, driven primarily by elevated {", ".join(parts)}.'
