# Qarilər

## Tətbiqin hazırlanmasında və öyrədilməsində bu qarilərin qiraətindən istifadə olunub

Aşağıdakı qarilərin qiraəti iki iş üçün istifadə olunub:

1. **Təcvid müddət zolağını qurmaq** — hər yerdə bir qariyə (Hüsariyə) baxmaq əvəzinə, düzgün sayılan uzatma aralığını bir çox mürəttəl qari ilə ölçmək.
2. **Yoxlamaları yoxlamaq** — düzgün oxunuşda yanlış xəbərdarlığın nə qədər çıxdığını və (mümkün olanda) bilinən səhvlərin tutulub-tutulmadığını ölçmək.

**Səs tanıma modeli bu qarilərlə öyrədilməyib.** Tətbiq əvvəlcədən öyrədilmiş Tilawa Zipformer modelindən istifadə edir. Bu siyahı həmin modelin təlim dəsti deyil.

Adlar EveryAyah / laboratoriya kataloqundakı yazılışdır (`lab/quran-band/reciters.mjs`). Kataloqda olmayan ad uydurulmayıb.

Zolaq süzgəci (11 noyabr 2026-cı il düzəlişindən sonra): qari saxlanılır, əgər orta uyğunluq (meanQ) ən azı 0,95-dirsə və zəif uyğun gələn ayələrin payı 25%-dən çox deyilsə. Zəif ayələr (`poor > 0,15`) zolağa düşmür. Fatihə, Yasin və Mülkdə bu süzgəc 32 zolaq qarisinin hamısını saxlayıb (çıxarılan: 0).

---

## 1. Müddət zolağındakı 32 mürəttəl qari

Hafs üsulu, EveryAyah mürəttəl qiraətləri. Abdullah əl-Cuhəni zolağa düşməyib (Mülk keyfiyyət qapısında zəif uyğunluq). Əbdülbasit çıxarılıb (çox uzadır). Əbdülqadir əl-Osman zolağa salına bilməyib (rəsmi yazının endirilməsi YouTube-da əngəllənib).

Hüsari mürəttəl həm zolaq üzvüdür, həm də saytda hələ də əsas müddət istinadıdır: yeni zolaq qaydası meyarlardan keçib «SHIP» olunana qədər tətbiq Hüsari yolu ilə işləyir.

| Daxili kod | Tam ad (kataloq) | Üslub | Rol | Zolaq süzgəci |
|------------|------------------|-------|-----|----------------|
| husary | Husary murattal | mürəttəl | zolaq üzvü və əsas müddət istinadı | saxlanılıb |
| alafasy | Mishari al-Afasy | mürəttəl | zolaq üzvü | saxlanılıb |
| minshawi | Minshawi murattal | mürəttəl | zolaq üzvü | saxlanılıb |
| ayyoub | Muhammad Ayyoub | mürəttəl | zolaq üzvü | saxlanılıb |
| shaatre | Abu Bakr al-Shatri | mürəttəl | zolaq üzvü | saxlanılıb |
| hudhaify | Ali al-Hudhaify | mürəttəl | zolaq üzvü | saxlanılıb |
| shuraim | Saud ash-Shuraim | mürəttəl | zolaq üzvü | saxlanılıb |
| sudais | Abdur-Rahman as-Sudais | mürəttəl | zolaq üzvü | saxlanılıb |
| ajamy | Ahmed al-Ajamy | mürəttəl | zolaq üzvü | saxlanılıb |
| banna | Mahmoud Ali al-Banna | mürəttəl | zolaq üzvü | saxlanılıb |
| tablawi | Mohamed al-Tablawi | mürəttəl | zolaq üzvü | saxlanılıb |
| maher | Maher al-Muaiqly | mürəttəl | zolaq üzvü | saxlanılıb |
| matroud | Abdullah Matroud | mürəttəl | zolaq üzvü | saxlanılıb |
| ali_jaber | Ali Jaber | mürəttəl | zolaq üzvü | saxlanılıb |
| akhdar | Ibrahim al-Akhdar | mürəttəl | zolaq üzvü | saxlanılıb |
| fares_abbad | Fares Abbad | mürəttəl | zolaq üzvü | saxlanılıb |
| nasser_alqatami | Nasser al-Qatami | mürəttəl | zolaq üzvü | saxlanılıb |
| yasser_dussary | Yasser al-Dosari | mürəttəl | zolaq üzvü | saxlanılıb |
| salah_budair | Salah al-Budair | mürəttəl | zolaq üzvü | saxlanılıb |
| sahl_yassin | Sahl Yassin | mürəttəl | zolaq üzvü | saxlanılıb |
| bukhatir | Salah Bukhatir | mürəttəl | zolaq üzvü | saxlanılıb |
| qahtaanee | Khalid al-Qahtani | mürəttəl | zolaq üzvü | saxlanılıb |
| muhsin_qasim | Muhsin al-Qasim | mürəttəl | zolaq üzvü | saxlanılıb |
| abdul_kareem | Muhammad Abdul Kareem | mürəttəl | zolaq üzvü | saxlanılıb |
| ahmed_neana | Ahmed Neana | mürəttəl | zolaq üzvü | saxlanılıb |
| ali_hajjaj | Ali Hajjaj al-Suesy | mürəttəl | zolaq üzvü | saxlanılıb |
| ghamadi | Saad al-Ghamdi | mürəttəl | zolaq üzvü | saxlanılıb |
| aziz_alili | Aziz Alili | mürəttəl | zolaq üzvü | saxlanılıb |
| yaser_salamah | Yaser Salamah | mürəttəl | zolaq üzvü | saxlanılıb |
| tunaiji | Khalifa al-Tunaiji | mürəttəl | zolaq üzvü | saxlanılıb |
| akram | Akram al-Alaqimy | mürəttəl | zolaq üzvü | saxlanılıb |
| nabil | Nabil al-Rifai | mürəttəl | zolaq üzvü | saxlanılıb |

