// Download a modest EveryAyah set (murattal, no Abdulbasit) for clean-recitation FA.
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { LAB, log } from "./infer-lib.mjs";

export const RECITERS = {
  husary: "Husary_64kbps",
  alafasy: "Alafasy_128kbps",
  minshawi: "Minshawy_Murattal_128kbps",
  shaatre: "Abu_Bakr_Ash-Shaatree_128kbps",
  hudhaify: "Hudhaify_128kbps",
  sudais: "Abdurrahmaan_As-Sudais_192kbps",
  ayyoub: "Muhammad_Ayyoub_128kbps",
  shuraim: "Saood_ash-Shuraym_128kbps",
};

// Many surahs, not the whole Quran. Ranges are inclusive 1-based ayah numbers.
export const SURAHS = [
  [1, 1, 7],
  [2, 1, 15],
  [18, 1, 10],
  [36, 1, 15],
  [55, 1, 10],
  [67, 1, 15],
  [78, 1, 10],
  [99, 1, 8],
  [103, 1, 3],
  [108, 1, 3],
  [109, 1, 6],
  [110, 1, 3],
  [111, 1, 5],
  [112, 1, 4],
  [113, 1, 5],
  [114, 1, 6],
];

const BASE = "https://everyayah.com/data";
const OUT = path.join(LAB, "clean-audio");

function get(url, dest) {
  return new Promise((resolve, reject) => {
    const tmp = dest + ".part";
    const doReq = (u, hops = 0) => {
      if (hops > 5) return reject(new Error("redirects " + u));
      https.get(u, { timeout: 60000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return doReq(res.headers.location, hops + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} ${u}`));
        }
        const f = fs.createWriteStream(tmp);
        res.pipe(f);
        f.on("finish", () => f.close(() => { fs.renameSync(tmp, dest); resolve(); }));
        f.on("error", reject);
      }).on("error", reject);
    };
    doReq(url);
  });
}

export function plan() {
  const jobs = [];
  for (const [id, folder] of Object.entries(RECITERS)) {
    for (const [s, a0, a1] of SURAHS) {
      for (let a = a0; a <= a1; a += 1) {
        const name = String(s).padStart(3, "0") + String(a).padStart(3, "0") + ".mp3";
        jobs.push({ id, s, a, folder, url: `${BASE}/${folder}/${name}`, dest: path.join(OUT, id, name) });
      }
    }
  }
  return jobs;
}

const jobs = plan();
let have = 0, got = 0, fail = 0;
const t0 = Date.now();
for (const j of jobs) {
  fs.mkdirSync(path.dirname(j.dest), { recursive: true });
  if (fs.existsSync(j.dest) && fs.statSync(j.dest).size > 1000) { have += 1; continue; }
  try {
    await get(j.url, j.dest);
    got += 1;
  } catch (e) {
    fail += 1;
    log("fail", j.id, j.s, j.a, String(e).slice(0, 120));
  }
  if ((got + fail) % 20 === 0) log("download", "have", have, "got", got, "fail", fail, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
log("download done", "planned", jobs.length, "have", have, "got", got, "fail", fail);
