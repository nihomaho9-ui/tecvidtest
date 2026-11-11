# Təcvid müddəti: çoxqarili zolaq

Saytdakı Çətin təcvid yoxlaması hələ də **Hüsari mürəttəl** istinadı ilə işləyir (`public/tj/<səhifə>.json`). 32 qarilik zolaq məlumatı Fatihə üçün yüklənib, amma heç bir müddət qaydası hələ «SHIP» olunmayıb. Qayda meyarlardan keçəndən sonra `BAND_MODES` həmin qaydanı zolağa keçirəcək. Munfəsil bu qərara daxil olmayacaq (aşağıya baxın).

## Necə qurulur

Hər ayədə, hər qaidədə 32 mürəttəl qarinin uzatma nisbəti ölçülür. Zolaq: minimum, 10-cu faiz (p10), median, 90-cı faiz (p90) və maksimum. Zəif uyğun gələn ayələr (`poor > 0,15`) zolağa düşmür.

Qari süzgəci (11 noyabr 2026, Ər-Riyad): orta uyğunluq ən azı 0,95 və zəif ayə payı ən çoxu 25%. Əvvəlki səhv (`poorAy >= 3` mütləq say) yoxlama dəstində (2:1–41, Kəhf, Yasin; 234 ayə) 32 yaxşı qaridən 23-nü çıxarmışdı (orta uyğunluq 0,98–0,99 olduğu halda). Düzəlişdən sonra Fatihə, Yasin və Mülkdə 32 qari saxlanılıb, 0 çıxarılıb. Əbdülbasit zolaqda deyil. əl-Cuhəni 32-lik siyahıya salınmayıb.

## Təmiz oxunuşda yanlış xəbərdarlıq (band-loo)

Mənbə: `lab/quran-band/out/eval-clean.txt`, 32 qari, düzəlişdən sonrakı hesablama. Yoxlama dəsti: 2:1–41, 18 (Kəhf), 36 (Yasin); 9 634 ayə-qari. «band-loo»: zolaqda yoxlanan qari özü iştirak etmir. «shipped» = saytdakı Hüsari yolu.

Lazim mədd bu dəstdə rast gəlməyib (rəqəm yoxdur).

| Qayda | Saytdakı Hüsari yolu | Ən yaxşı zolaq (FA) | Qərar (hələlik) |
|-------|----------------------|---------------------|-----------------|
| Müttəsil mədd | 2,9% (67/2273) | band-min 0,4% (10/2273) | Gözləyir (tutma sınağı bitməyib) |
| İxfa | 0,6% (47/7810) | band-min 0,1% (7/7810); band-p10 0,3% (23/7810) | Gözləyir |
| Uzun səslər (long) | 0,5% (119/25299) | band-min 0,1% (18/25299); band-p10 0,2% (62/25299) | Gözləyir |
| Ğunnə | 1,4% (98/6965) | bütün zolaq variantları 1,9% (129/6965) — Hüsaridən pis | Zolaq buraxılmayacaq; Hüsari qalır |
| Munfəsil mədd | 33,8% (1721/5098) | band-min 0,1% (3/5098); band-p10 0,8% (42/5098) | Çətin=4 rejimində zolağa keçirilməyəcək (aşağıya baxın) |

Hüsari təkbaşına (baseline-husary), müqayisə üçün: müttəsil 2,4% (55/2273), ixfa 0,7% (52/7810), uzun 0,8% (200/25299), ğunnə 1,7% (116/6965), munfəsil 37,1% (1892/5098).

Bütün qaydaların cəmi (standart rejimlər, əlavə döşəmə yoxdur): shipped 4,33% (2052/47445), band-min 0,35% (167/47445), band-p10 0,65% (309/47445). Bu cəm rəqəmini munfəsil çox böyüdür; qaydaları ayrı oxumaq daha düzgündür.

### Ayrı saxlanılan dəstlər (held-out)

Eyni hesabat. Rəqəmlər band-min (və lazım olanda shipped) üçündür.

