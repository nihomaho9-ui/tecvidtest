# Başqa bot üçün davam qeydi

Bu fayl Quran Tasheeh işinin **nə görüldüyünü, necə görüldüyünü və necə davam etməyi** bir yerdə saxlayır. Mahir 12 noyabr 2026-da (t72u) istəyib ki, sonra başqa bot da oxuyub davam edə bilsin. Rəqəmlər real sınaq və git tarixçəsindəndir; uydurma yoxdur.

**Yazılma:** 12 noyabr 2026, 12:52 (Ər-Riyad vaxtı), Çalışqan.  
**Əlaqəli qeydlər:** [tecvid-muddet.md](tecvid-muddet.md), [surə-ardicilligi.md](surə-ardicilligi.md), [qariler.md](qariler.md), [data.json](data.json). Bəzi köhnə bölmələr (məsələn `tecvid-muddet.md` içindəki «Inject sınağı — gözləyir» və `surə-ardicilligi.md` girişində «heç bir müddət qaydası SHIP deyil») güncel deyil — bu fayla və `tecvid-muddet.md` sonundakı «Buraxılan zolaq qaydaları» bölməsinə baxın.

---

## İndi haradayıq (12 noyabr 2026, 12:52)

- Canlı sayt: [https://quran.mushafuk.online/](https://quran.mushafuk.online/) (HTTP 200).
- Mushaf prefiksi **3/114** saytdadır: Fatihə, Bəqərə, Âl-i İmran. 4-cü surə (Nisa) ölçülür; bitəndə `ship-watch` avtomatik prefiks 4-ü çıxarmalıdır. 36 (Yasin) və 67 (Mülk) laboratoriyada ölçülüb, növbə onlara çatanda çıxarılacaq.
- Müddət hakimləri: `BAND_MODES = { ikhfa: "p19.5", long: "p42" }` — 12 noyabr 2026, **11:45** (Ər-Riyad) tarixində Mahirin «Push et» sözündən sonra çıxarılıb.
  - `main` `ef297a093d84d79a23251296b07e0910a67aca55`
  - `gh-pages` `674211b91cdcc9bf08e80bd886a7b4b9432d5c7a`
  - xidmət işçisi `tecvid-shell-v20`
  - sinaqstatiskasi yeniləməsi: `2afc081e060ddcbef2db52685c4bba7b1fafab9e`
- Müttəsil, ğunnə, munfəsil və lazım **Hüsari-də qalır**. Munfəsil Çətin=4-ə avtomatik çıxarılmır.
- Gücləndirmə üçün **yeni yolların** analizi (LLR həddi, ğunnəyə real müddət müqayisəsi və s.) 12:52-də hələ işləyirdi: `lab/quran-band/fine/research-analyze.mjs`, qeydlər `fine/research-records.json` (artıq hazırdır, 47 445 təmiz + 23 640 inject). Nəticə çıxanda Mahirə göstərilməli, avtomatik sayta çıxarılmamalıdır.
- Ölçü boru xətti işləyir: `daemon.sh`, `watchdog.sh`, `ship-watch.sh`, `run-surahs.mjs` (4 işçi, `--from=1 --to=114`).

---

## Mahirin dayanıqlı göstərişləri (dəyişdirməyin)

- Azərbaycan dilində yazın. Dəqiqlik sürətdən üstündür; tələsmir. Son tarix: **20 noyabr 2026, 20:00**, Ər-Riyad vaxtı.
- Quranı **mushaf sırası ilə** (1→114) ölçün; hər tamamlanan prefiksdən sonra push edin («Başdan sure sure get. Hər sure bitende push et»).
- Əbdülbasiti zolağa salmayın (uzadır). Əbdülqadir əl-Osmanın üslubu üstün tutulur, amma YouTube bağlı olduğu üçün zolaqda yoxdur; əl-Cuhəni də zolaqda deyil. Zolaqda **32** mürəttəl qari var.
- Çıxarma meyarı **heç vaxt yumşaldılmasın:** yanlış siqnal mövcud (çıxarılmış və ya Hüsari) yoldan pis olmamalıdır və mümkün olan yerdə **≤ 1,5%**; tutma Hüsaridən (və artıq çıxarılmış qaydada çıxarılmış kəsimdən) pis olmamalıdır. Keçməyən qayda sayta buraxılmır.
- **Munfəsil Çətin=4-də Hüsari-də qalır.** Bunu avtomatik dəyişməyin.
- Hər yeni sure çıxanda və hər yeni decide-val/SHIP nəticəsində Mahirə bildirin. Artıq deyilmiş xəbəri təkrarlamayın.
- Hər yeni sınaq və ya push-dan sonra bu `sinaqstatiskasi/` qovluğunu yeniləyin (dəqiq yazılış), amma qovluq yeniləməsini Mahirə ayrıca xəbər verməyin. Qari siyahısının mətni: **«Tətbiqin hazırlanmasında və öyrədilməsində bu qarilərin qiraətindən istifadə olunub»**.
- GITHUB_TOKEN, GEMINI_API_KEY və `~/.config/gh/hosts.yml` məzmununu heç vaxt yazmayın və çap etməyin.

---

## Repo, sayt, laboratoriya

- GitHub: [nihomaho9-ui/tecvidtest](https://github.com/nihomaho9-ui/tecvidtest), `main` və GitHub Pages `gh-pages`, CNAME `quran.mushafuk.online`.
- Push **yalnız** `nihomaho9-ui` hesabı ilə, `gh auth git-credential` vasitəsilə. `muhadisonline` yalnız oxumaq üçündür (403). `cursor-github` bağlanması `mmuxax-bot`-dur — bu push üçün istifadə etməyin. `user-GitHub-xai` avtomatlaşdırma üçündür. Qutu yenidən başlayanda auth itə bilər: `~/.config/gh/hosts.yml` (rejim 600) və `persist-cli-auth save`.
- Laboratoriya (qutu): `/workspace/tecvidtest-mulk/lab/quran-band/`.
- İş ağacları: `/workspace/tecvidtest-ship` (`main`), `/workspace/tecvidtest-gh-pages` (`gh-pages`).
- Əsas skriptlər: `daemon.sh`, `watchdog.sh`, `ship-watch.sh` → `ship-surah.sh`, `run-surahs.mjs` (4 ölçü işçisi), `inject2.mjs` (bitib), `decide-val.mjs` (bitib), `lab/update-sinaqstatiskasi.mjs`.
- Hakim kodu: `src/tajwid-core.js` (və `.d.ts`), tətbiq: `src/tajwid.ts`. Zolaq sətirlərinin ilk 8 sütunu əvvəlki kimidir; **indeks 8** əlavə faizlər üçündür (ixfa `19.5`, uzun məd yuxarı `58`). Qısa qaydalar zolağın aşağı `pX`-ini, uzun məd yuxarı `p(100−X)`-i oxuyur. Gələcək avtomatik surə çıxarışları bu əlavə sütunu yazmalıdır — `buildBand` / `rebuild-surah-bands` / `assemble-pages` / `apply-band-app.mjs` / `tools/tajwid-band-prep.mjs` 11:45 çıxarışında buna görə yenilənib. Onları geri almayın.
- 20 dəqiqədən bir rutin: «Quran Tasheeh işini izlə» (yalnız **yeni** xəbər Mahirə çatdırılsın).

### Vacib tələ

`out/measures.json` 12 noyabr saat 03:35-dən (qutu bərpasından) bəri boşdur (`[]`). `eval.mjs`, `decide-val.mjs` və ya `inject2.mjs`-i olduğu kimi yenidən işə salsanız, məlumat olmadan işləyər. Yenidən model (ONNX) işlətməyin: yoxlama ölçüləri `lab/quran-band/fine/measures-val.json` içində keşdən bərpa olunub; inject nəticələri `out/inject.json` / `out/inject-shards/` / `out/inject-summary.json`-dadır. `decide-val.json` 10:34-də yazılıb.

Bəqərənin 2-ci səhifəsi / **2:1 (الم)** üçün müddət zolağı yoxdur: 32 qaridə `unit/r` boşdur. İlk Bəqərə çıxarışı səhifə 2-ni atlamışdı; `assemble-pages.mjs` boş zolaqlı ölçülmüş ayəni tamamlanmış sayır, prefiks 2 yenidən `tecvid-shell-v18` ilə çıxarılıb. 2:1-də zolaq hələ yoxdur — bu gözləniləndir.

---

## Validasiya və çıxarılan eşiklər (necə qərar verilib)

Yoxlama dəsti: **2:1–41, 18, 36**. Meyar yuxarıdakı kimidir.

1. **Inject** (süni səhv, tutma): 34 285 iş, 12 noyabr **10:34**-də bitdi (`ok` 30 836). `inject2.mjs` 4 hissə, köhnə 1 579 nəticə (9 qarilik səhv süzgəc) istifadə olunmayıb.
2. **`decide-val`** (yalnız band-min, band-p10, median): eyni gün **10:34**, `SHIP: none`. Hamısı o kəsiklərdə Hüsari-də qaldı. Qısa səbəblər:
   - müttəsil: Hüsari FA 2,42% (55/2273), tutma 52,4% (2379/4540); band-min tutması 45,1%-ə düşür; p10 FA 2,33% (>1,5%).
   - ixfa: Hüsari FA 0,67% (52/7810), tutma 32,7% (309/946); p10 tutması 31% (293) — 16 ədəd az; median FA Hüsaridən pis.
   - uzun məd: Hüsari FA 0,79% (200/25299), tutma 22,6% (21/93, kiçik nümunə); p10 tutması 20,4%; median 204 yanlış siqnal (4 çox).
   - ğunnə: hər üç kəsik eyni — FA 1,85% (129/6965), tutma 35,2% (4896/13906). FA həm 1,5%-dən, həm Hüsaridən (116) pis. **Ğunnə hakimi zolaq nisbətini müqayisə etmir**, yalnız hansı yerlərin yoxlanacağına baxır.
   - munfəsil: siyasətə görə Çətin=4-də Hüsari (Hüsari FA 37,11%, tutma 85,6%).
   - lazım: yoxlama dəstində yer yoxdur.
3. **Aralıq eşiklər** (Mahir: «Ən faydalı olanını et»): mövcud inject nəticəsində p0–p50, 0,5 addım, 101 kəsik, model yenidən işlədilmədi. Fayllar: `lab/quran-band/out/fine-cuts.json`, `out/fine-cuts.txt`, `fine/`.
   - İxfa: p14–p24 keçir. Seçilən ehtiyatlı kəsik **p19.5**: FA **0,51% (40/7810)**, tutma **34,78% (329/946)** — 20 əlavə tutma, 12 az yanlış siqnal. p24 daha çox tutur (347), amma ehtiyatı nazikdir (3 yanlış siqnal). p24,5 uğursuzdur (54 FA).
   - Uzun məd: p37,5–p48,5 keçir, tutma hamısında 21/93. Seçilən orta **p42** (yuxarı p58): FA **0,71% (179/25299)**. p37,5 kənardadır (p37 tutması 20-yə düşür); median uğursuzdur.
   - Müttəsil keçmədi: p6 FA 1,50% (34/2273), tutma 7 ədəd az (2372/4540); p6,5 tutma bəs, FA 1,63% (37, 3 çox).
4. Mahir «Ən münasibi et», sonra hazırlığı görüb **«Push et»** dedi. Koda `p<X>` dəstəyi və əlavə sütun əlavə olundu; zolaqlar `ayah/` xam fayllarından yenidən quruldu (model yox). Smoke-test keçdi. Digər qaydalar Hüsari-də qaldı.

---

## Hələ görüləcək iş

1. **Ölçü və push davamı.** Nisa bitsin, prefiks 4 çıxarılsın, sonra 5, 6, … mushaf sırası ilə, 36 və 67 növbəyə düşəndə. Hər yeni prefiksdə Mahirə bildirin; `sinaqstatiskasi/` yeniləyin (SW-ni yalnız həqiqi tətbiq dəyişikliyində artırın).
2. **Yeni gücləndirmə yolları** (Mahir: «Yeni yollara bax gücləndirmək üçün»). Analiz, avtomatik çıxarma yoxdur. Kəsikdən başqa ideyalar: ğunnə hakiminə real müddət müqayisəsi; müttəsilin 7 tutma / 3 FA boşluğunu meyar pozmadan bağlamaq (məs. LLR həddi, Hüsari ilə hibrid). Skript: `fine/research.mjs` (qeydlər hazırdır — təkrar işlətməyə ehtiyac yoxdur, əgər yoxlama uyğun gəlirsə), `fine/research-analyze.mjs`. İxfa və uzun məd artıq saytdadır: orada «yaxşılaşma» çıxarılmış kəsikdən pis olmamalıdır (ixfa 40/7810 və 329/946; uzun 179/25299 və 21/93), təkcə Hüsaridən yaxşı olması bəs etmir. Nəticəni Mahirə göstərin, təsdiqsiz push etməyin. Meyarı yumşaltmayın.
3. **Hərf yoxlamaları.** 11 cüt əvvəl çıxarılıb (`tecvid-shell-v15`). Yeni Gemini detektorları saxlanılıb (51 klip, heç biri keçməyib); daha çox təsdiqlənmiş nümunə lazımdır.
4. **Lazım** üçün yoxlama nümunəsi yoxdur — yeni dəst olmadan SHIP etməyin.
5. İmkan olsa, `out/measures.json` boşluğunu `fine/measures-val.json` və ya `.lp` keşindən düzəldin ki, təsadüfi yenidən işəsalma korolmasın. Model işlətməyin.

---

## Laboratoriya faylları (qutu)

Hamısı `/workspace/tecvidtest-mulk/lab/quran-band/` altındadır:

| Yol | Nədir |
|-----|--------|
| `out/decide-val.json`, `out/decide-val.txt` | 10:34 qərarı (min/p10/median, SHIP yox) |
| `out/inject-summary.json`, `out/inject.json`, `out/inject-shards/` | 34 285 inject nəticəsi |
| `out/fine-cuts.json`, `out/fine-cuts.txt`, `fine/` | 101 aralıq kəsik, bərpa olunmuş yoxlama ölçüləri |
| `fine/measures-val.json` | Boş `out/measures.json` əvəzinə istifadə edin |
| `fine/research-records.json`, `fine/research.mjs`, `fine/research-analyze.mjs` | Yeni yol analizi (analiz hələ bitməyə bilər) |
| `prep-cuts/` | p19.5/p42 hazırlığı, patch, rescore, nümunə zolaqlar |
| `out/ship-state.json`, `out/pushes.log` | Son çıxarış vəziyyəti |
| `out/surah-001.json` … `003`, `036`, `067` | Ölçülmüş surə zolaqları (4 hələ bitməyib) |
| `ayah/` | Qari-ayə xam müddətləri; zolağı model olmadan yenidən qurmaq olur |

---

## Qısa tarixçə (12 noyabr)

- ~03:17 qutu yenidən başladı: proseslər öldü, `out/` itkisi, inject sıfırdan ~03:35, `measures.json` boş qaldı, GitHub auth bərpa olundu (`nihomaho9-ui`).
- Fatihə, sonra Bəqərə: əvvəl `tecvid-shell-v17` (səhifə 2 yox), sonra v18 (49 səhifə, 2:1-də zolaq yenə yoxdur). Âl-i İmran ölçüldü və **11:01**-də v19 ilə çıxarıldı (`main` `9422e71`, `gh-pages` `0b7b14f`) — o vaxt yalnız zolaq məlumatı, hakimlər Hüsari.
- `ship-watch` sonsuz yenidənqurma döngüsü (mtime + `rebuiltAt`) düzəldildi: məzmun eynidirsə yazılmır, hash `ls --full-time` əvəzinə məzmunadır.
- 10:34 inject + decide-val. Mahir gücləndirmə istədi; aralıq kəsiklər tapıldı; ehtiyatlı p19.5 və p42 hazırlandı; **11:45**-də v20 ilə sayta çıxarıldı.
