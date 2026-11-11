#!/usr/bin/env python3
"""Incremental Hijaiyah detection summary (emit-filtered, matching the app judge)."""
import json, sys
from collections import defaultdict, Counter
from pathlib import Path

def pair_key(a, b):
    a = "ء" if a in ("ا", "أ", "إ", "آ") else a
    b = "ء" if b in ("ا", "أ", "إ", "آ") else b
    return "/".join(sorted([a, b]))

def st(xs):
    xs = [x for x in xs if x is not None]
    if not xs:
        return {"n": 0}
    xs = sorted(xs)
    def pct(p):
        i = (len(xs) - 1) * p; a = int(i); f = i - a
        return xs[a] * (1 - f) + xs[min(a + 1, len(xs) - 1)] * f
    return {"n": len(xs), "mean": sum(xs)/len(xs), "min": xs[0], "p10": pct(.1), "p50": pct(.5), "p90": pct(.9), "max": xs[-1]}

def rate(xs, th, lower=True):
    xs = [x for x in xs if x is not None]
    if not xs:
        return None
    return sum(1 for x in xs if (x <= th if lower else x >= th)) / len(xs)

p = Path("/workspace/letter-lab/out/hijaiyah.jsonl")
rows = [json.loads(l) for l in p.read_text().splitlines() if l] if p.exists() else []
print(f"n={len(rows)} ok={sum(1 for r in rows if r.get('ok'))} fail={sum(1 for r in rows if not r.get('ok'))}")
print("category", Counter(r.get("category") for r in rows))
print("letters", dict(Counter(r.get("letter") for r in rows)))
print("emit> -4", sum(1 for r in rows if r.get("ok") and (r.get("emit") is not None and r["emit"] > -4)),
      "of", sum(1 for r in rows if r.get("ok")))

by = defaultdict(lambda: {"benar": [], "salah": [], "cross": [], "benar_emit": [], "salah_emit": [], "cross_emit": [],
                          "benar_fam": [], "salah_fam": [], "cross_fam": [], "benar_clipfam": [], "cross_clipfam": []})
for r in rows:
    if not r.get("ok"):
        continue
    emit_ok = r.get("emit") is not None and r["emit"] > -4
    for pr in r.get("pairs") or []:
        if pr.get("llr") is None:
            continue
        b = by[pr["key"]]
        if emit_ok:
            b[r["category"]].append(pr["llr"])
            b[r["category"] + "_fam"].append(pr.get("fam"))
            cf = (r.get("clipFam") or {}).get(pr["key"])
            if cf is not None:
                b[r["category"] + "_clipfam"].append(cf)
        b[r["category"] + "_emit"].append(r.get("emit"))
    if r.get("category") == "benar":
        for c in r.get("cross") or []:
            if not (c.get("ok") and c.get("llr") is not None):
                continue
            key = pair_key(r["letter"], c["letter"])
            b = by[key]
            c_emit_ok = c.get("emit") is not None and c["emit"] > -4
            if c_emit_ok:
                b["cross"].append(c["llr"])
                b["cross_fam"].append(c.get("fam"))
            b["cross_emit"].append(c.get("emit"))

print("\n=== emit>-4 LLR (benar=negatives, cross=true substitutions, salah=sifat inversion) ===")
for k in sorted(by):
    d = by[k]
    print(f"\n{k}")
    print(f"  benar  {st(d['benar'])}")
    print(f"  salah  {st(d['salah'])}")
    print(f"  cross  {st(d['cross'])}")
    print(f"  cross_emit_ok {sum(1 for e in d['cross_emit'] if e is not None and e>-4)}/{len(d['cross_emit'])}  benar_emit_ok {sum(1 for e in d['benar_emit'] if e is not None and e>-4)}/{len(d['benar_emit'])}")
    for th in (0, 0.5, 1):
        fb, ds, dc = rate(d["benar"], th), rate(d["salah"], th), rate(d["cross"], th)
        def pcts(x):
            return "n/a" if x is None else f"{100*x:.1f}%"
        print(f"  th<={th}: FA(benar)={pcts(fb)}  det(salah)={pcts(ds)}  det(cross)={pcts(dc)}")

# unfiltered too
print("\n=== ALL ok clips (no emit filter) means ===")
by2 = defaultdict(lambda: {"benar": [], "salah": [], "cross": []})
for r in rows:
    if not r.get("ok"):
        continue
    for pr in r.get("pairs") or []:
        if pr.get("llr") is not None:
            by2[pr["key"]][r["category"]].append(pr["llr"])
    if r.get("category") == "benar":
        for c in r.get("cross") or []:
            if c.get("ok") and c.get("llr") is not None:
                by2[pair_key(r["letter"], c["letter"])]["cross"].append(c["llr"])
for k in sorted(by2):
    d = by2[k]
    print(f"  {k}: benar mean={st(d['benar']).get('mean')} n={st(d['benar'])['n']} | salah mean={st(d['salah']).get('mean')} n={st(d['salah'])['n']} | cross mean={st(d['cross']).get('mean')} n={st(d['cross'])['n']}")