**Müttəsil:** band-min held-qasr 0,0% (0/214), held-mujawwad 0,0% (0/241), held-muallim 0,0% (0/70), held-elongated 0,0% (0/69). Shipped: 2,3% (5/214), 14,5% (35/241), 4,3% (3/70), 0,0% (0/69).

**İxfa:** band-min held-qasr 0,1% (1/731), held-mujawwad 0,0% (0/783), held-muallim 0,0% (0/247), held-elongated 0,0% (0/236). Shipped: 0,3% (2/731), 0,1% (1/783), 0,0%, 0,0%.

**Uzun səslər:** band-min held-qasr 0,0% (0/2393), held-mujawwad 0,0% (1/2548), held-muallim 0,1% (1/802), held-elongated 0,0% (0/769). Shipped: 0,3% (6/2393), 0,2% (4/2548), 0,0% (0/802), 0,0% (0/769).

**Ğunnə:** zolaq held-qasr 0,6% (4/651), held-mujawwad 3,3% (23/701), held-muallim 2,7% (6/219), held-elongated 0,0% (0/218). Shipped daha yaxşı və ya bərabərdir: 0,3% (2/651), 2,7% (19/701), 1,4% (3/219), 0,0% (0/218).

**Munfəsil:** band-min held-qasr 0,0% (0/479), held-mujawwad 0,2% (1/516), held-muallim 0,0% (0/159), held-elongated 0,0% (0/150). Shipped çox yüksəkdir, çünki qəsr 4 hərəkədən qısa oxuyur: 51,6% (247/479), 62,8% (324/516), 0,6% (1/159), 0,0% (0/150).

## Munfəsil qərarı

Təcvid müddəti yalnız **Çətin** rejimində işləyir. Normal və Sərt müddəti yoxlamır, ona görə orada 2–5 hərəkə artıq qəbul olunur.

Çətin rejimində munfəsil düyməsi var: ilkin 4 dəyəri 4–5 hərəkə tələb edir (`tr=2.1`, təxminən 4 say). 2 dəyəri munfəsili heç vaxt işarələmir (0% yanlış xəbərdarlıq).

«Təmiz» 34–37%-lik yanlış xəbərdarlığın demək olar hamısı qəsrdir: zolaq munfəsillərinin 40,5%-ində (2066/5098) nisbət 2-dən kiçikdir (4 sayı tamamlanmayıb); yalnız 2,5%-ində (129/5098) nisbət 0,8-dən kiçikdir (aydın şəkildə 2 hərəkədən qısa). band-min və band-p10 aşağı yanlış xəbərdarlıq verir, çünki 32 qarilik zolağa qəsr mürəttəl qarilər də daxildir (Şüreym, Südeys, əl-Bənna və b.). Onları Çətin=4-ə buraxmaq 4–5 hərəkə tələbini dayandırardı. Ona görə Çətin munfəsil=4 Hüsari/shipped yolunda qalır.

## Inject sınağı (tutma) — gözləyir

Süni qısaldılmış kliplərlə tutmanı ölçən sınaq 32 qari üzrə **yenidən**, sıfırdan buraxılıb: **34 285** iş. Köhnə 1 579 nəticə 9 qarilik (səhv süzgəcli) zolaqla hesablandığı üçün təkrar istifadə olunmayıb.

**Vəziyyət (12 noyabr 2026, 00:51, Ər-Riyad):** 34 285 işdən **150**-si yazılıb. Tutma rəqəmləri və hansı qaydaların «SHIP» olunacağı **gözləyir**. `decide-val` inject bitəndən sonra avtomatik işləyəcək.

Əvvəlki `decide-val` (süzgəc düzəlişindən əvvəl, 9 qari, natamam inject) heç bir qaydanı buraxmayıb; o nəticə indiki 32 qarilik qərar deyil.

## Saytda nə var

Fatihə zolaq məlumatı 11 noyabr 2026, 22:54-də (Ər-Riyad) `main` `fbcf250` və `gh-pages` `68d1d04` ilə çıxarılıb, xidmət işçisi `tecvid-shell-v16`. `BAND_MODES` boşdur: hakimlər Hüsari yolundadır, davranış fərqi 0-dır. Yeni qayda yalnız inject və `decide-val` «SHIP» deyəndən sonra açılacaq.