---

## 2. Zolaqdan çıxarılan qarilər

Bu qarilər müddət zolağının 32 üzvünə daxil deyil. Səbəbi hər birinin yanında yazılıb.

| Daxili kod | Tam ad (kataloq) | Üslub | Rol və səbəb |
|------------|------------------|-------|----------------|
| abdulbasit | Abdulbasit murattal | mürəttəl | Zolaqdan çıxarılıb, çünki çox uzadır (istifadəçi qərarı). Ayrı saxlanılan «held-elongated» yoxlamasında istifadə olunub. Hərf yoxlamasının təmiz dəstindən də çıxarılıb. |
| abdulbasit_mj | Abdulbasit mujawwad | mücəvvəd | Eyni səbəblə zolaqdan çıxarılıb. Ayrı saxlanılan mücəvvəd yoxlamasındadır. Hərf yoxlamasının təmiz dəstindən də çıxarılıb. |
| juhaynee | Abdullah al-Juhaynee | mürəttəl | Mülk keyfiyyət qapısında zəif uyğunluğa görə 32 nəfərlik müddət zolağına salınmayıb. Hərf yoxlamasında iştirak edib; orada kəskin kənar qiymət olub (ayə səviyyəsində bayraqlar təxminən 23%). |
| alosman | Abdulkader Al-Osman | müəllim dərsi / talqin | Zolağa namizəd idi, amma rəsmi YouTube yazısı endirilə bilmədi (HTTP 403, sonra bot yoxlaması). Kuki və ya proksi ilə keçid edilməyib. Fatihə və Mülk dərs sınaqlarında müəllim kimi istifadə olunub; hərf yoxlamasının 41 nəfərlik təmiz keşində də var. Müddət zolağı üzvü deyil. |

---

## 3. Ayrı saxlanılan yoxlama qariləri (held-out)

Bunlar zolağı qurmaq üçün yox, zolaq qurulandan sonra düzgün oxunuşu yoxlamaq üçündür. Qəsr, mücəvvəd, müəllim və (Əbdülbasitin) uzadılmış üslubu zolağa qarışdırılmayıb.

| Daxili kod | Tam ad (kataloq) | Üslub | Rol |
|------------|------------------|-------|-----|
| jibreel | Muhammad Jibreel | mürəttəl (qəsr) | held-qasr yoxlaması |
| rifai | Hani ar-Rifai | mürəttəl (qəsr) | held-qasr yoxlaması |
| basfar | Abdullah Basfar | mürəttəl (qəsr) | held-qasr yoxlaması |
| husarymj | Husary mujawwad | mücəvvəd | held-mujawwad yoxlaması |
| minshawi_mj | Minshawi mujawwad | mücəvvəd | held-mujawwad yoxlaması |
| mustafa_ismail | Mustafa Ismail | mücəvvəd | held-mujawwad yoxlaması |
| husary_muallim | Husary muallim | müəllim qiraəti | held-muallim yoxlaması |

Əbdülbasit mürəttəl və mücəvvəd də bu qrupdadır; onlar yuxarıda «zolaqdan çıxarılanlar» bölməsində göstərilib.

---

## 4. Müəllimlər (dərs yazıları)

Bu adlar EveryAyah zolaq siyahısının 32 üzvü deyil. Dərslərdəki nümunəvi səhvləri və düzgün oxunuşu yoxlamaq üçün istifadə olunub.

| Ad | Mənbə | Rol |
|----|-------|-----|
| Abdulkader Al-Osman (Əbdülqadir əl-Osman) | Rəsmi dərslər (Fatihə təlqin/təshih; Mülk təlqini YouTube-da əngəlləndi) | Müəllim. 15 nümunəvi Fatihə səhvi müddət hakimi ilə yoxlanılıb. Ətraflı: [muellim-dersleri.md](muellim-dersleri.md). |
| Ayman Rashdi Swed (Əyman Rəşdi Süveyd) | archive.org dərs səsi (lisenziya orada göstərilməyib; yalnız tədqiqat, tətbiqə daxil edilməyib) | Müəllim. İki dərs (məxaric və ən çox yayılmış hərf səhvləri) Gemini ilə işarələnib. Ətraflı: [gemini-etiketleme.md](gemini-etiketleme.md). |

---

## 5. Hərf yoxlamasında işlədilən 41 qari

Hərf cütlərinin təmiz (düzgün oxunuş) yanlış xəbərdarlığı 41 qarinin keşlənmiş posteriorları üzərində ölçülüb. Əbdülbasitin hər iki üslubu bu dəstdən çıxarılıb. Siyahıda 32 zolaq qarisi, ayrı saxlanılan yoxlama qariləri, əl-Cuhəni və əl-Osman var. 8 243 ayə; bir keş uyğun gəlməyib: `ahmed_neana-18-63`. Əsas rəqəmlər əl-Cuhənisiz də verilib (40 qari, 7 972 ayə). Ətraflı: [herf-yoxlamalari.md](herf-yoxlamalari.md).
