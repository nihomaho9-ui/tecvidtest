/**
 * Hifz reveal gating and auto-locate confidence.
 * Words are revealed only on a confident "ok" verdict. Unsure/wrong stay hidden.
 * Ideas (not code) from public recitation UIs: treat "unsure" as not confirmed,
 * and only auto-jump a global locate when the search is decisive and close.
 */

export type GateVerdict = {
  surah: number;
  ayah: number;
  word: number;
  state: string;
  distance: number;
  heardRatio: number;
  margin: number;
};

export type SearchHit = {
  surah: number;
  ayah: number;
  word: number;
  distance: number;
};

export type SearchResult = {
  hits: SearchHit[];
  decisive: boolean;
};

/** Tilawa okDistance / minHeardFraction / minMargin. Unsure is never enough to reveal. */
export const REVEAL_MAX_DISTANCE = 0.15;
export const REVEAL_MIN_HEARD = 0.34;
export const REVEAL_MIN_MARGIN = 0.35;

/** Auto-jump when the global search is this close; otherwise prompt. */
export const AUTO_LOCATE_DISTANCE = 0.18;
export const PROMPT_LOCATE_DISTANCE = 0.35;
export const LOCATE_RIVAL_MARGIN = 0.1;

export function canReveal(v: GateVerdict): boolean {
  return (
    v.state === "ok" &&
    v.distance <= REVEAL_MAX_DISTANCE &&
    v.heardRatio >= REVEAL_MIN_HEARD &&
    v.margin >= REVEAL_MIN_MARGIN
  );
}

/** Mark in red without revealing the letters. Skipped with almost no audio is a miss. */
export function isWrongMark(v: GateVerdict): boolean {
  if (v.state === "wrong") return true;
  if (v.state === "skipped" && v.heardRatio < 0.2) return true;
  return false;
}

export function revealedIndices(verdicts: readonly GateVerdict[], surah: number, ayah: number): number[] {
  return verdicts
    .filter((v) => v.surah === surah && v.ayah === ayah && canReveal(v))
    .map((v) => v.word)
    .sort((a, b) => a - b);
}

export function wrongIndices(verdicts: readonly GateVerdict[], surah: number, ayah: number): number[] {
  return verdicts
    .filter((v) => v.surah === surah && v.ayah === ayah && isWrongMark(v) && !canReveal(v))
    .map((v) => v.word)
    .sort((a, b) => a - b);
}

/** Legacy reveal set: cursor fill + ok/unsure matched_indices. Used only for before/after benches. */
export function legacyRevealIndices(matched: readonly number[], wordIndex: number): number[] {
  const idx = new Set<number>(matched);
  for (let i = 0; i <= wordIndex; i += 1) idx.add(i);
  return [...idx].filter((i) => i >= 0).sort((a, b) => a - b);
}

export function locateLevel(distance: number, decisive: boolean, rivalDistance?: number): "auto" | "prompt" | "none" {
  if (!(distance <= PROMPT_LOCATE_DISTANCE)) return "none";
  const margin = rivalDistance != null ? rivalDistance - distance : 1;
  const strong = decisive || margin >= LOCATE_RIVAL_MARGIN;
  if (!strong) return "none";
  if (decisive && distance <= AUTO_LOCATE_DISTANCE) return "auto";
  return "prompt";
}

export function isNearbyAyah(
  fromS: number,
  fromA: number,
  toS: number,
  toA: number,
  fromLast?: number,
): boolean {
  if (!fromS || !toS) return false;
  if (fromS === toS && Math.abs(fromA - toA) <= 1) return true;
  if (toS === fromS + 1 && toA === 1 && fromLast != null && fromA === fromLast) return true;
  if (fromS === toS + 1 && fromA === 1 && fromLast != null && toA === fromLast) return true;
  return false;
}

export function pickLocate(result: SearchResult | null | undefined): {
  hit: SearchHit;
  level: "auto" | "prompt";
} | null {
  const hit = result?.hits[0];
  if (!hit || !hit.surah || !hit.ayah) return null;
  const rival = result.hits[1]?.distance;
  const level = locateLevel(hit.distance, !!result.decisive, rival);
  if (level === "none") return null;
  return { hit, level };
}
