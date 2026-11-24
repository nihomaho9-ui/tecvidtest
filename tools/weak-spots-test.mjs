import assert from 'node:assert/strict';
import { noteMiss, noteOk, intensity, wordHeat, listSorted, suggestions, migrateMisses, exportJson, importJson, SPACE_MS, DECAY_DROP } from '../src/weak-spots.ts';

let spots = [];
spots = noteMiss(spots, 1, 1, 2, 'possible_substitution', 1000);
spots = noteMiss(spots, 1, 1, 2, 'possible_substitution', 2000);
assert.equal(spots[0].hits, 2);
assert.equal(spots[0].score, 2);
assert.equal(intensity(2), 2);
assert.equal(wordHeat(spots, 1, 1, 2), 2);
assert.equal(wordHeat(spots, 1, 1, 0), 0);

spots = noteMiss(spots, 2, 5, 0, 'possible_omission', 3000);
spots = noteOk(spots, 1, 1, 2, 4000);
assert.equal(spots.find((x) => x.s === 1).score, 1);
spots = noteOk(spots, 1, 1, 2, 5000);
assert.ok(!spots.some((x) => x.s === 1), 'decayed below drop is removed');
assert.equal(spots.length, 1);

const many = [];
noteMiss(many, 36, 1, 0, 'possible_omission', 1);
noteMiss(many, 36, 1, 0, 'possible_omission', 2);
noteMiss(many, 36, 1, 1, 'possible_vowel', 3);
noteMiss(many, 2, 255, -1, 'possible_skipped_ayah', 4);
noteMiss(many, 114, 1, 0, 'possible_substitution', 10 * 60 * 60 * 1000);
const sug = suggestions(many, 13 * 60 * 60 * 1000, 5);
assert.ok(sug.length >= 1);
// 36:1 was practised at t=3, 13h later it is due; 114:1 practised at 10h, only 3h ago so spaced out if others exist
assert.equal(sug[0].s, 36);
assert.ok(!sug.some((x) => x.s === 114) || sug[0].s !== 114);

const migrated = migrateMisses([{ s: 103, a: 2, w: 1, kind: 'possible_repetition', n: 3, t: 9 }]);
assert.equal(migrated[0].hits, 3);
assert.equal(migrated[0].score, 3);

const json = exportJson(many, 100);
const back = importJson(json, migrated);
assert.ok(back.some((x) => x.s === 103 && x.hits === 3));
assert.ok(back.some((x) => x.s === 36));
const merged = importJson(exportJson([{ s: 36, a: 1, w: 0, kind: 'possible_omission', hits: 9, lastMiss: 99, lastOk: 0, lastPractised: 99, score: 9 }]), many);
assert.equal(merged.find((x) => x.s === 36 && x.w === 0).hits, 9);
assert.equal(merged.find((x) => x.s === 36 && x.w === 0).score, 9);

try { importJson('not-json'); assert.fail('should throw'); } catch (e) { assert.equal(e.message, 'invalid'); }

assert.ok(SPACE_MS > 0 && DECAY_DROP < 1);
const sorted = listSorted([{ s: 1, a: 1, w: 0, kind: 'a', hits: 1, lastMiss: 1, lastOk: 0, lastPractised: 1, score: 1 }, { s: 1, a: 2, w: 0, kind: 'a', hits: 1, lastMiss: 9, lastOk: 0, lastPractised: 9, score: 4 }]);
assert.equal(sorted[0].a, 2);
console.log('weak-spots tests ok');
