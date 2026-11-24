/** Keep in sync with src/recite-gate.ts */
export const REVEAL_MAX_DISTANCE = 0.15;
export const REVEAL_MIN_HEARD = 0.34;
export const REVEAL_MIN_MARGIN = 0.35;
export function canReveal(v) {
  return v.state === "ok" && v.distance <= REVEAL_MAX_DISTANCE && v.heardRatio >= REVEAL_MIN_HEARD && v.margin >= REVEAL_MIN_MARGIN;
}
export function revealedIndices(verdicts, surah, ayah) {
  return verdicts.filter((v) => v.surah === surah && v.ayah === ayah && canReveal(v)).map((v) => v.word).sort((a, b) => a - b);
}
export function legacyRevealIndices(matched, wordIndex) {
  const idx = new Set(matched);
  for (let i = 0; i <= wordIndex; i++) idx.add(i);
  return [...idx].filter((i) => i >= 0).sort((a, b) => a - b);
}
