// "Çətin" mode tajwid check: madd, ghunna and ikhfa held too short, judged against the reciter's own tempo and
// Husary's reference reading of the same page (public/tj/<page>.json, built by tools/tajwid-prep.mjs).
import { CLASSES, ayahTokens, alignAyah, measure, judge, setEquivalence, errorVariant, siteLLR, tokenClass, qprobeScore, type TjIssue } from "./tajwid-core.js";
import QPROBE from "./tajwid-qprobe.json";
import QMID from "./tajwid-qmid.json";
import { t } from "./i18n";

type RefAyah = {
  s: number; a: number; url: string; seg: [number, number, number][]; tj: [number, string, number][]; q: number;
  all?: [number, string, number | null, number, number | null, number][]; mt?: Record<string, string>;
};
type RefPage = { p: number; ayahs: RefAyah[] };
type Core = { encodePhonemes: (t: string) => number[] | null; TOKENS: readonly string[] };
type Corpus = { surahs: { ayahs: { w: string[][] }[] }[] };
type Runner = {
  accept: (frames: Float32Array[]) => Promise<{ logProbs: Float32Array; frames: number; encoder?: Float32Array; encoderFrames?: number }>;
  __tj?: boolean;
};
const ENC = 512;
export type TjFound = TjIssue & { s: number; a: number; text: string };

const COLOR: Record<string, string> = { madd: "#0e8a7d", ghunna: "#7a4cc8", ikhfa: "#d9731a", qalqala: "#2a6fb0" };
const LABEL = (kind: string): string =>
  t(kind === "ghunna" ? "tj.label.ghunna" : kind === "ikhfa" ? "tj.label.ikhfa" : kind === "qalqala" ? "tj.label.qalqala" : "tj.label.madd");
const RING = 25 * 240; // 4 minutes of decoder frames

function explain(x: TjIssue): string {
  const h = t(x.r < 1.35 ? "tj.heard2" : "tj.heardShort");
  if (x.type === "long") return t("tj.long");
  if (x.sub === "madd6") return t("tj.lazim", { h });
  if (x.type === "munfasil") return t("tj.munfasil", { h });
  if (x.type === "muttasil") return t("tj.muttasil", { h });
  if (x.kind === "madd") return t("tj.madd", { h });
  if (x.sub === "qalqala-mid") return t("tj.qmid");
  if (x.kind === "qalqala") return t("tj.qfinal");
  if (x.kind === "ghunna") return t("tj.ghunna");
  return t("tj.ikhfa");
}

export interface TajwidHost {
  root: HTMLElement;
  sheet: HTMLElement;
  asset: (p: string) => string;
  pageOf: (s: number, a: number) => number | undefined;
  retryAyah: (s: number, a: number) => void;
}

