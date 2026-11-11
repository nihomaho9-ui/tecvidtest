// Çətin tajwid check (madd, ghunna, ikhfa, qalqala, waqf) plus Sərt/Çətin letter-pronunciation GOP.
// Duration rules use Husary's page reference (public/tj/<page>.json). Letter flags do not need it.
import { CLASSES, ayahTokens, alignAyah, measure, judge, setEquivalence, errorVariant, siteLLR, tokenClass, qprobeScore, findStops, WAQF, type TjIssue } from "./tajwid-core.js";
import QPROBE from "./tajwid-qprobe.json";
import QMID from "./tajwid-qmid.json";
import THRESHOLDS_JSON from "./letter-gop-thresholds.json";
import { buildIndex, scoreAyah, judgeLetterRows, type LetterIndex, type LetterIssue, type LetterThresholds } from "./letter-gop.js";
const THRESHOLDS = THRESHOLDS_JSON as LetterThresholds;
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
  reset?: () => void;
  __tj?: boolean;
};
// Wrong-stop (waqf) note: the stop word and whether the reader went back (soft) or carried on.
type WaqfIssue = { i: number; w: number; kind: "waqf"; sub: "waqf" | "waqf-soft"; type?: string; r: number; rRef: null };
type Note = TjIssue | WaqfIssue | LetterIssue;
const ENC = 512;
export type TjFound = Note & { s: number; a: number; text: string };

const COLOR: Record<string, string> = { madd: "#0e8a7d", ghunna: "#7a4cc8", ikhfa: "#d9731a", qalqala: "#2a6fb0", waqf: "#c0392b", letter: "#a15b2e" };
const LABEL = (kind: string, sub?: string): string => {
  if (kind === "letter") {
    if (sub === "qalqala") return t("tj.label.qalqala");
    if (sub === "ghunna") return t("tj.label.letterGhunna");
    if (sub === "ikhfa") return t("tj.label.letterIkhfa");
    if (sub === "extra-ghunna") return t("tj.label.extraGhunna");
    return t("tj.label.letter");
  }
  return t(
    kind === "waqf"
      ? "tj.label.waqf"
      : kind === "ghunna"
        ? "tj.label.ghunna"
        : kind === "ikhfa"
          ? "tj.label.ikhfa"
          : kind === "qalqala"
            ? "tj.label.qalqala"
            : "tj.label.madd",
  );
};
const RING = 25 * 240; // 4 minutes of decoder frames

// Mark substituted for {w} so the Uthmani word can be inserted as a bidi-isolated span (Amiri Quran),
// not mixed as plain text (which can look garbled in a Latin-script sentence).
const WORD_MARK = "\uFFF0";

function bareLetter(tok?: string): string {
  if (!tok) return "";
  const m = tok.match(/[ءاأببتثجحخدذرزسشصضطظعغفقكلمنهوي]/);
  return m ? m[0] : tok;
}
function explain(x: Note, w = ""): string {
  const vars: Record<string, string> = { h: "", w, exp: "", heard: "" };
  if (x.kind === "letter") {
    vars.exp = bareLetter((x as LetterIssue).expected);
    vars.heard = bareLetter((x as LetterIssue).heard);
    if (x.sub === "qalqala") return t("tj.letterQalqala", vars);
    if (x.sub === "ghunna") return t("tj.letterGhunna", vars);
    if (x.sub === "ikhfa") return t("tj.letterIkhfa", vars);
    if (x.sub === "extra-ghunna") return t("tj.letterExtraGhunna", vars);
    return t("tj.letter", vars);
  }
  if (x.kind === "waqf") return t(x.sub === "waqf-soft" ? "tj.waqfSoft" : "tj.waqf", vars);
  vars.h = t(x.r < 1.35 ? "tj.heard2" : "tj.heardShort");
  if (x.type === "long") return t("tj.long", vars);
  if (x.sub === "madd6") return t("tj.lazim", vars);
  if (x.type === "munfasil") return t("tj.munfasil", vars);
  if (x.type === "muttasil") return t("tj.muttasil", vars);
  if (x.kind === "madd") return t("tj.madd", vars);
  if (x.sub === "qalqala-mid") return t("tj.qmid", vars);
  if (x.kind === "qalqala") return t("tj.qfinal", vars);
  if (x.kind === "ghunna") return t("tj.ghunna", vars);
  return t("tj.ikhfa", vars);
}

function appendExplain(el: HTMLElement, x: Note & { text: string }): void {
  const bits = explain(x, WORD_MARK).split(WORD_MARK);
  bits.forEach((bit, i) => {
    if (i && x.text) {
      const w = document.createElement("span");
      w.className = "tj-w";
      w.dir = "rtl";
      w.lang = "ar";
      w.textContent = x.text;
      el.append(w);
    }
    if (bit) el.append(bit);
  });
}

export interface TajwidHost {
  root: HTMLElement;
  sheet: HTMLElement;
  asset: (p: string) => string;
  pageOf: (s: number, a: number) => number | undefined;
  retryAyah: (s: number, a: number) => void;
  hasClip: (s: number, a: number) => boolean;
  playMine: (s: number, a: number) => void;
}

