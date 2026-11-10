export const CLASSES: number;
export const BLANK: number;
export interface AyahTok { ids: number[]; wi: number[]; toks: string[] }
export interface Aligned { start: Int32Array; emit: Float32Array; from: number; to: number; score: number }
export interface Row { i: number; k: string; w: number; final: boolean; span: number; emit: number; r: number }
export interface Measured { rows: Row[]; unit: number; uo: number; poor: number }
export interface TjIssue { i: number; w: number; kind: "madd" | "ghunna" | "ikhfa" | "qalqala"; sub: string; type?: string; r: number; rRef: number | null; llr?: number }
export interface RefAyahLike { tj: [number, string, number][]; all?: [number, string, number | null, number, number | null, number][]; mt?: Record<string, string> }
export const KINDS: Record<string, number>;
export const REL: number;
export function tokenClass(t: string): string;
export function ayahTokens(corpusAyah: { w: string[][] }, encode: (t: string) => number[] | null, TOKENS: readonly string[]): AyahTok | null;
export function alignAyah(lp: Float32Array, T: number, ids: number[], penalty?: number, cap?: number): Aligned | null;
export function measure(al: Aligned, at: AyahTok): Measured;
export const RULES: Record<string, { tr?: number; q?: number; tl?: number }>;
export function maddType(at: AyahTok, i: number, mt?: Record<string, string>): string;
export function judge(m: Measured, ref?: RefAyahLike | [number, string, number][] | null, opt?: { llr?: (i: number) => number; qprobe?: (i: number) => number; qmid?: (i: number) => number; at?: AyahTok; munfasil?: 2 | 4 }): TjIssue[];
export function setEquivalence(TOKENS: readonly string[]): void;
export function errorVariant(t: string, k: string): string | undefined;
export function siteLLR(lp: Float32Array, T: number, ids: number[], al: Aligned, i: number, altId: number | null | undefined, ctx?: number): number;
export interface QProbe { v: number; win: [number, number]; dim: number; w: number[]; b: number }
export function qprobeScore(enc: Float32Array, T: number, s: number, probe: QProbe): number;
export const WAQF: { fullPenalty: number; tail: number; maxSpan: number; minRun: number; gap: number; lag: number; cap: number; bridge: number; minDyn: number; back: number; ahead: number; penalty: number; debug?: unknown[] };
export function quietRuns(loud: Float32Array, T: number, from: number, to: number, opt?: typeof WAQF): { s: number; e: number }[];
export function findStops(lp: Float32Array, T: number, loud: Float32Array, at: AyahTok, al: Aligned, marks: Record<number, string> | null, opt?: typeof WAQF): { w: number; soft: boolean; len: number; next: number }[];
