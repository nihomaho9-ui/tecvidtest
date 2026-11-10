# Notices

The page code in this repository is written for Mushafuk Tartil.

The Zipformer model (`public/model.onnx`) and the phoneme corpus (`public/corpus.json`) are derivatives of Quran-Lab's Zipformer work, distributed under the **NPL-1.2** non-commercial share-alike licence. They are not MIT. See `NPL-1.2.txt`.

- Do not charge for the model, the corpus, or a feature they power.
- Hosted use is free or cost-recovery only.
- Recognition runs on the device. No recitation audio is uploaded.

Display text is the Uthmani wording shipped with the Tilawa corpus for word alignment.
The recognizer is [@tilawa/core](https://github.com/yazinsai/tilawa) (MIT code) with `onnxruntime-web` (MIT).

## Tajwid reference data

- `public/tj/*.json` hold measurements of Sheikh Mahmoud Khalil al-Husary's murattal recitation (EveryAyah / quranicaudio.com audio, quran.com word timings), used only as a timing reference for the "Çətin" tajwid check.
- The madd type per token (`mt`: munfasil / muttasil / lazim) comes from Quran-Lab's `rule_index.jsonl` in [Quran-Lab/mfa-quran-hafs](https://huggingface.co/Quran-Lab/mfa-quran-hafs), Apache-2.0.
- `public/tj/waqf.json` (allowed stop places for the "Yanlış vəqf" note) lists the pause marks (ۖ ۗ ۘ ۙ ۚ ۛ ۜ) of the Uthmani text from the quran.com API v4, plus places where al-Husary pauses in the timings above.
- Thresholds were tuned with [obadx/qdat_bench](https://huggingface.co/datasets/obadx/qdat_bench) (Apache-2.0); the benchmark audio is not shipped.

## Amiri Quran font

`fonts/AmiriQuran-arabic.woff2` (used for Arabic words in the tajwid card) is Amiri Quran, Copyright 2010-2022 The Amiri Project Authors (https://github.com/aliftype/amiri), licensed under the SIL Open Font License 1.1 — see `fonts/OFL-AmiriQuran.txt`.
