import json, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_predict
R = json.load(open('qprobe.json')); dev = [r for r in R if r['set'] == 'dev']; w = 2
X = np.array([np.concatenate([r['f'][2*w], r['f'][2*w+1]]) for r in dev]); y = np.array([r['y'] for r in dev])
sc = StandardScaler().fit(X); Z = sc.transform(X); m = LogisticRegression(C=0.01, max_iter=5000)
cv = cross_val_predict(m, Z, y, cv=5, method='decision_function'); th = float(cv[y == 0].max()) + 0.1
m.fit(Z, y); W = m.coef_[0] / sc.scale_; b = float(m.intercept_[0] - (m.coef_[0] * sc.mean_ / sc.scale_).sum() - th)
json.dump({ 'v': 1, 'win': [-3, 3], 'dim': 512, 'pool': 'mean|max', 'w': [round(float(v), 6) for v in W], 'b': round(b, 6),
  'note': 'Logistic probe: >0 = ayah-end qalqala probably missing. Trained on qdat_bench dev half (Apache-2.0) + clean qaris 2:1-41; threshold = max dev-negative CV score + 0.1.' },
  open('/workspace/tecvidtest/src/tajwid-qprobe.json', 'w'))
print('th', th, 'dev n', len(dev))
