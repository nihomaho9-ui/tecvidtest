import type { FramePosteriors } from "@tilawa/core";
import type { AyahTok } from "./tajwid-core.js";

export const PAIRS: [string, string][];
export function pairKey(a: string, b: string): string;
export function baseLetter(tok: string): string | null;
export function mapTokenLetter(tok: string, from: string, to: string, tokenIndex: Map<string, number>): number;
export function buildIndex(tokens?: readonly string[]): LetterIndex;
export interface LetterIndex {
  tokens: readonly string[];
  tokenIndex: Map<string, number>;
  byBase: Map<string, number[]>;
  sisters: Map<number, { key: string; from: string; to: string; sisterId: number; sisterTok: string }[]>;
  qalqalaOf: Map<number, number>;
  ghunnaOf: Map<number, number>;
}
export function wrapPost(lp: Float32Array, T: number): FramePosteriors;
export function tokenSpan(al: { start: ArrayLike<number>; to: number }, i: number, T: number, pad?: number): [number, number];
export function tokenGop(post: FramePosteriors, ids: number[], from: number, to: number): number;
export function forcedLLR(post: FramePosteriors, expIds: number[], altIds: number[], from: number, to: number): number;
export function letterLogMass(lp: Float32Array, T: number, from: number, to: number, letter: string, index: LetterIndex): number;
export function meanLogp(lp: Float32Array, from: number, to: number, id: number): number;
export function nasalLogMass(lp: Float32Array, from: number, to: number, index: LetterIndex): number;
export function contextLLR(lp: Float32Array, T: number, ids: number[], al: { start: ArrayLike<number>; to: number }, i: number, altId: number, ctx?: number): number;
export interface PairScore {
  key: string; from: string; to: string; sisterId: number; sisterTok: string;
  llr: number; llrWin: number; llrCtx: number; fam: number; gopSister: number;
}
export interface TokenScore {
  i: number; w: number; tok: string; base: string | null; from: number; to: number;
  emit: number; gop: number; pairs: PairScore[];
  qalqala: { alt: number; llr: number; llrWin: number; llrCtx: number; gop: number } | null;
  ghunna: { kind: "ghunna" | "ikhfa"; alt: number; llr: number; llrWin: number; llrCtx: number; gop: number } | null;
  extraGhunna: { mass: number; gop: number } | null;
  clipFam?: Record<string, number>;
}
export function scoreToken(lp: Float32Array, T: number, post: FramePosteriors, at: AyahTok, al: { start: ArrayLike<number>; to: number; emit: ArrayLike<number> }, i: number, index: LetterIndex): TokenScore;
export function scoreAyah(lp: Float32Array, T: number, at: AyahTok, al: { start: ArrayLike<number>; to: number; emit: ArrayLike<number> } | null, index: LetterIndex): TokenScore[];
export function isolatedIds(letter: string, vowelSub: number, index: LetterIndex): (AyahTok & { tok: string; id: number; base: string }) | null;
export function scoreIsolated(lp: Float32Array, T: number, letter: string, vowelSub: number, index: LetterIndex): { ok: boolean; reason?: string; letter: string; vowelSub: number; T?: number; al?: { from: number; to: number; emit: number }; row?: TokenScore };
export interface LetterIssue {
  i: number; w: number; kind: "letter"; sub: string; type: string; r: number; rRef: number | null; llr?: number;
  heard?: string; expected?: string;
}
export function judgeLetterRows(rows: TokenScore[], thresholds: LetterThresholds | null | undefined): LetterIssue[];
export interface LetterThresholds {
  pairs?: Record<string, { llr?: number; fam?: number; gop?: number }>;
  qalqala?: { llr?: number; gop?: number } | null;
  ghunna?: { llr?: number; gop?: number } | null;
  ikhfa?: { llr?: number; gop?: number } | null;
  extraGhunna?: { mass?: number } | null;
}
export const DEFAULT_THRESHOLDS: LetterThresholds;
