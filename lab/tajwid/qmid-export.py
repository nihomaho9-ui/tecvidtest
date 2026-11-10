import json, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GroupKFold, cross_val_predict
D = [r for r in json.load(open('qsyn-dev.json')) if not r['final']]
X = np.array([r['f'] for r in D]); y = np.array([r['y'] for r in D]); g = [f"{r['rec']}-{r['s']}-{r['a']}" for r in D]
sc = StandardScaler().fit(X); Z = sc.transform(X)
cv = cross_val_predict(LogisticRegression(C=0.01, max_iter=5000), Z, y, groups=g, cv=GroupKFold(5), method='decision_function')
m = LogisticRegression(C=0.01, max_iter=5000).fit(Z, y); th = float(cv[y == 0].max()) + 1.0
W = m.coef_[0] / sc.scale_; b = float(m.intercept_[0] - (m.coef_[0] * sc.mean_ / sc.scale_).sum()) - th
json.dump({'v': 1, 'win': [-3, 3], 'dim': 512, 'w': [round(float(v), 6) for v in W], 'b': round(b, 6),
  'note': 'Mid-ayah sakin qalqala probe: >0 = bounce probably missing. Trained on synthetic pairs (clean qaris vs release silenced), dev surahs 2:1-41, 85, 89, 96, 111-113; threshold = max CV dev negative + 1.0.'}, open('qmid-weights.json', 'w'))
print('th', th)
