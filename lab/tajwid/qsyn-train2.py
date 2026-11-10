import json, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GroupKFold, cross_val_predict
D = json.load(open('qsyn-dev.json')); T = json.load(open('qsyn-test.json')); Q = json.load(open('qprobe.json'))
X = lambda rows: np.array([r['f'] for r in rows]); QX = lambda rows: np.array([r['f'][4] + r['f'][5] for r in rows]); y = lambda rows: np.array([r['y'] for r in rows])
qd = [r for r in Q if r['src'] == 'qdat']; qt = [r for r in qd if r['set'] == 'test']; qdv = [r for r in qd if r['set'] == 'dev']
print('--- MID: threshold sweep (dev CV clean quantile)')
d = [r for r in D if not r['final']]; t = [r for r in T if not r['final']]
sc = StandardScaler().fit(X(d)); Z = sc.transform(X(d)); g = [f"{r['rec']}-{r['s']}-{r['a']}" for r in d]
cv = cross_val_predict(LogisticRegression(C=0.01, max_iter=5000), Z, y(d), groups=g, cv=GroupKFold(5), method='decision_function'); m = LogisticRegression(C=0.01, max_iter=5000).fit(Z, y(d))
st = m.decision_function(sc.transform(X(t))); yt = y(t); neg = cv[y(d) == 0]
for qq in [0.99, 0.995, 1.0]:
  for add in [0, 0.5, 1.0, 2.0]:
    th = np.quantile(neg, qq) + add
    print(f"q{qq} +{add}: dev-CV FA {100*(neg>th).mean():.1f}% | TEST synthetic TPR {100*(st[yt==1]>th).mean():3.0f}% clean FA {100*(st[yt==0]>th).mean():.1f}% ({(st[yt==0]>th).sum()}/{(yt==0).sum()})")
print('--- FINAL: synthetic + qdat dev')
d = [r for r in D if r['final']]; Xd = np.vstack([X(d), QX(qdv)]); yd = np.concatenate([y(d), y(qdv)]); src = np.array([0]*len(d) + [1]*len(qdv))
g = [f"{r['rec']}-{r['s']}-{r['a']}" for r in d] + [f"q{i}" for i in range(len(qdv))]
sc = StandardScaler().fit(Xd); Z = sc.transform(Xd)
cv = cross_val_predict(LogisticRegression(C=0.01, max_iter=5000), Z, yd, groups=g, cv=GroupKFold(5), method='decision_function'); m = LogisticRegression(C=0.01, max_iter=5000).fit(Z, yd)
tf = [r for r in T if r['final']]; sf = m.decision_function(sc.transform(X(tf))); yf = y(tf)
sq = m.decision_function(sc.transform(QX(qt))); yq = y(qt)
pro_t = [r for r in Q if r['src'] == 'pro' and r['set'] == 'test']; sp = m.decision_function(sc.transform(QX(pro_t)))
for add in [0, 0.5, 1.0]:
  th = cv[yd == 0].max() + add
  print(f"th=max dev neg +{add}: qdat test TPR {100*(sq[yq==1]>th).mean():3.0f}% FA {(sq[yq==0]>th).sum()}/{(yq==0).sum()} | syn test TPR {100*(sf[yf==1]>th).mean():3.0f}% clean FA {(sf[yf==0]>th).sum()}/{(yf==0).sum()} | pro test finals FA {(sp>th).sum()}/{len(sp)}")
