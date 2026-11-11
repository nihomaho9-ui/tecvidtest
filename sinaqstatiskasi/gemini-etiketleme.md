# Gemini ilə dərs kliplərinin işarələnməsi

Məqsəd müəllim dərslərindəki real səhvləri işarələyib yeni yoxlamaları (təfxim, qəlqələ, ğunnə, əlavə hərf cütləri) qiymətləndirmək idi. **Heç bir yeni yoxlama bu raundda sayta çıxarılmayıb** — heç biri meyarları aydın şəkildə keçmədi.

Mənbə: `/workspace/letter-lab/out/gemini/confirmed/report.json`, `gt-accuracy.json`, `CHECKPOINT.json` (yazılıb: 11 noyabr 2026, 23:46, Ər-Riyad).

## Təsdiqlənmiş kliplər

İki ayrı model (gemini-3.5-flash-lite və gemini-3.1-flash-lite) razılaşanda klip «təsdiqlənmiş» sayılır: zaman damğası dərs pəncərəsinə düşməlidir, versiya və ailə üst-üstə düşməli, IoU ən azı 0,2 və ya orta nöqtələr 2,5 saniyədən yaxın olmalı və kəsişmə olmalıdır.

- Təsdiqlənmiş kliplər: **51**
- Səhvli: **32**
- Düzgün: **19**

Səhvli kliplərin ailəyə görə bölgüsü: məxrac 8, təfxim/tərqiq (emphasis) 8, hərəkə 5, mədd 4, ğunnə 3, hərf dəyişməsi 2, qəlqələ 2.

Mənbəyə görə səhvli: əl-Osman dərslərindən 20 (demo 02–11, 13–15), Süveydin «ən çox yayılmış hərf səhvləri» dərsindən 12. Süveydin məxaric dərsində iki keçidin razılaşdığı klip olmayıb (0 two-pass).

əl-Osman: pəncərədən kənar 23 klip atılıb; iki keçiddə 37, tək keçiddə 72. Süveyd hərf-səhv dərsi: 11 atılıb, 14 two-pass, 43 tək keçid.

## Gemini-nin öz dəqiqliyi

Doğruluğu məlum olan **20** kliplə (Hijaiyah benar/salah və qdat düzgün/səhv nümunələri) yoxlanılıb.

- Düzgün oxunuşa yanlış «səhv» deməyib: **0/10** (yanlış xəbərdarlıq 0%).
- 10 bilinən səhvdən yalnız **1**-ini tutub (tutma 10%). Tutulan bir qdat «qəlqələ yoxdur» klipidir; tip isə səhv ailəyə düşüb (ğunnə).
- Ümumi varlıq dəqiqliyi (səhv var/yox): **55%** (0,55).

Ona görə Gemini yalnız **ikinci yoxlama** kimi istifadə olunur: iki model razılaşmasa, klip təsdiqlənmiş sayılmır. Təkcə Gemini etiketinin üstündə yeni qayda buraxılmır.

İstifadə (açar yazılmayıb): 61 çağırış, 60 uğurlu, 1 uğursuz; təxminən 274 685 prompt və 32 595 cavab tokeni.

## د/ت cütü — saxlanılıb

İki modelin razılaşdığı dal→ta müəllim nümunəsi shipped hərf qaydasında (`llr≤0 ∧ fam≤0`, `emit>-4`) **tutulmayıb** (dar pəncərə llr=3,543, fam=0,917; geniş 868–882s llr=1,705, fam=0,606). Sonrakı təmiz 1:4 oxunuşu llr=21,268, fam=2,314; düzgün kontrast 7,305 / 1,914. Bəzi təmiz qari yerlərinin LLR-i bu səhvdən aşağıdır (məsələn minshawi_mj 2:25 llr=1,081; sudais 2:24 llr=2,277). Səhvi tutan istənilən hədd həmin təmiz yerləri də bayraqlayardı.

Yanlış xəbərdarlıq anlıq görüntüsü (rəsmi dəst hələ bitməmişdi: 1 və 2:1–41 bitmiş, 18 davam edirdi, 36 və 67 gözləyirdi; əl-Cuhənisiz): shipped qaydasında **1/9590** yer (maher 2:33) və **1/2381** ayə. Bu, təxminən 0,01%-dir, amma müəllim səhvini tutmadığı üçün cüt saxlanılıb. Sonrakı dal-ta ölçümü davam edirdi (12 noyabr 2026, 00:47 ətrafında 10 654 işdən 7 300-ü yazılıb); **tam rəsmi FA cədvəli hələ gözləyir**.

## Digər saxlanılan işlər

- **Qəlqələ.** İki təsdiqlənmiş səhv Süveyd dərsində ba və mim üzərindədir — klassik قطب جد dəsti deyil. Əvvəlki qdat_bench hərf-GOP-u `llr≤0`-da təxminən 0%, 1,5% FA həddində 19% tutma vermişdi. Yeni buraxıla bilən xüsusiyyət yoxdur.
- **Artıq ğunnə.** əl-Osmanda 3 təsdiqlənmiş hadisə (əl-aləmin-in «ya»sı iki dəfə; əd-dallin). Əvvəlki hərf-GOP ayə FA-sına görə artıq saxlanılmışdı.
- **İxfa / idğam.** İki keçiddə təsdiqlənmiş səhvli klip yoxdur. Gemini məlum iki «ixfa nun kimi oxunub» klipini də tutmayıb.
- **Təfxim / tərqiq.** 8 təsdiqlənmiş səhv (ra-dan əvvəl ba, ra-dan əvvəl həmzə, sad-dan əvvəl nun, ğayn-dan əvvəl mim, vəla-nın lamı, ağır vav). Model lüğətində ümumi qalın/incə işarə yoxdur (`ر۪` yalnız 11:41 «məcrəha»da, `لۜ` istifadə olunmur). Mövcud bacı cütlər (ص/س, ط/ت və s.) qalın-incə hərf cütlərini artıq əhatə edir. Yeni token səviyyəli yoxlama keçməyib.
- **fa→va və zəif fa məxrəci.** Süveydin təsdiqlənmiş hərf dəyişməsi Zipformer lüğətində bacı cüt deyil.

**Qərar:** push yoxdur. `tecvid-shell-v15` dəyişməyib.
