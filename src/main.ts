import "./tartil.css";
import { createTajwid } from "./tajwid";
import { LANGS, applyI18n, getLang, isRtl, onLang, setLang, surahName, t, type Lang } from "./i18n";

let delayMin = 400;
let delayStep = 30;
let delayCap = 120;

type PageFile = { lines: string[]; wlens: number[][]; runs: [string, number][]; prev14: boolean };
type IndexFile = { v: number; pages: number[][][]; ayahs: number[]; words: number[][] };
type FeedSession = {
  feed: (pcm: Float32Array) => Promise<unknown>;
  stop: () => Promise<unknown>;
  reset: () => void;
  zipformer: {
    setMode: (mode: "tracking" | "correction") => unknown;
    setExpected: (passage: { surah: number; ayah: number; ayahEnd?: number } | null) => void;
    setStructural: (opts: { ayahOrder?: boolean; similarVerse?: boolean; timing?: "stop" | "pause" }) => Promise<void>;
    setSlipHead: (mode: false | "strict" | "high") => void;
    correct: (action: "review_later" | "retry" | "continue") => unknown;
    verdicts: () => Verdict[];
    correction: { state: { phase?: string }; suppressed?: { delete: (wordIndex: number) => void }; thresholds?: Record<string, number> };
  } | null;
};
type Issue = { surah?: number; ayah?: number; word?: number; kind?: string; wordIndex?: number; source?: string };
type Verdict = { surah: number; ayah: number; word: number; state: string; distance: number; heardRatio: number; margin: number };
type ProgressMsg = {
  type: string;
  surah?: number;
  ayah?: number;
  word_index?: number;
  matched_indices?: number[];
  issue?: Issue;
  state?: { phase?: string; issue?: Issue | null };
};
type Miss = { s: number; a: number; w: number; kind: string; n: number; t: number };
const MISS_KEY = "tartil.misses";
const KINDS = ["possible_omission", "possible_substitution", "possible_vowel", "possible_repetition", "possible_skipped_ayah", "unclear_ayah"] as const;
function kindName(kind: string): string {
  return (KINDS as readonly string[]).includes(kind) ? t(`kind.${kind}` as Parameters<typeof t>[0]) : t("kind.error");
}
const wordAt = (w: number): string => (w >= 0 ? t("word", { w: w + 1 }) : "");

const BASE = import.meta.env.BASE_URL || "/";
const QCF = "https://mushafuk.online/yazi-fonts/qcf/";
const BISM = "\uFC41\uFC42\uFC43\uFC44";
const STARTS =
  "1:1:2,2:2:3,3:50:3,4:77:2,5:106:8,6:128:3,7:151:3,8:177:3,9:187:2,10:208:2,11:221:9,12:235:11,13:249:3,14:255:5,15:262:3,16:267:9,17:282:3,18:293:12,19:305:3,20:312:7,21:322:3,22:332:2,23:342:2,24:350:2,25:359:13,26:367:2,27:377:2,28:385:10,29:396:10,30:404:12,31:411:3,32:415:2,33:418:2,34:428:3,35:434:10,36:440:6,37:446:2,38:453:2,39:458:6,40:467:5,41:477:3,42:483:3,43:489:7,44:496:3,45:499:2,46:502:9,47:507:2,48:511:3,49:515:9,50:518:3,51:520:14,52:523:10,53:526:2,54:528:12,55:531:7,56:534:9,57:537:13,58:542:3,59:545:9,60:549:2,61:551:9,62:553:3,63:554:9,64:556:2,65:558:2,66:560:3,67:562:3,68:564:8,69:566:12,70:568:11,71:570:7,72:572:3,73:574:3,74:575:10,75:577:8,76:578:12,77:580:9,78:582:3,79:583:10,80:585:2,81:586:4,82:587:3,83:587:14,84:589:5,85:590:4,86:591:3,87:591:12,88:592:7,89:593:5,90:594:8,91:595:4,92:595:13,93:596:8,94:596:15,95:597:5,96:597:11,97:598:6,98:598:11,99:599:8,100:599:14,101:600:6,102:600:13,103:601:3,104:601:7,105:601:13,106:602:3,107:602:8,108:602:14,109:603:3,110:603:8,111:603:13,112:604:3,113:604:7,114:604:12";

const heads: Record<number, Record<number, number>> = {};
const bisLines: Record<number, Record<number, boolean>> = {};
const stackLines: Record<number, Record<number, boolean>> = {};
for (const item of STARTS.split(",")) {
  const [id, pg, line] = item.split(":").map(Number);
  if (id === 1 || id === 9) (heads[pg] ??= {})[Math.max(0, line - 2)] = id;
  else if (line >= 3) {
    (heads[pg] ??= {})[line - 3] = id;
    (bisLines[pg] ??= {})[line - 2] = true;
  } else {
    (heads[pg] ??= {})[0] = id;
    (stackLines[pg] ??= {})[0] = true;
  }
}
const loadedFonts = new Set<number>();
const fontLoads = new Map<number, Promise<void>>();
let namesReady: Promise<void> | null = null;

function asset(path: string): string {
  const rel = BASE + path.replace(/^\//, "");
  if (typeof document === "undefined") return rel;
  const rootUrl = new URL(document.baseURI);
  if (!rootUrl.pathname.endsWith("/")) {
    const last = rootUrl.pathname.split("/").pop() || "";
    if (!last.includes(".")) rootUrl.pathname += "/";
  }
  return new URL(rel, rootUrl).href;
}

const LANDSCAPE_PHONE = "(orientation: landscape) and (max-height: 520px)";

function clampPage(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(604, Math.max(1, Math.round(n)));
}

const pageFiles = new Map<number, PageFile>();
const pageJobs = new Map<number, Promise<PageFile>>();
const wordCountOf = new Map<string, number>();
let pageIndex: IndexFile | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url);
  return res.json() as Promise<T>;
}

async function loadPageIndex(): Promise<IndexFile> {
  if (pageIndex) return pageIndex;
  const idx = await fetchJson<IndexFile>(asset("pg/index.json"));
  idx.pages.forEach((ayahs, i) => {
    const counts = idx.words[i] ?? [];
    ayahs.forEach((pair, j) => {
      const s = pair[0] ?? 0;
      const a = pair[1] ?? 0;
      if (s && a) wordCountOf.set(`${s}:${a}`, counts[j] ?? wordCountOf.get(`${s}:${a}`) ?? 0);
    });
  });
  pageIndex = idx;
  return idx;
}

async function loadPageFile(n: number): Promise<PageFile> {
  const hit = pageFiles.get(n);
  if (hit) return hit;
  const pending = pageJobs.get(n);
  if (pending) return pending;
  const job = fetchJson<PageFile>(asset(`pg/${clampPage(n)}.json`))
    .then((data) => {
      pageFiles.set(clampPage(n), data);
      return data;
    })
    .finally(() => pageJobs.delete(clampPage(n)));
  pageJobs.set(clampPage(n), job);
  return job;
}

function precacheUrls(urls: string[]): void {
  if (!urls.length || !("serviceWorker" in navigator)) return;
  const send = (reg?: ServiceWorker | null) => reg?.postMessage({ type: "precache", urls });
  send(navigator.serviceWorker.controller);
  void navigator.serviceWorker.ready.then((r) => send(r.active)).catch(() => undefined);
}

