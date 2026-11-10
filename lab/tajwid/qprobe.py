import json, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import cross_val_predict
R = json.load(open('qprobe.json'))
dev = [r for r in R if r['set'] == 'dev']; te = [r for r in R if r['set'] == 'test']
def X(rows, w): return np.array([np.concatenate([r['f'][2*w], r['f'][2*w+1]]) for r in rows])
y = lambda rows: np.array([r['y'] for r in rows])
yd, yt = y(dev), y(te)
llr = lambda rows: np.array([r['llr'] if r['llr'] is not None else -99 for r in rows])
print('dev n', len(dev), yd.sum(), 'test n', len(te), yt.sum())
print('LLR AUC dev %.3f test %.3f' % (roc_auc_score(yd, llr(dev)), roc_auc_score(yt, llr(te))))
def report(name, sd, st):
    # threshold from dev at <=1.5% FA on dev negatives
    neg = np.sort(sd[yd == 0]); th = neg[int(np.ceil(0.985 * len(neg))) - 1] if len(neg) else 0
    th = max(th, neg.max()) if len(neg) < 67 else th
    tpr_t = (st[yt == 1] > th).mean(); fa_q = (st[(yt == 0) & np.array([r['src']=='qdat' for r in te])] > th).mean(); fa_p = (st[(yt == 0) & np.array([r['src']=='pro' for r in te])] > th).mean()
    print('%-26s AUC test %.3f | dev-th TPR test %3.0f%%  FA qdat %3.0f%%  FA pro %3.0f%%' % (name, roc_auc_score(yt, st), 100*tpr_t, 100*fa_q, 100*fa_p))
report('LLR', llr(dev), llr(te))
for w in range(4):
    for C in [0.001, 0.01, 0.1]:
        sc = StandardScaler().fit(X(dev, w)); m = LogisticRegression(C=C, max_iter=5000)
        cv = cross_val_predict(m, sc.transform(X(dev, w)), yd, cv=5, method='decision_function')
        m.fit(sc.transform(X(dev, w)), yd); st = m.decision_function(sc.transform(X(te, w)))
        report(f'probe w{w} C{C} (cv-dev th)', cv, st)
        # fused with LLR
        z = lambda a: (a - cv.mean()) / cv.std()
print('--- qdat-only training/eval (removes pro-vs-learner confound)')
q = lambda rows: [r for r in rows if r['src'] == 'qdat']
dq, tq = q(dev), q(te); ydq, ytq = y(dq), y(tq)
print('LLR qdat-only AUC test %.3f' % roc_auc_score(ytq, llr(tq)))
for w in range(4):
  for C in [0.01, 0.1]:
    sc = StandardScaler().fit(X(dq, w)); m = LogisticRegression(C=C, max_iter=5000)
    cv = cross_val_predict(m, sc.transform(X(dq, w)), ydq, cv=5, method='decision_function'); m.fit(sc.transform(X(dq, w)), ydq)
    st = m.decision_function(sc.transform(X(tq, w))); sp = m.decision_function(sc.transform(X([r for r in te if r['src']=='pro'], w)))
    th = cv[ydq == 0].max()
    print('w%d C%-5s AUC test %.3f | th=max dev-neg: TPR %3.0f%% FA qdat %3.0f%% FA pro-test %3.0f%% (%d)' % (w, C, roc_auc_score(ytq, st), 100*(st[ytq==1]>th).mean(), 100*(st[ytq==0]>th).mean(), 100*(sp>th).mean(), len(sp)))
