# Sınaq statistikası

Davam etmək və ya başqa assistentə vermək üçün əvvəlcə **[davam.md](davam.md)** oxuyun.

Bu qovluq Quran Tasheeh tətbiqinin keçirdiyi sınaq və yoxlamaların qeydidir. Rəqəmlər yalnız real laboratoriya hesabatlarından, jurnallardan və git tarixçəsindən götürülüb. Uydurulmuş rəqəm yoxdur. Hələ bitməyən işlər «gözləyir» kimi yazılıb.

Bu qovluq tətbiqin yığılmasına (build) və `gh-pages` yerləşdirməsinə daxil deyil. Saytdakı davranış buradakı sənədlərə görə dəyişmir.

Səs tanıma modeli əvvəlcədən öyrədilmiş **Tilawa Zipformer** modelidir. Aşağıdakı qarilərin qiraəti həmin modelin təlimi üçün istifadə olunmayıb. Onların qiraəti təcvid müddət aralıqlarını qurmaq və yoxlamaları ölçmək üçündür.

**Yazılma vaxtı:** 12 noyabr 2026, 00:51 (Ər-Riyad vaxtı).

**Sayta çıxarma meyarı:** düzgün oxunuşda yanlış xəbərdarlıq mövcud (Hüsari) yoldan pis olmamalıdır və mümkün olan yerdə 1,5%-dən çox olmamalıdır; süni səhvlərdə tutma Hüsaridən pis olmamalıdır. Meyarı keçməyən qayda sayta buraxılmır.

## Qarilər

**[qariler.md](qariler.md) — Tətbiqin hazırlanmasında və öyrədilməsində bu qarilərin qiraətindən istifadə olunub.**

Orada hər qarinin tam adı, daxili kodu, üslubu (mürəttəl, mücəvvəd, müəllim), rolu və zolaq süzgəcinin nəticəsi yazılıb. Müəllimlər və zolaqdan çıxarılan qarilər ayrıca göstərilir.

## Mündəricat

| Fayl | Nə var |
|------|--------|
| [davam.md](davam.md) | **Başqa bot üçün:** nə görülüb, necə görülüb, indi haradayıq, necə davam etməli |
| [qariler.md](qariler.md) | Sınaqda və hazırlıqda istifadə olunan bütün qarilər |
| [tecvid-muddet.md](tecvid-muddet.md) | Çoxqarili müddət zolağı, yanlış xəbərdarlıqlar, munfəsil qərarı, inject sınağının vəziyyəti |
| [herf-yoxlamalari.md](herf-yoxlamalari.md) | Sayta çıxarılan 11 hərf cütü, yanlış xəbərdarlıq və tutma, saxlanılan yoxlamalar |
| [gemini-etiketleme.md](gemini-etiketleme.md) | Gemini ilə dərs kliplərinin işarələnməsi və Gemini-nin öz dəqiqliyi |
| [muellim-dersleri.md](muellim-dersleri.md) | Əbdülqadir əl-Osmanın Fatihə dərsi və Əyman Rəşdi Süveyd dərsləri |
| [audit-duzelisleri.md](audit-duzelisleri.md) | 10 audit düzəlişi (sw v14) |
| [surə-ardicilligi.md](surə-ardicilligi.md) | Surə-surə ölçü və push ardıcıllığı |
| [data.json](data.json) | Eyni əsas rəqəmlər, maşın oxuna bilən formada (sonra tətbiqdə göstərmək üçün) |

Yeniləmə üçün: `lab/update-sinaqstatiskasi.mjs` surə irəliləyişini və `data.json` içindəki müvafiq sahələri laboratoriya status fayllarından yeniləyir.
