import fs from "node:fs";
import { TOKENS } from "@tilawa/core";
import { setEquivalence } from "../../src/tajwid-core.js";
import { buildIndex, scoreIsolated } from "../../src/letter-gop.js";
import { readWavPcm16k, logprobs } from "./infer-lib.mjs";

setEquivalence(TOKENS);
const index = buildIndex(TOKENS);
console.log("sister-maps", [...index.sisters.values()].reduce((s,a)=>s+a.length,0), "qalqala", index.qalqalaOf.size, "ghunna", index.ghunnaOf.size);

const samples = [
  ["/workspace/letter-lab/hijaiyah/wav/Data Benar/1/6-1-1.wav", "ح", 1, "benar ha"],
  ["/workspace/letter-lab/hijaiyah/wav/Data Salah/1/6-1-1.wav", "ح", 1, "salah ha"],
  ["/workspace/letter-lab/hijaiyah/wav/Data Benar/1/27-1-1.wav", "ه", 1, "benar haa"],
  ["/workspace/letter-lab/hijaiyah/wav/Data Benar/1/14-1-1.wav", "ص", 1, "benar sad"],
  ["/workspace/letter-lab/hijaiyah/wav/Data Benar/1/12-1-1.wav", "س", 1, "benar sin"],
  ["/workspace/letter-lab/hijaiyah/wav/Data Salah/1/14-1-1.wav", "ص", 1, "salah sad"],
];
for (const [p, letter, v, tag] of samples) {
  if (!fs.existsSync(p)) { console.log("missing", p); continue; }
  const t0 = Date.now();
  const pcm = readWavPcm16k(p);
  const { lp, T } = await logprobs(pcm, 8000);
  const sc = scoreIsolated(lp, T, letter, v, index);
  const pairs = (sc.row?.pairs||[]).map(x => `${x.key}:llr=${Number(x.llr).toFixed(2)} fam=${Number(x.fam).toFixed(2)} gopS=${Number(x.gopSister).toFixed(2)}`).join(" | ");
  console.log(tag, "T", T, "ok", sc.ok, "emit", sc.al?.emit != null ? Number(sc.al.emit).toFixed(2) : null, "gop", sc.row?.gop != null ? Number(sc.row.gop).toFixed(2) : null, pairs, `${Date.now()-t0}ms`);
}
