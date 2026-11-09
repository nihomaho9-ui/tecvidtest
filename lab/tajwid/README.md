# Tajwid lab (offline, Node)

Not part of the web build. Uses the app's `public/model.onnx` + `public/corpus.json` (copy them next to these scripts) with `onnxruntime-node` and `@tilawa/core`.
Audio: 16 kHz mono float32 per-ayah clips in `audio/<reciter>-<surah>-<ayah>.f32` (EveryAyah / quran.com recitations; Husary murattal is the reference).

- `lp.mjs` – fbank + streaming Zipformer -> per-frame CTC log-probs (25 Hz)
- `align.mjs` – CTC Viterbi forced alignment to the ayah's tajwid phoneme string; token classes (madd2/4/6, ghunna, ikhfa, qalqala)
- `det.mjs` – duration detector: span(prev token start -> next token start) / tempo unit
- `clean.mjs R` – ratio distributions on clean audio (false alarms)
- `inject.mjs R a0 a1 F` – cut F x the extra length out of each madd4/ghunna/ikhfa, re-run model, check detection
- `qalq.mjs` – qalqala release removal vs model GOP
- `score.mjs` – summary table

## Phase 2 scripts

- `lp2.mjs`: model output + encoder frames, cached.
- `feats.mjs`: per-site ratio + LLR.
- `build.mjs`: clean and injected feature rows.
- `qfeat.mjs` / `qeval.mjs`: qdat_bench features and AUC.
- `tune.mjs`: per-rule grid at a target false-alarm rate, dev → test.
- `cmp.mjs`: compare chosen settings and show false alarms per reciter.
- `validate.mjs`: shipped `judge()` with real prep reference files; `before` or `after`.
- `rule-index-xcheck.mjs`: our madd types vs Quran-Lab rule_index.

Results are in docs/TAJWID-PHASE2.md.
