import json, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_predict
from sklearn.metrics import roc_auc_score
R = json.load(open('nprobe.json'))
for k in ['ikhfa', 'ghunna']:
  for train_src in [('qdat',), ('qdat', 'pro')]:
    for useR in [False, True]:
      D = [r for r in R if r['k'] == k and r['set'] == 'dev' and r['src'] in train_src]; T = [r for r in R if r['k'] == k and r['set'] == 'test']
      X = lambda rows: np.array([r['f'] + ([np.log(r['r']) if r['r'] and r['r'] > 0 else 0] * 20 if useR else []) for r in rows])
      yd = np.array([r['y'] for r in D]); sc = StandardScaler().fit(X(D)); m = LogisticRegression(C=0.01, max_iter=5000)
      cv = cross_val_predict(m, sc.transform(X(D)), yd, cv=5, method='decision_function'); m.fit(sc.transform(X(D)), yd)
      th = np.quantile(cv[yd == 0], 0.99)
      st = m.decision_function(sc.transform(X(T))); qt = np.array([r['src'] == 'qdat' for r in T]); yt = np.array([r['y'] for r in T])
      # pro dev FA with dev-trained model (in-sample if pro used) and pro test FA
      Pd = [r for r in R if r['k'] == k and r['set'] == 'dev' and r['src'] == 'pro']; sd = m.decision_function(sc.transform(X(Pd)))
      th2 = max(th, np.quantile(sd, 0.99))
      print('%-6s train=%-9s r:%d qdat-test AUC %.3f | th(dev 1%%): TPR %3.0f%% FA qdat %3.0f%% FA pro-test %4.1f%% (n %d)' % (k, '+'.join(train_src), useR, roc_auc_score(yt[qt], st[qt]),
        100*(st[qt & (yt==1)] > th2).mean(), 100*(st[qt & (yt==0)] > th2).mean(), 100*(st[~qt] > th2).mean(), (~qt).sum()))