export function createTajwid(host: TajwidHost) {
  let on = false;
  let munfasil: 2 | 4 = 4; // madd munfasil length the reciter follows: 2 (qasr) or 4–5 counts
  let core: Core | null = null;
  let corpus: Corpus | null = null;
  const ring = new Float32Array(RING * CLASSES);
  const encRing = new Float32Array(RING * ENC); // encoder rows for the qalqala probe
  const encOk = new Uint8Array(RING);
  let frames = 0; // decoder frames seen since load (monotonic)
  let lastDrop = -1;
  const starts = new Map<string, number>();
  const done = new Set<string>();
  const found = new Map<string, TjFound[]>();
  const pageCache = new Map<number, Promise<RefPage | null>>();
  let index: Promise<Set<number>> | null = null;
  let cardKey = "";
  let cardShownAt = 0;
  let collapsed = false;
  let noted = 0;
  const stats: number[] = [];
  let encChecks = 0;
  const skips: Record<string, number> = {};
  const skip = (k: string): void => {
    skips[k] = (skips[k] || 0) + 1;
    const w = window as unknown as { __tj?: Record<string, unknown> };
    w.__tj = { ...(w.__tj || { stats, found: [] }), skips };
  };

  const card = document.createElement("div");
  card.className = "tj-card";
  card.hidden = true;
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "tj-chip";
  chip.hidden = true;
  host.root.append(card, chip);

  function pageIndex(): Promise<Set<number>> {
    index ??= fetch(host.asset("tj/index.json"))
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((j: { pages: number[] }) => new Set(j.pages))
      .catch(() => new Set<number>());
    return index;
  }
  function refPage(p: number): Promise<RefPage | null> {
    let hit = pageCache.get(p);
    if (!hit) {
      hit = pageIndex().then((set) =>
        set.has(p) ? fetch(host.asset(`tj/${p}.json`)).then((r) => (r.ok ? (r.json() as Promise<RefPage>) : null)).catch(() => null) : null,
      );
      pageCache.set(p, hit);
    }
    return hit;
  }

  function attach(zip: unknown, c: Core, corp: unknown): void {
    core = c;
    setEquivalence(c.TOKENS);
    corpus = corp as Corpus;
    const runner = (zip as { runner?: Runner } | null)?.runner;
    if (!runner || runner.__tj) return;
    runner.__tj = true;
    const accept = runner.accept.bind(runner);
    runner.accept = async (fr) => {
      const out = await accept(fr);
      const n = out.frames || 0;
      const enc = out.encoder && out.encoderFrames === n && out.encoder.length >= n * ENC ? out.encoder : null;
      for (let t = 0; t < n; t += 1) {
        const slot = (frames + t) % RING;
        ring.set(out.logProbs.subarray(t * CLASSES, (t + 1) * CLASSES), slot * CLASSES);
        encOk[slot] = enc ? 1 : 0;
        if (enc) encRing.set(enc.subarray(t * ENC, (t + 1) * ENC), slot * ENC);
      }
      frames += n;
      return out;
    };
  }

  function newTake(): void {
    starts.clear();
    done.clear();
  }
  function dropped(): void {
    lastDrop = frames;
  }
  function heard(s: number, a: number): void {
    if (!on) return;
    const key = `${s}:${a}`;
    if (!starts.has(key)) starts.set(key, frames);
    if (!card.hidden && !collapsed && cardKey !== key && performance.now() - cardShownAt > 2500) collapse();
  }

  function ayahDone(s: number, a: number): void {
    if (!on || !core || !corpus) return;
    const key = `${s}:${a}`;
    if (done.has(key)) return;
    if (!starts.has(key)) return skip("nostart");
    done.add(key);
    window.setTimeout(() => void check(s, a), 1500);
  }

  async function check(s: number, a: number): Promise<void> {
    if (!core || !corpus) return;
    const key = `${s}:${a}`;
    const p = host.pageOf(s, a);
    const ref = p ? await refPage(p) : null;
    const refAyah = ref?.ayahs.find((x) => x.s === s && x.a === a);
    if (!refAyah) {
      skip("noref");
      if (p && noted !== p) {
        noted = p;
        quiet(t("tj.noData"));
      }
      return;
    }
    const t0 = performance.now();
    const end = frames;
    const begin = Math.max(end - RING + 1, (starts.get(key) ?? end) - 250, 0);
    if (lastDrop >= begin) return skip("drop"); // audio was dropped inside this ayah: durations are not trustworthy
    const T = end - begin;
    const at = ayahTokens(corpus.surahs[s - 1].ayahs[a - 1], core.encodePhonemes, core.TOKENS);
    if (!at || T < at.ids.length + 5) return skip("short");
    const lp = new Float32Array(T * CLASSES);
    let encAll = true;
    for (let t = 0; t < T; t += 1) {
      const slot = (begin + t) % RING;
      lp.set(ring.subarray(slot * CLASSES, (slot + 1) * CLASSES), t * CLASSES);
      if (!encOk[slot]) encAll = false;
    }
    let enc: Float32Array | null = null;
    if (encAll) {
      encChecks += 1;
      enc = new Float32Array(T * ENC);
      for (let t = 0; t < T; t += 1) {
        const slot = (begin + t) % RING;
        enc.set(encRing.subarray(slot * ENC, (slot + 1) * ENC), t * ENC);
      }
    }
    const al = alignAyah(lp, T, at.ids);
    const toks = core.TOKENS;
    const llr = (i: number): number => {
      const alt = errorVariant(at.toks[i], tokenClass(at.toks[i]));
      const id = alt === undefined ? -1 : toks.indexOf(alt);
      return id >= 0 && al ? siteLLR(lp, T, at.ids, al, i, id) : NaN;
    };
    const qprobe = enc && al ? (i: number): number => qprobeScore(enc, T, al.start[i], QPROBE as never) : undefined;
    const qmid = enc && al ? (i: number): number => qprobeScore(enc, T, al.start[i], QMID as never) : undefined;
    const issues = al ? judge(measure(al, at), refAyah, { llr, at, qprobe, qmid, munfasil }) : [];
    stats.push(performance.now() - t0);
    const words = corpus.surahs[s - 1].ayahs[a - 1].w;
    const list = issues.map((x) => ({ ...x, s, a, text: words[x.w]?.[2] ?? "" }));
    const prev = found.get(key);
    if (list.length) found.set(key, list);
    else found.delete(key);
    paint();
    if (list.length) open(key);
    else if (prev?.length && cardKey === key) close();
    (window as unknown as { __tj?: unknown }).__tj = { stats, encChecks, skips, found: [...found.values()].flat() };
  }

  function paint(): void {
    host.sheet.querySelectorAll<HTMLElement>(".w.tj").forEach((el) => {
      el.classList.remove("tj");
      el.removeAttribute("data-tjn");
      el.style.removeProperty("--tjc");
    });
    for (const list of found.values()) {
      list.forEach((x, n) => {
        const el = host.sheet.querySelector<HTMLElement>(`.w[data-k="${x.s}:${x.a}:${x.w}"]`);
        if (!el || el.classList.contains("tj")) return;
        el.classList.add("tj");
        el.dataset.tjn = String(n + 1);
        el.style.setProperty("--tjc", COLOR[x.kind]);
      });
    }
    const total = [...found.values()].reduce((n, l) => n + l.length, 0);
    chip.textContent = t("tj.chip", { n: total });
    if (!total) chip.hidden = true;
  }

  function quiet(text: string): void {
    if (!card.hidden && !collapsed) return;
    chip.hidden = false;
    chip.classList.add("muted");
    chip.textContent = text;
    window.setTimeout(() => {
      chip.classList.remove("muted");
      paint();
    }, 3500);
  }

  function open(key: string): void {
    const list = found.get(key);
    if (!list?.length) return;
    const [s, a] = key.split(":").map(Number);
    cardKey = key;
    cardShownAt = performance.now();
    collapsed = false;
    chip.hidden = true;
    card.replaceChildren();
    const grab = document.createElement("div");
    grab.className = "tj-grab";
    const head = document.createElement("div");
    head.className = "tj-ch";
    head.replaceChildren();
    const hb = document.createElement("b");
    hb.textContent = t("tj.head", { a });
    const hn = document.createElement("span");
    hn.textContent = t("tj.count", { n: list.length });
    head.append(hb, hn);
    card.append(grab, head);
    list.forEach((x, n) => {
      const row = document.createElement("div");
      row.className = "tj-it";
      row.style.setProperty("--tjc", COLOR[x.kind]);
      const num = document.createElement("span");
      num.className = "tj-num";
      num.textContent = String(n + 1);
      const ar = document.createElement("span");
      ar.className = "tj-ar";
      ar.textContent = x.text;
      const mid = document.createElement("div");
      mid.className = "tj-mid";
      const b = document.createElement("b");
      b.textContent = x.type === "long" ? t("tj.label.long") : LABEL(x.kind);
      const d = document.createElement("div");
      d.textContent = explain(x);
      mid.append(b, d);
      row.append(num, ar, mid);
      card.append(row);
    });
    const act = document.createElement("div");
    act.className = "tj-act";
    const again = document.createElement("button");
    again.type = "button";
    again.textContent = t("tj.again");
    again.addEventListener("click", () => {
      found.delete(key);
      done.delete(key);
      starts.delete(key);
      paint();
      close();
      host.retryAyah(s, a);
    });
    const go = document.createElement("button");
    go.type = "button";
    go.className = "pri";
    go.textContent = t("tj.go");
    go.addEventListener("click", () => collapse());
    act.append(again, go);
    const note = document.createElement("div");
    note.className = "tj-dis";
    note.textContent = t("tj.note");
    card.append(act, note);
    card.hidden = false;
  }
  function collapse(): void {
    card.hidden = true;
    collapsed = true;
    paint();
    if ([...found.values()].some((l) => l.length)) chip.hidden = false;
  }
  function close(): void {
    card.hidden = true;
    collapsed = false;
    cardKey = "";
  }
  chip.addEventListener("click", () => {
    if (chip.classList.contains("muted")) return;
    const keys = [...found.keys()];
    if (keys.length) open(keys[keys.length - 1]);
  });
  host.sheet.addEventListener("click", (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>(".w.tj");
    if (!el) return;
    const [s, a] = (el.dataset.k || "").split(":");
    open(`${s}:${a}`);
  });

  return {
    attach,
    newTake,
    dropped,
    heard,
    ayahDone,
    paint,
    /** Redraw the chip and an open card in the current UI language. */
    relabel() {
      paint();
      if (!card.hidden && !collapsed && cardKey) open(cardKey);
    },
    get on() {
      return on;
    },
    setMunfasil(n: 2 | 4) {
      munfasil = n;
      const w = window as unknown as { __tj?: Record<string, unknown> };
      w.__tj = { ...(w.__tj || {}), munfasil: n };
    },
    set(v: boolean) {
      on = v;
      host.root.classList.toggle("tj-mode", v);
      if (!v) {
        found.clear();
        paint();
        close();
        chip.hidden = true;
      }
    },
    clear() {
      found.clear();
      paint();
      close();
      chip.hidden = true;
    },
    prefetch(p: number) {
      if (on) void refPage(p);
    },
  };
}
