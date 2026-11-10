import json, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.metrics import roc_auc_score
D = json.load(open('qsyn-dev.json')); T = json.load(open('qsyn-test.json')); Q = json.load(open('qprobe.json'))
X = lambda rows: np.array([r['f'] for r in rows]); y = lambda rows: np.array([r['y'] for r in rows])
# qprobe.json rows use f[4] (mean) + f[5] (max) for window [-3,3]
QX = lambda rows: np.array([r['f'][4] + r['f'][5] for r in rows])
qd = [r for r in Q if r['src'] == 'qdat']; qt = [r for r in qd if r['set'] == 'test']; qdv = [r for r in qd if r['set'] == 'dev']
for name, mask in [('mid', lambda r: not r['final']), ('final', lambda r: r['final']), ('all', lambda r: True)]:
  d = [r for r in D if mask(r)]; t = [r for r in T if mask(r)]
  for C in [0.01, 0.1]:
    sc = StandardScaler().fit(X(d)); Z = sc.transform(X(d)); g = [f"{r['rec']}-{r['s']}-{r['a']}" for r in d]
    cv = cross_val_predict(LogisticRegression(C=C, max_iter=5000), Z, y(d), groups=g, cv=GroupKFold(5), method='decision_function')
    m = LogisticRegression(C=C, max_iter=5000).fit(Z, y(d)); th = np.quantile(cv[y(d) == 0], 0.99)
    st = m.decision_function(sc.transform(X(t))); yt = y(t)
    sq = m.decision_function(sc.transform(QX(qt))); yq = np.array([r['y'] for r in qt])
    by = {}
    for r, s in zip(t, st):
      if r['y']: k = ('F' if r['final'] else 'M') + r['L']; by.setdefault(k, []).append(s > th)
    print(f"{name:5} C{C:<4} syn-test AUC {roc_auc_score(yt, st):.3f} TPR {100*(st[yt==1]>th).mean():3.0f}% FA(clean test) {100*(st[yt==0]>th).mean():4.1f}% | qdat real AUC {roc_auc_score(yq, sq):.3f} TPR {100*(sq[yq==1]>th).mean():3.0f}% FA {100*(sq[yq==0]>th).mean():3.0f}% |",
      ' '.join(f"{k}:{100*np.mean(v):.0f}%" for k, v in sorted(by.items())))
