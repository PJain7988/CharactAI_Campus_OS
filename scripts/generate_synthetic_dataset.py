"""
Synthetic dataset generator for CharactAI's ML experimentation (Section 49 of the
brief: "real character datasets are inappropriate and difficult to obtain... you
should not train an ML model to determine whether a student is a good or bad
person"). This generates a plausible, clearly-labelled-as-synthetic dataset of
*development indicators* (never "character" or "goodness" labels) that mirrors the
feature set produced by CharactAI's activity-tracking schema, so the ai-service's
clustering/regression demos have something realistic to run against.

Usage:
    python scripts/generate_synthetic_dataset.py [--n 500] [--out data.csv]
"""
import argparse
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    'attendance_rate', 'library_visits', 'books_completed', 'certifications',
    'workshops', 'projects', 'hackathons', 'sports_participation',
    'volunteer_hours', 'leadership_roles', 'team_projects', 'event_participation',
    'punctuality', 'assignment_completion'
]

PROFILE_CENTERS = {
    'Academic Focused':        dict(attendance_rate=95, library_visits=120, books_completed=25, certifications=4,
                                     workshops=6, projects=4, hackathons=1, sports_participation=1,
                                     volunteer_hours=10, leadership_roles=1, team_projects=3, event_participation=8,
                                     punctuality=93, assignment_completion=97),
    'Technical Innovator':     dict(attendance_rate=85, library_visits=60, books_completed=10, certifications=9,
                                     workshops=12, projects=9, hackathons=6, sports_participation=1,
                                     volunteer_hours=8, leadership_roles=2, team_projects=6, event_participation=10,
                                     punctuality=85, assignment_completion=88),
    'Leadership Oriented':     dict(attendance_rate=88, library_visits=45, books_completed=8, certifications=5,
                                     workshops=7, projects=5, hackathons=3, sports_participation=2,
                                     volunteer_hours=25, leadership_roles=6, team_projects=8, event_participation=18,
                                     punctuality=90, assignment_completion=90),
    'Balanced Performer':      dict(attendance_rate=90, library_visits=70, books_completed=14, certifications=6,
                                     workshops=8, projects=6, hackathons=3, sports_participation=3,
                                     volunteer_hours=15, leadership_roles=3, team_projects=6, event_participation=12,
                                     punctuality=90, assignment_completion=92),
    'Extracurricular Focused': dict(attendance_rate=82, library_visits=30, books_completed=6, certifications=3,
                                     workshops=5, projects=3, hackathons=1, sports_participation=6,
                                     volunteer_hours=20, leadership_roles=3, team_projects=4, event_participation=22,
                                     punctuality=84, assignment_completion=83),
}


def generate(n=500, seed=42):
    rng = np.random.default_rng(seed)
    profiles = list(PROFILE_CENTERS.keys())
    rows = []
    for _ in range(n):
        profile = rng.choice(profiles)
        center = PROFILE_CENTERS[profile]
        row = {}
        for col in FEATURE_COLUMNS:
            base = center[col]
            noise_scale = max(1.0, base * 0.25)
            value = max(0, rng.normal(base, noise_scale))
            if col in ('attendance_rate', 'punctuality', 'assignment_completion'):
                value = min(100, value)
            row[col] = round(value, 1)
        row['true_profile'] = profile  # kept only for validating the unsupervised clustering later

        # Derived overall development score used as the regression TARGET (Section 22),
        # built from a transparent weighted formula analogous to the Node rules engine —
        # this keeps the "label" itself explainable rather than an opaque human rating.
        normalized = {
            'academic': (row['attendance_rate'] + row['assignment_completion']) / 2,
            'learning': min(100, row['library_visits'] / 2 + row['books_completed'] * 2 + row['certifications'] * 3),
            'technical': min(100, row['projects'] * 6 + row['hackathons'] * 8 + row['certifications'] * 2),
            'leadership': min(100, row['leadership_roles'] * 12),
            'teamwork': min(100, row['team_projects'] * 8),
            'discipline': (row['punctuality'] + row['attendance_rate']) / 2,
            'social': min(100, row['volunteer_hours'] * 2.5),
            'extracurricular': min(100, row['event_participation'] * 4 + row['sports_participation'] * 5),
        }
        weights = dict(academic=0.16, learning=0.14, technical=0.16, leadership=0.12,
                        teamwork=0.10, discipline=0.12, social=0.10, extracurricular=0.10)
        overall = sum(normalized[k] * weights[k] for k in weights)
        row['overall_development_score'] = round(min(100, overall), 1)
        rows.append(row)

    return pd.DataFrame(rows)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--n', type=int, default=500, help='Number of synthetic student records')
    parser.add_argument('--out', type=str, default='synthetic_students.csv')
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()

    df = generate(args.n, args.seed)
    df.to_csv(args.out, index=False)
    print(f'Wrote {len(df)} synthetic records to {args.out}')
    print(df.head())
