import json, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_predict
R = json.load(open('nprobe.json')); out = {}
for k in ['ikhfa', 'ghunna']:
  D = [r for r in R if r['k'] == k and r['set'] == 'dev']; X = np.array([r['f'] for r in D]); y = np.array([r['y'] for r in D]); q = np.array([r['src'] == 'qdat' for r in D])
  sc = StandardScaler().fit(X); Z = sc.transform(X); m = LogisticRegression(C=0.01, max_iter=5000).fit(Z, y)
  cv = cross_val_predict(LogisticRegression(C=0.01, max_iter=5000), Z, y, cv=5, method='decision_function')
  th = float(max(cv[(y == 0) & q].max(), np.quantile(cv[(y == 0) & ~q], 0.99))) + 0.1  # CV scores: max over qdat dev negatives, 99th pct of clean qaris
  W = m.coef_[0] / sc.scale_; b0 = float(m.intercept_[0] - (m.coef_[0] * sc.mean_ / sc.scale_).sum())
  out[k] = {'win': 'span', 'dim': 512, 'w': [round(float(v), 6) for v in W], 'b': round(b0 - th, 6)}; print(k, 'th', round(th, 2))
json.dump({'v': 1, 'note': 'Span probes: logistic on [mean|max] of encoder rows over the token span. >0 = probably not nasalised/held. Trained on qdat_bench dev + clean qaris (dev surahs); threshold from 5-fold CV dev negatives.', **out}, open('nprobe-weights.json', 'w'))
