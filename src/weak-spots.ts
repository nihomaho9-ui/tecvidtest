/**
 * Local weak-spots map: mistakes per ayah/word, scored for heat and review.
 * Everything stays on the device (localStorage). No server.
 */

export type WeakSpot = {
  s: number;
  a: number;
  w: number;
  kind: string;
  hits: number;
  lastMiss: number;
  lastOk: number;
  lastPractised: number;
  score: number;
};

export const WEAK_KEY = "tartil.weakspots.v1";
export const WEAK_VERSION = 1;
/** Drop a spot once its score falls below this after a correct recitation. */
export const DECAY_DROP = 0.5;
export const DECAY_FACTOR = 0.5;
export const MAX_SPOTS = 400;
/** Recently practised ayahs wait this long (ms) before they are suggested again. */
export const SPACE_MS = 12 * 60 * 60 * 1000;

export type LegacyMiss = { s: number; a: number; w: number; kind: string; n?: number; t?: number };

export function spotKey(s: number, a: number, w: number, kind = ""): string {
  return kind ? `${s}:${a}:${w}:${kind}` : `${s}:${a}:${w}`;
}

export function noteMiss(spots: WeakSpot[], s: number, a: number, w: number, kind: string, now = Date.now()): WeakSpot[] {
  if (!s || !a) return spots;
  const k = kind || "error";
  const i = spots.findIndex((x) => x.s === s && x.a === a && x.w === w && x.kind === k);
  if (i >= 0) {
    const x = spots[i];
    spots[i] = {
      ...x,
      hits: x.hits + 1,
      lastMiss: now,
      lastPractised: now,
      score: Math.min(10, x.score + 1),
    };
  } else {
    spots.push({ s, a, w, kind: k, hits: 1, lastMiss: now, lastOk: 0, lastPractised: now, score: 1 });
  }
  if (spots.length > MAX_SPOTS) {
    spots.sort((p, q) => q.lastMiss - p.lastMiss);
    spots.splice(MAX_SPOTS);
  }
  return spots;
}

/** Decay on a correct recitation. Word -1 decays every spot in that ayah. */
export function noteOk(spots: WeakSpot[], s: number, a: number, w = -1, now = Date.now()): WeakSpot[] {
  const next: WeakSpot[] = [];
  for (const x of spots) {
    if (x.s !== s || x.a !== a || (w >= 0 && x.w !== w && x.w !== -1)) {
      next.push(x);
      continue;
    }
    const score = x.score * DECAY_FACTOR;
    if (score <= DECAY_DROP) continue;
    next.push({ ...x, score, lastOk: now, lastPractised: now });
  }
  return next;
}

export function intensity(score: number): 0 | 1 | 2 | 3 {
  if (score >= 3) return 3;
  if (score >= 1.5) return 2;
  if (score >= DECAY_DROP) return 1;
  return 0;
}

/** Word heat: use the strongest remaining spot on that word (or the whole ayah). */
export function wordHeat(spots: readonly WeakSpot[], s: number, a: number, w: number): 0 | 1 | 2 | 3 {
  let best = 0;
  for (const x of spots) {
    if (x.s !== s || x.a !== a) continue;
    if (x.w !== w && x.w !== -1) continue;
    const lv = intensity(x.score);
    if (lv > best) best = lv;
  }
  return best as 0 | 1 | 2 | 3;
}

export function listSorted(spots: readonly WeakSpot[], now = Date.now()): WeakSpot[] {
  return [...spots].sort((p, q) => q.score - p.score || q.lastMiss - p.lastMiss || p.s - q.s || p.a - q.a || p.w - q.w);
}

export type Suggestion = { s: number; a: number; score: number; hits: number; lastPractised: number; words: number };

