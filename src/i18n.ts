// UI language: every user-visible string of the app (not the Quran text). Default Azerbaijani.
export type Lang = "az" | "tr" | "en" | "ar" | "ru";
export const LANGS: { code: Lang; name: string }[] = [
  { code: "az", name: "Azərbaycan" },
  { code: "tr", name: "Türkçe" },
  { code: "en", name: "English" },
  { code: "ar", name: "العربية" },
  { code: "ru", name: "Русский" },
];
const IDX: Record<Lang, number> = { az: 0, tr: 1, en: 2, ar: 3, ru: 4 };
// [az, tr, en, ar, ru]
const D = {
  "nav.prev": ["Əvvəlki səhifə", "Önceki sayfa", "Previous page", "الصفحة السابقة", "Предыдущая страница"],
  "nav.next": ["Növbəti səhifə", "Sonraki sayfa", "Next page", "الصفحة التالية", "Следующая страница"],
  "nav.title": ["Surə və səhifə", "Sure ve sayfa", "Surah and page", "السورة والصفحة", "Сура и страница"],
  "nav.go": ["Keç", "Git", "Go", "انتقال", "Перейти"],
  "nav.page": ["Səhifə", "Sayfa", "Page", "الصفحة", "Страница"],
  "nav.surah": ["Surə", "Sure", "Surah", "السورة", "Сура"],
  "miss.btn": ["Xətalar", "Hatalar", "Mistakes", "الأخطاء", "Ошибки"],
  "miss.btnN": ["Xəta {n}", "Hata {n}", "Mistakes: {n}", "الأخطاء: {n}", "Ошибок: {n}"],
  "set.title": ["Ayarlar", "Ayarlar", "Settings", "الإعدادات", "Настройки"],
  "set.titleHard": ["Ayarlar (Çətin: təcvid açıqdır)", "Ayarlar (Zor: tecvid açık)", "Settings (Hard: tajwid on)", "الإعدادات (صعب: التجويد مفعّل)", "Настройки (сложная: таджвид включён)"],
  "close": ["Bağla", "Kapat", "Close", "إغلاق", "Закрыть"],
  "lang": ["Dil", "Dil", "Language", "اللغة", "Язык"],
  "sense": ["Həssaslıq", "Hassasiyet", "Sensitivity", "الحساسية", "Чувствительность"],
  "sense.normal": ["Normal", "Normal", "Normal", "عادي", "Обычная"],
  "sense.sert": ["Sərt", "Sıkı", "Strict", "دقيق", "Строгая"],
  "sense.cetin": ["Çətin", "Zor", "Hard", "صعب", "Сложная"],
  "sense.hint.normal": ["Adi yoxlama.", "Normal kontrol.", "Standard check.", "فحص عادي.", "Обычная проверка."],
  "sense.hint.sert": ["Söz xətaları və hərf tələffüzü daha diqqətlə yoxlanır.", "Kelime hataları ve harf telaffuzu daha dikkatli kontrol edilir.", "Word mistakes and letter pronunciation are checked more closely.", "تُفحص أخطاء الكلمات ونطق الحروف بدقة أكبر.", "Ошибки в словах и произношение букв проверяются внимательнее."],
  "sense.hint.cetin": ["Söz xətaları + hərf tələffüzü + təcvid (məd, ğunnə, ixfa, qəlqələ).", "Kelime hataları + harf telaffuzu + tecvid (med, gunne, ihfâ, kalkale).", "Word mistakes + letter pronunciation + tajwid (madd, ghunnah, ikhfa, qalqalah).", "أخطاء الكلمات + نطق الحروف + التجويد (المد، الغنة، الإخفاء، القلقلة).", "Ошибки в словах + произношение букв + таджвид (мадд, гунна, ихфа, калькала)."],
  "madd": ["Məd munfəsil", "Med-i munfasıl", "Madd munfasil", "المد المنفصل", "Мадд мунфасиль"],
  "madd.4": ["4–5 hərəkə", "4–5 hareke", "4–5 counts", "4–5 حركات", "4–5 харакатов"],
  "madd.2": ["2 hərəkə", "2 hareke", "2 counts", "حركتان", "2 хараката"],
  "madd.st2": ["Qasr: munfəsil 2 hərəkə oxunursa, xəta sayılmır.", "Kasr: munfasıl 2 hareke okunursa hata sayılmaz.", "Qasr: munfasil read with 2 counts is not a mistake.", "القصر: إذا قُرئ المنفصل بحركتين لا يُعدّ خطأ.", "Каср: мунфасиль в 2 хараката не считается ошибкой."],
  "madd.st4": ["Munfəsil 4–5 hərəkədən qısa oxunursa, Çətin rejimdə qeyd olunur.", "Munfasıl 4–5 harekeden kısa okunursa Zor modda işaretlenir.", "In Hard mode, munfasil shorter than 4–5 counts is flagged.", "في الوضع الصعب يُنبَّه إذا قُرئ المنفصل أقصر من 4–5 حركات.", "В сложном режиме мунфасиль короче 4–5 харакатов отмечается."],
  "hifz": ["Hifz rejimi", "Hafızlık modu", "Hifz mode", "وضع الحفظ", "Режим хифза"],
  "off": ["Söndür", "Kapalı", "Off", "إيقاف", "Выкл."],
  "on": ["Aç", "Açık", "On", "تشغيل", "Вкл."],
  "speed": ["Açılma sürəti", "Açılma hızı", "Reveal speed", "سرعة الإظهار", "Скорость показа"],
  "speed.orta": ["Orta", "Normal", "Normal", "متوسطة", "Средняя"],
  "speed.tez": ["Tez", "Hızlı", "Fast", "سريعة", "Быстрая"],
  "theme": ["Səhifə rəngi", "Sayfa rengi", "Page colour", "لون الصفحة", "Цвет страницы"],
  "theme.cream": ["Krem", "Krem", "Cream", "كريمي", "Крем"],
  "theme.white": ["Ağ", "Beyaz", "White", "أبيض", "Белый"],
  "theme.black": ["Qara", "Siyah", "Black", "أسود", "Чёрный"],
  "mic": ["Mikrofon", "Mikrofon", "Microphone", "الميكروفون", "Микрофон"],
  "micN": ["Mikrofon {n}", "Mikrofon {n}", "Microphone {n}", "ميكروفون {n}", "Микрофон {n}"],
  "mine": ["Səsimi dinlə", "Sesimi dinle", "Hear my recitation", "استمع إلى تلاوتي", "Послушать своё чтение"],
  "back": ["Son oxuduğum səhifəyə qayıt", "Son okuduğum sayfaya dön", "Back to my last page", "العودة إلى آخر صفحة قرأتها", "Вернуться к последней странице"],
  "today": ["Bu gün: {d} ayə, {e} xəta · Bu həftə: {wa} ayə, {we} xəta", "Bugün: {d} ayet, {e} hata · Bu hafta: {wa} ayet, {we} hata", "Today: {d} ayahs, {e} mistakes · This week: {wa} ayahs, {we} mistakes", "اليوم: {d} آية، {e} خطأ · هذا الأسبوع: {wa} آية، {we} خطأ", "Сегодня: аятов {d}, ошибок {e} · За неделю: аятов {wa}, ошибок {we}"],
  "foot": ["Tanıma telefonun özündə işləyir. Model və lüğət NPL-1.2 — yalnız qeyri-kommersiya.", "Tanıma telefonun kendisinde çalışır. Model ve sözlük NPL-1.2 — yalnızca ticari olmayan kullanım.", "Recognition runs on your phone. Model and lexicon NPL-1.2 — non-commercial use only.", "يعمل التعرّف على هاتفك نفسه. النموذج والمعجم بترخيص NPL-1.2 — للاستخدام غير التجاري فقط.", "Распознавание работает на самом телефоне. Модель и словарь NPL-1.2 — только некоммерческое использование."],
  "search": ["Axtarış", "Arama", "Search", "بحث", "Поиск"],
  "st.read": ["Oxu", "Oku", "Recite", "اقرأ", "Читайте"],
  "st.readSub": ["Mikrofonu açın: ayələr gizlənir, model təsdiqləyəndə açılır.", "Mikrofonu açın: ayetler gizlenir, model onaylayınca açılır.", "Turn on the mic: ayahs hide and appear as the model confirms them.", "شغّل الميكروفون: تُخفى الآيات وتظهر عندما يؤكدها النموذج.", "Включите микрофон: аяты скрываются и открываются, когда модель их подтвердит."],
  "miss.title": ["Xəta yerləri", "Hata yerleri", "Mistakes", "مواضع الأخطاء", "Места ошибок"],
  "miss.fix": ["Düzəlt", "Düzelt", "Fix", "تصحيح", "Исправить"],
  "miss.clear": ["Təmizlə", "Temizle", "Clear", "مسح", "Очистить"],
  "sum.title": ["Hesab", "Özet", "Summary", "الملخص", "Итог"],
  "miss.none": ["Hələ xəta yoxdur.", "Henüz hata yok.", "No mistakes yet.", "لا أخطاء بعد.", "Ошибок пока нет."],
  "kind.possible_omission": ["söz düşüb", "kelime atlandı", "word missed", "كلمة ساقطة", "пропущено слово"],
  "kind.possible_substitution": ["söz səhvdir", "kelime yanlış", "wrong word", "كلمة خاطئة", "неверное слово"],
  "kind.possible_vowel": ["hərəkə", "hareke", "vowel", "حركة", "огласовка"],
  "kind.possible_repetition": ["təkrar", "tekrar", "repeated", "تكرار", "повтор"],
  "kind.possible_skipped_ayah": ["ayə keçilib", "ayet atlandı", "ayah skipped", "آية متروكة", "аят пропущен"],
  "kind.unclear_ayah": ["ayə tutulmayıb", "ayet anlaşılmadı", "ayah not recognised", "آية غير واضحة", "аят не распознан"],
  "kind.error": ["xəta", "hata", "mistake", "خطأ", "ошибка"],
  "word": [", söz {w}", ", kelime {w}", ", word {w}", "، الكلمة {w}", ", слово {w}"],
  "st.mistake": ["Xəta", "Hata", "Mistake", "خطأ", "Ошибка"],
  "st.done": ["Bitdi", "Bitti", "Done", "انتهى", "Готово"],
  "st.allFixed": ["Bütün xətalar düzəldi.", "Tüm hatalar düzeltildi.", "All mistakes fixed.", "صُحّحت كل الأخطاء.", "Все ошибки исправлены."],
  "st.noMiss": ["Xəta yoxdur", "Hata yok", "No mistakes", "لا أخطاء", "Ошибок нет"],
  "st.noMissSub": ["Düzəldiləcək yer qalmayıb.", "Düzeltilecek yer kalmadı.", "Nothing left to fix.", "لم يبق شيء للتصحيح.", "Исправлять нечего."],
  "st.mine": ["Səsim", "Sesim", "My voice", "صوتي", "Мой голос"],
  "st.mineDone": ["Sənin səsin — son oxuduğun ayə.", "Senin sesin — son okuduğun ayet.", "Your own voice — the last ayah you read.", "صوتك — آخر آية قرأتها.", "Ваш голос — последний прочитанный аят."],
  "tj.mine": ["Səsimi dinlə", "Sesimi dinle", "Hear my recitation", "استمع إلى تلاوتي", "Послушать своё чтение"],
  "st.mineYou": ["{p} — sənin oxuyuşun.", "{p} — senin okuyuşun.", "{p} — your recitation.", "{p} — تلاوتك.", "{p} — ваше чтение."],
  "loading": ["Quran açılır…", "Kur'an açılıyor…", "Opening the Quran…", "جارٍ فتح القرآن…", "Открывается Коран…"],
  "st.again": ["Yenidən", "Tekrar", "Again", "مرة أخرى", "Ещё раз"],
  "st.againSub": ["{p} — ayəni təmiz oxuyun.", "{p} — ayeti hatasız okuyun.", "{p} — read the ayah cleanly.", "{p} — اقرأ الآية بلا خطأ.", "{p} — прочитайте аят без ошибок."],
  "st.fixed": ["Düzəldi", "Düzeldi", "Fixed", "صُحّح", "Исправлено"],
  "st.fixedSub": ["Ayə təmizdir. Davam edə bilərsiniz.", "Ayet hatasız. Devam edebilirsiniz.", "The ayah is clean. You can continue.", "الآية سليمة. يمكنك المتابعة.", "Аят чистый. Можно продолжать."],
  "st.held": ["Buraxıldı", "Atlandı", "Skipped", "تُركت", "Пропущено"],
  "st.heldSub": ["{p} bitməyib. Növbəti ayə açılmır.", "{p} bitmedi. Sonraki ayet açılmaz.", "{p} is not finished. The next ayah stays hidden.", "{p} لم تكتمل. لن تظهر الآية التالية.", "{p} не закончен. Следующий аят не откроется."],
  "st.listening": ["Dinləyirəm", "Dinliyorum", "Listening", "أستمع", "Слушаю"],
  "st.wordFixed": ["{p} — söz düzəldi. Ayəni bitirin.", "{p} — kelime düzeldi. Ayeti bitirin.", "{p} — word fixed. Finish the ayah.", "{p} — صُحّحت الكلمة. أكمل الآية.", "{p} — слово исправлено. Закончите аят."],
  "err.open": ["{x} açılmadı", "{x} açılamadı", "Could not open {x}", "تعذّر فتح {x}", "Не удалось открыть: {x}"],
  "st.model": ["Model yüklənir", "Model yükleniyor", "Loading model", "جارٍ تحميل النموذج", "Загрузка модели"],
  "st.modelSub": ["Bir dəfə, təxminən 85 MB (model, lüğət və mühərrik). Sonra telefonda qalır.", "Bir kez, yaklaşık 85 MB (model, sözlük ve motor). Sonra telefonda kalır.", "Once, about 85 MB (model, lexicon and engine). Then it stays on the phone.", "مرة واحدة، نحو 85 ميغابايت (النموذج والمعجم والمحرّك). ثم يبقى على الهاتف.", "Один раз, около 85 МБ (модель, словарь и движок). Потом остаётся на телефоне."],
  "st.lex": ["Lüğət açılır", "Sözlük açılıyor", "Opening lexicon", "جارٍ فتح المعجم", "Открывается словарь"],
  "st.lexSub": ["Ayə sözləri hazırlanır…", "Ayet kelimeleri hazırlanıyor…", "Preparing ayah words…", "تجهيز كلمات الآيات…", "Подготовка слов аятов…"],
  "err.lex": ["Lüğət açılmadı", "Sözlük açılamadı", "Could not open the lexicon", "تعذّر فتح المعجم", "Не удалось открыть словарь"],
  "sum.n": ["Düz söz: {h}. Xəta: {e}.", "Doğru kelime: {h}. Hata: {e}.", "Correct words: {h}. Mistakes: {e}.", "كلمات صحيحة: {h}. أخطاء: {e}.", "Верных слов: {h}. Ошибок: {e}."],
  "lvl.close": ["Yaxınlaş. Səs zəifdir, telefonu yaxın tutun.", "Yaklaşın. Ses zayıf, telefonu yakın tutun.", "Come closer. The sound is weak, hold the phone nearer.", "اقترب. الصوت ضعيف، قرّب الهاتف.", "Ближе. Звук слабый, держите телефон ближе."],
  "lvl.ok": ["Səs kifayətdir. Oxuyun.", "Ses yeterli. Okuyun.", "Sound is good. Recite.", "الصوت كافٍ. اقرأ.", "Звук хороший. Читайте."],
  "lvl.none": ["Səs gəlmir. Telefonu yaxınlaşdırın.", "Ses gelmiyor. Telefonu yaklaştırın.", "No sound. Bring the phone closer.", "لا يصل صوت. قرّب الهاتف.", "Звука нет. Поднесите телефон ближе."],
  "st.repeat": ["Təkrar", "Tekrar", "Repeat", "كرّر", "Повтор"],
  "st.repeatSub": ["{p} — ayəni yenidən oxuyun", "{p} — ayeti yeniden okuyun", "{p} — read the ayah again", "{p} — أعد قراءة الآية", "{p} — прочитайте аят ещё раз"],
  "st.onlyHere": ["{p} — yalnız bu yer gizlidir", "{p} — yalnızca bu yer gizli", "{p} — only this spot is hidden", "{p} — هذا الموضع فقط مخفي", "{p} — скрыто только это место"],
  "err.mic": ["Mikrofon açılmadı", "Mikrofon açılamadı", "The microphone could not start", "تعذّر تشغيل الميكروفون", "Не удалось включить микрофон"],
  "st.failed": ["Alınmadı", "Olmadı", "Failed", "تعذّر", "Не получилось"],
  "st.noMic": ["Mikrofon yoxdur", "Mikrofon yok", "No microphone", "لا يوجد ميكروفون", "Нет микрофона"],
  "st.noMicSub": ["Bu brauzer səs yazmır. Chrome və ya Huawei brauzerində HTTPS ilə açın.", "Bu tarayıcı ses kaydetmiyor. Chrome veya Huawei tarayıcısında HTTPS ile açın.", "This browser cannot record. Open it in Chrome or the Huawei browser over HTTPS.", "هذا المتصفح لا يسجّل الصوت. افتحه في Chrome أو متصفح Huawei عبر HTTPS.", "Этот браузер не записывает звук. Откройте в Chrome или браузере Huawei по HTTPS."],
  "st.hidden": ["Ayələr gizləndi. Nömrələr qalır. Təsdiqlənən söz açılır.", "Ayetler gizlendi. Numaralar kalır. Onaylanan kelime açılır.", "Ayahs hidden. Numbers stay. Each confirmed word appears.", "أُخفيت الآيات. تبقى الأرقام. تظهر كل كلمة تُؤكَّد.", "Аяты скрыты. Номера остаются. Подтверждённое слово открывается."],
  "st.micOff": ["Mikrofon bağlıdır. Ayələr açıqdır.", "Mikrofon kapalı. Ayetler açık.", "Mic is off. Ayahs are shown.", "الميكروفون مغلق. الآيات ظاهرة.", "Микрофон выключен. Аяты открыты."],
  "st.perm": ["İcazə lazımdır", "İzin gerekli", "Permission needed", "الإذن مطلوب", "Нужно разрешение"],
  "st.permSub": ["Brauzer mikrofonu bloklayıb. İcazəni açıb yenidən basın.", "Tarayıcı mikrofonu engelledi. İzni açıp tekrar basın.", "The browser blocked the mic. Allow it and tap again.", "حظر المتصفح الميكروفون. اسمح به ثم اضغط مجددًا.", "Браузер заблокировал микрофон. Разрешите и нажмите снова."],
  "tj.label.madd": ["Məd qısa oxundu", "Med kısa okundu", "Madd was read short", "قُرئ المد قصيرًا", "Мадд прочитан коротко"],
  "tj.label.long": ["Məd uzun oxundu", "Med uzun okundu", "Madd was held too long", "طال المد أكثر من اللازم", "Мадд прочитан слишком долго"],
  "tj.label.ghunna": ["Ğunnə qısa oxundu", "Gunne kısa okundu", "Ghunnah was read short", "الغنة قصيرة", "Гунна прочитана коротко"],
  "tj.label.ikhfa": ["Ixfa qısa oxundu", "Ihfâ kısa okundu", "Ikhfa was read short", "الإخفاء قصير", "Ихфа прочитана коротко"],
  "tj.label.waqf": ["Yanlış vəqf", "Yanlış vakf", "Wrong stop", "وقف غير جائز", "Неверная остановка"],
  "tj.label.waqfSoft": ["Yanlış vəqf (geri qayıtdın)", "Yanlış vakf (geri döndün)", "Wrong stop (you went back)", "وقف غير جائز (أعدتَ القراءة)", "Неверная остановка (вы вернулись)"],
  "tj.waqf": [
    "Yanlış vəqf: {w} sözündə dayanmaq olmaz, məna yarımçıq qalır. Ayənin sonuna və ya vəqf işarəsi olan yerə qədər davam et.",
    "Yanlış vakf: {w} kelimesinde durulmaz, mana yarım kalır. Ayetin sonuna veya vakf işaretli yere kadar devam et.",
    "Wrong stop: do not stop at {w}; the meaning is cut. Continue to the ayah end or to a place with a waqf mark.",
    "وقف غير جائز: لا يجوز الوقف على كلمة {w} لانقطاع المعنى. تابع إلى آخر الآية أو إلى موضع فيه علامة وقف.",
    "Неверная остановка: на слове {w} останавливаться нельзя, смысл обрывается. Продолжайте до конца аята или до места со знаком паузы.",
  ],
  "tj.waqfSoft": [
    "Yanlış vəqf: {w} sözündə dayanmaq olmaz. Geri qayıdıb təkrarlamağın yaxşıdır, amma nəfəsi vəqf işarəsi olan yerdə və ya ayənin sonunda al.",
    "Yanlış vakf: {w} kelimesinde durulmaz. Geri dönüp tekrarlaman iyi, ama nefesi vakf işaretli yerde veya ayetin sonunda al.",
    "Wrong stop: do not stop at {w}. Going back to repeat is right, but take your breath at a waqf mark or the ayah end.",
    "وقف غير جائز: لا يجوز الوقف على كلمة {w}. أحسنتَ بالإعادة، لكن خذ النفَس عند علامة وقف أو آخر الآية.",
    "Неверная остановка: на слове {w} останавливаться нельзя. Вернуться и повторить — верно, но дышите на знаке паузы или в конце аята.",
  ],
  "tj.label.qalqala": ["Qəlqələ yoxdur", "Kalkale yok", "No qalqalah", "لا قلقلة", "Нет калькалы"],
  "tj.note": ["Avtomatik təcvid rəyi səhv ola bilər, müəllimi əvəz etmir.", "Otomatik tecvid yorumu yanılabilir, hocanın yerini tutmaz.", "Automatic tajwid feedback can be wrong and does not replace a teacher.", "ملاحظات التجويد الآلية قد تخطئ ولا تغني عن المعلّم.", "Автоматическая оценка таджвида может ошибаться и не заменяет учителя."],
  "tj.heard2": ["Sən ~2 hərəkə uzatdın.", "~2 hareke uzattın.", "You held it ~2 counts.", "مددتَ نحو حركتين.", "Вы тянули ~2 хараката."],
  "tj.heardShort": ["Sən bir az qısa uzatdın.", "Biraz kısa uzattın.", "You held it a little short.", "مددتَ أقصر قليلًا.", "Вы тянули чуть короче."],
  "tj.long": ["Təbii məd uzun oxundu: {w} sözündə təbii məd 2 hərəkədir, daha uzadılmamalıdır.", "Tabiî med uzun okundu: {w} kelimesinde tabiî med 2 harekedir, daha uzatılmamalıdır.", "Natural madd was held too long: in {w}, natural madd is 2 counts and should not be lengthened.", "المد الطبيعي طال أكثر من اللازم: في كلمة {w} المد الطبيعي حركتان ولا يُزاد عليه.", "Естественный мадд прочитан слишком долго: в слове {w} естественный мадд — 2 хараката, удлинять его не следует."],
  "tj.lazim": ["Məd lazım qısa oxundu: {w} sözündə məd 6 hərəkə uzadılmalıdır. {h}", "Med-i lâzım kısa okundu: {w} kelimesinde med 6 hareke uzatılmalıdır. {h}", "Madd lazim was read short: in {w}, the madd should be held 6 counts. {h}", "المد اللازم قُرئ قصيرًا: في كلمة {w} يُمد 6 حركات. {h}", "Мадд лязим прочитан коротко: в слове {w} мадд нужно тянуть 6 харакатов. {h}"],
  "tj.munfasil": ["Məd munfəsil qısa oxundu: {w} sözündə (Şatibiyyə yolu) məd 4–5 hərəkə uzadılmalıdır. {h}", "Med-i munfasıl kısa okundu: {w} kelimesinde (Şâtıbiyye tarîki) med 4–5 hareke uzatılmalıdır. {h}", "Madd munfasil was read short: in {w} (Shatibiyyah), the madd should be held 4–5 counts. {h}", "المد المنفصل قُرئ قصيرًا: في كلمة {w} (طريق الشاطبية) يُمد 4–5 حركات. {h}", "Мадд мунфасиль прочитан коротко: в слове {w} (путь Шатибии) мадд нужно тянуть 4–5 харакатов. {h}"],
  "tj.muttasil": ["Məd muttəsil qısa oxundu: {w} sözündə məd 4–5 hərəkə uzadılmalıdır. {h}", "Med-i muttasıl kısa okundu: {w} kelimesinde med 4–5 hareke uzatılmalıdır. {h}", "Madd muttasil was read short: in {w}, the madd should be held 4–5 counts. {h}", "المد المتصل قُرئ قصيرًا: في كلمة {w} يُمد 4–5 حركات. {h}", "Мадд муттасиль прочитан коротко: в слове {w} мадд нужно тянуть 4–5 харакатов. {h}"],
  "tj.madd": ["Məd qısa oxundu: {w} sözündə məd 4–5 hərəkə uzadılmalıdır. {h}", "Med kısa okundu: {w} kelimesinde med 4–5 hareke uzatılmalıdır. {h}", "Madd was read short: in {w}, the madd should be held 4–5 counts. {h}", "قُرئ المد قصيرًا: في كلمة {w} يُمد 4–5 حركات. {h}", "Мадд прочитан коротко: в слове {w} мадд нужно тянуть 4–5 харакатов. {h}"],
  "tj.qmid": ["Qəlqələ yoxdur: {w} sözündə sakin qəlqələ hərfinin səsi yüngülcə titrədilməlidir (qəlqələ-i suğra).", "Kalkale yok: {w} kelimesinde sakin kalkale harfinin sesi hafifçe titretilmelidir (kalkale-i suğrâ).", "No qalqalah: in {w}, the sakin qalqalah letter should have a light bounce (minor qalqalah).", "لا قلقلة: في كلمة {w} يُظهر حرف القلقلة الساكن نبرة خفيفة (قلقلة صغرى).", "Нет калькалы: в слове {w} у буквы калькалы с сукуном должен быть лёгкий отскок (малая калькала)."],
  "tj.qfinal": ["Qəlqələ yoxdur: {w} sözü ayənin sonundadır; sakin qəlqələ hərfinin səsi aydın titrədilməlidir (qəlqələ-i kübra).", "Kalkale yok: {w} ayetin sonundadır; sakin kalkale harfinin sesi belirgin titretilmelidir (kalkale-i kübrâ).", "No qalqalah: {w} is at the ayah end; the sakin qalqalah letter should have a clear bounce (major qalqalah).", "لا قلقلة: كلمة {w} في آخر الآية؛ يُظهر حرف القلقلة الساكن نبرة واضحة (قلقلة كبرى).", "Нет калькалы: слово {w} в конце аята; у буквы калькалы с сукуном должен быть чёткий отскок (большая калькала)."],
  "tj.ghunna": ["Ğunnə qısa oxundu: {w} sözündə şəddəli nun və ya mimdə ğunnə 2 hərəkə burunda saxlanılmalıdır.", "Gunne kısa okundu: {w} kelimesinde şeddeli nun veya mimde gunne 2 hareke burunda tutulmalıdır.", "Ghunnah was read short: in {w}, the ghunnah on nun or mim with shaddah should be held 2 counts in the nose.", "الغنة قصيرة: في كلمة {w} تُمسك غنة النون أو الميم المشددة حركتين في الخيشوم.", "Гунна прочитана коротко: в слове {w} гунну на нуне или миме с шаддой нужно держать 2 хараката в носу."],
  "tj.ikhfa": ["Ixfa qısa oxundu: {w} sözündə sakin nun və ya mim gizlədilir; səs təxminən 2 hərəkə burunda saxlanılmalıdır.", "Ihfâ kısa okundu: {w} kelimesinde sakin nun veya mim ihfâ edilir; ses yaklaşık 2 hareke burunda tutulmalıdır.", "Ikhfa was read short: in {w}, the sakin nun or mim is concealed; hold the sound about 2 counts in the nose.", "الإخفاء قصير: في كلمة {w} تُخفى النون أو الميم الساكنة ويُمسك الصوت نحو حركتين في الخيشوم.", "Ихфа прочитана коротко: в слове {w} нун или мим с сукуном скрывается; звук нужно держать около 2 харакатов в носу."],
  "tj.label.letter": ["Hərf tələffüzü", "Harf telaffuzu", "Letter pronunciation", "نطق الحرف", "Произношение буквы"],
  "tj.label.letterGhunna": ["Ğunnə yoxdur", "Gunne yok", "No ghunnah", "لا غنة", "Нет гунны"],
  "tj.label.letterIkhfa": ["Ixfa yoxdur", "Ihfâ yok", "No ikhfa", "لا إخفاء", "Нет ихфы"],
  "tj.label.extraGhunna": ["Artıq ğunnə", "Fazla gunne", "Extra ghunnah", "غنة زائدة", "Лишняя гунна"],
  "tj.letter": ["{exp} hərfi {heard} kimi oxundu: {w} sözündə {exp} səsi {heard} səsindən fərqlənməli, öz məxrəcində deyilməlidir.", "{exp} harfi {heard} gibi okundu: {w} kelimesinde {exp} sesi {heard} sesinden ayrılmalı, kendi mahrecinde çıkarılmalıdır.", "{exp} was read like {heard}: in {w}, {exp} should not sound like {heard} and must be articulated from its own point of articulation.", "قُرئ حرف {exp} كأنه {heard}: في كلمة {w} يجب أن يتميز صوت {exp} عن {heard} ويُخرج من مخرجه.", "Буква {exp} прочитана как {heard}: в слове {w} звук {exp} не должен быть похож на {heard} и должен произноситься из своего места артикуляции."],
  "tj.letterQalqala": ["Qəlqələ yoxdur və ya zəifdir: {w} sözündə sakin qəlqələ hərfinin səsi titrədilməlidir.", "Kalkale yok veya zayıf: {w} kelimesinde sakin kalkale harfinin sesi titretilmelidir.", "Qalqalah is missing or weak: in {w}, the sakin qalqalah letter should have a bounce.", "القلقلة معدومة أو ضعيفة: في كلمة {w} يُظهر حرف القلقلة الساكن نبرة.", "Калькала отсутствует или слабая: в слове {w} у буквы калькалы с сукуном должен быть отскок."],
  "tj.letterGhunna": ["Ğunnə yoxdur və ya zəifdir: {w} sözündə şəddəli nun və ya mimdə ğunnə aydın eşidilməlidir.", "Gunne yok veya zayıf: {w} kelimesinde şeddeli nun veya mimde gunne açıkça duyulmalıdır.", "Ghunnah is missing or weak: in {w}, the ghunnah on nun or mim with shaddah should be clearly heard.", "الغنة معدومة أو ضعيفة: في كلمة {w} تُسمع غنة النون أو الميم المشددة بوضوح.", "Гунна отсутствует или слабая: в слове {w} гунна на нуне или миме с шаддой должна быть ясно слышна."],
  "tj.letterIkhfa": ["Ixfa yoxdur və ya zəifdir: {w} sözündə sakin nun və ya mim gizlədilməli, səs burunda saxlanılmalıdır.", "Ihfâ yok veya zayıf: {w} kelimesinde sakin nun veya mim ihfâ edilmeli, ses burunda tutulmalıdır.", "Ikhfa is missing or weak: in {w}, the sakin nun or mim should be concealed and held in the nose.", "الإخفاء معدوم أو ضعيف: في كلمة {w} تُخفى النون أو الميم الساكنة ويُمسك الصوت في الخيشوم.", "Ихфа отсутствует или слабая: в слове {w} нун или мим с сукуном нужно скрыть и держать звук в носу."],
  "tj.letterExtraGhunna": ["Artıq ğunnə: {w} sözündə bu yerdə burun səsi olmamalıdır.", "Fazla gunne: {w} kelimesinde burada burun sesi olmamalıdır.", "Extra ghunnah: in {w}, this sound should not be nasalized.", "غنة زائدة: في كلمة {w} لا يكون في هذا الموضع صوت أنفي.", "Лишняя гунна: в слове {w} в этом месте не должно быть носового звука."],
  "tj.noData": ["Bu səhifə üçün təcvid məlumatı hələ hazır deyil.", "Bu sayfa için tecvid verisi henüz hazır değil.", "Tajwid data for this page is not ready yet.", "بيانات التجويد لهذه الصفحة غير جاهزة بعد.", "Данные таджвида для этой страницы ещё не готовы."],
  "tj.chip": ["Təcvid rəyi ({n})", "Tecvid yorumu ({n})", "Tajwid review ({n})", "ملاحظات التجويد ({n})", "Разбор таджвида ({n})"],
  "tj.prev": ["Əvvəlki ayə", "Önceki ayet", "Previous ayah", "الآية السابقة", "Предыдущий аят"],
  "tj.next": ["Sonrakı ayə", "Sonraki ayet", "Next ayah", "الآية التالية", "Следующий аят"],
  "tj.head": ["Ayə {a} — təcvid rəyi", "Ayet {a} — tecvid yorumu", "Ayah {a} — tajwid review", "الآية {a} — ملاحظات التجويد", "Аят {a} — разбор таджвида"],
  "tj.count": ["{n} qeyd","{n} not","Notes: {n}","ملاحظات: {n}","Заметки: {n}"],
  "tj.again": ["Ayəni yenidən oxu", "Ayeti yeniden oku", "Read the ayah again", "أعد قراءة الآية", "Прочитать аят заново"],
  "miss.clearConfirm": ["Bütün xətalar silinsin? Bu addım geri alınmır.", "Tüm hatalar silinsin mi? Bu işlem geri alınamaz.", "Clear all mistakes? This cannot be undone.", "هل تريد مسح كل الأخطاء؟ لا يمكن التراجع عن ذلك.", "Удалить все ошибки? Это нельзя отменить."],
  "st.micStopped": ["Mikrofon dayandı", "Mikrofon durdu", "Microphone stopped", "توقف الميكروفون", "Микрофон остановился"],
  "st.micStoppedSub": ["Telefon başqa proqrama keçəndə mikrofon bağlana bilər. Yenidən açmaq üçün düyməyə basın.", "Telefonda başka bir uygulamaya geçince mikrofon kapanabilir. Yeniden açmak için düğmeye basın.", "The mic may stop when you leave the app. Tap the button to start it again.", "قد يتوقف الميكروفون عند مغادرة التطبيق. اضغط الزر لتشغيله من جديد.", "Микрофон может выключиться, если вы покинете приложение. Нажмите кнопку, чтобы включить его снова."],
  "st.feedErr": ["Səs emalında xəta oldu. Mikrofonu yenidən açın.", "Ses işlenirken bir hata oldu. Mikrofonu yeniden açın.", "Something went wrong while processing the audio. Turn the mic on again.", "حدث خطأ أثناء معالجة الصوت. شغّل الميكروفون مرة أخرى.", "Ошибка при обработке звука. Включите микрофон снова."],
  "font.fail": ["Bu səhifənin yazı tipi yüklənmədi. İnterneti yoxlayıb səhifəni yeniləyin.", "Bu sayfanın yazı tipi yüklenemedi. İnterneti kontrol edip sayfayı yenileyin.", "This page's font could not be loaded. Check your connection and refresh.", "تعذّر تحميل خط هذه الصفحة. تحقق من الاتصال ثم حدّث الصفحة.", "Не удалось загрузить шрифт этой страницы. Проверьте соединение и обновите страницу."],
  "tj.go": ["Davam et", "Devam et", "Continue", "متابعة", "Продолжить"],
} as const;
export type Key = keyof typeof D;
const SURAH: Record<Lang, readonly string[]> = {
  az: ["Fatihə", "Bəqərə", "Ali İmran", "Nisa", "Maidə", "Ənam", "Əraf", "Ənfal", "Tövbə", "Yunus", "Hud", "Yusuf", "Rəd", "İbrahim", "Hicr", "Nəhl", "İsra", "Kəhf", "Məryəm", "Taha", "Ənbiya", "Həcc", "Muminun", "Nur", "Furqan", "Şüəra", "Nəml", "Qəsəs", "Ənkəbut", "Rum", "Loğman", "Səcdə", "Əhzab", "Səba", "Fatir", "Yasin", "Saffat", "Sad", "Zümər", "Ğafir", "Fussilət", "Şura", "Zuxruf", "Duxan", "Casiyə", "Əhqaf", "Məhəmməd", "Fəth", "Hucurat", "Qaf", "Zariyat", "Tur", "Nəcm", "Qəmər", "Rəhman", "Vaqiə", "Hədid", "Mucadələ", "Həşr", "Mumtəhənə", "Səff", "Cumuə", "Munafiqun", "Təğabun", "Talaq", "Təhrim", "Mülk", "Qələm", "Haqqə", "Məaric", "Nuh", "Cinn", "Muzzəmmil", "Muddəssir", "Qiyamət", "İnsan", "Mursəlat", "Nəbə", "Naziat", "Əbəsə", "Təkvir", "İnfitar", "Mutaffifin", "İnşiqaq", "Buruc", "Tariq", "Əla", "Ğaşiyə", "Fəcr", "Bələd", "Şəms", "Leyl", "Duha", "Şərh", "Tin", "Ələq", "Qədr", "Bəyyinə", "Zəlzələ", "Adiyat", "Qariə", "Təkasur", "Əsr", "Huməzə", "Fil", "Qureyş", "Maun", "Kövsər", "Kafirun", "Nəsr", "Məsəd", "İxlas", "Fələq", "Nas"],
  tr: ["Fâtiha", "Bakara", "Âl-i İmrân", "Nisâ", "Mâide", "En'âm", "A'râf", "Enfâl", "Tevbe", "Yûnus", "Hûd", "Yûsuf", "Ra'd", "İbrâhîm", "Hicr", "Nahl", "İsrâ", "Kehf", "Meryem", "Tâhâ", "Enbiyâ", "Hac", "Mü'minûn", "Nûr", "Furkân", "Şuarâ", "Neml", "Kasas", "Ankebût", "Rûm", "Lokmân", "Secde", "Ahzâb", "Sebe'", "Fâtır", "Yâsîn", "Sâffât", "Sâd", "Zümer", "Mü'min", "Fussilet", "Şûrâ", "Zuhruf", "Duhân", "Câsiye", "Ahkâf", "Muhammed", "Fetih", "Hucurât", "Kâf", "Zâriyât", "Tûr", "Necm", "Kamer", "Rahmân", "Vâkıa", "Hadîd", "Mücâdele", "Haşr", "Mümtehine", "Saf", "Cuma", "Münâfikûn", "Teğâbün", "Talâk", "Tahrîm", "Mülk", "Kalem", "Hâkka", "Meâric", "Nûh", "Cin", "Müzzemmil", "Müddessir", "Kıyâme", "İnsân", "Mürselât", "Nebe'", "Nâziât", "Abese", "Tekvîr", "İnfitâr", "Mutaffifîn", "İnşikâk", "Bürûc", "Târık", "A'lâ", "Gâşiye", "Fecr", "Beled", "Şems", "Leyl", "Duhâ", "İnşirâh", "Tîn", "Alak", "Kadir", "Beyyine", "Zilzâl", "Âdiyât", "Kâria", "Tekâsür", "Asr", "Hümeze", "Fîl", "Kureyş", "Mâûn", "Kevser", "Kâfirûn", "Nasr", "Tebbet", "İhlâs", "Felak", "Nâs"],
  en: ["Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Taha", "Al-Anbya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shuraa", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah", "As-Saf", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duhaa", "Ash-Sharh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"],
  ar: ["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "ابراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبإ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الانسان", "المرسلات", "النبإ", "النازعات", "عبس", "التكوير", "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"],
  ru: ["Аль-Фатиха", "Аль-Бакара", "Аль Имран", "Ан-Ниса", "Аль-Маида", "Аль-Анам", "Аль-Араф", "Аль-Анфаль", "Ат-Тауба", "Юнус", "Худ", "Юсуф", "Ар-Раад", "Ибрахим", "Аль-Хиджр", "Ан-Нахль", "Аль-Исра", "Аль-Кахф", "Марьям", "Та Ха", "Аль-Анбийа", "Аль-Хаджж", "Аль-Муминун", "Ан-Нур", "Аль-Фуркан", "Аш-Шуара", "Ан-Намль", "Аль-Касас", "Аль-Анкабут", "Ар-Рум", "Лукман", "Ас-Саджда", "Аль-Ахзаб", "Саба", "Фатыр", "Йа Син", "Ас-Саффат", "Сад", "Аз-Зумар", "Гафир", "Фуссилат", "Аш-Шура", "Аз-Зухруф", "Ад-Духан", "Аль-Джасийа", "Аль-Ахкаф", "Мухаммад", "Аль-Фатх", "Аль-Худжурат", "Каф", "Аз-Зарийат", "Ат-Тур", "Ан-Наджм", "Аль-Камар", "Ар-Рахман", "Аль-Вакиа", "Аль-Хадид", "Аль-Муджадила", "Аль-Хашр", "Аль-Мумтахана", "Ас-Сафф", "Аль-Джумуа", "Аль-Мунафикун", "Ат-Тагабун", "Ат-Талак", "Ат-Тахрим", "Аль-Мульк", "Аль-Калам", "Аль-Хакка", "Аль-Мааридж", "Нух", "Аль-Джинн", "Аль-Муззаммиль", "Аль-Муддассир", "Аль-Кийама", "Аль-Инсан", "Аль-Мурсалят", "Ан-Наба", "Ан-Назиат", "Абаса", "Ат-Таквир", "Аль-Инфитар", "Аль-Мутаффифин", "Аль-Иншикак", "Аль-Бурудж", "Ат-Тарик", "Аль-Аля", "Аль-Гашийа", "Аль-Фаджр", "Аль-Балад", "Аш-Шамс", "Аль-Лайл", "Ад-Духа", "Аш-Шарх", "Ат-Тин", "Аль-Алак", "Аль-Кадр", "Аль-Баййина", "Аз-Залзала", "Аль-Адийат", "Аль-Кариа", "Ат-Такасур", "Аль-Аср", "Аль-Хумаза", "Аль-Филь", "Курайш", "Аль-Маун", "Аль-Каусар", "Аль-Кафирун", "Ан-Наср", "Аль-Масад", "Аль-Ихлас", "Аль-Фалак", "Ан-Нас"],
};

function load(): Lang {
  try {
    const v = localStorage.getItem("tartil.lang");
    if (v === "az" || v === "tr" || v === "en" || v === "ar" || v === "ru") return v;
  } catch {
    /* ignore */
  }
  return "az";
}
let lang: Lang = load();
const subs = new Set<() => void>();

export function getLang(): Lang {
  return lang;
}
export function isRtl(): boolean {
  return lang === "ar";
}
export function setLang(next: Lang): void {
  lang = next;
  try {
    localStorage.setItem("tartil.lang", next);
  } catch {
    /* ignore quota */
  }
  subs.forEach((f) => f());
}
export function onLang(f: () => void): void {
  subs.add(f);
}
export function t(key: Key, v?: Record<string, string | number>): string {
  let s: string = D[key][IDX[lang]];
  if (v) for (const [k, x] of Object.entries(v)) s = s.split(`{${k}}`).join(String(x));
  return s;
}
export function hasKey(key: string): key is Key {
  return key in D;
}
/** Surah name in the UI language (1-based). */
export function surahName(n: number): string {
  return SURAH[lang][n - 1] ?? String(n);
}
/** Fill [data-i18n] text, [data-i18n-aria] aria-label and [data-i18n-title] title under root. */
export function applyI18n(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const k = el.dataset.i18n || "";
    if (hasKey(k)) el.textContent = t(k);
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((el) => {
    const k = el.dataset.i18nAria || "";
    if (hasKey(k)) el.setAttribute("aria-label", t(k));
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
    const k = el.dataset.i18nTitle || "";
    if (hasKey(k)) el.title = t(k);
  });
}
