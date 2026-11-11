#!/usr/bin/env node
// Refresh sinaqstatiskasi/data.json surahProgress + inject, and the
// auto-generated block in sinaqstatiskasi/surə-ardicilligi.md, from lab status files.
// Does not invent other numbers. Does not bump the service worker or deploy.
//
// Usage:
//   node lab/update-sinaqstatiskasi.mjs
//   node lab/update-sinaqstatiskasi.mjs --out /path/to/lab/quran-band/out
//
// Looks for status files in --out, then $BAND_OUT, then
// lab/quran-band/out, then /workspace/tecvidtest-mulk/lab/quran-band/out.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const DOCS = path.join(root, "sinaqstatiskasi");
const DATA_PATH = path.join(DOCS, "data.json");
const SURAH_MD = path.join(DOCS, "surə-ardicilligi.md");

const BAND = [
  "abdul_kareem", "ahmed_neana", "ajamy", "akhdar", "akram", "alafasy",
  "ali_hajjaj", "ali_jaber", "ayyoub", "aziz_alili", "banna", "bukhatir",
  "fares_abbad", "ghamadi", "hudhaify", "husary", "maher", "matroud",
  "minshawi", "muhsin_qasim", "nabil", "nasser_alqatami", "qahtaanee",
  "sahl_yassin", "salah_budair", "shaatre", "shuraim", "sudais", "tablawi",
  "tunaiji", "yaser_salamah", "yasser_dussary",
];
const AYAH_N = { 1: 7, 2: 286, 18: 110, 36: 83, 67: 30 };
const NAMES_AZ = { 1: "Fatihə", 2: "əl-Bəqərə", 18: "əl-Kəhf", 36: "Yasin", 67: "əl-Mülk" };

function argOut() {
  const i = process.argv.indexOf("--out");
  if (i >= 0 && process.argv[i + 1]) return path.resolve(process.argv[i + 1]);
  const cands = [
    process.env.BAND_OUT,
    path.join(root, "lab/quran-band/out"),
    "/workspace/tecvidtest-mulk/lab/quran-band/out",
  ].filter(Boolean);
  for (const c of cands) {
    if (fs.existsSync(path.join(c, "ship-state.json")) || fs.existsSync(path.join(c, "progress.json"))) {
      return c;
    }
  }
  return cands[0];
}