export function suggestions(spots: readonly WeakSpot[], now = Date.now(), limit = 5): Suggestion[] {
  const by = new Map<string, Suggestion>();
  for (const x of spots) {
    const k = `${x.s}:${x.a}`;
    const cur = by.get(k);
    if (!cur) {
      by.set(k, { s: x.s, a: x.a, score: x.score, hits: x.hits, lastPractised: x.lastPractised, words: 1 });
    } else {
      cur.score += x.score;
      cur.hits += x.hits;
      cur.lastPractised = Math.max(cur.lastPractised, x.lastPractised);
      cur.words += 1;
    }
  }
  const all = [...by.values()];
  const ready = all.filter((x) => now - x.lastPractised >= SPACE_MS);
  const pool = ready.length ? ready : all;
  return pool.sort((p, q) => q.score - p.score || p.lastPractised - q.lastPractised).slice(0, limit);
}

export function migrateMisses(misses: readonly LegacyMiss[], now = Date.now()): WeakSpot[] {
  const spots: WeakSpot[] = [];
  for (const m of misses) {
    if (!m || !m.s || !m.a) continue;
    const n = Math.max(1, m.n || 1);
    const t = m.t || now;
    spots.push({
      s: m.s,
      a: m.a,
      w: m.w ?? -1,
      kind: m.kind || "error",
      hits: n,
      lastMiss: t,
      lastOk: 0,
      lastPractised: t,
      score: Math.min(10, n),
    });
  }
  return spots;
}

export function exportJson(spots: readonly WeakSpot[], now = Date.now()): string {
  return JSON.stringify({ v: WEAK_VERSION, exported: new Date(now).toISOString(), spots }, null, 2);
}

export function importJson(raw: string, existing: readonly WeakSpot[] = []): WeakSpot[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("invalid");
  }
  const list = Array.isArray(data) ? data : (data as { spots?: unknown })?.spots;
  if (!Array.isArray(list)) throw new Error("invalid");
  const map = new Map<string, WeakSpot>();
  for (const x of existing) map.set(spotKey(x.s, x.a, x.w, x.kind), { ...x });
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Partial<WeakSpot>;
    const s = Number(o.s);
    const a = Number(o.a);
    if (!s || !a) continue;
    const w = Number(o.w ?? -1);
    const kind = String(o.kind || "error");
    const incoming: WeakSpot = {
      s,
      a,
      w,
      kind,
      hits: Math.max(1, Number(o.hits) || 1),
      lastMiss: Number(o.lastMiss) || 0,
      lastOk: Number(o.lastOk) || 0,
      lastPractised: Number(o.lastPractised) || Number(o.lastMiss) || 0,
      score: Math.min(10, Math.max(0, Number(o.score) || 1)),
    };
    const k = spotKey(s, a, w, kind);
    const prev = map.get(k);
    if (!prev) map.set(k, incoming);
    else {
      map.set(k, {
        ...prev,
        hits: Math.max(prev.hits, incoming.hits),
        lastMiss: Math.max(prev.lastMiss, incoming.lastMiss),
        lastOk: Math.max(prev.lastOk, incoming.lastOk),
        lastPractised: Math.max(prev.lastPractised, incoming.lastPractised),
        score: Math.max(prev.score, incoming.score),
      });
    }
  }
  return [...map.values()];
}

export function loadSpots(storage: { getItem(k: string): string | null } = globalThis.localStorage, misses: readonly LegacyMiss[] = []): WeakSpot[] {
  try {
    const raw = storage?.getItem?.(WEAK_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { spots?: WeakSpot[] } | WeakSpot[];
      const list = Array.isArray(data) ? data : data.spots;
      if (Array.isArray(list) && list.length) return list.filter((x) => x && x.s && x.a);
    }
  } catch {
    /* ignore */
  }
  return migrateMisses(misses);
}

export function saveSpots(spots: readonly WeakSpot[], storage: { setItem(k: string, v: string): void } = globalThis.localStorage): void {
  try {
    storage.setItem(WEAK_KEY, JSON.stringify({ v: WEAK_VERSION, spots }));
  } catch {
    /* ignore quota */
  }
}

export function toMisses(spots: readonly WeakSpot[]): LegacyMiss[] {
  return listSorted(spots).map((x) => ({ s: x.s, a: x.a, w: x.w, kind: x.kind, n: x.hits, t: x.lastMiss }));
}
