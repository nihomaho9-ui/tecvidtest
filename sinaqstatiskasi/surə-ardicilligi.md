# Surə ardıcıllığı

Mahirin göstərişi: Quranı **mushaf sırası ilə** (1-dən 114-ə) ölçmək və hər tamamlanan prefiksdən (1…N) sonra push etmək. Kiçik surələr birləşdirilə bilər. Dəqiqlik sürətdən üstündür.

Zolaq məlumatı yüklənsə belə, müddət qaydası yalnız `decide-val` «SHIP» deyəndə açılır. 12 noyabr 2026, 00:51 (Ər-Riyad) etibarilə heç bir müddət qaydası SHIP deyil.

<!-- auto:start -->
Yenilənmə: 12 noyabr 2026, 10:44 (Ər-Riyad vaxtı).

## Sayta çıxarılan prefiks

| Prefiks | Surələr | main SHA | gh-pages SHA | Xidmət işçisi | Vaxt (Ər-Riyad) | Qeyd |
|---------|---------|----------|--------------|---------------|-----------------|------|
| 2 / 114 | 1 Fatihə, 2 əl-Bəqərə | `f2015049759ed193fa69923086221b8a8868c6f2` | `2de6268c3bcb004aa22760e5564b99917c49d71a` | tecvid-shell-v18 | 12 noyabr 2026, 07:26 | Yalnız zolaq məlumatı; `BAND_MODES` boşdursa hakimlər Hüsari yolundadır |

Push jurnali: `lab/quran-band/out/pushes.log` və `ship-state.json`.

## Ölçü vəziyyəti (32 zolaq qarisi)

Gözlənilən ölçü sayı = ayə sayı × 32.

| Surə | Ayə | Ölçülüb / gözlənir | Status |
|------|-----|---------------------|--------|
| 1 Fatihə | 7 | 224 / 224 | Bitib, saytdadır (12 noyabr 2026, 07:26) |
| 2 əl-Bəqərə | 286 | 9151 / 9152 | Bitib, saytdadır (12 noyabr 2026, 07:26) |
| 18 əl-Kəhf | 110 | 3519 / 3520 | Yoxlama dəstində ölçülüb; progress siyahısında «bitmiş surə» deyil. Əksik: `ahmed_neana 18:63` |
| 36 Yasin | 83 | 2656 / 2656 | Bitib, növbə prefiks 36-ya çatanda push olunacaq. Köhnə süzgəc bəzən daha az qari saxlayırdı; düzəlişdən sonra 32-si də saxlanılır |
| 67 əl-Mülk | 30 | 960 / 960 | Bitib, növbə 67-yə çatanda push olunacaq |

`progress.json` (laboratoriya): bitmiş elan olunanlar 1, 2, 36, 67; hazırda ölçülən **3**. 3–17, 19–35, 37–66 və 68–114 bu skriptin gördüyü ayə keşində yoxdursa, hələ ölçülməyib sayılır.

Inject tutma sınağı: 34 285 işdən 34 285-si yazılıb (bitib, decide-val gözləyə bilər). Ətraflı: [tecvid-muddet.md](tecvid-muddet.md).
<!-- auto:end -->

## İlk ölçülən surələr haqqında

Əvvəl Fatihə, Mülk və Yasin (və yoxlama üçün Bəqərə 1–41 ilə Kəhf) ölçülmüşdü. Sonra sıra 1→114 olaraq düzəldildi. Mülk və Yasin hazırdır, amma Bəqərə bitmədən sayta 36 və ya 67 kimi çıxarılmayacaq.
