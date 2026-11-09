# Tajwid detection — phase 1 findings (10 Nov 2026)

Reference reciter: Husary murattal (EveryAyah/quran.com). Cross-check: Minshawi murattal, Alafasy.
Test set: 2:1-41 (page 3 = 2:6-16 inside it). 70 obligatory 4-count madds, 55 mushaddad/idgham ghunnas, 54 ikhfa.

## Method
The app's model already outputs the quran-transcript tajwid phonetic script (madd length, ghunna, ikhfa, qalqala symbols). Raw token run-length is not a reliable duration measure, but the span between the CTC emissions of the neighbouring tokens is. Ratio r = span / reciter's own tempo unit (median natural madd in the same ayah), so slow and fast reciters are judged by their own pace.
Errors were injected by cutting the steady part of the vowel/nasal (15 ms crossfade) and re-running the model.

## Results (Husary, 2:1-41)
| Rule | Threshold | Fully shortened (->2 counts / no ghunna) | Half shortened (~3 counts) | Clean false alarm Husary / Minshawi / Alafasy |
|---|---|---|---|---|
| Madd 4-5 (muttasil, munfasil, lazim) | r<2.0 | 68/70 (97%) | 52/70 (74%) | 0% / 1.4% / 0% |
| Ghunna (نّ مّ, idgham with ghunna) | r<1.6 | 49/55 (89%) | 35/55 (64%) | 3.6% / 0% / 0% |
| Ikhfa (ن/م) | r<1.3 | 53/54 (98%) | 27/54 (50%) | 1.8% / 1.8% / 0% |
| Qalqala | model GOP | 0/46 — model still "hears" qalqala after the burst is removed | – | – |
Edits caused 19 extra flags on other tokens across 358 edited clips (~5%).

## Feasibility
- Reliable now (same 66 MB model, no extra download): madd too short (obligatory 4/6), ghunna too short, ikhfa too short. Madd at waqf ('arid) is free 2/4/6 -> not graded.
- Needs an acoustic detector on top (no model download): qalqala release, too-long natural madd.
- Needs a letter-level model / real learner data: idgham vs izhar quality, tafkhim/tarqiq, makharij.