function readJson(p, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function riyadhStamp(d = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} Asia/Riyadh`;
}

function azLong(stamp) {
  // stamp: "YYYY-MM-DD HH:MM:SS Asia/Riyadh"
  const m = stamp.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
  if (!m) return stamp;
  const months = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avqust","sentyabr","oktyabr","noyabr","dekabr"];
  const mon = months[Number(m[2]) - 1];
  const day = String(Number(m[3]));
  return `${day} ${mon} ${m[1]}, ${m[4]}:${m[5]}`;
}

function toRiyadh(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return riyadhStamp(d);
}

function countAyahs(ayahDir) {
  const got = new Map(); // `${s}:${a}` -> Set
  const missing = {};
  const measured = {};
  if (!fs.existsSync(ayahDir)) return { measured, missing, available: false };
  for (const name of fs.readdirSync(ayahDir)) {
    if (!name.endsWith(".json")) continue;
    const stem = name.slice(0, -5);
    const parts = stem.split("-");
    if (parts.length < 3) continue;
    const a = Number(parts.at(-1));
    const s = Number(parts.at(-2));
    const rec = parts.slice(0, -2).join("-");
    if (!BAND.includes(rec) || !AYAH_N[s]) continue;
    const k = `${s}:${a}`;
    if (!got.has(k)) got.set(k, new Set());
    got.get(k).add(rec);
  }
  for (const [s, n] of Object.entries(AYAH_N)) {
    const sn = Number(s);
    let m = 0;
    const miss = [];
    for (let a = 1; a <= n; a++) {
      const have = got.get(`${sn}:${a}`) || new Set();
      m += have.size;
      for (const rec of BAND) {
        if (!have.has(rec)) miss.push(`${rec} ${sn}:${a}`);
      }
    }
    measured[sn] = m;
    missing[sn] = miss;
  }
  return { measured, missing, available: true };
}

function injectDone(outDir) {
  const p = path.join(outDir, "inject.json");
  const j = readJson(p, null);
  if (Array.isArray(j)) return j.length;
  if (j && Array.isArray(j.results)) return j.results.length;
  return null;
}

const outDir = argOut();
const ayahDir = path.join(path.dirname(outDir), "ayah");
const asOf = riyadhStamp();
const ship = readJson(path.join(outDir, "ship-state.json"), {}) || {};
const progress = readJson(path.join(outDir, "progress.json"), {}) || {};
const counts = countAyahs(ayahDir);
const injDone = injectDone(outDir);
const injJobs = 34285;

const data = readJson(DATA_PATH);
if (!data) {
  console.error("missing", DATA_PATH);
  process.exit(1);
}

function row(n, extra = {}) {
  const need = (AYAH_N[n] || 0) * BAND.length;
  const measured = counts.available ? (counts.measured[n] ?? 0) : extra.measured;
  return {
    n,
    nameAz: NAMES_AZ[n] || extra.nameAz || String(n),
    ayahs: AYAH_N[n] || extra.ayahs,
    measured,
    need,
    ...extra,
  };
}

const shippedAt = toRiyadh(ship.at) || data.surahProgress?.surahs?.[0]?.shippedAt;
const s1 = row(1, {
  status: ship.lastShippedPrefix >= 1 ? "shipped" : "measured-waiting-for-ordered-prefix",
  sha: ship.sha || data.shipped?.durationBandDataCommit,
  ghPages: ship.ghPages || data.shipped?.durationBandDataGhPages,
  sw: ship.sw || data.shipped?.durationBandDataSw,
  shippedAt,
});
const s2miss = counts.missing?.[2] || [];
const known404 = s2miss.includes("abdul_kareem 2:56") ? "abdul_kareem 2:56 HTTP 404" : undefined;
const s2 = row(2, {
  status: "measuring",
  ...(known404 ? { knownMissingDownload: known404 } : {}),
});
if (counts.available && s2.measured === s2.need) s2.status = "measured-waiting-for-ordered-prefix";
if (ship.lastShippedPrefix >= 2) s2.status = "shipped";

const s18miss = counts.missing?.[18] || [];
const s18 = row(18, {
  status: "measured-in-val-set-not-marked-complete",
  ...(s18miss.length ? { missing: s18miss.join(", ") } : {}),
});
const s36 = row(36, { status: "measured-waiting-for-ordered-prefix" });
const s67 = row(67, { status: "measured-waiting-for-ordered-prefix" });
if (ship.lastShippedPrefix >= 18) s18.status = "shipped";
if (ship.lastShippedPrefix >= 36) s36.status = "shipped";
if (ship.lastShippedPrefix >= 67) s67.status = "shipped";

data.updatedAt = asOf;
data.surahProgress = {
  asOf,
  order: "1-114 mushaf order, push after each completed prefix",
  lastShippedPrefix: ship.lastShippedPrefix ?? data.surahProgress?.lastShippedPrefix ?? 1,
  current: progress.current ?? data.surahProgress?.current ?? 2,
  doneLab: progress.done ?? data.surahProgress?.doneLab ?? [1, 36, 67],
  injectPending: injDone == null || injDone < injJobs,
  surahs: [s1, s2, s18, s36, s67],
};
if (data.duration?.inject) {
  data.duration.inject.done = injDone;
  data.duration.inject.jobs = injJobs;
  data.duration.inject.asOf = asOf;
  data.duration.inject.status = injDone != null && injDone >= injJobs ? "complete-awaiting-decide-val" : "pending";
}
if (ship.sha) {
  data.shipped.durationBandDataCommit = ship.sha;
  data.shipped.durationBandDataGhPages = ship.ghPages || data.shipped.durationBandDataGhPages;
  data.shipped.durationBandDataSw = ship.sw || data.shipped.durationBandDataSw;
  data.shipped.durationBandDataAt = shippedAt || data.shipped.durationBandDataAt;
  data.shipped.durationBandDataPrefix = ship.lastShippedPrefix ?? data.shipped.durationBandDataPrefix;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

function pct(m, n) {
  if (!n) return "";
  return ` (${Math.round((100 * m) / n)}%)`.replace(" (100%)", "");
}

const injLine =
  injDone == null
    ? "Inject tutma sınağı: say gözləyir (inject.json oxunmadı)."
    : `Inject tutma sınağı: ${injJobs.toLocaleString("az-AZ").replace(/\./g, " ")} işdən ${injDone.toLocaleString("az-AZ").replace(/\./g, " ")}-si yazılıb (${injDone >= injJobs ? "bitib, decide-val gözləyə bilər" : "gözləyir"}). Ətraflı: [tecvid-muddet.md](tecvid-muddet.md).`;

const shipRow = `| ${s1.status === "shipped" ? (ship.lastShippedPrefix || 1) + " / 114" : "—"} | 1 Fatihə | \`${s1.sha || "—"}\` | \`${s1.ghPages || "—"}\` | ${s1.sw || "—"} | ${s1.shippedAt ? azLong(s1.shippedAt) : "—"} | Yalnız zolaq məlumatı; \`BAND_MODES\` boşdursa hakimlər Hüsari yolundadır |`;

function statusLine(s) {
  const name = `${s.n} ${s.nameAz}`;
  const frac = `${s.measured} / ${s.need}`;
  let st = s.status;
  if (s.n === 1 && s.status === "shipped") st = `Bitib, saytdadır (${s.shippedAt ? azLong(s.shippedAt) : ""})`.trim();
  if (s.n === 2 && s.status === "measuring") st = `Ölçülür${pct(s.measured, s.need)}.${s.knownMissingDownload ? " Məlum əksik yükləmə: `" + s.knownMissingDownload.replace(" HTTP 404", "") + "` (HTTP 404)" : ""}`;
  if (s.n === 18) st = `Yoxlama dəstində ölçülüb; progress siyahısında «bitmiş surə» deyil.${s.missing ? " Əksik: `" + s.missing + "`" : ""}`;
  if (s.n === 36 && s.status !== "shipped") st = "Bitib, növbə prefiks 36-ya çatanda push olunacaq. Köhnə süzgəc bəzən daha az qari saxlayırdı; düzəlişdən sonra 32-si də saxlanılır";
  if (s.n === 67 && s.status !== "shipped") st = "Bitib, növbə 67-yə çatanda push olunacaq";
  if (s.status === "shipped" && s.n !== 1) st = `Bitib, saytdadır (${s.shippedAt ? azLong(s.shippedAt) : ""})`;
  return `| ${name} | ${s.ayahs} | ${frac} | ${st} |`;
}

const auto = `Yenilənmə: ${azLong(asOf)} (Ər-Riyad vaxtı).

## Sayta çıxarılan prefiks

| Prefiks | Surələr | main SHA | gh-pages SHA | Xidmət işçisi | Vaxt (Ər-Riyad) | Qeyd |
|---------|---------|----------|--------------|---------------|-----------------|------|
${shipRow}

Push jurnali: \`lab/quran-band/out/pushes.log\` və \`ship-state.json\`.

## Ölçü vəziyyəti (32 zolaq qarisi)

Gözlənilən ölçü sayı = ayə sayı × 32.

| Surə | Ayə | Ölçülüb / gözlənir | Status |
|------|-----|---------------------|--------|
${statusLine(s1)}
${statusLine(s2)}
${statusLine(s18)}
${statusLine(s36)}
${statusLine(s67)}

\`progress.json\` (laboratoriya): bitmiş elan olunanlar ${(data.surahProgress.doneLab || []).join(", ") || "—"}; hazırda ölçülən **${data.surahProgress.current}**. 3–17, 19–35, 37–66 və 68–114 bu skriptin gördüyü ayə keşində yoxdursa, hələ ölçülməyib sayılır.

${injLine}
`;

let md = fs.readFileSync(SURAH_MD, "utf8");
if (!md.includes("<!-- auto:start -->") || !md.includes("<!-- auto:end -->")) {
  console.error("missing auto markers in", SURAH_MD);
  process.exit(1);
}
md = md.replace(/<!-- auto:start -->[\s\S]*?<!-- auto:end -->/, `<!-- auto:start -->\n${auto}<!-- auto:end -->`);
fs.writeFileSync(SURAH_MD, md);

console.log("updated", path.relative(root, DATA_PATH), "and", path.relative(root, SURAH_MD));
console.log("asOf", asOf, "outDir", outDir);
console.log("measured", counts.measured, "inject", injDone, "/", injJobs, "prefix", ship.lastShippedPrefix);
