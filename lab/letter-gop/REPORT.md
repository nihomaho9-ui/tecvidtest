# Letter-level pronunciation checks (hərf tələffüzü)

Shipped 2026-11-11 (Asia/Riyadh). Feature lives in **Sərt** and **Çətin** only; **Normal** is unchanged (no letter flags, no duration tajwid). Existing duration / word-GOP thresholds were not edited.

## What shipped

Eleven sister-letter pairs, flagged when token-window LLR(expected vs sister) ≤ 0 **and** letter-family log-mass also favors the sister (fam ≤ 0). The emission filter already skips poorly aligned tokens (`emit ≤ -4`).

Pairs: ء/ع, ح/ه, خ/ه, ق/ك, ت/ط, د/ض, س/ص, ث/س, ذ/ز, خ/غ, ز/ظ.

Held back (see below): qalqala, ghunna, ikhfa letter-GOP, and extra-ghunna.

## Clean false-alarm budget (≤ 1.5% per check)

Scored cached Zipformer posteriors, **8,243 ayahs**, **41 EveryAyah reciters** (Abdulbasit excluded), surahs **1, 2:1–41, 18, 36, 67**. One cache failed to align (`ahmed_neana-18-63`).

One reciter, **juhaynee**, is a clear outlier (mean pair LLRs ~3–5 nats vs ~15–19 for everyone else; 23% ayah flags at the ship rule). Figures below are **without juhaynee** (40 reciters, 7,972 ayahs), then with him in parentheses.

| Check | Sites | Site FA (llr≤0 ∧ fam≤0) | With juhaynee |
|------|------:|------------------------:|--------------:|
| ء/ع | 36,098 | **0.07%** | 0.16% |
| ح/ه | 24,309 | **0.01%** | 0.07% |
| خ/ه | 21,706 | **0.00%** | 0.01% |
| ق/ك | 20,644 | **0.13%** | 0.16% |
| ت/ط | 16,957 | **0.38%** | 0.40% |
| د/ض | 10,451 | **0.00%** | 0.00% |
| س/ص | 10,165 | **0.00%** | 0.07% |
| ث/س | 9,225 | **0.10%** | 0.15% |
| ذ/ز | 8,902 | **0.07%** | 0.10% |
| خ/غ | 4,672 | **0.00%** | 0.02% |
| ز/ظ | 3,078 | **0.00%** | 0.00% |

All 11 checks are well under the 1.5% site budget, including juhaynee.

Union (any letter flag on the ayah): **1.71%** (136/7,972) without juhaynee; 2.41% with him. Fatiha and Al-Mulk are 0% / 0.58% ayah FA; almost all remaining flags concentrate on a handful of systematic sites in 18 and 36 (notably 36:18, 36:67, 18:97 تَ and 36:76 كَ, 18:34 ءَ), each firing on ~25 reciters. That is a model/vocab limitation, not a random sprinkling of alarms.

A looser 1.5%-quantile threshold (LLR around +3 to +9) would flag ~11% of clean ayahs if every feature were on; we did **not** use that. LLR ≤ 0 means the sister actually fits as well or better.

## Detection

**In-context substitutions.** On clean recitation the expected letter beats its sister by ~15–19 nats. A complete swap in the same alignment window flips the sign, so detection at LLR ≤ 0 is essentially 100% minus the site FA above. This is the app’s actual domain (full ayahs).

**Hijaiyah isolated letters** (CC BY 4.0; 5 benar + 5 salah respondents, rep=1; 573 scored of 600, 27 missing wavs). The recitation CTC model almost never assigns a confident emission to a single isolated letter (`emit > -4` on only 12/573 clips), so isolated rates are out-of-domain. Unfiltered, 10 of 11 pairs still move the right way (benar mean +1.1 to +3.0, cross-sister mean −1.0 to −2.8). Cross detection at LLR ≤ 0: ت/ط 69%, ث/س 73%, ح/ه 67%, خ/غ 73%, خ/ه 77%, د/ض 84%, ذ/ز 77%, ز/ظ 87%, س/ص 83%, ق/ك 88%. Salah (sifat inversion, not always a true sister swap) is weaker, 23–57%. **ء/ع is inverted in isolation** (benar ain often looks like hamza); in context it is not — clean mean LLR 14.7, and a well-aligned ع in Al-Osman’s نعبد scored 28. We still ship ء/ع for recitation only and document the isolated mismatch.

**qdat_bench** (159 clips of 5:109, second half; labels are *length / missing bounce*, not letter swaps):

| Feature | Error n | Correct n | Det at LLR≤0 | Det at clean p1.5 | Notes |
|---------|--------:|----------:|-------------:|------------------:|-------|
| qalqala | 58 | 101 | 0.0% | 19% (th≈9.7) | Missing bounce still has mean LLR 13.1 vs 19.2 |
| ghunna  | 41 | 118 | 0.0% | ~10% (th≈3.0) | Short shadda noon, not denasalisation |
| ikhfa   | 94 | 65 | 1.1% | ~10% (th≈3.0) | Same — duration, already covered in Çətin |

Held: these letter-GOP checks do not meaningfully catch the labelled errors inside a 1.5% clean-FA budget. Keep using Çətin’s duration band for them.

**Al-Osman Fatiha lesson** (16 windows). All eight clean full-ayah takes: **zero** flags at the ship rule. Demonstrated errors are mostly tafkheem / haraka / long drills with poor alignment (correctly suppressed by `emit > -4`). dal-vs-ta is not a shipped pair (we only score د/ض). Extra ghunna on يا of العالمين did not produce a clean, well-aligned nasal-mass hit. So Al-Osman supports low FA on clean takes, not a detection claim.

## Held back

- **qalqala / ghunna / ikhfa letter-GOP** — no meaningful detection of qdat length errors at a safe threshold.
- **extra-ghunna** — even at a 0.1% site budget it flags ~2% of clean ayahs (many candidate sites per ayah); Al-Osman did not give a clean true-positive.
- Nothing was enabled on **Normal**.

## Integration

`tajwid.setMode({ tajwid, letters })`: Sərt = letters only, Çətin = duration tajwid + letters, Normal = neither. Five-language copy (az/tr/en/ar/ru). Letter flags are brown (`#a15b2e`) and do not require a Husary duration reference.