export function createTajwid(host: TajwidHost) {
  let onTajwid = false;
  let onLetters = false;
  let letterIndex: LetterIndex | null = null;
  const active = (): boolean => onTajwid || onLetters;
  let munfasil: 2 | 4 = 4; // madd munfasil length the reciter follows: 2 (qasr) or 4–5 counts
  let core: Core | null = null;
  let corpus: Corpus | null = null;
  const ring = new Float32Array(RING * CLASSES);
  const encRing = new Float32Array(RING * ENC); // encoder rows for the qalqala probe
  const encOk = new Uint8Array(RING);
  const loudRing = new Float32Array(RING); // per decoder frame: loudest fbank frame (mean log-mel) of its 4
  let fbPend: number[] = []; // fbank loudness not yet paired with a decoder frame (since the runner's last reset)
  let waqf: Promise<string[][] | null> | null = null; // allowed-stop table: t[s-1][a-1] = "7j,15s"
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
  let lastKey = "";
  let noted = 0;
  const stats: number[] = [];
  const wq: unknown[] = []; // wrong-stop debug (window.__tj.wq)
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
  function waqfTable(): Promise<string[][] | null> {
    waqf ??= fetch(host.asset("tj/waqf.json"))
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { t?: string[][] } | null) => j?.t ?? null)
      .catch(() => null);
    return waqf;
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
    letterIndex = buildIndex(c.TOKENS);
    corpus = corp as Corpus;
    const runner = (zip as { runner?: Runner } | null)?.runner;
    if (!runner || runner.__tj) return;
    runner.__tj = true;
    const accept = runner.accept.bind(runner);
    if (runner.reset) {
      const reset = runner.reset.bind(runner);
      runner.reset = () => {
        fbPend = [];
        reset();
      };
    }
    runner.accept = async (fr) => {
      for (const f of fr) {
        let sum = 0;
        for (let i = 0; i < f.length; i += 1) sum += f[i];
        fbPend.push(f.length ? sum / f.length : -Infinity);
      }
      const out = await accept(fr);
      const n = out.frames || 0;
      const enc = out.encoder && out.encoderFrames === n && out.encoder.length >= n * ENC ? out.encoder : null;
      for (let t = 0; t < n; t += 1) {
        const slot = (frames + t) % RING;
        ring.set(out.logProbs.subarray(t * CLASSES, (t + 1) * CLASSES), slot * CLASSES);
        encOk[slot] = enc ? 1 : 0;
        if (enc) encRing.set(enc.subarray(t * ENC, (t + 1) * ENC), slot * ENC);
        let m = -Infinity; // decoder frame t covers fbank frames 4t..4t+3
        for (const v of fbPend.splice(0, 4)) if (v > m) m = v;
        loudRing[slot] = m;
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
    if (!active()) return;
    const key = `${s}:${a}`;
    if (!starts.has(key)) starts.set(key, frames);
  }

  function ayahDone(s: number, a: number): void {
    if (!active() || !core || !corpus) return;
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
    const ref = onTajwid && p ? await refPage(p) : null;
    const refAyah = ref?.ayahs.find((x) => x.s === s && x.a === a);
    if (onTajwid && !refAyah) {
      skip("noref");
      if (p && noted !== p) {
        noted = p;
        if (!onLetters) quiet(t("tj.noData"));
      }
      if (!onLetters) return;
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
    const issues: Note[] = [];
    if (onTajwid && al && refAyah) issues.push(...judge(measure(al, at), refAyah, { llr, at, qprobe, qmid, munfasil }));
    const table = onTajwid && al ? await waqfTable() : null;
    if (onTajwid && al && table) {
      // wrong stop: a pause mid-ayah where no waqf mark (or Husary's own pause) allows one
      const marks: Record<number, string> = {};
      for (const x of (table[s - 1]?.[a - 1] || "").split(",")) {
        const m = /^(\d+)(\D+)$/.exec(x);
        if (m) marks[+m[1]] = m[2];
      }
      const loud = new Float32Array(T);
      for (let t = 0; t < T; t += 1) loud[t] = loudRing[(begin + t) % RING];
      const dbg: unknown[] = [];
      const stops = findStops(lp, T, loud, at, al, marks, { ...WAQF, debug: dbg } as typeof WAQF);
      wq.push({ key, T, from: al.from, to: al.to, stops, d: dbg[0] ?? null });
      if (wq.length > 40) wq.shift();
      for (const x of stops)
        issues.push({ i: -1, w: x.w, kind: "waqf", sub: x.soft ? "waqf-soft" : "waqf", type: "waqf", r: 1, rRef: null });
    }
    if (onLetters && al && letterIndex && measure(al, at).poor <= 0.15) {
      issues.push(...judgeLetterRows(scoreAyah(lp, T, at, al, letterIndex), THRESHOLDS));
    }
    issues.sort((x, y) => x.w - y.w);
    stats.push(performance.now() - t0);
    const words = corpus.surahs[s - 1].ayahs[a - 1].w;
    // words[i] = [QCF glyphs, phoneme spelling, Uthmani]. Only [2] is shown on the card.
    const list = issues.map((x) => ({ ...x, s, a, text: words[x.w]?.[2] ?? "" }));
    const prev = found.get(key);
    if (list.length) found.set(key, list);
    else found.delete(key);
    if (list.length) lastKey = key;
    else if (lastKey === key) lastKey = [...found.keys()].pop() ?? "";
    paint();
    if (list.length) {
      if (!card.hidden && !collapsed) {
        if (cardKey === key) open(key);
        else head();
      } else pulse();
    } else if (prev?.length && cardKey === key) close();
    (window as unknown as { __tj?: unknown }).__tj = { stats, encChecks, skips, wq, found: [...found.values()].flat() };
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
    else if (card.hidden && !chip.classList.contains("muted")) chip.hidden = false;
  }
  function pulse(): void {
    if (!card.hidden && !collapsed) return;
    chip.hidden = false;
    chip.classList.remove("new");
    void chip.offsetWidth;
    chip.classList.add("new");
  }
  // Ayahs with notes in mushaf order, for the ‹ › switch in the card.
  function noteKeys(): string[] {
    return [...found.keys()]
      .filter((k) => found.get(k)?.length)
      .sort((x, y) => {
        const [s1, a1] = x.split(":").map(Number);
        const [s2, a2] = y.split(":").map(Number);
        return s1 - s2 || a1 - a2;
      });
  }
  let headEl: HTMLElement | null = null;
  function head(): void {
    if (!headEl || !cardKey) return;
    const keys = noteKeys();
    const at = keys.indexOf(cardKey);
    const nav = headEl.querySelector<HTMLElement>(".tj-nav");
    if (!nav) return;
    nav.hidden = keys.length < 2;
    nav.querySelector(".tj-pos")!.textContent = `${at + 1}/${keys.length}`;
    (nav.querySelector(".tj-prev") as HTMLButtonElement).disabled = at <= 0;
    (nav.querySelector(".tj-next") as HTMLButtonElement).disabled = at < 0 || at >= keys.length - 1;
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
    const top = document.createElement("div");
    top.className = "tj-ch";
    const hb = document.createElement("b");
    hb.textContent = t("tj.head", { a });
    const hn = document.createElement("span");
    hn.textContent = t("tj.count", { n: list.length });
    const nav = document.createElement("span");
    nav.className = "tj-nav";
    const mk = (cls: string, label: string, txt: string, step: number) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = cls;
      btn.textContent = txt;
      btn.setAttribute("aria-label", t(label));
      btn.addEventListener("click", () => {
        const keys = noteKeys();
        const next = keys[keys.indexOf(cardKey) + step];
        if (next) open(next);
      });
      return btn;
    };
    const pos = document.createElement("span");
    pos.className = "tj-pos";
    const rtl = host.root.classList.contains("ui-rtl");
    nav.append(mk("tj-prev", "tj.prev", rtl ? "›" : "‹", -1), pos, mk("tj-next", "tj.next", rtl ? "‹" : "›", 1));
    const right = document.createElement("span");
    right.className = "tj-chr";
    right.append(hn, nav);
    top.append(hb, right);
    card.append(grab, top);
    headEl = top;
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
      b.textContent = x.type === "long" ? t("tj.label.long") : x.sub === "waqf-soft" ? t("tj.label.waqfSoft") : LABEL(x.kind, x.sub);
      const d = document.createElement("div");
      appendExplain(d, x);
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
    if (host.hasClip(s, a)) {
      const mine = document.createElement("button");
      mine.type = "button";
      mine.className = "tj-mine";
      mine.textContent = t("tj.mine");
      mine.addEventListener("click", () => host.playMine(s, a));
      act.append(mine);
    }
    act.append(again, go);
    const note = document.createElement("div");
    note.className = "tj-dis";
    note.textContent = t("tj.note");
    card.append(act, note);
    card.hidden = false;
    head();
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
    chip.classList.remove("new");
    const keys = noteKeys();
    const key = lastKey && found.get(lastKey)?.length ? lastKey : keys[keys.length - 1];
    if (key) open(key);
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
      return active();
    },
    setMunfasil(n: 2 | 4) {
      munfasil = n;
      const w = window as unknown as { __tj?: Record<string, unknown> };
      w.__tj = { ...(w.__tj || {}), munfasil: n };
    },
    set(v: boolean) {
      // Backward-compatible: v enables Çətin (tajwid + letters). Use setMode for Sərt.
      this.setMode({ tajwid: v, letters: v });
    },
    setMode(opts: { tajwid?: boolean; letters?: boolean }) {
      if (opts.tajwid !== undefined) onTajwid = opts.tajwid;
      if (opts.letters !== undefined) onLetters = opts.letters;
      host.root.classList.toggle("tj-mode", active());
      if (!active()) {
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
      if (!onTajwid) return;
      void refPage(p);
      void waqfTable();
    },
  };
}
