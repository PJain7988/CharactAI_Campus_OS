# Notebooks

Place exploratory Jupyter notebooks here for your major-project report — e.g.
`01_eda.ipynb` (exploratory data analysis on the synthetic or real dataset),
`02_clustering_experiments.ipynb`, `03_regression_model_comparison.ipynb`.

A good starting point:

```python
import sys
sys.path.insert(0, '..')
sys.path.insert(0, '../../scripts')

from generate_synthetic_dataset import generate
from app.preprocessing import clean_dataframe
from app.feature_engineering import build_feature_matrix
from app.clustering import run_clustering
from app.scoring_model import train_and_compare, feature_importances

df = clean_dataframe(generate(n=500))
X, feature_names = build_feature_matrix(df)
y = df['overall_development_score']

cluster_result = run_clustering(X.values, feature_names)
comparison, models = train_and_compare(X.values, y.values)
print(comparison)
```
