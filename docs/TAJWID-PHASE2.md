# Tajwid check — phase 2 (tuned rules)

The "Çətin" level now uses per-rule thresholds that were picked on dev data for ≤1.5% false alarms. They were then checked on data the tuning never saw.

- **Dev:** Husary, Alafasy and Minshawi on 2:1-41, plus the qdat_bench dev half (ids 0-7…).
- **Held-out:** 10 qaris on 36:1-30 and 67:1-20, plus the qdat_bench test half (ids 8-f…). The qdat_bench data is 159 real learners reciting 5:109, labelled by humans, Apache-2.0.
- **Injected errors:** Husary, Minshawi and Abdulbasit audio with a "full" cut (down to a natural 2-count) or a "half" cut (half of the extra length removed).
- **munfasil negatives:** qasr reciters (Jibreel, Rifai, Husary mujawwad, Basfar) are excluded. Under the Shatibiyya path (Husary murattal), munfasil is 4–5 counts.
- **Code path:** `lab validate.mjs` runs the shipped `judge()` with real prep reference files, on cached model output.

## Rules (`RULES` in src/tajwid-core.js)

| rule | flag when |
|---|---|
| muttasil (and other madd 4) | ratio < 2.2 and < 0.75 × Husary's ratio |
| munfasil (type from Quran-Lab rule_index) | ratio < 2.1 and < 0.8 × Husary's ratio |
| madd lazim | ratio < 2.6 and < 0.72 × Husary's ratio |
| ghunna (noon/meem with shadda) | ratio < 1.9 and LLR(plain noon) > −10 |
| ikhfa | ratio < 1.2 and LLR(clear noon) > −12 and < 0.72 × Husary's ratio |
| natural madd held too long (new) | mid-word only; ratio > 1.4 and > 1.5 × Husary's ratio, and LLR(4-count variant) > −10; needs the page's all-site data |
| qalqala at the ayah end (new) | encoder probe score > 0 (logistic on [mean‖max] of the 512-d encoder rows at token start ±3 frames, `src/tajwid-qprobe.json`, 11 KB) |

All rules also require these gates:

- The token and both of its neighbours are clearly heard (emit ≥ −3).
- Less than 15% of the ayah is poorly aligned.
- The ayah window has no dropped audio.

The wording says "Ehtimal: …" (possible), and the card keeps the disclaimer.

## Before → after (held-out test split)

```
BEFORE                      muttasil     munfasil       ghunna        ikhfa      qalqala         long
dev FA husary                0% 0/28      0% 0/42      0% 0/55      0% 0/55       0% 0/1     0% 0/322
dev FA others                0% 0/56      0% 0/84     0% 0/110     0% 0/110       0% 0/2     0% 0/644
dev inj full               89% 24/27    93% 38/41    52% 28/54    69% 37/54            -            -
dev inj half               37% 10/27    39% 16/41      0% 0/54      0% 0/54            -            -
dev inj long                       -            -            -            -            -     0% 0/119
dev qdat err(TPR)                  -    71% 17/24    65% 13/20    54% 22/41      0% 0/27       0% 0/9
dev qdat ok(FPR)                   -      0% 0/47      0% 0/51      0% 0/30      0% 0/44     0% 0/275
test FA husary               0% 0/10      0% 0/24      0% 0/37      0% 0/49       0% 0/2     0% 0/188
test FA others               0% 0/97     1% 1/108     0% 1/331    2% 11/469      0% 0/18    0% 0/1700
test inj full              74% 23/31    86% 50/58   53% 57/107   57% 83/146            -            -
test inj half               10% 3/31    17% 10/58     2% 2/107     0% 0/145            -            -
test inj long                      -            -            -            -            -     0% 0/236
test qdat err(TPR)                 -    59% 19/32    57% 12/21    57% 31/54      0% 0/31       0% 0/9
test qdat ok(FPR)                  -      0% 0/56      0% 0/67      0% 0/34      0% 0/57     0% 0/343

AFTER                       muttasil     munfasil       ghunna        ikhfa      qalqala         long
dev FA husary                0% 0/28      0% 0/42      0% 0/55      0% 0/55       0% 0/1     0% 0/322
dev FA others                0% 0/56      0% 0/84     0% 0/110     0% 0/110       0% 0/2     0% 1/644
dev inj full               85% 23/27    93% 38/41    48% 26/54    41% 22/54            -            -
dev inj half               78% 21/27    90% 37/41    44% 24/54      0% 0/54            -            -
dev inj long                       -            -            -            -            -   33% 39/119
dev qdat err(TPR)                  -    83% 20/24    75% 15/20    51% 21/41    89% 24/27       0% 0/9
dev qdat ok(FPR)                   -      0% 0/47      0% 0/51      0% 0/30      0% 0/44     0% 0/275
test FA husary               0% 0/10      0% 0/24      0% 0/37      0% 0/49       0% 0/2     0% 0/188
test FA others               1% 1/97     1% 1/108     0% 1/331     1% 5/469      0% 0/18    0% 1/1700
test inj full              71% 22/31    86% 50/58   47% 50/107   34% 50/146            -            -
test inj half              45% 14/31    47% 27/58   14% 15/107     0% 0/145            -            -
test inj long                      -            -            -            -            -   11% 27/236
test qdat err(TPR)                 -    69% 22/32    67% 14/21    54% 29/54    68% 21/31       0% 0/9
test qdat ok(FPR)                  -      2% 1/56      1% 1/67      0% 0/34      0% 0/57     0% 0/343
```

Not enabled, because no setting met the false-alarm target:

- **Qalqala sughra (mid-ayah):** the burst-removed injections are not separable yet.
- **Idgham / izhar:** not done.

The model tends to write the rule rather than what was said (Quran-Lab's own warning), so ikhfa stays weak. This matches published results (Muaalem ikhfa F1 0.45).

## Qalqala probe (research item 5)

| | qdat test AUC | qdat test TPR | qdat test FA | clean qaris, ayah-end qalqala (10 qaris, ب د ق ج ط) |
|---|---|---|---|---|
| LLR (no-qalqala variant) | 0.87 | 55% | 0% | **33/380 flagged (9%)** → not shipped |
| encoder probe, training on qdat dev only | 0.99 | 77% | 0/57 | – |
| encoder probe, shipped judge path (gates + Husary ref) | – | 68% (21/31) | 0/57 | **0/380** |

Limits:

- Every positive comes from one word, the ب at the end of 5:109 (qdat_bench learners).
- On synthetic cases (pro audio with the release silenced), the score moves up (median −6.2 → −4.3) but stays under the threshold: 0/190 detected.
- So for other letters and voices the check stays silent rather than wrong. It needs more labelled learner data.
- Mid-ayah (sughra) qalqala is not checked.

## Natural madd held too long (research item 4)

- Clean natural madds have a long tail: about 2% are over 2.1× the unit, from every qari. They are almost all at a word end, where a mid-ayah pause stretches them.
- So the check runs mid-word only, and must also be clearly longer than Husary's own reading and supported by the LLR.
- Natural madds are frequent (about 10 per ayah), so the setting was chosen for per-ayah false alarms:
  - Dev: 1.3% of ayahs.
  - Held-out test: 1/1700 sites, about 0.2% of ayahs.
  - qdat: 0/618.
- Detection is low: 11% of all injected long madds (about 26% of mid-word ones), and 0/9 in qdat (all word-final or at the edge).
- It needs the page's all-site data; prep backfills older pages.
- Pre-stop trimming was not added: word-final and ayah-final madds are skipped instead.
