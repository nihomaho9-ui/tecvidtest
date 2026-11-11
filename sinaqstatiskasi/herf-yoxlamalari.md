# Hərf yoxlamaları (məxrac / bacı hərflər)

11 noyabr 2026 (Ər-Riyad) tarixində sayta çıxarılıb: `main` `9afec7d`, xidmət işçisi `tecvid-shell-v15`. Mənbə: `lab/letter-gop/REPORT.md`.

Yoxlama **Sərt** və **Çətin** rejimlərində işləyir. **Normal** dəyişməyib (nə hərf, nə müddət təcvidi). Mövcud müddət və söz-GOP astanaları dəyişdirilməyib.

Bir söz pəncərəsində gözlənilən hərf bacı hərfdən pis və ya bərabər oturanda (`LLR ≤ 0`) və hərf ailəsinin kütləsi də bacını üstün tutanda (`fam ≤ 0`) bayraq qalxır. Zəif uyğun gələn tokenlər (`emit ≤ -4`) buraxılır.

## Sayta çıxarılan 11 cüt

ء/ع, ح/ه, خ/ه, ق/ك, ت/ط, د/ض, س/ص, ث/س, ذ/ز, خ/غ, ز/ظ.

## Təmiz oxunuşda yanlış xəbərdarlıq

Keşlənmiş Zipformer posteriorları: **8 243 ayə**, **41 qari** (Əbdülbasit çıxarılıb; siyahı [qariler.md](qariler.md) faylındadır), surələr **1, 2:1–41, 18, 36, 67**. Bir keş uyğun gəlməyib: `ahmed_neana-18-63`.

Abdullah əl-Cuhəni kəskin kənardır (cüt LLR-ləri təxminən 3–5 nat, qalanlarda 15–19; ship qaydasında ayələrin 23%-i bayraqlanır). Aşağıdakı rəqəmlər **əl-Cuhənisizdir** (40 qari, 7 972 ayə); mötərizədə onunla birgə.

Bütün 11 yoxlama, əl-Cuhəni daxil, yer (sayt) səviyyəsində 1,5% büdcənin altındadır.

| Cüt | Yer sayı | Yer FA (əl-Cuhənisiz) | əl-Cuhəni ilə |
|-----|----------|------------------------|----------------|
| ء/ع | 36 098 | **0,07%** | 0,16% |
| ح/ه | 24 309 | **0,01%** | 0,07% |
| خ/ه | 21 706 | **0,00%** | 0,01% |
| ق/ك | 20 644 | **0,13%** | 0,16% |
| ت/ط | 16 957 | **0,38%** | 0,40% |
| د/ض | 10 451 | **0,00%** | 0,00% |
| س/ص | 10 165 | **0,00%** | 0,07% |
| ث/س | 9 225 | **0,10%** | 0,15% |
| ذ/ز | 8 902 | **0,07%** | 0,10% |
| خ/غ | 4 672 | **0,00%** | 0,02% |
| ز/ظ | 3 078 | **0,00%** | 0,00% |

Bir ayədə istənilən hərf bayrağı (ittifaq): **1,71%** (136/7 972) əl-Cuhənisiz; onunla 2,41%. Fatihə 0%, əl-Mülk 0,58% ayə FA. Qalan bayraqların demək olar hamısı 18 və 36-dakı bir neçə sistemli yerə yığılır (xüsusən 36:18, 36:67, 18:97 تَ, 36:76 كَ, 18:34 ءَ); hər biri təxminən 25 qaridə işə düşür. Bu, təsadüfi səpələnmə deyil, model/lüğət məhdudiyyətidir.

Daha boş 1,5%-kvantil astana (LLR təxminən +3…+9) bütün xüsusiyyətlər açıq olsa təxminən 11% təmiz ayəni bayraqlayardı; **istifadə olunmayıb**. `LLR ≤ 0` deməkdir ki, bacı hərf eyni dərəcədə və ya daha yaxşı oturur.

## Tutma

**Ayə içində əvəzləmə.** Təmiz qiraətdə gözlənilən hərf bacısını təxminən 15–19 nat üstələyir. Eyni pəncərədə tam dəyişmə işarəni çevirir, ona görə `LLR ≤ 0` tutması mahiyyətcə 100% minus yuxarıdakı yer FA-dır. Tətbiqin real mühiti tam ayələrdir.

