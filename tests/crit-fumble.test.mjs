import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, scriptedRoller, lvl0, adv } from './helpers.mjs';

const R = loadRules();

test('critique niveau 0 : 1d4 table I + Chance', () => {
  R.__setRoller(scriptedRoller([[4, 3]]));
  const r = R.rollCritical(lvl0({ luckMod: 1 }));
  assert.equal(r.dice, '1d4'); assert.equal(r.total, 4); assert.equal(r.table, 'I'); assert.equal(r.luckMod, 1);
  assert.deepEqual(r.roll.rolls, [3]); assert.ok(r.text.length > 0);
});
test('critique de classe : dé et table du niveau', () => {
  const row = R.getClassRow(adv('warrior', 3));
  R.__setRoller(scriptedRoller([[Number(row.crit.dice.split('d')[1]), 1]]));
  const r = R.rollCritical(adv('warrior', 3, { luckMod: 0 }));
  assert.equal(r.dice, row.crit.dice); assert.equal(r.table, row.crit.table);
});
test('augure 26 double la Chance au critique', () => {
  R.__setRoller(scriptedRoller([[12, 5]]));
  assert.equal(R.rollCritical(adv('warrior', 1, { luckMod: 1, luckySignRoll: 26 })).total, 7);
});
test('augure 26 : Chance doublée même négative ; autres augures non doublés', () => {
  R.__setRoller(scriptedRoller([[12, 5]]));
  assert.equal(R.rollCritical(adv('warrior', 1, { luckMod: -1, luckySignRoll: 26 })).luckMod, -2);
  R.__setRoller(scriptedRoller([[12, 5]]));
  assert.equal(R.rollCritical(adv('warrior', 1, { luckMod: 1, luckySignRoll: 28 })).luckMod, 1);
});
test('maladresse inverse la Chance', () => {
  R.__setRoller(scriptedRoller([[12, 5]]));
  const r = R.rollFumble(adv('warrior', 1, { luckMod: 2, armorId: 'chainmail' }));
  assert.equal(r.total, 3); assert.equal(r.die, 'd12'); assert.equal(r.luckMod, 2);
});
test('maladresse : Chance négative augmente le total', () => {
  R.__setRoller(scriptedRoller([[4, 2]]));
  assert.equal(R.rollFumble(adv('thief', 1, { luckMod: -1 })).total, 3);
});
test('augure 28 double la Chance à la maladresse', () => {
  R.__setRoller(scriptedRoller([[4, 4]]));
  const r = R.rollFumble(adv('thief', 1, { luckMod: 1, luckySignRoll: 28 }));
  assert.equal(r.luckMod, 2); assert.equal(r.total, 2);
  R.__setRoller(scriptedRoller([[4, 4]]));
  assert.equal(R.rollFumble(adv('thief', 1, { luckMod: 1, luckySignRoll: 26 })).luckMod, 1);
});
test('maladresse : pire dé entre armure et bouclier', () => {
  R.__setRoller(scriptedRoller([[8, 1]]));
  assert.equal(R.rollFumble(adv('warrior', 1, { armorId: 'none', hasShield: true })).die, 'd8');
  R.__setRoller(scriptedRoller([[16, 1]]));
  assert.equal(R.rollFumble(adv('warrior', 1, { armorId: 'full_plate', hasShield: true })).die, 'd16');
});
test('maladresse niveau 0 : dé de l’armure', () => {
  R.__setRoller(scriptedRoller([[8, 1]]));
  assert.equal(R.rollFumble(lvl0({ armorId: 'leather' })).die, 'd8');
});
test('canBurnLuckToCancel : guerrier et nain seulement', () => {
  R.__setRoller(scriptedRoller([[4, 1]]));
  assert.equal(R.rollFumble(adv('warrior', 1)).canBurnLuckToCancel, true);
  R.__setRoller(scriptedRoller([[4, 1]]));
  assert.equal(R.rollFumble(adv('dwarf', 1)).canBurnLuckToCancel, true);
  R.__setRoller(scriptedRoller([[4, 1]]));
  assert.equal(R.rollFumble(adv('thief', 1)).canBurnLuckToCancel, false);
});
test('annuler une maladresse brûle 1 Chance et recalcule le modificateur', () => {
  const src = adv('dwarf', 1, { luck: 13, initialLuck: 13 });
  const { result, char } = R.cancelFumbleWithLuck(src);
  assert.equal(result.ok, true);
  assert.equal(char.stats.luck.score, 12); assert.equal(char.stats.luck.mod, 0); assert.equal(char.stats.luck.initialScore, 13);
  assert.equal(src.stats.luck.score, 13);
});
test('annuler une maladresse sans Chance refusé', () => {
  const src = adv('dwarf', 1, { luck: 0 });
  const r = R.cancelFumbleWithLuck(src);
  assert.equal(r.result.ok, false); assert.equal(r.char.stats.luck.score, 0);
});
test('annuler une maladresse refusé pour les autres classes', () => {
  assert.equal(R.cancelFumbleWithLuck(adv('thief', 1)).result.ok, false);
});
