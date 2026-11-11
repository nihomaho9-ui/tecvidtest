# Audit düzəlişləri

11 noyabr 2026, 20:26 (Ər-Riyad) tarixində `84617bb` komiti 10 audit maddəsini sayta çıxardı; xidmət işçisi **tecvid-shell-v14**. Eyni gün 20:27-də `262f505` Pages yerləşdirməsində `.nojekyll` və NPL lisenziya fayllarını saxladı (`NOTICE.md`, `NPL-1.2.txt`).

Mənbə: git komit mesajı və `84617bb` / `262f505` fərqləri. Bu 10 maddə laboratoriya FA/tutma cədvəli deyil; tətbiqin işləmə və əlçatanlıq düzəlişləridir. Hamısı həmin gün «Hamısını düzəlt, push et» xahişindən sonra çıxarılıb.

1. **Mushaf JSON-unun tənbəl yüklənməsi.** Səhifə mətni JS paketindən çıxarılıb: `public/pg/<n>.json` və `pg/index.json` (`tools/split-pages.mjs`). Səhifə lazım olanda yüklənir, qonşu səhifələr isə əvvəlcədən keşə alınır.
2. **Versiyalı model paketi.** `model.onnx` faylının SHA-256 xülasəsindən `__MODEL_ID__` yaranır. İstifadəçiyə göstərilən ölçü mətni «təxminən 66 MB»-dən «təxminən 85 MB (model, lüğət və mühərrik)»-ə yenilənib.
3. **Oflayn qabıq.** Xidmət işçisi quraşdırmada qabıq fayllarını (səhifə, şriftlər, wasm, manifest, `pg/index.json` və yığılmış JS/CSS) əvvəlcədən keşləyir; keş adı `tecvid-shell-v14`.
4. **Bu günün statistikası.** Günün xəta sayı `todayErrorCount()` ilə hesablanır; əvvəl bütün `misses` siyahısının uzunluğu göstərilirdi.
5. **Hifz.** Hifz + mikrofon rejimində oxunan sözlərin hərfləri gizlədilir; ayə nömrələri və işarə xətti görünən qalır.
6. **Son səhifə.** Axırıncı oxunan səhifə `tartil.read` açarı ilə yadda saxlanılır və tətbiq açılanda ora qayıdır.
7. **Kliplərin qalması.** Öz səs klipləri IndexedDB-də (`tartil-clips`) saxlanır; səhifə yenilənəndə itmir.
8. **Mikrofonun yenidən başlaması.** Tətbiqə qayıdanda audio kontekst davam etdirilir. Əgər telefon başqa proqrama keçəndə mikrofon bağlanıbsa, istifadəçiyə yenidən açmaq mesajı göstərilir.
9. **Səhifə düymələri.** Üz qabığında əvvəlki/sonrakı səhifə düymələri var; səhifə döndərmə əlçatanlığı artırılıb.
10. **Əlçatanlıq (a11y).** Düymələrin basıla bilən sahəsi 32×32-dən 44×44 pikselə çıxarılıb; ikonalara `aria-hidden`, statusa `aria-live` verilib; mövzu rəngi yenilənib.

Bundan sonrakı buraxılışlar (v13 təcvid kartı mətni `f72b119`, hərf yoxlamaları v15, Fatihə zolaq məlumatı v16) bu 10 maddənin üstünə gəlib; onlar digər sənədlərdə yazılıb.
