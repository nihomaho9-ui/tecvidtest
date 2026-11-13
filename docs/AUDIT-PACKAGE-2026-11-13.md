# External audit package (13 Nov 2026) — claim check

The package (README + 2 reports + 4 code files) was treated as untrusted. Each claim was reproduced against the live site / source / benches. Nothing was adopted unless it fixed a real bug or raised detection with no extra false flags.

| # | Claim | Real? | Action | Measured |
|---|---|---|---|---|
| 1 | Arabic UI shows boxes (tofu) | No. Not reproducible, even with a Latin-only fontconfig (desktop and 375×812) | Hardening only: bundled `TjQuran` (Amiri Quran, already shipped, offline) added as last-resort UI font. The audit CSS `@import` of Google Fonts was rejected (remote font, breaks offline) | Screenshots `audit-ar-settings-*` |
| 2 | "Xəta yerləri" covers ayahs, mic overlaps it | Half. It is a popover above the bar, mic is in the bar below (panel bottom 720 < bar top 725), no overlap. It did stay open until the counter was tapped again | Closes on outside tap and Esc (counter toggle and row tap unchanged) | tap page / Esc / toggle / row all behave; 0 JS errors |
| 3 | Bookmark icon does not bookmark; no Cüz | The icon is an open-book icon labelled "Surə və səhifə" (opens the jump sheet); the last page is already restored (`tartil.read`) | None. Multi-bookmarks and a Cüz row are proposals | — |
| 4 | Arrow keys do not turn pages | False | None | nav harness: keyLeft→4, keyRight→3 |
| 5 | Hifz cannot be used without the mic | True by design: text is hidden only while the mic listens | Proposal (needs a hide/reveal entry + 5-language strings): tap-to-reveal when hifz is on and the mic is off | — |
| 6 | `M(e,t)` = (a+b−d)/(a+b) makes 1-letter errors invisible | The formula is python-Levenshtein `ratio()` in `@tilawa/core` (library, not ours). Word verdicts of the zipformer path use `alignGlobal` + `phonemeCost` (makhraj neighbour groups, haraka costs) + GOP, not `ratio`. `ratio` is used for ayah search and decode-stability | Not changed. 20 000 random 1-letter/haraka substitutions of real corpus words: old ratio ≥ every threshold 100%; the audit's max-len version still ≥0.7 in 99.8% and ≥0.82 in 96.6%, so it would not "catch" them either. recitation-bench dev (771 clips) with max-len patched vs stock: identical (clean FA 15, omit 55.3%, sub 51.5%, rep 17.5%, trunc 68.9%, skip 98.7%, order 96.2%) | |
| 7 | Weighted Levenshtein (haraka, makhraj, i'rab) | Already in place: `phonemeCost` neighbour groups, and the 11 sister-letter checks shipped in v15 (see sinaqstatiskasi/herf-yoxlamalari.md, FA ≤0.4%/site) | None | — |
| 8 | Lazim threshold 2.6 too low (use 3.35) | Not shown | Not changed | lab validate (Husary/pro FA, injected, qdat): zero change in any row |
| 9 | `tl` −10/−12 too low; raise to −6.8/−7.5 | Wrong direction. The rule flags when LLR(error variant) > tl, so raising tl makes it stricter | Not changed | qdat dev TPR ikhfa 51→32%, ghunna 75→40%; test ikhfa 54→19%, ghunna 67→19% |
| 10 | Acoustic confidence gate (flag token if emit < −5.8) | No. Adds false flags | Not adopted | 12.5% of 534 clean pro ayahs flagged (Husary 7/48); 1.87% of tokens |
| 11 | Mic chain: HPF 80 Hz, +3.5 dB @3.5 kHz, compressor | No gain. App already disables echo cancellation, NS and AGC on purpose (duration measurement) | Not adopted | Chrome OfflineAudioContext render of the exact chain, then validate: qalqala dev TPR 89→85%, ghunna test TPR 67→57%, muttasil test FA 1→3 clips; no row improved |
| 12 | Munfasil "2" mode `continue` is a gap | Intentional | None | 2-mode = qasr reading, short munfasil is not an error; "too long" is not flagged because Husary holds 4–5. Çətin munfasil stays on Husary (davam.md) |
| 13 | Model is ~85 MB zipformer v3 | Partly: bundle ≈ 85 MB (model+vocab+engine) is what the app says; the blended model is 69 MB | None | — |

Reproduce: `lab`-side scripts are in the working notes; bench = `tools/recitation-bench` with `TARTIL_REPO` pointing at a repo copy whose `levenshtein.js` `ratio` is changed.