export function mountTartil(root: HTMLElement, opts?: { hash?: boolean }): () => void {
  const hashMode = opts?.hash === true;
  // Ayahs per page follow the drawn Madinah layout so recitation and jumps match what is on screen.
  let pages: number[][][] = Array.from({ length: 604 }, () => []);
  const pageOf = new Map<string, number>();
  const surahPage = new Map<number, number>();
  let page = 1;
  let pickedSurah = 0;
  let alive = true;
  let micOn = false;
  let loadingModel = false;
  let session: FeedSession | null = null;
  let expectedSurah = 0;
  let retryKey = "";
  let ayahLock = "";
  let lockDirty = false;
  let rearm = false;
  let settling = false;
  let wake: WakeLockSentinel | null = null;
  let heard = 0;
  let takeMisses: Miss[] = [];
  // Ayahs whose words were already checked once the reciter moved on to the next ayah.
  const ayahChecked = new Set<string>();
  let retryClose = false;
  let audioStop: (() => Promise<void>) | null = null;
  let settlingMic: Promise<void> = Promise.resolve();
  let opening = false;
  const shown = new Set<string>();
  const timers = new Map<string, number>();
  let freshKey = "";

  root.className = "tartil";
  root.innerHTML = `
    <header class="t-top">
      <button type="button" class="t-ico t-turn t-next" data-i18n-aria="nav.next" data-i18n-title="nav.next">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
      </button>
      <button type="button" class="t-ico t-surah-btn" aria-haspopup="dialog" aria-expanded="false" data-i18n-aria="nav.title" data-i18n-title="nav.title">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4z"/><path d="M5 4a3 3 0 0 0-3 3v13"/></svg>
      </button>
      <button type="button" class="t-missbtn" aria-expanded="false" data-i18n-aria="miss.btn">0</button>
      <button type="button" class="t-ico t-turn t-prev" data-i18n-aria="nav.prev" data-i18n-title="nav.prev">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <button type="button" class="t-more" aria-expanded="false" aria-haspopup="dialog" data-i18n-title="set.title">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </header>
    <div class="t-sheet" hidden>
      <div class="t-sheet-box" role="dialog" aria-modal="true" data-i18n-aria="set.title">
        <div class="t-sheet-h"><b data-i18n="set.title"></b><button type="button" class="t-sheet-x" data-i18n="close"></button></div>
        <label class="t-set"><span data-i18n="lang"></span><select class="t-lang" data-i18n-aria="lang"></select></label>
        <div class="t-set"><span data-i18n="sense"></span><div class="t-seg" data-set="sense"><button type="button" data-v="normal" aria-pressed="false" data-i18n="sense.normal"></button><button type="button" data-v="sert" aria-pressed="false" data-i18n="sense.sert"></button><button type="button" data-v="cetin" aria-pressed="false" data-i18n="sense.cetin"></button></div></div>
        <p class="t-hint t-sense-hint"></p>
        <div class="t-set"><span><span data-i18n="madd"></span> <small class="t-madd-only"></small></span><div class="t-seg" data-set="madd"><button type="button" data-v="4" aria-pressed="false" data-i18n="madd.4"></button><button type="button" data-v="2" aria-pressed="false" data-i18n="madd.2"></button></div></div>
        <div class="t-set"><span data-i18n="hifz"></span><div class="t-seg" data-set="hifz"><button type="button" data-v="0" aria-pressed="false" data-i18n="off"></button><button type="button" data-v="1" aria-pressed="false" data-i18n="on"></button></div></div>
        <div class="t-set"><span data-i18n="speed"></span><div class="t-seg" data-set="speed"><button type="button" data-v="orta" aria-pressed="false" data-i18n="speed.orta"></button><button type="button" data-v="tez" aria-pressed="false" data-i18n="speed.tez"></button></div></div>
        <div class="t-set"><span data-i18n="theme"></span><div class="t-seg" data-set="theme"><button type="button" data-v="cream" aria-pressed="false" data-i18n="theme.cream"></button><button type="button" data-v="white" aria-pressed="false" data-i18n="theme.white"></button><button type="button" data-v="black" aria-pressed="false" data-i18n="theme.black"></button></div></div>
        <label class="t-set t-microw" hidden><span data-i18n="mic"></span><select class="t-micpick" data-i18n-aria="mic"></select></label>
        <div class="t-acts">
          <button type="button" class="t-act t-mine" hidden><span data-i18n="mine"></span> <small class="t-mine-p"></small></button>
          <button type="button" class="t-act t-back" hidden data-i18n="back"></button>
        </div>
        <p class="t-today"></p>
        <p class="t-about"><b>Quran Tasheeh</b> · <span data-i18n="foot"></span></p>
      </div>
    </div>
    <div class="t-sheet t-nav" hidden>
      <div class="t-sheet-box" role="dialog" aria-modal="true" data-i18n-aria="nav.title">
        <div class="t-sheet-h"><b data-i18n="nav.title"></b><button type="button" class="t-sheet-x t-nav-x" data-i18n="close"></button></div>
        <label class="t-set"><span data-i18n="nav.surah"></span><select class="t-surah" data-i18n-aria="nav.surah"></select></label>
        <form class="t-set t-goform"><span data-i18n="nav.page"></span><span class="t-go"><input class="t-pageno" type="number" min="1" max="604" inputmode="numeric" enterkeyhint="go" data-i18n-aria="nav.page" /><button type="submit" class="t-gobtn" data-i18n="nav.go"></button></span></form>
      </div>
    </div>
    <div class="t-pnum" aria-live="polite"></div>
    <p class="t-fontfail" hidden role="status"></p>
    <main class="t-page" dir="rtl"></main>
    <p class="t-foot"><span data-i18n="foot"></span></p>
    <div class="t-bar">
      <button type="button" class="t-mic" aria-pressed="false" data-i18n-aria="mic">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>
      </button>
      <div class="t-status" aria-live="polite" aria-atomic="true">
        <b class="t-st"></b>
        <span class="t-sub"></span>
        <div class="t-load" aria-hidden="true"><i></i></div>
        <div class="t-level" aria-hidden="true"><i></i></div>
      </div>
    </div>
    <div class="t-miss" hidden>
      <div class="t-miss-h"><b data-i18n="miss.title"></b><span><button type="button" class="t-miss-go" data-i18n="miss.fix"></button><button type="button" class="t-miss-clear" data-i18n="miss.clear"></button></span></div>
      <div class="t-miss-list"></div>
    </div>
    <div class="t-sum" hidden>
      <div class="t-sum-h"><b data-i18n="sum.title"></b><button type="button" class="t-sum-ok" data-i18n="close"></button></div>
      <p class="t-sum-n"></p>
      <ul class="t-sum-list"></ul>
    </div>`;

  if (!hashMode) {
    const foot = root.querySelector(".t-foot");
    if (foot) {
      foot.appendChild(document.createTextNode(" "));
      const link = document.createElement("a");
      link.href = "/axtaris";
      link.dataset.i18n = "search";
      link.textContent = t("search");
      foot.appendChild(link);
    }
  }
  function need<T extends Element>(sel: string): T {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(sel);
    return el;
  }
  applyI18n(root);
  const surahSel = need<HTMLSelectElement>(".t-surah");
  const pageInput = need<HTMLInputElement>(".t-pageno");
  const pnumEl = need<HTMLElement>(".t-pnum");
  // Page number as plain text under the page, like a printed mushaf (Arabic-Indic digits for the Arabic UI).
  function paintPageNo(): void {
    const n = Number(pageInput.value) || 0;
    pnumEl.textContent = n ? (isRtl() ? n.toLocaleString("ar-EG", { useGrouping: false }) : String(n)) : "";
  }
  const pageEl = need<HTMLElement>(".t-page");
  const sheet = pageEl;
  const tj = createTajwid({
    root,
    sheet,
    asset,
    pageOf: (s, a) => pageOf.get(`${s}:${a}`),
    retryAyah: (s, a) => void retryTajwid(s, a),
    hasClip: (s, a) => hasClip(s, a),
    playMine: (s, a) => void playMine(s, a),
  });
  const micBtn = need<HTMLButtonElement>(".t-mic");
  const st = need<HTMLElement>(".t-st");
  const sub = need<HTMLElement>(".t-sub");
  const loadBar = need<HTMLElement>(".t-load");
  const loadFill = need<HTMLElement>(".t-load i");
  const levelBar = need<HTMLElement>(".t-level");
  const levelFill = need<HTMLElement>(".t-level i");
  const sumBox = need<HTMLElement>(".t-sum");
  const sumN = need<HTMLElement>(".t-sum-n");
  const sumList = need<HTMLElement>(".t-sum-list");
  const missBtn = need<HTMLButtonElement>(".t-missbtn");
  // One settings sheet (☰) instead of a row of icons: every option has a text label.
  const moreBtn = need<HTMLButtonElement>(".t-more");
  const setSheet = need<HTMLElement>(".t-sheet");
  function setSeg(group: string, value: string): void {
    setSheet.querySelectorAll<HTMLButtonElement>(`.t-seg[data-set="${group}"] button`).forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.v === value ? "true" : "false");
    });
  }
  function closeSheet(): void {
    if (setSheet.hidden) return;
    setSheet.hidden = true;
    moreBtn.setAttribute("aria-expanded", "false");
    moreBtn.classList.remove("on");
  }
  function focusables(box: HTMLElement): HTMLElement[] {
    return [...box.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      .filter((el) => !el.disabled && !el.closest("[hidden]") && el.getAttribute("aria-hidden") !== "true");
  }
  function trapFocus(box: HTMLElement, ev: KeyboardEvent): void {
    if (box.hidden || ev.key !== "Tab") return;
    const nodes = focusables(box);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  }
  moreBtn.addEventListener("click", () => {
    if (!setSheet.hidden) {
      closeSheet();
      return;
    }
    root.querySelector(".t-nav")?.setAttribute("hidden", "");
    root.querySelector(".t-surah-btn")?.setAttribute("aria-expanded", "false");
    setSheet.hidden = false;
    moreBtn.setAttribute("aria-expanded", "true");
    moreBtn.classList.add("on");
    setSheet.querySelector<HTMLButtonElement>(".t-sheet-x")?.focus();
  });
  setSheet.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t === setSheet || t.closest(".t-sheet-x") || t.closest(".t-mine, .t-back")) closeSheet();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
    trapFocus(setSheet, e);
  });
  const missBox = need<HTMLElement>(".t-miss");
  const missList = need<HTMLElement>(".t-miss-list");
  let misses: Miss[] = [];
  const strikes = new Map<string, number>();
  const warns = new Set<string>();
  let sense: "normal" | "sert" | "cetin" = "normal";
  let lastHeardS = 0;
  let lastHeardA = 0;
  let hifz = false;
  let queueOn = false;
  // The user's own voice: a rolling ring of mic audio, cut into one clip per finished ayah (kept in memory only).
  const CLIP_RING = 16000 * 90;
  const micRing = new Float32Array(CLIP_RING);
  let micPos = 0;
  let clipMark = 0;
  const clips = new Map<string, Float32Array>();
  let lastClip = "";
  let quietStop = false;
  let playGen = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(MISS_KEY) || "[]") as Miss[];
    if (Array.isArray(saved)) misses = saved.filter((m) => m && m.s && m.a);
  } catch {
    misses = [];
  }
  try {
    const raw = JSON.parse(localStorage.getItem("tartil.strikes") || "{}") as Record<string, number>;
    Object.entries(raw).forEach(([key, n]) => {
      if (n > 0) strikes.set(key, n);
    });
    {
      const saved = localStorage.getItem("tartil.sense");
      if (saved === "sert" || saved === "cetin") sense = saved;
    }
    hifz = localStorage.getItem("tartil.hifz") === "1";
  } catch {
    /* ignore */
  }
  if (hifz) root.classList.add("hifz");
  function saveStrikes(): void {
    try {
      localStorage.setItem("tartil.strikes", JSON.stringify(Object.fromEntries([...strikes].slice(-300))));
    } catch {
      /* ignore quota */
    }
  }

  function saveMisses(): void {
    try {
      localStorage.setItem(MISS_KEY, JSON.stringify(misses.slice(-200)));
    } catch {
      /* ignore quota */
    }
  }

  function paintMisses(): void {
    tj.paint();
    const rank: Record<string, number> = { "err-skip": 4, "err-miss": 3, "err-repeat": 2, "err-vowel": 1 };
    const mark = new Map<string, string>();
    const put = (key: string, cls: string) => {
      const prev = mark.get(key);
      if (!prev || rank[cls] > rank[prev]) mark.set(key, cls);
    };
    for (const m of misses) {
      const cls = m.kind === "possible_vowel"
        ? "err-vowel"
        : m.kind === "possible_repetition"
          ? "err-repeat"
          : m.kind === "possible_skipped_ayah" || m.kind === "unclear_ayah"
            ? "err-skip"
            : "err-miss";
      if (cls === "err-skip" || m.w < 0) {
        const total = wordList(m.s, m.a).length;
        for (let i = 0; i < total; i += 1) put(`${m.s}:${m.a}:${i}`, cls);
      } else put(`${m.s}:${m.a}:${m.w}`, cls);
    }
    sheet.querySelectorAll<HTMLElement>(".w").forEach((el) => {
      el.classList.remove("err", "err-miss", "err-vowel", "err-skip", "err-repeat", "warn");
      const key = el.dataset.k || "";
      const cls = mark.get(key);
      if (cls) el.classList.add(cls);
      else if (warns.has(key)) el.classList.add("warn");
    });
    const total = misses.reduce((n, m) => n + (m.n || 1), 0);
    missBtn.textContent = String(total);
    missBtn.setAttribute("aria-label", t("miss.btnN", { n: total }));
    paintToday();
    missList.replaceChildren();
    if (!misses.length) {
      const empty = document.createElement("p");
      empty.className = "t-miss-empty";
      empty.textContent = t("miss.none");
      missList.appendChild(empty);
      return;
    }
    [...misses].reverse().forEach((m) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "t-miss-row";
      const name = surahName(m.s);
      const kind = kindName(m.kind);
      const times = m.n > 1 ? ` · ${m.n}` : "";
      row.textContent = `${name} ${m.a}${wordAt(m.w)} — ${kind}${times}`;
      row.addEventListener("click", () => {
        queueOn = false;
        void beginRetry(m);
      });
      missList.appendChild(row);
    });
  }

  function remember(issue: Issue): void {
    const s = issue.surah ?? 0;
    const a = issue.ayah ?? 0;
    const w = issue.word ?? -1;
    if (!s || !a) return;
    const kind = issue.kind || "error";
    const prev = misses.find((m) => m.s === s && m.a === a && m.w === w && m.kind === kind);
    if (prev) prev.n += 1;
    else misses.push({ s, a, w, kind, n: 1, t: Date.now() });
    if (misses.length > 200) misses = misses.slice(-200);
    takeMisses.push({ s, a, w, kind, n: 1, t: Date.now() });
    bumpWeek("error");
    saveMisses();
    paintMisses();
    navigator.vibrate?.(50);
    const name = surahName(s);
    setStatus(() => t("st.mistake"), () => `${surahName(s)} ${a}${wordAt(w)} — ${kindName(kind)}`);
  }

  function orderedMisses(): Miss[] {
    return [...misses].sort((a, b) => a.s - b.s || a.a - b.a || a.w - b.w);
  }

  function forgetSpot(surah: number, ayah: number, word = -1): void {
    for (const key of [...strikes.keys()]) {
      const parts = key.split(":");
      if (Number(parts[0]) !== surah || Number(parts[1]) !== ayah) continue;
      if (word >= 0 && Number(parts[2]) !== word) continue;
      strikes.delete(key);
      warns.delete(`${surah}:${ayah}:${parts[2]}`);
    }
    saveStrikes();
  }

  function advanceQueue(): void {
    if (!queueOn) return;
    const next = orderedMisses()[0];
    if (!next) {
      queueOn = false;
      setStatus(() => t("st.done"), () => t("st.allFixed"));
      queueMicrotask(() => {
        if (micOn) void stopMic();
      });
      return;
    }
    void beginRetry(next);
  }

  function releaseIssue(issue: Issue): void {
    const z = session?.zipformer;
    if (!z) return;
    z.correct("review_later");
    if (typeof issue.wordIndex === "number") z.correction.suppressed?.delete(issue.wordIndex);
  }

  function noteStrike(issue: Issue): boolean {
    const s = issue.surah ?? 0;
    const a = issue.ayah ?? 0;
    const w = issue.word ?? -1;
    if (!s || !a) return false;
    const kind = issue.kind || "error";
    const key = `${s}:${a}:${w}:${kind}`;
    const n = (strikes.get(key) ?? 0) + 1;
    strikes.set(key, n);
    saveStrikes();
    warns.delete(`${s}:${a}:${w}`);
    return true;
  }

  missBtn.addEventListener("click", () => {
    missBox.hidden = !missBox.hidden;
    missBtn.setAttribute("aria-expanded", missBox.hidden ? "false" : "true");
    if (!missBox.hidden) paintMisses();
  });
  need<HTMLButtonElement>(".t-miss-clear").addEventListener("click", () => {
    if (!misses.length && !strikes.size) return;
    if (!window.confirm(t("miss.clearConfirm"))) return;
    misses = [];
    strikes.clear();
    warns.clear();
    saveStrikes();
    saveMisses();
    paintMisses();
  });
  need<HTMLButtonElement>(".t-miss-go").addEventListener("click", () => {
    if (!orderedMisses().length) {
      setStatus(() => t("st.noMiss"), () => t("st.noMissSub"));
      return;
    }
    queueOn = true;
    missBox.hidden = true;
    void beginRetry(orderedMisses()[0]);
  });
  need<HTMLButtonElement>(".t-sum-ok").addEventListener("click", () => {
    sumBox.hidden = true;
  });
  const themes = ["cream", "white", "black"] as const;
  let theme: (typeof themes)[number] = "cream";
  try {
    const savedTheme = localStorage.getItem("tartil.theme");
    if (savedTheme === "white" || savedTheme === "black" || savedTheme === "cream") theme = savedTheme;
  } catch {
    /* ignore */
  }
  function applyTheme(name: (typeof themes)[number]): void {
    theme = name;
    root.classList.toggle("theme-white", name === "white");
    root.classList.toggle("theme-black", name === "black");
    setSeg("theme", name);
    const color = name === "black" ? "#111111" : name === "white" ? "#ffffff" : "#fffaf0";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
    try {
      localStorage.setItem("tartil.theme", name);
    } catch {
      /* ignore quota */
    }
  }
  applyTheme(theme);
  const todayEl = need<HTMLElement>(".t-today");
  const icon = (cls: string, body: string) => {
    const el = root.querySelector(cls);
    if (el && !el.querySelector("svg")) el.insertAdjacentHTML("afterbegin", `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`);
  };
  let pace: "tez" | "orta" = "orta";
  try {
    if (localStorage.getItem("tartil.speed") === "tez") pace = "tez";
  } catch {
    /* ignore */
  }
  function applyPace(name: "tez" | "orta"): void {
    pace = name;
    if (name === "tez") {
      delayMin = 180;
      delayStep = 15;
      delayCap = 40;
    } else {
      delayMin = 400;
      delayStep = 30;
      delayCap = 120;
    }
    setSeg("speed", name);
    try {
      localStorage.setItem("tartil.speed", name);
    } catch {
      /* ignore quota */
    }
  }
  applyPace(pace);
  const senseHint = need<HTMLElement>(".t-sense-hint");
  function applySense(name: "normal" | "sert" | "cetin", announce = false): void {
    sense = name;
    setSeg("sense", name);
    senseHint.textContent = t(name === "cetin" ? "sense.hint.cetin" : name === "sert" ? "sense.hint.sert" : "sense.hint.normal");
    moreBtn.classList.toggle("hard", name === "cetin");
    moreBtn.setAttribute("aria-label", t(name === "cetin" ? "set.titleHard" : "set.title"));
    tj.setMode({ tajwid: name === "cetin", letters: name === "sert" || name === "cetin" });
    if (name === "cetin") tj.prefetch(page);
    if (announce) {
      setStatus(() => t(name === "cetin" ? "sense.cetin" : name === "sert" ? "sense.sert" : "sense.normal"), () => senseHint.textContent || "");
    }
    applyWordStrictness();
    try {
      localStorage.setItem("tartil.sense", name);
    } catch {
      /* ignore quota */
    }
  }
  applySense(sense);
  // Sərt / Çətin word checks: GOP posterior vs expected word, slightly looser
  // mid-ayah distance gates, and a last-ayah review at stop. Slip head stays off
  // (it flags false vowels on clean recitations and catches no extra mistakes).
  // Normal is left on the previous path.
  const SERT_THRESHOLDS = { gopFlag: -5, substitutionDistance: 0.5, vowelWordMargin: 0.65, vowelMargin: 0.04 };
  const NORMAL_THRESHOLDS = { gopFlag: Number.NEGATIVE_INFINITY, substitutionDistance: 0.6, vowelWordMargin: 0.8, vowelMargin: 0.05 };
  function applyWordStrictness(): void {
    const z = session?.zipformer;
    if (!z) return;
    z.setSlipHead(false);
    if (z.correction?.thresholds) {
      Object.assign(z.correction.thresholds, sense === "sert" || sense === "cetin" ? SERT_THRESHOLDS : NORMAL_THRESHOLDS);
    }
  }
  function wordCheckParams(): { fineDist: number; omitHeard: number; subDist: number; subMargin: number } {
    if (sense === "sert" || sense === "cetin") return { fineDist: 0.3, omitHeard: 0.45, subDist: 0.5, subMargin: 0.4 };
    return { fineDist: 0.25, omitHeard: 0.35, subDist: 0.6, subMargin: 0.5 };
  }
  // Madd munfasil length the reciter follows (Çətin tajwid check): 4–5 counts (default) or 2 (qasr, never flagged short).
  let munfasil: 2 | 4 = 4;
  try {
    if (localStorage.getItem("tartil.munfasil") === "2") munfasil = 2;
  } catch {
    /* ignore */
  }
  function applyMunfasil(n: 2 | 4, announce = false): void {
    munfasil = n;
    tj.setMunfasil(n);
    setSeg("madd", String(n));
    if (announce) {
      setStatus(
        () => `${t("madd")}: ${t(n === 2 ? "madd.2" : "madd.4")}`,
        () => t(n === 2 ? "madd.st2" : "madd.st4"),
      );
    }
    try {
      localStorage.setItem("tartil.munfasil", String(n));
    } catch {
      /* ignore quota */
    }
  }
  applyMunfasil(munfasil);
  function applyHifz(on: boolean): void {
    hifz = on;
    root.classList.toggle("hifz", on);
    setSeg("hifz", on ? "1" : "0");
    try {
      localStorage.setItem("tartil.hifz", on ? "1" : "0");
    } catch {
      /* ignore quota */
    }
  }
  applyHifz(hifz);
  setSheet.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".t-seg button");
    const group = btn?.closest<HTMLElement>(".t-seg")?.dataset.set;
    const v = btn?.dataset.v;
    if (!btn || !group || !v) return;
    if (group === "sense" && (v === "normal" || v === "sert" || v === "cetin")) applySense(v, true);
    else if (group === "madd") applyMunfasil(v === "2" ? 2 : 4, true);
    else if (group === "hifz") applyHifz(v === "1");
    else if (group === "speed") applyPace(v === "tez" ? "tez" : "orta");
    else if (group === "theme" && (v === "cream" || v === "white" || v === "black")) applyTheme(v);
  });
  const micPick = need<HTMLSelectElement>(".t-micpick");
  function savedMic(): string {
    try {
      return localStorage.getItem("tartil.mic") || "";
    } catch {
      return "";
    }
  }
  async function listMics(): Promise<void> {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const found = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput");
    micPick.replaceChildren();
    const auto = document.createElement("option");
    auto.value = "";
    auto.textContent = t("mic");
    micPick.appendChild(auto);
    found.forEach((d, i) => {
      const opt = document.createElement("option");
      opt.value = d.deviceId;
      opt.textContent = d.label || t("micN", { n: i + 1 });
      micPick.appendChild(opt);
    });
    const keep = savedMic();
    if ([...micPick.options].some((opt) => opt.value === keep)) micPick.value = keep;
    micPick.closest<HTMLElement>(".t-microw")?.toggleAttribute("hidden", found.length < 2);
  }
  micPick.addEventListener("change", () => {
    try {
      localStorage.setItem("tartil.mic", micPick.value);
    } catch {
      /* ignore quota */
    }
  });
  void listMics();
  const mineBtn = need<HTMLButtonElement>(".t-mine");
  const backBtn = need<HTMLButtonElement>(".t-back");
  function ringSlice(from: number, to: number): Float32Array {
    const a = Math.max(from, to - CLIP_RING + 1, 0);
    const out = new Float32Array(Math.max(0, to - a));
    for (let i = 0; i < out.length; i += 1) out[i] = micRing[(a + i) % CLIP_RING];
    return out;
  }
  function paintMine(): void {
    const bits = lastClip.split(":").map(Number);
    mineBtn.hidden = !clips.has(lastClip);
    need<HTMLElement>(".t-mine-p").textContent = bits[0] ? `(${surahName(bits[0])} ${bits[1]})` : "";
  }
  function rmsOf(from: number, to: number): number {
    let q = 0;
    let c = 0;
    for (let i = Math.max(from, micPos - CLIP_RING + 1, 0); i < to; i += 4) {
      const v = micRing[i % CLIP_RING];
      q += v * v;
      c += 1;
    }
    return c ? Math.sqrt(q / c) : 0;
  }
  // The last word is confirmed while it is still being said, so the clip ends at the pause that follows (or after 4 s).
  let clipWait: { key: string; start: number; end0: number; ref: number; timer: number } | null = null;
  const CLIP_DB = "tartil-clips";
  const CLIP_STORE = "clips";
  const CLIP_CAP = 8 * 1024 * 1024;
  type ClipRec = { key: string; pcm: ArrayBuffer; t: number; last?: number };
  function openClipDb(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      if (!("indexedDB" in window)) {
        resolve(null);
        return;
      }
      const req = indexedDB.open(CLIP_DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(CLIP_STORE)) req.result.createObjectStore(CLIP_STORE, { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }
  function idbReq<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function persistClip(key: string, pcm: Float32Array): Promise<void> {
    const db = await openClipDb();
    if (!db) return;
    try {
      const rec: ClipRec = { key, pcm: pcm.slice().buffer, t: Date.now(), last: 1 };
      const all = await new Promise<ClipRec[]>((resolve, reject) => {
        const tx = db.transaction(CLIP_STORE, "readwrite");
        const store = tx.objectStore(CLIP_STORE);
        store.put(rec);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result || []) as ClipRec[]);
        tx.onerror = () => reject(tx.error);
      });
      const others = all.filter((row) => row.key !== key).sort((a, b) => (a.t || 0) - (b.t || 0));
      let total = all.reduce((sum, row) => sum + (row.pcm?.byteLength ?? 0), 0);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(CLIP_STORE, "readwrite");
        const store = tx.objectStore(CLIP_STORE);
        for (const row of others) {
          if (row.last) store.put({ ...row, last: 0 });
        }
        for (const row of others) {
          if (total <= CLIP_CAP) break;
          store.delete(row.key);
          total -= row.pcm?.byteLength ?? 0;
          clips.delete(row.key);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* quota or private mode */
    }
    db.close();
  }
  async function restoreClips(): Promise<void> {
    const db = await openClipDb();
    if (!db) return;
    try {
      const read = db.transaction(CLIP_STORE, "readonly");
      const all = (await idbReq(read.objectStore(CLIP_STORE).getAll())) as ClipRec[];
      all.sort((a, b) => (a.t || 0) - (b.t || 0));
      for (const row of all) {
        if (!row?.key || !row.pcm) continue;
        clips.set(row.key, new Float32Array(row.pcm));
        if (row.last) lastClip = row.key;
      }
      if (!lastClip && all.length) lastClip = all[all.length - 1].key;
      paintMine();
    } catch {
      /* ignore */
    }
    db.close();
  }
  function keepClip(key: string, start: number, end: number): void {
    if (end - start < 8000) return;
    clips.delete(key);
    const pcm = ringSlice(start, end);
    clips.set(key, pcm);
    while (clips.size > 12) clips.delete(clips.keys().next().value as string);
    lastClip = key;
    paintMine();
    void persistClip(key, pcm);
  }
  function settleClip(force: boolean): void {
    const w = clipWait;
    if (!w) return;
    const W = 4000;
    let quiet = -1;
    for (let i = Math.max(w.start, w.end0 - W); i + W <= micPos; i += 1600) {
      if (rmsOf(i, i + W) < w.ref * 0.22) {
        quiet = i + W / 2;
        break;
      }
    }
    const limit = w.end0 + 16000 * 4;
    if (quiet < 0 && !force && micPos < limit) {
      w.timer = window.setTimeout(() => settleClip(false), 300);
      return;
    }
    window.clearTimeout(w.timer);
    clipWait = null;
    const end = quiet >= 0 ? Math.min(micPos, quiet + 4000) : Math.min(micPos, limit);
    clipMark = quiet >= 0 ? quiet : end;
    keepClip(w.key, w.start, end);
  }
  function cutClip(s: number, a: number): void {
    if (clipWait) settleClip(true);
    const end0 = micPos;
    const start = Math.max(0, clipMark - 4000, end0 - 16000 * 45);
    clipMark = end0;
    clipWait = { key: `${s}:${a}`, start, end0, ref: rmsOf(start, end0), timer: 0 };
    settleClip(false);
  }
  function hasClip(s: number, a: number): boolean {
    const key = `${s}:${a}`;
    return clips.has(key) || clipWait?.key === key;
  }
  async function playMine(s: number, a: number): Promise<void> {
    const pcm = clips.get(`${s}:${a}`);
    if (!pcm) return;
    quietStop = true;
    if (micOn || audioStop) await stopMic();
    quietStop = false;
    stopClip();
    setStatus(() => t("st.mine"), () => t("st.mineYou", { p: `${surahName(s)} ${a}` }));
    const ok = await playPcm(pcm);
    if (ok) setStatus(() => t("st.read"), () => t("st.mineDone"));
  }
  function playPcm(pcm: Float32Array): Promise<boolean> {
    const gen = playGen;
    return new Promise((resolve) => {
      void (async () => {
        try {
          const ctx = voice ?? new AudioContext();
          voice = ctx;
          await ctx.resume();
          if (gen !== playGen) {
            resolve(false);
            return;
          }
          const buf = ctx.createBuffer(1, pcm.length, 16000);
          buf.copyToChannel(pcm, 0);
          const src = ctx.createBufferSource();
          const gain = ctx.createGain();
          gain.gain.value = 1.6;
          src.buffer = buf;
          src.connect(gain);
          gain.connect(ctx.destination);
          voiceStop = () => src.stop();
          src.onended = () => resolve(gen === playGen);
          src.start();
        } catch {
          resolve(false);
        }
      })();
    });
  }
  mineBtn.addEventListener("click", () => {
    const bits = lastClip.split(":").map(Number);
    if (bits[0]) void playMine(bits[0], bits[1]);
  });
  const dayAyahs = new Set<string>();
  function todayStamp(): string {
    const n = new Date();
    return `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`;
  }
  try {
    const raw = JSON.parse(localStorage.getItem("tartil.day") || "") as { d?: string; ayahs?: string[] };
    if (raw?.d === todayStamp() && Array.isArray(raw.ayahs)) raw.ayahs.forEach((key) => dayAyahs.add(key));
  } catch {
    /* ignore */
  }
  function todayErrorCount(): number {
    const fromWeek = readWeek()[weekKey()]?.errors;
    if (typeof fromWeek === "number") return fromWeek;
    // Migrate older sessions that only stored the open-mistake list.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const t0 = start.getTime();
    return misses.filter((m) => (m.t || 0) >= t0).reduce((n, m) => n + (m.n || 1), 0);
  }
  function paintToday(): void {
    const week = weekTotals();
    // Today and week error counts are cumulative recorded mistakes (including ones later fixed), not the open list.
    todayEl.textContent = t("today", { d: dayAyahs.size, e: todayErrorCount(), wa: week.ayahs, we: week.errors });
  }
  function weekKey(offset = 0): string {
    const n = new Date();
    n.setDate(n.getDate() - offset);
    return `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`;
  }
  function readWeek(): Record<string, { ayahs?: string[]; errors?: number }> {
    try {
      const raw = JSON.parse(localStorage.getItem("tartil.week") || "{}") as Record<string, { ayahs?: string[]; errors?: number }>;
      return raw && typeof raw === "object" ? raw : {};
    } catch {
      return {};
    }
  }
  function weekTotals(): { ayahs: number; errors: number } {
    const week = readWeek();
    let ayahs = 0;
    let errors = 0;
    for (let i = 0; i < 7; i += 1) {
      const row = week[weekKey(i)];
      ayahs += row?.ayahs?.length ?? 0;
      errors += row?.errors ?? 0;
    }
    return { ayahs, errors };
  }
  function bumpWeek(kind: "ayah" | "error", ayahKey = ""): void {
    const week = readWeek();
    const key = weekKey();
    const row = week[key] ?? { ayahs: [], errors: 0 };
    if (!Array.isArray(row.ayahs)) row.ayahs = [];
    if (kind === "ayah" && ayahKey && !row.ayahs.includes(ayahKey)) row.ayahs.push(ayahKey);
    if (kind === "error") row.errors = (row.errors ?? 0) + 1;
    week[key] = row;
    const keep: Record<string, { ayahs?: string[]; errors?: number }> = {};
    for (let i = 0; i < 7; i += 1) {
      const day = weekKey(i);
      if (week[day]) keep[day] = week[day];
    }
    try {
      localStorage.setItem("tartil.week", JSON.stringify(keep));
    } catch {
      /* ignore quota */
    }
  }
  function noteAyah(surah: number, ayah: number): void {
    const key = `${surah}:${ayah}`;
    if (dayAyahs.has(key)) return;
    dayAyahs.add(key);
    bumpWeek("ayah", key);
    try {
      localStorage.setItem("tartil.day", JSON.stringify({ d: todayStamp(), ayahs: [...dayAyahs] }));
    } catch {
      /* ignore quota */
    }
    paintToday();
  }
  paintToday();

  let liveSub = t("st.readSub");
  let quietOn = false;
  // Status texts may be thunks so a language change can redraw the current status at once.
  type Txt = string | (() => string);
  let lastStatus: [Txt, Txt] = ["", ""];
  function setStatus(title: Txt, detail: Txt): void {
    lastStatus = [title, detail];
    const tx = typeof title === "function" ? title() : title;
    const dx = typeof detail === "function" ? detail() : detail;
    st.textContent = tx;
    liveSub = dx;
    if (!quietOn) sub.textContent = dx;
  }
  function redrawStatus(): void {
    setStatus(lastStatus[0], lastStatus[1]);
  }

  function setProgress(p: number | null): void {
    if (p == null) {
      loadBar.classList.remove("on");
      return;
    }
    loadBar.classList.add("on");
    loadFill.style.width = `${Math.round(p * 100)}%`;
  }

  function wordList(surah: number, ayah: number): string[] {
    const n = wordCountOf.get(`${surah}:${ayah}`) ?? 0;
    return Array.from({ length: n }, () => "");
  }

  function loadNames(): Promise<void> {
    if (!namesReady) {
      namesReady = Promise.all([
        new FontFace("surahnames", `url(${asset("sura_names.woff2")})`).load(),
        new FontFace("QCF1", `url(${QCF}p1.woff2)`).load(),
      ]).then((faces) => {
        faces.forEach((face) => document.fonts.add(face));
        loadedFonts.add(1);
      });
    }
    return namesReady;
  }

  function loadPageFont(n: number): Promise<void> {
    if (loadedFonts.has(n)) return Promise.resolve();
    const pending = fontLoads.get(n);
    if (pending) return pending;
    const face = new FontFace(`QCF${n}`, `url(${QCF}p${n}.woff2)`);
    const job = face
      .load()
      .then(() => {
        document.fonts.add(face);
        loadedFonts.add(n);
      })
      .finally(() => fontLoads.delete(n));
    fontLoads.set(n, job);
    return job;
  }

  function textWidth(line: HTMLElement): number {
    const range = document.createRange();
    range.selectNodeContents(line);
    return range.getBoundingClientRect().width;
  }

  function fit(): void {
    pageEl.querySelectorAll<HTMLElement>(".line").forEach((line) => line.style.removeProperty("--g"));
    const land = matchMedia(LANDSCAPE_PHONE).matches;
    root.classList.toggle("land", land);
    if (!land) root.style.removeProperty("--t-row");
    const bar = root.querySelector<HTMLElement>(".t-bar");
    const barH = bar ? Math.ceil(bar.getBoundingClientRect().height) : 0;
    root.style.setProperty("--t-bar-h", `${barH}px`);
    const pnH = Math.ceil(pnumEl.getBoundingClientRect().height) || 18;
    root.style.setProperty("--t-pn-h", `${pnH}px`);
    const h = Math.max(160, pageEl.clientHeight - barH - pnH - 21);
    const w = pageEl.clientWidth - 12;
    if (!h || !w) return;
    let size = land ? w / 12 : h / 15;
    for (let i = 0; i < 3; i += 1) {
      pageEl.style.fontSize = `${size}px`;
      let widest = 0;
      pageEl.querySelectorAll<HTMLElement>(".line:not(.surah):not(.basmala)").forEach((line) => {
        widest = Math.max(widest, line.scrollWidth);
      });
      if (widest <= w || widest === 0) break;
      size *= (w / widest) * 0.94;
    }
    const phone = matchMedia("(max-width: 520px)").matches;
    const rowH = (pageEl.clientHeight - barH - pnH) / 15;
    if (land) {
      pageEl.style.fontSize = `${size}px`;
      root.style.setProperty("--t-row", `${(size / 0.62).toFixed(2)}px`);
    } else pageEl.style.fontSize = `${Math.min(size * (phone ? 1 : 0.92), rowH * 0.62)}px`;
    pageEl.style.overflowY = "hidden";
    let ink = 0;
    pageEl.querySelectorAll<HTMLElement>(".line:not(.surah):not(.basmala)").forEach((line) => {
      ink = Math.max(ink, textWidth(line));
    });
    const card = Math.min(Math.max(ink, 0), pageEl.clientWidth * 0.94);
    pageEl.querySelectorAll<HTMLElement>(".shead").forEach((head) => {
      if (card > 0) head.style.width = `${card}px`;
    });
    if (card > 0) {
      pageEl.querySelectorAll<HTMLElement>(".line:not(.surah):not(.basmala)").forEach((line) => {
        const ws = line.querySelectorAll<HTMLElement>(".w");
        if (ws.length < 2) return;
        const gap0 = parseFloat(getComputedStyle(ws[1]).marginInlineStart) || 0;
        const nat = textWidth(line) - gap0 * (ws.length - 1);
        const g = (card - nat) / (ws.length - 1);
        if (nat >= card * 0.8 && g >= gap0) line.style.setProperty("--g", `${g.toFixed(2)}px`);
      });
    }
    pageEl.querySelectorAll<HTMLElement>(".snames").forEach((row) => {
      const head = row.parentElement;
      if (!head) return;
      row.style.fontSize = `${Math.max(13, head.clientHeight * 0.46)}px`;
    });
  }

  function draw(pageNo: number): void {
    const file = pageFiles.get(pageNo);
    const pageLines = file?.lines ?? [];
    const wlens = file?.wlens ?? [];
    const runs = file?.runs ?? [];
    const marks: Record<number, number> = { ...(heads[pageNo] ?? {}) };
    const bis: Record<number, boolean> = { ...(bisLines[pageNo] ?? {}) };
    const stack: Record<number, boolean> = { ...(stackLines[pageNo] ?? {}) };
    if (stack[0] && pageNo > 1 && !file?.prev14) {
      delete marks[0];
      delete stack[0];
      bis[0] = true;
    }
    const nextStack = stackLines[pageNo + 1] ?? {};
    if (nextStack[0] && !pageLines[14] && marks[14] == null) {
      const id = heads[pageNo + 1]?.[0];
      if (id) marks[14] = id;
    }
    pageEl.classList.toggle("mid", pageNo === 1 || pageNo === 2);
    pageEl.style.fontFamily = `QCF${pageNo}, serif`;
    let ri = 0;
    let left = runs[0] ? runs[0][1] : 0;
    const lineKeys = pageLines.map((text) =>
      [...text].map((ch) => {
        if (ch !== " ") {
          while (left === 0 && ri < runs.length - 1) {
            ri += 1;
            left = runs[ri]?.[1] ?? 0;
          }
          left -= 1;
        }
        return runs[ri]?.[0] ?? "";
      }),
    );
    const wordIx = new Map<string, number>();
    const addBasmala = (parent: HTMLElement, surahId: number) => {
      const b = document.createElement("span");
      b.className = "basmala";
      if (surahId) b.dataset.k = `bism:${surahId}`;
      b.textContent = BISM;
      parent.appendChild(b);
    };
    const addAyahs = (row: HTMLElement, text: string, i: number) => {
      let span: HTMLElement | null = null;
      let word: HTMLElement | null = null;
      const ks = lineKeys[i] ?? [];
      const lens = wlens[i] ?? [];
      let wi = 0;
      let remain = lens[0] || Infinity;
      let first = true;
      [...text].forEach((ch, j) => {
        const key = ks[j] || "";
        if (!span || span.dataset.ayah !== key) {
          span = document.createElement("span");
          span.className = "ay";
          span.dataset.ayah = key;
          row.appendChild(span);
          word = null;
        }
        if (remain === 0) {
          wi += 1;
          remain = lens[wi] || Infinity;
          word = null;
        }
        if (!word) {
          word = document.createElement("span");
          word.className = first ? "w w0" : "w";
          first = false;
          const idx = wordIx.get(key) ?? 0;
          wordIx.set(key, idx + 1);
          if (key) {
            word.dataset.k = `${key}:${idx}`;
            const [s, a] = key.split(":");
            const spoken = wordList(Number(s), Number(a)).length;
            if (spoken && idx === spoken) word.classList.add("num");
          }
          span.appendChild(word);
        }
        word.textContent += ch;
        remain -= 1;
      });
    };
    let last = pageLines.length - 1;
    if (pageNo === 1 || pageNo === 2) {
      while (last > 0 && !pageLines[last] && marks[last] == null && !bis[last]) last -= 1;
    }
    pageEl.replaceChildren();
    pageLines.forEach((text, i) => {
      if (i > last) return;
      if ((pageNo === 1 || pageNo === 2) && !text && marks[i] == null && !bis[i]) return;
      const row = document.createElement("div");
      const surahId = marks[i];
      row.className = surahId != null ? `line surah${stack[i] ? " stack" : ""}` : bis[i] ? "line basmala" : "line";
      if (surahId != null) {
        const head = document.createElement("div");
        head.className = "shead";
        const frame = document.createElement("img");
        frame.src = asset("surah-banner.png");
        frame.alt = "";
        const names = document.createElement("span");
        names.className = "snames";
        const ornament = document.createElement("span");
        ornament.className = "sname";
        ornament.textContent = "\uE000";
        const name = document.createElement("span");
        name.className = "sname";
        name.textContent = String.fromCharCode(0xe000 + Number.parseInt(String(surahId), 16));
        names.append(ornament, name);
        head.append(frame, names);
        row.appendChild(head);
        if (stack[i]) addBasmala(row, surahId);
      } else if (bis[i]) addBasmala(row, marks[i - 1] ?? 0);
      else addAyahs(row, text, i);
      pageEl.appendChild(row);
    });
  }

  let paint = 0;
  function paintFontFail(ok: boolean): void {
    pageEl.classList.toggle("font-fail", !ok);
    const bar = need<HTMLElement>(".t-fontfail");
    bar.hidden = ok;
    bar.textContent = ok ? "" : t("font.fail");
  }

  function paintTurns(): void {
    const prev = root.querySelector<HTMLButtonElement>(".t-prev");
    const next = root.querySelector<HTMLButtonElement>(".t-next");
    if (prev) prev.disabled = page <= 1;
    if (next) next.disabled = page >= 604;
  }

  async function render(): Promise<void> {
    const id = ++paint;
    const n = page;
    if (!pageEl.childElementCount) pageEl.textContent = t("loading");
    let fontOk = loadedFonts.has(n);
    try {
      await Promise.all([
        loadNames().catch(() => undefined),
        loadPageFont(n).then(() => { fontOk = true; }, () => { fontOk = loadedFonts.has(n); }),
        loadPageFile(n),
      ]);
      fontOk = loadedFonts.has(n);
    } catch {
      fontOk = loadedFonts.has(n);
      if (!pageFiles.has(n) && id === paint) pageEl.textContent = t("err.open", { x: t("nav.page") });
    }
    if (!alive || id !== paint) return;
    paintFontFail(fontOk);
    const turned = pageInput.value !== String(n);
    if (pageFiles.has(n)) draw(n);
    fit();
    if (turned && root.classList.contains("land")) window.scrollTo(0, 0);
    if (micOn || retryKey) applyShown();
    if (retryKey) markRetry();
    paintMisses();
    pageInput.value = String(n);
    paintPageNo();
    const first = pages[n - 1]?.[0];
    const keepPick = pickedSurah > 0 && surahPage.get(pickedSurah) === n;
    pickedSurah = 0;
    if (!keepPick && first) surahSel.value = String(first[0]);
    if (hashMode) history.replaceState(null, "", `#${n}`);
    showBack();
    try {
      localStorage.setItem("tartil.page", String(n));
    } catch {
      /* ignore quota */
    }
    const ahead = n + 1;
    if (ahead <= 604) {
      void loadPageFont(ahead).catch(() => undefined);
      void loadPageFile(ahead).catch(() => undefined);
    }
    if (n > 1) {
      void loadPageFont(n - 1).catch(() => undefined);
      void loadPageFile(n - 1).catch(() => undefined);
    }
    paintTurns();
    precacheUrls([
      asset(`pg/${n}.json`),
      ...(n > 1 ? [asset(`pg/${n - 1}.json`)] : []),
      ...(ahead <= 604 ? [asset(`pg/${ahead}.json`)] : []),
    ]);
  }

  function clearTimers(): void {
    for (const id of timers.values()) window.clearTimeout(id);
    timers.clear();
  }

  let paintQueued = false;
  function applyShown(): void {
    if (paintQueued) return;
    paintQueued = true;
    window.requestAnimationFrame(() => {
      paintQueued = false;
      const nodes = sheet.querySelectorAll<HTMLElement>("[data-k]");
      nodes.forEach((el) => {
        const key = el.dataset.k || "";
        const on = shown.has(key);
        if (el.classList.contains("on") !== on) el.classList.toggle("on", on);
        const fresh = key === freshKey;
        if (el.classList.contains("fresh") !== fresh) el.classList.toggle("fresh", fresh);
      });
      paintCue();
      followLine();
    });
  }

  // Landscape scrolls: keep the line being recited in view, but give way to the reader's own scrolling.
  let userScrollAt = 0;
  const markUserScroll = (): void => {
    userScrollAt = Date.now();
  };
  const onScrollKey = (ev: KeyboardEvent): void => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(ev.key)) markUserScroll();
  };
  window.addEventListener("wheel", markUserScroll, { passive: true });
  window.addEventListener("touchmove", markUserScroll, { passive: true });
  window.addEventListener("keydown", onScrollKey);
  function followLine(): void {
    if (!micOn || !root.classList.contains("land")) return;
    if (Date.now() - userScrollAt < 4000) return;
    const target =
      sheet.querySelector<HTMLElement>(".w.cue") ||
      sheet.querySelector<HTMLElement>(".w.fresh") ||
      [...sheet.querySelectorAll<HTMLElement>(".w.on")].pop();
    const line = target?.closest<HTMLElement>(".line");
    if (!line) return;
    const head = root.querySelector<HTMLElement>(".t-top")?.getBoundingClientRect().bottom ?? 0;
    const foot = root.querySelector<HTMLElement>(".t-bar")?.getBoundingClientRect().top ?? window.innerHeight;
    const view = foot - head;
    const r = line.getBoundingClientRect();
    if (r.top >= head && r.bottom <= head + view * 0.8) return;
    const top = Math.max(0, window.scrollY + r.top - head - view * 0.2);
    if (Math.abs(top - window.scrollY) < 2) return;
    window.scrollTo({ top, behavior: "smooth" });
  }
  const followTimer = window.setInterval(followLine, 700);

  function paintCue(): void {
    sheet.querySelectorAll(".cue").forEach((el) => el.classList.remove("cue"));
    if (!micOn || root.classList.contains("retry")) return;
    const words = sheet.querySelectorAll<HTMLElement>(".w");
    for (const el of words) {
      if (el.classList.contains("num")) continue;
      const key = el.dataset.k || "";
      if (!key || shown.has(key)) continue;
      if (ayahLock && !key.startsWith(`${ayahLock}:`)) continue;
      el.classList.add("cue");
      break;
    }
  }

  function rewindLock(): void {
    if (!ayahLock) return;
    const [ls, la] = ayahLock.split(":").map(Number);
    for (const key of [...shown]) {
      const parts = key.split(":");
      if (parts.length < 3) continue;
      const ks = Number(parts[0]);
      const ka = Number(parts[1]);
      if (ks > ls || (ks === ls && ka >= la)) shown.delete(key);
    }
    for (const [key, id] of [...timers]) {
      const parts = key.split(":");
      if (parts.length < 3) continue;
      const ks = Number(parts[0]);
      const ka = Number(parts[1]);
      if (ks > ls || (ks === ls && ka >= la)) {
        window.clearTimeout(id);
        timers.delete(key);
      }
    }
  }

  function holdAyah(surah: number, ayah: number): void {
    const key = `${surah}:${ayah}`;
    if (!ayahLock) {
      ayahLock = key;
      lockDirty = false;
    } else if (ayahLock === key && !rearm) lockDirty = true;
    else {
      const [ls, la] = ayahLock.split(":").map(Number);
      if (surah < ls || (surah === ls && ayah < la)) {
        ayahLock = key;
        lockDirty = false;
      }
    }
    rearm = true;
    rewindLock();
    applyShown();
  }

  function go(n: number): void {
    page = clampPage(n);
    try {
      localStorage.setItem("tartil.read", String(page));
    } catch {
      /* ignore quota */
    }
    void render();
  }

  function reveal(key: string): void {
    if (!alive) return;
    timers.delete(key);
    shown.add(key);
    freshKey = key;
    const parts = key.split(":");
    if (parts[0] !== "bism" && parts[0] !== "num") {
      const surah = Number(parts[0]);
      const ayah = Number(parts[1]);
      const target = pageOf.get(`${surah}:${ayah}`);
      if (target && target !== page) {
        page = target;
        if (!retryKey) {
          try {
            localStorage.setItem("tartil.read", String(page));
          } catch {
            /* ignore quota */
          }
        }
        expectPage();
        if (!retryHit(key)) {
          render();
          return;
        }
      }
      const total = wordList(surah, ayah).length;
      const idx = Number(parts[2]);
      if (idx === total - 1) {
        tj.ayahDone(surah, ayah);
        if (surah === seqS && ayah === seqA) seqDone = true;
        noteAyah(surah, ayah);
        cutClip(surah, ayah);
        shown.add(`num:${surah}:${ayah}`);
        const prefix = `${surah}:${ayah}:`;
        sheet.querySelectorAll<HTMLElement>(".w").forEach((el) => {
          const k = el.dataset.k || "";
          if (k.startsWith(prefix) && /^\d+$/.test(k.slice(prefix.length))) shown.add(k);
        });
      }
      if (ayah === 1) shown.add(`bism:${surah}`);
      if (ayahLock === `${surah}:${ayah}` && idx === total - 1 && !rearm) {
        if (lockDirty) {
          lockDirty = false;
          rearm = true;
          rewindLock();
          setStatus(() => t("st.again"), () => t("st.againSub", { p: `${surahName(surah)} ${ayah}` }));
          applyShown();
          return;
        }
        misses = misses.filter((m) => !(m.s === surah && m.a === ayah));
        forgetSpot(surah, ayah);
        saveMisses();
        paintMisses();
        ayahLock = "";
        setStatus(() => t("st.fixed"), () => t("st.fixedSub"));
        if (queueOn) advanceQueue();
      }
    }
    if (/^\d+:\d+:\d+$/.test(key)) {
      const bits = key.split(":").map(Number);
      if (bits[2] < wordList(bits[0], bits[1]).length) heard += 1;
    }
    if (retryHit(key)) {
      const bits = key.split(":").map(Number);
      const whole = retryKey.endsWith(":*");
      misses = misses.filter((m) => !(m.s === bits[0] && m.a === bits[1] && (whole || m.w === bits[2])));
      forgetSpot(bits[0], bits[1], whole ? -1 : bits[2]);
      saveMisses();
      retryKey = "";
      paintMisses();
      applyShown();
      if (queueOn) {
        advanceQueue();
        return;
      }
      retryClose = true;
      queueMicrotask(() => {
        if (micOn) void stopMic();
      });
      return;
    }
    applyShown();
    if (retryKey) markRetry();
  }

  let seqS = 0;
  let seqA = 0;
  let seqDone = false;
  let seqHold = false;
  function seqOk(surah: number, ayah: number): boolean {
    if (retryKey) return true;
    if (!seqA) {
      const here = pages[page - 1]?.[0];
      seqS = here?.[0] ?? surah;
      seqA = here?.[1] ?? ayah;
      seqDone = false;
    }
    if (surah === seqS && ayah <= seqA) return true;
    const follows = (surah === seqS && ayah === seqA + 1) || (surah === seqS + 1 && ayah === 1);
    if (follows && !seqDone && wordList(seqS, seqA).length <= 2) {
      // One- or two-word ayahs (93:1, 103:1) are often over before the model locks on; reading on proves them.
      const held = wordList(seqS, seqA).map((_, i) => i);
      const [hs, ha] = [seqS, seqA];
      seqDone = true;
      schedule(hs, ha, held);
    }
    if (follows && seqDone) {
      seqS = surah;
      seqA = ayah;
      seqDone = false;
      seqHold = false;
      return true;
    }
    if (!seqHold) {
      seqHold = true;
      const name = surahName(seqS);
      setStatus(() => t("st.held"), () => t("st.heldSub", { p: `${surahName(seqS)} ${seqA}` }));
    }
    return false;
  }

  function schedule(surah: number, ayah: number, indices: number[]): void {
    if (surah === 1 && ayah === 1 && pageOf.get("1:1") !== page) return;
    if (!seqOk(surah, ayah)) return;
    if (ayahLock) {
      const [ls, la] = ayahLock.split(":").map(Number);
      if (surah > ls || (surah === ls && ayah > la)) return;
    }
    if (rearm) {
      if (ayahLock !== `${surah}:${ayah}` || Math.min(...indices) > 0) return;
      rearm = false;
    }
    const fresh = indices
      .filter((i) => {
        const key = `${surah}:${ayah}:${i}`;
        return !shown.has(key) && !timers.has(key);
      })
      .sort((a, b) => a - b);
    fresh.forEach((i, n) => {
      const key = `${surah}:${ayah}:${i}`;
      const delay = delayMin + Math.min(delayCap, n * delayStep);
      const id = window.setTimeout(() => reveal(key), delay);
      timers.set(key, id);
    });
    if (fresh.length && !retryKey) {
      const name = surahName(surah);
      setStatus(() => t("st.listening"), () => `${surahName(surah)} ${ayah}`);
    }
  }

  function onEvent(msg: ProgressMsg): void {
    if (msg.type === "correction" || msg.type === "correction_note") {
      const issue = msg.type === "correction_note" ? msg.issue : msg.state?.issue;
      const phase = msg.state?.phase;
      if (msg.type === "correction_note" && issue) {
        if (noteStrike(issue)) remember(issue);
        return;
      }
      if (phase === "error" && issue?.surah && issue.ayah) {
        // Look-alike-verse omissions fired on the same words for every clean qari (2:6, 2:38, 93:7);
        // the word rules and checkFinishedAyah catch real dropped words.
        const lookAlikeDrop = issue.source === "similar_verse" && issue.kind === "possible_omission";
        if (!lookAlikeDrop && noteStrike(issue)) remember(issue);
        if (!settling) {
          settling = true;
          try {
            releaseIssue(issue);
          } finally {
            settling = false;
          }
        }
        return;
      }
      if (phase === "corrected" && issue?.surah && issue.ayah) {
        misses = misses.filter((m) => !(m.s === issue.surah && m.a === issue.ayah && m.w === (issue.word ?? -1)));
        forgetSpot(issue.surah, issue.ayah, issue.word ?? -1);
        saveMisses();
        paintMisses();
        lockDirty = false;
        if (!settling) {
          settling = true;
          try {
            session?.zipformer?.correct("continue");
          } finally {
            settling = false;
          }
        }
        const name = surahName(issue.surah);
        setStatus(() => t("st.fixed"), () => t("st.wordFixed", { p: `${surahName(issue.surah)} ${issue.ayah}` }));
        return;
      }
      return;
    }
    if (!micOn || msg.type !== "word_progress") return;
    const surah = msg.surah;
    const ayah = msg.ayah;
    if (!surah || !ayah) return;
    const upto = typeof msg.word_index === "number" ? msg.word_index : -1;
    const idxs = new Set<number>(msg.matched_indices ?? []);
    for (let i = 0; i <= upto; i += 1) idxs.add(i);
    if (!idxs.size) return;
    lastHeardS = surah;
    lastHeardA = ayah;
    checkFinishedAyah(surah, ayah);
    if (surah) expectPage({ surah, ayah });
    tj.heard(surah, ayah);
    schedule(surah, ayah, [...idxs]);
  }

  // When the reciter starts ayah N+1, judge ayah N's words once more with its whole audio settled.
  // Tuned on real qari recordings with spliced mistakes (tools/recitation-bench): no extra flags on
  // clean takes, and it catches dropped endings and dropped or swapped words the live rules miss.
  // Sərt / Çətin also review the last ayah at mic stop (Normal still only runs this on N+1).
  function checkAyahWords(surah: number, ayah: number, evenIfRetry = false): void {
    const key = `words:${surah}:${ayah}`;
    if ((!evenIfRetry && retryKey) || ayahChecked.has(key)) return;
    ayahChecked.add(key);
    let all: Verdict[] = [];
    try {
      all = session?.zipformer?.verdicts() ?? [];
    } catch {
      return;
    }
    const v = all.filter((x) => x.surah === surah && x.ayah === ayah).sort((a, b) => a.word - b.word);
    if (v.length < 3) return;
    const p = wordCheckParams();
    const found: Issue[] = [];
    const lost = (x: Verdict) => x.state === "skipped" || (x.state === "wrong" && x.distance >= 0.5);
    let k = v.length;
    while (k > 0 && lost(v[k - 1])) k -= 1;
    if (k < v.length && k > 0 && v[k - 1].state !== "skipped") {
      found.push({ surah, ayah, word: v[k].word, kind: "possible_omission" });
    }
    const fine = (x?: Verdict) => !!x && (x.state === "ok" || x.state === "unsure") && x.distance <= p.fineDist;
    for (let i = 1; i < k - 1; i += 1) {
      const x = v[i];
      if (!fine(v[i - 1]) || !fine(v[i + 1])) continue;
      if (x.state === "skipped" && x.heardRatio <= p.omitHeard) found.push({ surah, ayah, word: x.word, kind: "possible_omission" });
      else if (x.state === "wrong" && x.distance >= p.subDist && x.margin >= p.subMargin) {
        found.push({ surah, ayah, word: x.word, kind: "possible_substitution" });
      }
    }
    for (const issue of found) {
      const near = takeMisses.some((m) => m.s === issue.surah && m.a === issue.ayah && Math.abs(m.w - (issue.word ?? -9)) <= 1);
      if (!near && noteStrike(issue)) remember(issue);
    }
  }
  function checkFinishedAyah(surah: number, ayah: number): void {
    if (ayah < 2) return;
    checkAyahWords(surah, ayah - 1);
  }
  function checkLastHeardAyah(): void {
    if (sense !== "sert" && sense !== "cetin") return;
    if (!lastHeardS || !lastHeardA) return;
    checkAyahWords(lastHeardS, lastHeardA, true);
  }

  const MODEL_ID = __MODEL_ID__;
  // The model that was shipped unversioned in tartil-v1. Only this hash may be reused from that cache.
  const MODEL_LEGACY_ID = "bfb5b7126956";
  const PACK_SIZES = { model: 69246033, wasm: 14848852, corpus: 5453439 };

  async function readBody(res: Response, label: string, onBytes: (got: number, total: number) => void, fallback: number): Promise<ArrayBuffer> {
    if (!res.ok || !res.body) throw new Error(t("err.open", { x: label }));
    const total = Number(res.headers.get("content-length") || 0) || fallback;
    const reader = res.body.getReader();
    const parts: Uint8Array[] = [];
    let got = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (!chunk.value) continue;
      parts.push(chunk.value);
      got += chunk.value.byteLength;
      onBytes(got, total);
    }
    const buf = new Uint8Array(got);
    let offset = 0;
    for (const part of parts) {
      buf.set(part, offset);
      offset += part.byteLength;
    }
    return buf.buffer;
  }

  async function cachedGet(cacheName: string, url: string, also?: string): Promise<ArrayBuffer | null> {
    if (!("caches" in window)) return null;
    const cache = await caches.open(cacheName);
    const hit = (await cache.match(url)) || (also ? await cache.match(also, { ignoreSearch: true }) : undefined);
    return hit ? hit.arrayBuffer() : null;
  }

  async function cachedPut(cacheName: string, url: string, buf: ArrayBuffer): Promise<void> {
    if (!("caches" in window)) return;
    try {
      const cache = await caches.open(cacheName);
      await cache.put(url, new Response(buf.slice(0)));
    } catch {
      /* cache optional */
    }
  }

  async function loadPackPart(
    url: string,
    label: string,
    key: keyof typeof PACK_SIZES,
    cacheName: string,
    onTick: (key: keyof typeof PACK_SIZES, got: number, total: number) => void,
    fallbackUrl?: string,
  ): Promise<ArrayBuffer> {
    const sized = PACK_SIZES[key];
    const hit = await cachedGet(cacheName, url, fallbackUrl);
    if (hit) {
      onTick(key, hit.byteLength, hit.byteLength);
      return hit;
    }
    const res = await fetch(url);
    const buf = await readBody(res, label, (got, total) => onTick(key, got, total || sized), sized);
    await cachedPut(cacheName, url, buf);
    return buf;
  }

  async function loadModelBuffer(onTick: (key: keyof typeof PACK_SIZES, got: number, total: number) => void): Promise<ArrayBuffer> {
    const url = asset(`model.onnx?v=${MODEL_ID}`);
    const cacheName = `tartil-model-${MODEL_ID}`;
    const hit = await cachedGet(cacheName, url, asset("model.onnx"));
    if (hit) {
      onTick("model", hit.byteLength, hit.byteLength);
      return hit;
    }
    if (MODEL_ID === MODEL_LEGACY_ID) {
      const legacy = await cachedGet("tartil-v1", asset("model.onnx"));
      if (legacy) {
        onTick("model", legacy.byteLength, legacy.byteLength);
        await cachedPut(cacheName, url, legacy);
        return legacy;
      }
    }
    return loadPackPart(url, "Model", "model", cacheName, onTick, asset("model.onnx"));
  }

  async function ensureSession(): Promise<FeedSession> {
    if (session) return session;
    loadingModel = true;
    micBtn.disabled = true;
    setStatus(() => t("st.model"), () => t("st.modelSub"));
    setProgress(0.02);
    try {
    const ort = await import("onnxruntime-web/wasm");
    const core = await import("@tilawa/core");
    const env = ort.env.wasm;
    env.numThreads = 1;
    env.proxy = true;
    env.wasmPaths = new URL(asset("ort/"), window.location.href).href;
    const got = { model: 0, wasm: 0, corpus: 0 };
    const tot = { ...PACK_SIZES };
    const tick = (key: keyof typeof PACK_SIZES, n: number, total: number) => {
      got[key] = n;
      if (total) tot[key] = total;
      const sum = got.model + got.wasm + got.corpus;
      const all = tot.model + tot.wasm + tot.corpus;
      setProgress(Math.min(0.99, all ? sum / all : 0));
    };
    const wasmUrl = asset("ort/ort-wasm-simd-threaded.wasm");
    const corpusUrl = asset("corpus.json");
    const [model, , corpusBuf] = await Promise.all([
      loadModelBuffer(tick),
      loadPackPart(wasmUrl, "Engine", "wasm", "tartil-wasm", tick),
      loadPackPart(corpusUrl, t("st.lex"), "corpus", "tartil-corpus", tick),
    ]);
    setStatus(() => t("st.lex"), () => t("st.lexSub"));
    let corpus: unknown;
    try {
      corpus = JSON.parse(new TextDecoder().decode(corpusBuf));
    } catch {
      throw new Error(t("err.lex"));
    }
    let created: FeedSession;
    try {
      created = await core.createRecognitionSession({
        ort,
        model,
        corpus,
        stayOnSurah: true,
        config: { outsideJumpCost: 24, commitDwell: 4, backfillRatio: 2 },
        onEvent: (msg: unknown) => {
          if (msg && typeof msg === "object" && "type" in msg) onEvent(msg as ProgressMsg);
        },
      });
    } catch {
      env.proxy = false;
      created = await core.createRecognitionSession({
        ort,
        model,
        corpus,
        stayOnSurah: true,
        config: { outsideJumpCost: 24, commitDwell: 4, backfillRatio: 2 },
        onEvent: (msg: unknown) => {
          if (msg && typeof msg === "object" && "type" in msg) onEvent(msg as ProgressMsg);
        },
      });
    }
    session = created;
    tj.attach(created.zipformer, core as unknown as { encodePhonemes: (t: string) => number[] | null; TOKENS: readonly string[] }, corpus);
    if (created.zipformer) {
      await created.zipformer.setStructural({ ayahOrder: true, similarVerse: true, timing: "pause" });
      // The slip head added false vowel flags on clean qari recordings and caught nothing extra.
      created.zipformer.setSlipHead(false);
      created.zipformer.setMode("correction");
      applyWordStrictness();
    }
    return created;
    } catch (err) {
      throw err;
    } finally {
      loadingModel = false;
      setProgress(null);
    }
  }

  function resample(input: Float32Array, fromRate: number): Float32Array {
    if (fromRate === 16000) return input;
    const ratio = fromRate / 16000;
    const outLen = Math.floor(input.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i += 1) {
      const x = i * ratio;
      const i0 = Math.floor(x);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const f = x - i0;
      out[i] = (input[i0] ?? 0) * (1 - f) + (input[i1] ?? 0) * f;
    }
    return out;
  }

  // The skip / look-alike checks align everything heard since their block start against the expected passage, and
  // setExpected keeps that block. At a surah change on the page the old surah's audio would be judged against the new
  // surah (113:1 and 114:1 open alike: clean 114 got a false substitution and two skipped ayahs), so start a new block
  // there, as the session itself does every 120 s.
  function newStructuralBlock(z: unknown): void {
    const st = (z as { st?: { tokens?: unknown[]; samples?: number; blockTok?: number; blockT0?: number } }).st;
    if (!st || !Array.isArray(st.tokens) || typeof st.samples !== "number") return;
    st.blockTok = st.tokens.length;
    st.blockT0 = st.samples / 16000;
  }

  let expectedKey = "";
  // A page can hold the end of one surah and the start of the next (e.g. page 580: 76:26-31, 77:1-19). The engine's
  // expected passage is one surah and it never relocates out of it, so expect the surah segment the reciter is in and
  // move on to the page's next segment once they reach the current segment's last ayah. The engine skips the basmala
  // before the next surah's first word when it locks.
  function expectPage(at?: { surah: number; ayah: number }): void {
    if (retryKey || !session?.zipformer) return;
    const list = pages[page - 1] ?? [];
    if (!list.length) return;
    const segs: { surah: number; first: number; last: number }[] = [];
    for (const [s, a] of list) {
      const seg = segs[segs.length - 1];
      if (seg && seg.surah === s) seg.last = Math.max(seg.last, a);
      else segs.push({ surah: s, first: a, last: a });
    }
    let k = 0;
    if (at) {
      const i = segs.findIndex((x) => x.surah === at.surah);
      if (i >= 0) k = at.ayah >= segs[i].last && i + 1 < segs.length ? i + 1 : i;
    } else if (expectedKey) {
      // Keep the segment already expected on this page (another call without a position must not rewind it).
      const i = segs.findIndex((x) => expectedKey.startsWith(`${x.surah}:${x.first}:`));
      if (i >= 0) k = i;
    }
    const seg = segs[k];
    const total = pageIndex?.ayahs[seg.surah - 1] ?? seg.last;
    // Expect this segment plus the next ayah, which still turns the page. A window to the end of a long surah made each
    // pause allocate gigabytes in the recitation checks and froze or crashed the tab.
    const end = Math.min(total, seg.last + 1);
    const key = `${seg.surah}:${seg.first}:${end}`;
    if (expectedKey === key) return;
    const crossing = Boolean(at) && expectedKey !== "" && !expectedKey.startsWith(`${seg.surah}:`);
    expectedKey = key;
    session.zipformer.setExpected({ surah: seg.surah, ayah: seg.first, ayahEnd: end });
    if (crossing) newStructuralBlock(session.zipformer);
  }

  function retryHit(key: string): boolean {
    if (!retryKey) return false;
    if (retryKey.endsWith(":*")) {
      const [s, a] = retryKey.split(":");
      const last = wordList(Number(s), Number(a)).length - 1;
      return key === `${s}:${a}:${last}`;
    }
    return key === retryKey;
  }

  function isRetryWord(key: string): boolean {
    if (!retryKey) return false;
    if (retryKey.endsWith(":*")) {
      const prefix = retryKey.slice(0, -1);
      if (!key.startsWith(prefix)) return false;
      const [s, a] = retryKey.split(":");
      return Number(key.slice(prefix.length)) < wordList(Number(s), Number(a)).length;
    }
    return key === retryKey;
  }

  function markRetry(): void {
    sheet.querySelectorAll<HTMLElement>(".w").forEach((el) => {
      el.classList.toggle("retry", isRetryWord(el.dataset.k || ""));
    });
  }

  function showSummary(fixed: boolean, nHeard: number, found: Miss[]): void {
    sumN.textContent = t("sum.n", { h: nHeard, e: found.length });
    sumList.replaceChildren();
    found.forEach((m) => {
      const li = document.createElement("li");
      const name = surahName(m.s);
      li.textContent = `${name} ${m.a}${wordAt(m.w)} — ${kindName(m.kind)}`;
      sumList.appendChild(li);
    });
    sumBox.hidden = false;
    setStatus(() => fixed ? t("st.fixed") : t("sum.title"), sumN.textContent || "");
  }

  function setLevel(raw: Float32Array): void {
    let acc = 0;
    const step = 8;
    for (let i = 0; i < raw.length; i += step) acc += raw[i] * raw[i];
    const rms = Math.sqrt(acc / Math.max(1, Math.ceil(raw.length / step)));
    watchLevel(rms);
  }

  let tapGain: ((room: number) => void) | null = null;
  let calUntil = 0;
  let calSum = 0;
  let calN = 0;
  let calDone = false;
  let quietSince = 0;
  function watchLevel(rms: number): void {
    levelFill.style.width = `${Math.min(100, Math.round(rms * 900))}%`;
    const now = performance.now();
    if (!calDone) {
      if (!calUntil) calUntil = now + 2000;
      calSum += rms;
      calN += 1;
      if (now < calUntil) return;
      calDone = true;
      const avg = calSum / Math.max(1, calN);
      if (avg < 0.012) {
        quietOn = true;
        sub.textContent = t("lvl.close");
      } else {
        const room = Math.min(12, Math.max(1, 0.08 / avg));
        try {
          localStorage.setItem("tartil.gain", room.toFixed(2));
        } catch {
          /* ignore quota */
        }
        tapGain?.(room);
        quietOn = false;
        if (!retryKey) {
          liveSub = t("lvl.ok");
          sub.textContent = liveSub;
        }
      }
    }
    if (rms < 0.008) {
      if (!quietSince) quietSince = now;
      if (!quietOn && now - quietSince > 1500) {
        quietOn = true;
        sub.textContent = t("lvl.none");
      }
      return;
    }
    quietSince = 0;
    if (quietOn && calDone) {
      quietOn = false;
      sub.textContent = liveSub;
    }
  }

  async function lockWake(): Promise<void> {
    try {
      wake = await navigator.wakeLock?.request("screen") ?? null;
    } catch {
      wake = null;
    }
  }

  let liveCtx: AudioContext | null = null;
  let liveTrack: MediaStreamTrack | null = null;
  let micLost = false;
  async function onMicLost(): Promise<void> {
    if (!micOn || micLost) return;
    micLost = true;
    quietStop = true;
    try {
      await stopMic();
    } finally {
      quietStop = false;
      micLost = false;
    }
    setStatus(() => t("st.micStopped"), () => t("st.micStoppedSub"));
  }
  function onVisible(): void {
    if (document.visibilityState !== "visible") return;
    void liveCtx?.resume().catch(() => undefined);
    void voice?.resume().catch(() => undefined);
    if (micOn) {
      void lockWake();
      if (liveTrack && liveTrack.readyState === "ended") void onMicLost();
    }
  }
  function onPageShow(): void {
    onVisible();
  }
  function onPageHide(): void {
    /* iOS may suspend the context; we resume on show. */
  }
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("pagehide", onPageHide);

  let voice: AudioContext | null = null;
  let voiceStop: (() => void) | null = null;

  function stopClip(): void {
    playGen += 1;
    try {
      voiceStop?.();
    } catch {
      /* already stopped */
    }
    voiceStop = null;
  }

  async function retryTajwid(s: number, a: number): Promise<void> {
    quietStop = true;
    if (micOn || audioStop) await stopMic();
    quietStop = false;
    retryKey = `${s}:${a}:*`;
    const target = pageOf.get(`${s}:${a}`);
    if (target) page = clampPage(target);
    await render();
    try {
      await startMic();
    } catch {
      retryKey = "";
      root.classList.remove("mic", "retry");
      return;
    }
    const name = surahName(s);
    setStatus(() => t("st.repeat"), () => t("st.repeatSub", { p: `${surahName(s)} ${a}` }));
  }

  async function beginRetry(m: Miss): Promise<void> {
    const keepQueue = queueOn;
    quietStop = true;
    if (micOn || audioStop) await stopMic();
    quietStop = false;
    queueOn = keepQueue;
    stopClip();
    if (!alive) return;
    retryKey = m.w >= 0 ? `${m.s}:${m.a}:${m.w}` : `${m.s}:${m.a}:*`;
    missBox.hidden = true;
    missBtn.setAttribute("aria-expanded", "false");
    sumBox.hidden = true;
    const target = pageOf.get(`${m.s}:${m.a}`);
    if (target) page = clampPage(target);
    const name = surahName(m.s);
    const place = `${name} ${m.a}${wordAt(m.w)}`;
    if (!micOn) {
      await render();
      try {
        await startMic();
      } catch (err: unknown) {
        micOn = false;
        retryKey = "";
        root.classList.remove("mic", "retry");
        levelBar.classList.remove("on");
        const message = err instanceof Error ? err.message : t("err.mic");
        setStatus(() => t("st.failed"), message);
      }
      return;
    }
    heard = 0;
    takeMisses = [];
    ayahChecked.clear();
    root.classList.remove("mic");
    root.classList.add("retry");
    session?.reset();
    session?.zipformer?.setMode("correction");
    shown.clear();
    freshKey = "";
    clearTimers();
    expectedSurah = 0;
    session?.zipformer?.setExpected({ surah: m.s, ayah: m.a, ayahEnd: m.a });
    expectedSurah = m.s;
    await render();
    markRetry();
    setStatus(() => t("st.repeat"), () => t("st.onlyHere", { p: place }));
  }

  async function startMic(): Promise<void> {
    if (opening || micOn) return;
    opening = true;
    stopClip();
    try {
    await settlingMic;
    if (micOn) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(() => t("st.noMic"), () => t("st.noMicSub"));
      return;
    }
    const engine = await ensureSession();
    engine.reset();
    tj.newTake();
    engine.zipformer?.setMode("correction");
    applyWordStrictness();
    lastHeardS = 0;
    lastHeardA = 0;
    shown.clear();
    freshKey = "";
    clearTimers();
    heard = 0;
    takeMisses = [];
    ayahChecked.clear();
    ayahLock = "";
    lockDirty = false;
    rearm = false;
    sumBox.hidden = true;
    expectedSurah = 0;
    expectedKey = "";
    const retrying = Boolean(retryKey);
    if (retrying) {
      const [s, a] = retryKey.split(":").map(Number);
      engine.zipformer?.setExpected({ surah: s, ayah: a, ayahEnd: a });
      expectedKey = `${s}:${a}:${a}`;
      expectedSurah = s;
    } else {
      const here = pages[page - 1]?.[0]?.[0];
      if (here) expectPage();
    }
    micOn = true;
    seqS = 0;
    seqA = 0;
    seqDone = false;
    seqHold = false;
    clipMark = micPos;
    calUntil = 0;
    calSum = 0;
    calN = 0;
    calDone = false;
    quietSince = 0;
    quietOn = false;
    root.classList.toggle("mic", !retrying);
    root.classList.toggle("retry", retrying);
    micBtn.setAttribute("aria-pressed", "true");
    levelBar.classList.add("on");
    void lockWake();
    applyShown();
    markRetry();
    if (retrying) {
      const [s, a, w] = retryKey.split(":");
      const name = surahName(Number(s));
      const word = w === "*" ? "" : wordAt(Number(w));
      setStatus(() => t("st.repeat"), () => t("st.onlyHere", { p: `${surahName(Number(s))} ${a}${word}` }));
    } else {
      setStatus(() => t("st.listening"), () => t("st.hidden"));
    }
    const micId = micPick.value;
    const audio = {
      channelCount: { ideal: 1 },
      sampleRate: { ideal: 16000 },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      googEchoCancellation: false,
      googEchoCancellation2: false,
      googDAEchoCancellation: false,
      googNoiseSuppression: false,
      googNoiseSuppression2: false,
      googAutoGainControl: false,
      googAutoGainControl2: false,
      googHighpassFilter: false,
      googTypingNoiseDetection: false,
      ...(micId ? { deviceId: { exact: micId } } : {}),
    } as MediaTrackConstraints;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio });
    } catch (err) {
      if (!micId) throw err;
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { ...audio, deviceId: undefined } as MediaTrackConstraints,
      });
    }
    if (!micOn) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const track = stream.getAudioTracks()[0];
    liveTrack = track || null;
    if (track) {
      try {
        await track.applyConstraints({
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        });
      } catch {
        /* the browser keeps its own defaults */
      }
      track.addEventListener("ended", () => { void onMicLost(); });
    }
    let ctx: AudioContext;
    try {
      ctx = new AudioContext({ sampleRate: 16000, latencyHint: "interactive" });
    } catch {
      ctx = new AudioContext({ latencyHint: "interactive" });
    }
    liveCtx = ctx;
    await ctx.resume();
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));
    if (!micOn) {
      stream.getTracks().forEach((t) => t.stop());
      if (liveCtx === ctx) liveCtx = null;
      liveTrack = null;
      void ctx.close();
      return;
    }
    const source = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    let pending = new Float32Array(0);
    let feeding = false;
    let feedDone: (() => void) | null = null;
    const chunkSize = 7680;
    const pump = () => {
      if (!micOn || feeding || pending.length < chunkSize) {
        if (!feeding && !micOn) feedDone?.();
        return;
      }
      const slice = pending.slice(0, chunkSize);
      if (pending.length > chunkSize * 2) tj.dropped();
      pending = pending.length > chunkSize * 2 ? pending.slice(pending.length - chunkSize) : pending.slice(chunkSize);
      feeding = true;
      void engine.feed(slice).then(() => {
        feeding = false;
        if (!micOn) {
          feedDone?.();
          return;
        }
        window.setTimeout(pump, 20);
      }, (err: unknown) => {
        feeding = false;
        const message = err instanceof Error && err.message ? err.message : t("st.feedErr");
        setStatus(() => t("st.failed"), () => message || t("st.feedErr"));
        if (!micOn) feedDone?.();
        else window.setTimeout(pump, 40);
      });
    };
    const pushPcm = (next: Float32Array) => {
      if (!micOn || !next.length) return;
      for (let i = 0; i < next.length; i += 1) micRing[(micPos + i) % CLIP_RING] = next[i];
      micPos += next.length;
      if (pending.length > chunkSize * 2) {
        tj.dropped();
        pending = pending.slice(pending.length - chunkSize * 2);
      }
      const merged = new Float32Array(pending.length + next.length);
      merged.set(pending, 0);
      merged.set(next, pending.length);
      pending = merged;
      if (!feeding) pump();
    };
    let proc: ScriptProcessorNode | null = null;
    let tap: AudioWorkletNode | null = null;
    try {
      await ctx.audioWorklet.addModule(asset("mic-worklet.js"));
      if (!micOn) {
        stream.getTracks().forEach((t) => t.stop());
        if (liveCtx === ctx) liveCtx = null;
        liveTrack = null;
        void ctx.close();
        return;
      }
      tap = new AudioWorkletNode(ctx, "mic-tap");
      tapGain = (room) => tap?.port.postMessage({ room });
      const savedGain = Number(localStorage.getItem("tartil.gain") || "1");
      if (savedGain > 1) tap.port.postMessage({ room: savedGain });
      tap.port.onmessage = (ev: MessageEvent<Float32Array | { rms?: number; pcm?: Float32Array }>) => {
        if (!micOn) return;
        const data = ev.data;
        const chunk = data instanceof Float32Array ? data : data.pcm;
        if (!chunk) return;
        if (data instanceof Float32Array) setLevel(chunk);
        else if (typeof data.rms === "number") watchLevel(data.rms);
        pushPcm(chunk);
      };
      source.connect(tap);
      tap.connect(gain);
      void listMics();
    } catch {
      proc = ctx.createScriptProcessor(4096, 1, 1);
      let fbEnv = 0.0002;
      let fbGain = 1;
      let fbX1 = 0;
      let fbY1 = 0;
      const hp = Math.exp((-2 * Math.PI * 80) / 16000);
      proc.onaudioprocess = (ev) => {
        if (!micOn) return;
        const raw = ev.inputBuffer.getChannelData(0);
        setLevel(raw);
        const pcm = resample(raw, ctx.sampleRate);
        const shaped = new Float32Array(pcm.length);
        for (let i = 0; i < pcm.length; i += 1) {
          const y = hp * (fbY1 + pcm[i] - fbX1);
          fbX1 = pcm[i];
          fbY1 = y;
          fbEnv = fbEnv * 0.9992 + y * y * 0.0008;
          const rms = Math.sqrt(fbEnv);
          const target = rms > 0.0011 ? Math.min(18, 0.12 / rms) : 1;
          const rate = target > fbGain ? 0.012 : 0.00035;
          fbGain += (target - fbGain) * rate;
          shaped[i] = Math.tanh(y * fbGain);
        }
        pushPcm(shaped);
      };
      source.connect(proc);
      proc.connect(gain);
    }
    gain.connect(ctx.destination);
    audioStop = async () => {
      if (proc) proc.onaudioprocess = null;
      try {
        proc?.disconnect();
        tap?.disconnect();
        source.disconnect();
        gain.disconnect();
      } catch {
        /* already stopped */
      }
      stream.getTracks().forEach((t) => t.stop());
      if (liveCtx === ctx) liveCtx = null;
      if (liveTrack && stream.getTracks().includes(liveTrack)) liveTrack = null;
      void ctx.close();
      await Promise.race([
        new Promise<void>((resolve) => {
          if (!feeding) resolve();
          else feedDone = resolve;
        }),
        new Promise((resolve) => window.setTimeout(resolve, 700)),
      ]);
      try {
        await Promise.race([
          (async () => {
            const phase = engine.zipformer?.correction?.state?.phase;
            if (phase && phase !== "idle") engine.zipformer?.correct("review_later");
            const flushed = await engine.stop();
            if (Array.isArray(flushed)) {
              for (const msg of flushed) {
                if (msg && typeof msg === "object" && "type" in msg) onEvent(msg as ProgressMsg);
              }
            }
            engine.reset();
          })(),
          new Promise((resolve) => window.setTimeout(resolve, 900)),
        ]);
      } catch {
        /* flush is best-effort */
      }
    };
    } finally {
      opening = false;
    }
  }

  async function stopMic(): Promise<void> {
    settleClip(true);
    stopClip();
    if (!micOn && !audioStop) return;
    // Sərt / Çətin: review the last ayah before the take's miss list is snapshotted.
    checkLastHeardAyah();
    micOn = false;
    micBtn.disabled = false;
    root.classList.remove("mic", "retry");
    micBtn.setAttribute("aria-pressed", "false");
    levelBar.classList.remove("on");
    levelFill.style.width = "0";
    clearTimers();
    shown.clear();
    freshKey = "";
    expectedSurah = 0;
    const fixed = retryClose;
    retryClose = false;
    retryKey = "";
    ayahLock = "";
    lockDirty = false;
    rearm = false;
    const nHeard = heard;
    const found = takeMisses.slice();
    heard = 0;
    takeMisses = [];
    ayahChecked.clear();
    setProgress(null);
    void wake?.release();
    wake = null;
    if (!quietStop) {
      if (nHeard || found.length) showSummary(fixed, nHeard, found);
      else setStatus(() => t("st.read"), () => t("st.micOff"));
    }
    render();
    const stop = audioStop;
    audioStop = null;
    if (!stop) return;
    settlingMic = Promise.race([
      stop().then(() => undefined).catch(() => undefined),
      new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
    ]);
    await settlingMic;
  }

  micBtn.addEventListener("click", () => {
    if (micOn || audioStop) {
      void stopMic();
      return;
    }
    if (loadingModel) return;
    void startMic().catch((err: unknown) => {
        micOn = false;
        retryKey = "";
        root.classList.remove("mic", "retry");
        levelBar.classList.remove("on");
        const message = err instanceof Error ? err.message : t("err.mic");
        const denied = /denied|permission|notallowed/i.test(message);
        setStatus(
          () => denied ? t("st.perm") : t("st.failed"),
          () => denied ? t("st.permSub") : message,
        );
        setProgress(null);
      })
      .finally(() => {
        micBtn.disabled = false;
      });
  });

  // Surah / page sheet (the header has no page box or arrows; pages turn by swipe or the arrow keys).
  const navSheet = need<HTMLElement>(".t-nav");
  const navBtn = need<HTMLButtonElement>(".t-surah-btn");
  function closeNav(): void {
    if (navSheet.hidden) return;
    navSheet.hidden = true;
    navBtn.setAttribute("aria-expanded", "false");
  }
  navBtn.addEventListener("click", () => {
    if (!navSheet.hidden) {
      closeNav();
      return;
    }
    closeSheet();
    pageInput.value = String(page);
    navSheet.hidden = false;
    navBtn.setAttribute("aria-expanded", "true");
  });
  navSheet.addEventListener("click", (e) => {
    const tg = e.target as HTMLElement;
    if (tg === navSheet || tg.closest(".t-nav-x")) closeNav();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
    trapFocus(navSheet, e);
  });
  need<HTMLFormElement>(".t-goform").addEventListener("submit", (e) => {
    e.preventDefault();
    const n = Number(pageInput.value.trim());
    if (!pageInput.value.trim() || !Number.isFinite(n)) {
      pageInput.value = String(page);
      return;
    }
    closeNav();
    go(n);
  });
  surahSel.addEventListener("change", () => {
    const n = Number(surahSel.value);
    const target = surahPage.get(n);
    if (target) {
      pickedSurah = n;
      closeNav();
      go(target);
    }
  });

  // Swipe turns the page like a printed mushaf: the next page lies to the left, so a swipe to the right goes
  // forward. Only a clear one-finger horizontal swipe counts (vertical scroll and pinch are left alone).
  let sx = 0;
  let sy = 0;
  let st0 = 0;
  let multi = false;
  pageEl.addEventListener("touchstart", (ev) => {
    multi = ev.touches.length > 1;
    const t = ev.changedTouches[0];
    if (!t || multi) return;
    sx = t.clientX;
    sy = t.clientY;
    st0 = performance.now();
  }, { passive: true });
  pageEl.addEventListener("touchmove", (ev) => {
    if (ev.touches.length > 1) multi = true;
  }, { passive: true });
  pageEl.addEventListener("touchend", (ev) => {
    const t = ev.changedTouches[0];
    if (!t || multi || ev.touches.length) return;
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    if (performance.now() - st0 > 900) return;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(page + (dx > 0 ? 1 : -1));
  }, { passive: true });

  root.querySelector(".t-next")?.addEventListener("click", () => go(page + 1));
  root.querySelector(".t-prev")?.addEventListener("click", () => go(page - 1));
  window.addEventListener("keydown", onKey);
  function onHash(): void {
    if (!hashMode) return;
    const n = Number((location.hash || "").replace("#", ""));
    if (n && Number.isFinite(n)) {
      if (clampPage(n) !== page) go(n);
      else if (location.hash !== `#${page}`) history.replaceState(null, "", `#${page}`);
    } else history.replaceState(null, "", `#${page}`);
  }
  window.addEventListener("hashchange", onHash);
  function onKey(ev: KeyboardEvent): void {
    const tg = ev.target as HTMLElement | null;
    if (tg && (tg.tagName === "INPUT" || tg.tagName === "SELECT" || tg.tagName === "TEXTAREA")) return;
    if (ev.key === "ArrowLeft") go(page + 1);
    if (ev.key === "ArrowRight") go(page - 1);
  }

  function applyIndex(idx: IndexFile): void {
    pages = idx.pages.map((list) => list.map((pair) => [pair[0] ?? 0, pair[1] ?? 0]));
    pageOf.clear();
    surahPage.clear();
    pages.forEach((ayahs, i) => {
      for (const pair of ayahs) {
        const surah = pair[0] ?? 0;
        const ayah = pair[1] ?? 0;
        const key = `${surah}:${ayah}`;
        if (!pageOf.has(key)) pageOf.set(key, i + 1);
        if (ayah === 1 && !surahPage.has(surah)) surahPage.set(surah, i + 1);
      }
    });
  }
  for (let i = 1; i <= 114; i += 1) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${i}. ${surahName(i)}`;
    surahSel.appendChild(opt);
  }
  let start = 1;
  let fromHash = 0;
  if (hashMode) {
    fromHash = Number((location.hash || "").replace("#", ""));
    if (fromHash) start = fromHash;
  }
  let savedPage = 0;
  let readPage = 0;
  try {
    savedPage = Number(localStorage.getItem("tartil.page") || "");
    readPage = Number(localStorage.getItem("tartil.read") || "") || savedPage;
    if (!localStorage.getItem("tartil.read") && savedPage) localStorage.setItem("tartil.read", String(savedPage));
    if (!hashMode && savedPage) start = savedPage;
    if (hashMode && !fromHash && savedPage) start = savedPage;
  } catch {
    /* ignore */
  }
  const explicit = hashMode && fromHash > 0 && fromHash !== savedPage;
  // Open on the last recited/visited page (tartil.read, then tartil.page). The mistake badge and Düzəlt still jump.
  if (!explicit) start = readPage || savedPage || start;
  page = clampPage(start);
  function showBack(): void {
    const read = Number(localStorage.getItem("tartil.read") || "") || readPage;
    backBtn.hidden = !read || read === page;
  }
  backBtn.addEventListener("click", () => {
    const read = Number(localStorage.getItem("tartil.read") || "") || readPage;
    if (read) go(read);
  });
  // UI language: panels, buttons and messages only; the mushaf text is never touched.
  const langSel = need<HTMLSelectElement>(".t-lang");
  for (const l of LANGS) {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent = l.name;
    opt.lang = l.code;
    langSel.appendChild(opt);
  }
  function refreshLang(): void {
    paintMine();
    const lang = getLang();
    langSel.value = lang;
    document.documentElement.lang = lang;
    root.classList.toggle("ui-rtl", isRtl());
    applyI18n(root);
    root.querySelectorAll<HTMLElement>(".t-madd-only").forEach((el) => {
      el.textContent = `(${t("sense.cetin")})`;
    });
    [...surahSel.options].forEach((opt) => {
      const n = Number(opt.value);
      if (n) opt.textContent = `${n}. ${surahName(n)}`;
    });
    applySense(sense);
    paintMisses();
    paintToday();
    if (micPick.options[0] && !micPick.options[0].value) micPick.options[0].textContent = t("mic");
    tj.relabel();
    paintPageNo();
    paintTurns();
    if (!need<HTMLElement>(".t-fontfail").hidden) paintFontFail(false);
    redrawStatus();
  }
  langSel.addEventListener("change", () => {
    const v = langSel.value;
    if (LANGS.some((l) => l.code === v)) setLang(v as Lang);
  });
  onLang(refreshLang);
  refreshLang();
  void restoreClips();
  setStatus(() => t("loading"), () => t("st.readSub"));
  void (async () => {
    try {
      applyIndex(await loadPageIndex());
      precacheUrls([asset("pg/index.json")]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("err.open", { x: "index" });
      setStatus(() => t("st.failed"), message);
      return;
    }
    if (!alive) return;
    if (!explicit) {
      const read = Number(localStorage.getItem("tartil.read") || "") || readPage || savedPage;
      if (read) start = read;
    }
    page = clampPage(start);
    setStatus(() => t("st.read"), () => t("st.readSub"));
    await render();
  })();
  const onResize = () => fit();
  window.addEventListener("resize", onResize);
  const barWatch = typeof ResizeObserver === "function" ? new ResizeObserver(() => fit()) : null;
  const barEl = root.querySelector<HTMLElement>(".t-bar");
  if (barWatch && barEl) barWatch.observe(barEl);
  // Warm the card font once so tajwid notes render offline too (the service worker keeps the file).
  if (document.fonts) void document.fonts.load('24px "TjQuran"', "\u0643").catch(() => undefined);
  // Reciter mp3s are gone: free the storage the old audio cache used.
  if ("caches" in window) void caches.delete("tartil-audio").catch(() => undefined);
  if ("serviceWorker" in navigator) {
    const sw = asset("sw.js");
    void navigator.serviceWorker.register(sw).catch(() => undefined);
  }

  return () => {
    alive = false;
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("hashchange", onHash);
    window.removeEventListener("wheel", markUserScroll);
    window.removeEventListener("touchmove", markUserScroll);
    window.removeEventListener("keydown", onScrollKey);
    window.clearInterval(followTimer);
    window.removeEventListener("resize", onResize);
    barWatch?.disconnect();
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("pagehide", onPageHide);
    clearTimers();
    void wake?.release();
    if (micOn) void stopMic();
  };
}

if (typeof document !== "undefined") {
  const boot = document.getElementById("app");
  if (boot && boot.dataset.tartil !== "1") {
    boot.dataset.tartil = "1";
    mountTartil(boot, { hash: true });
  }
}
