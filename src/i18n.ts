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
  "sense.hint.sert": ["Söz xətaları daha diqqətlə yoxlanır.", "Kelime hataları daha dikkatli kontrol edilir.", "Word mistakes are checked more closely.", "تُفحص أخطاء الكلمات بدقة أكبر.", "Ошибки в словах проверяются внимательнее."],
  "sense.hint.cetin": ["Söz xətaları + təcvid (məd, ğunnə, ixfa, qəlqələ).", "Kelime hataları + tecvid (med, gunne, ihfâ, kalkale).", "Word mistakes + tajwid (madd, ghunnah, ikhfa, qalqalah).", "أخطاء الكلمات + التجويد (المد، الغنة، الإخفاء، القلقلة).", "Ошибки в словах + таджвид (мадд, гунна, ихфа, калькала)."],
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
  "st.modelSub": ["Bir dəfə, təxminən 66 MB. Sonra telefonda qalır.", "Bir kez, yaklaşık 66 MB. Sonra telefonda kalır.", "Once, about 66 MB. Then it stays on the phone.", "مرة واحدة، نحو 66 ميغابايت. ثم يبقى على الهاتف.", "Один раз, около 66 МБ. Потом остаётся на телефоне."],
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
  "tj.label.madd": ["Ehtimal: məd qısa", "Muhtemel: med kısa", "Possible: madd too short", "احتمال: المد قصير", "Возможно: мадд короткий"],
  "tj.label.long": ["Ehtimal: məd uzun", "Muhtemel: med uzun", "Possible: madd too long", "احتمال: المد طويل", "Возможно: мадд длинный"],
  "tj.label.ghunna": ["Ehtimal: ğunnə qısa", "Muhtemel: gunne kısa", "Possible: ghunnah too short", "احتمال: الغنة قصيرة", "Возможно: гунна короткая"],
  "tj.label.ikhfa": ["Ehtimal: ixfa qısa", "Muhtemel: ihfâ kısa", "Possible: ikhfa too short", "احتمال: الإخفاء قصير", "Возможно: ихфа короткий"],
  "tj.label.qalqala": ["Ehtimal: qəlqələ yoxdur", "Muhtemel: kalkale yok", "Possible: no qalqalah", "احتمال: لا قلقلة", "Возможно: нет калькалы"],
  "tj.note": ["Avtomatik təcvid rəyi səhv ola bilər, müəllimi əvəz etmir.", "Otomatik tecvid yorumu yanılabilir, hocanın yerini tutmaz.", "Automatic tajwid feedback can be wrong and does not replace a teacher.", "ملاحظات التجويد الآلية قد تخطئ ولا تغني عن المعلّم.", "Автоматическая оценка таджвида может ошибаться и не заменяет учителя."],
  "tj.heard2": ["Sən ~2 hərəkə uzatdın.", "~2 hareke uzattın.", "You held it ~2 counts.", "مددتَ نحو حركتين.", "Вы тянули ~2 хараката."],
  "tj.heardShort": ["Sən bir az qısa uzatdın.", "Biraz kısa uzattın.", "You held it a little short.", "مددتَ أقصر قليلًا.", "Вы тянули чуть короче."],
  "tj.long": ["Təbii məd 2 hərəkədir; burada daha uzun çəkdin.", "Med-i tabîî 2 harekedir; burada daha uzun çektin.", "Natural madd is 2 counts; you held it longer here.", "المد الطبيعي حركتان؛ مددتَ هنا أطول.", "Естественный мадд — 2 хараката; здесь вы тянули дольше."],
  "tj.lazim": ["Məd lazim: 6 hərəkə uzadılır. {h}", "Med-i lâzım: 6 hareke uzatılır. {h}", "Madd lazim: held 6 counts. {h}", "المد اللازم: يُمد 6 حركات. {h}", "Мадд лязим: тянется 6 харакатов. {h}"],
  "tj.munfasil": ["Məd munfəsil (Şatibiyyə yolu): 4–5 hərəkə uzadılır. {h}", "Med-i munfasıl (Şâtıbiyye tarîki): 4–5 hareke uzatılır. {h}", "Madd munfasil (Shatibiyyah): held 4–5 counts. {h}", "المد المنفصل (طريق الشاطبية): يُمد 4–5 حركات. {h}", "Мадд мунфасиль (путь Шатибии): тянется 4–5 харакатов. {h}"],
  "tj.muttasil": ["Məd muttəsil: 4–5 hərəkə uzadılır. {h}", "Med-i muttasıl: 4–5 hareke uzatılır. {h}", "Madd muttasil: held 4–5 counts. {h}", "المد المتصل: يُمد 4–5 حركات. {h}", "Мадд муттасиль: тянется 4–5 харакатов. {h}"],
  "tj.madd": ["Məd 4–5 hərəkə uzadılmalıdır. {h}", "Med 4–5 hareke uzatılmalı. {h}", "This madd should be held 4–5 counts. {h}", "يجب أن يُمد هذا المد 4–5 حركات. {h}", "Этот мадд нужно тянуть 4–5 харакатов. {h}"],
  "tj.qmid": ["Sakin qəlqələ hərfi: səsi yüngülcə sıçrat (qəlqələ suğra).", "Sakin kalkale harfi: sesi hafifçe sektir (kalkale-i suğrâ).", "Sakin qalqalah letter: give a light bounce (minor qalqalah).", "حرف قلقلة ساكن: أظهر النبرة خفيفة (قلقلة صغرى).", "Буква калькалы с сукуном: лёгкий отскок звука (малая калькала)."],
  "tj.qfinal": ["Ayə sonunda sakin qəlqələ hərfi: səsi aydın sıçrat (qəlqələ kubra).", "Ayet sonunda sakin kalkale harfi: sesi belirgin sektir (kalkale-i kübrâ).", "Qalqalah letter at the ayah end: give a clear bounce (major qalqalah).", "حرف قلقلة ساكن في آخر الآية: أظهر النبرة واضحة (قلقلة كبرى).", "Буква калькалы в конце аята: чёткий отскок (большая калькала)."],
  "tj.ghunna": ["Şəddəli nun/mim: ğunnəni 2 hərəkə burunda saxla.", "Şeddeli nun/mim: gunneyi 2 hareke burunda tut.", "Nun/mim with shaddah: hold the ghunnah 2 counts in the nose.", "النون والميم المشددتان: أمسك الغنة حركتين في الخيشوم.", "Нун/мим с шаддой: держите гунну 2 хараката в носу."],
  "tj.ikhfa": ["Nun/mim sakin gizlədilir: səsi ~2 hərəkə burunda saxla.", "Sakin nun/mim ihfâ edilir: sesi ~2 hareke burunda tut.", "Ikhfa of nun/mim sakin: hold the sound ~2 counts in the nose.", "إخفاء النون/الميم الساكنة: أمسك الصوت نحو حركتين في الخيشوم.", "Ихфа нуна/мима с сукуном: держите звук ~2 хараката в носу."],
  "tj.noData": ["Bu səhifə üçün təcvid məlumatı hələ hazır deyil.", "Bu sayfa için tecvid verisi henüz hazır değil.", "Tajwid data for this page is not ready yet.", "بيانات التجويد لهذه الصفحة غير جاهزة بعد.", "Данные таджвида для этой страницы ещё не готовы."],
  "tj.chip": ["Təcvid rəyi ({n})", "Tecvid yorumu ({n})", "Tajwid review ({n})", "ملاحظات التجويد ({n})", "Разбор таджвида ({n})"],
  "tj.prev": ["Əvvəlki ayə", "Önceki ayet", "Previous ayah", "الآية السابقة", "Предыдущий аят"],
  "tj.next": ["Sonrakı ayə", "Sonraki ayet", "Next ayah", "الآية التالية", "Следующий аят"],
  "tj.head": ["Ayə {a} — təcvid rəyi", "Ayet {a} — tecvid yorumu", "Ayah {a} — tajwid review", "الآية {a} — ملاحظات التجويد", "Аят {a} — разбор таджвида"],
  "tj.count": ["{n} qeyd","{n} not","Notes: {n}","ملاحظات: {n}","Заметки: {n}"],
  "tj.again": ["Ayəni yenidən oxu", "Ayeti yeniden oku", "Read the ayah again", "أعد قراءة الآية", "Прочитать аят заново"],
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