**Təcrid olunmuş hicə hərfləri** (Hijaiyah Letter Pronunciation, CC BY 4.0; 5 benar + 5 salah respondent, 1 təkrar; 600-dən 573-ü qiymətləndirilib, 27 wav yoxdur). Recitation CTC modeli tək təcrid hərfi demək olar heç vaxt inamlı emissiya saymır (`emit > -4` yalnız 12/573 klipdə), ona görə bu mühit tətbiq mühitindən kənardır. Süzgəcsiz, 11 cütdən 10-u düz istiqamətdə hərəkət edir (benar orta +1,1…+3,0, çarpaz bacı orta −1,0…−2,8). Çarpaz tutma, `LLR ≤ 0`: ت/ط 69%, ث/س 73%, ح/ه 67%, خ/غ 73%, خ/ه 77%, د/ض 84%, ذ/ز 77%, ز/ظ 87%, س/ص 83%, ق/ك 88%. Salah (sifət çevirməsi, həmişə bacı dəyişməsi deyil) zəifdir: 23–57%. **ء/ع təcriddə tərsdir** (düzgün «ayn» tez-tez həmzəyə oxşayır); ayə içində belə deyil — təmiz orta LLR 14,7, əl-Osmanın «nəbəd»ində yaxşı uyğun gələn ع 28 olub. ء/ع cütü yalnız qiraət (ayə) üçün buraxılıb; təcrid uyğunsuzluğu qeyd olunur.

**qdat_bench** (159 klip, 5:109-un ikinci yarısı; etiketlər *uzunluq / əksik qəlqələ*, hərf dəyişməsi deyil):

| Xüsusiyyət | Səhv n | Düzgün n | Tutma LLR≤0 | Tutma təmiz p1.5-də | Qeyd |
|------------|--------:|----------:|------------:|--------------------:|------|
| qəlqələ | 58 | 101 | 0,0% | 19% (hədd ≈ 9,7) | Əksik sıçrayışın orta LLR-i hələ 13,1-dir (düzgündə 19,2) |
| ğunnə | 41 | 118 | 0,0% | təxminən 10% (hədd ≈ 3,0) | Qısa şəddə nun, denazallaşma deyil |
| ixfa | 94 | 65 | 1,1% | təxminən 10% (hədd ≈ 3,0) | Yenə müddət; Çətində artıq var |

## Saxlanılan (sayta çıxarılmayan) yoxlamalar

- **Qəlqələ / ğunnə / ixfa hərf-GOP.** qdat uzunluq səhvlərini təhlükəsiz həddə mənalı tutmur. Bu iş üçün Çətinin müddət yoxlaması qalır.
- **Artıq ğunnə.** Hətta 0,1% yer büdcəsində təmiz ayələrin təxminən 2%-ni bayraqlayır (hər ayədə çox namizəd yer). əl-Osman dərsində təmiz, yaxşı uyğun gələn doğru-müsbət alınmayıb.
- **د/ت (dalın ta kimi oxunması).** Göndərilən cütlər arasında yoxdur (yalnız د/ض var). Gemini ilə təsdiqlənmiş bir müəllim nümunəsi shipped qaydasında tutulmayıb; bəzi təmiz qari yerlərinin LLR-i həmin səhvdən aşağıdır. Saxlanılıb. Ətraflı: [gemini-etiketleme.md](gemini-etiketleme.md).
- **Təfxim/tərqiq, əlavə məxrac cütləri.** Aşağıdakı bölmə və Gemini qeydinə baxın. Normal rejimdə heç nə açılmayıb.

## Verilənlər və lisenziyalar

- **Hijaiyah Letter Pronunciation** — https://data.mendeley.com/datasets/r5fy2dd98g , DOI 10.17632/r5fy2dd98g.1, **CC BY 4.0**. Təcrid hərflər, doğru və səhv.
- **obadx/qdat_bench** — https://huggingface.co/datasets/obadx/qdat_bench , **Apache-2.0** (tətbiqin NOTICE faylında artıq istinad olunur). 159 qiraət, 5:109.
- **EveryAyah** təmiz qiraət keşi — hərf FA-sı üçün; Əbdülbasit çıxarılıb.
- **IqraEval** və bəzi digər dəstlər araşdırılıb, lakin bu buraxılışın rəqəmlərinə daxil edilməyib (bəziləri qapalıdır və ya lisenziya/həcm uyğun deyil). Mənbə qeydi: `letter-lab/notes/SOURCES.md`.
