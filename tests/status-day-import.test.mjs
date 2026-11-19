import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, scriptedRoller, lvl0, adv } from './helpers.mjs';

const R = loadRules();

test('aventurier niv. 3 tombe à -4 : agonisant 3 rounds, PV 0', () => { const { char } = R.applyHpChange(adv('warrior', 3, { currentHp: 2 }), -6); assert.equal(char.currentHp, 0); assert.deepEqual(char.dying, { roundsLeft: 3 }); });
test('nouveaux dégâts pendant l’agonie : décompte inchangé', () => { const d = R.applyHpChange(adv('warrior', 3, { currentHp: 1 }), -2).char; d.dying.roundsLeft = 1; assert.equal(R.applyHpChange(d, -3).char.dying.roundsLeft, 1); });
test('soin pendant l’agonie : sauvé, -1 END', () => { const d = R.applyHpChange(adv('warrior', 1, { currentHp: 1, sta: 13 }), -1).char; const { char, result } = R.applyHpChange(d, 2); assert.equal(char.currentHp, 2); assert.equal(char.stats.stamina.score, 12); assert.ok(result.events.includes('saved')); assert.equal(char.dying, undefined); });
test('fin du décompte : mort', () => { let d = R.applyHpChange(adv('warrior', 1, { currentHp: 1 }), -1).char; d = R.advanceDyingRound(d); assert.equal(R.getStatusCode(d), 'mort'); });
test('soin d’un mort refusé', () => { let d = R.advanceDyingRound(R.applyHpChange(adv('warrior', 1, { currentHp: 1 }), -1).char); assert.deepEqual(R.applyHpChange(d, 5).result.events, ['refused']); });
test('récupérer le corps réussi', () => { let d = R.advanceDyingRound(R.applyHpChange(adv('warrior', 1, { currentHp: 1, luck: 12 }), -1).char); R.__setRoller(scriptedRoller([[20, 12], [3, 2]])); const { char, result } = R.recoverBody(d); assert.equal(result.success, true); assert.equal(char.currentHp, 1); assert.equal(R.getStatusCode(char), 'groggy'); assert.equal(result.statLoss, 'agility'); });
test('une seule tentative', () => { let d = R.advanceDyingRound(R.applyHpChange(adv('warrior', 1, { currentHp: 1, luck: 3 }), -1).char); R.__setRoller(scriptedRoller([[20, 15]])); d = R.recoverBody(d).char; assert.throws(() => R.recoverBody(d)); });
test('niveau 0 à 0 PV : mort directe', () => assert.equal(R.getStatusCode(R.applyHpChange(lvl0({ currentHp: 1 }), -3).char), 'mort'));
test('nouvelle journée voleur niv. 2 : Chance +2 plafonnée', () => assert.equal(R.startNewDay(adv('thief', 2, { luck: 9, initialLuck: 10 })).char.stats.luck.score, 10));
test('brûlesort non récupéré le jour même', () => { const c = adv('wizard', 1, { daily: { spellburn: { strength: 3, agility: 0, stamina: 0 }, spellburnToday: true } }); const a = R.startNewDay(c).char; assert.equal(a.daily.spellburn.strength, 3); assert.equal(R.startNewDay(a).char.daily.spellburn.strength, 2); });
test('import : fusion par id', () => { const a = lvl0({ id: 'a' }), b = lvl0({ id: 'b' }), a2 = { ...lvl0({ id: 'a' }), name: 'Nouveau' }; const r = R.applyImportMerge([a, b], [a2, lvl0({ id: 'c' })], false); assert.deepEqual([r.added, r.replaced, r.ignored], [1, 0, 1]); assert.equal(r.characters.length, 3); assert.equal(R.applyImportMerge([a, b], [a2], true).characters[0].name, 'Nouveau'); });

// --- Compléments ---
test('statuts : vivant, blessé, agonisant, groggy', () => {
  assert.equal(R.getStatusCode(adv('warrior', 2)), 'vivant');
  assert.equal(R.getStatusCode(adv('warrior', 2, { currentHp: 3 })), 'blesse');
  assert.equal(R.getStatusCode(R.applyHpChange(adv('warrior', 2, { currentHp: 1 }), -5).char), 'agonisant');
  assert.equal(R.getStatusCode({ ...adv('warrior', 2), groggy: true }), 'groggy');
});
test('statut historique synchronisé : agonisant = Blessé, mort = Mort', () => {
  const d = R.applyHpChange(adv('warrior', 1, { currentHp: 1 }), -1).char;
  assert.equal(d.status, 'Blessé');
  assert.equal(R.advanceDyingRound(d).status, 'Mort');
});
test('soin plafonné à maxHp et cicatrice ajoutée', () => {
  const d = R.applyHpChange(adv('warrior', 1, { currentHp: 1, maxHp: 9 }), -1).char;
  const { char } = R.applyHpChange(d, 50);
  assert.equal(char.currentHp, 9);
  assert.equal(char.classData.scars.length, 1);
});
test('agonisant refusé pour montée de niveau et Chance du halfelin', () => {
  const d = R.applyHpChange(adv('warrior', 1, { currentHp: 1, xp: 999 }), -1).char;
  assert.equal(R.canLevelUp(d).ok, false);
  assert.equal(R.giveHalflingLuck(adv('halfling', 1), d, 1).result.ok, false);
});
test('libellés de getStatusCode via l’état groggy puis clearGroggy', () => {
  const g = { ...adv('warrior', 1, { currentHp: 1 }), groggy: true };
  const c = R.clearGroggy(g);
  assert.equal(c.groggy, undefined);
  assert.equal(R.getStatusCode(c), 'blesse');
});
test('récupération ratée : tentative marquée, toujours mort', () => {
  const d = R.advanceDyingRound(R.applyHpChange(adv('warrior', 1, { currentHp: 1, luck: 3 }), -1).char);
  R.__setRoller(scriptedRoller([[20, 15]]));
  const { char, result } = R.recoverBody(d);
  assert.equal(result.success, false);
  assert.equal(char.dead.recoveryAttempted, true);
  assert.equal(R.getStatusCode(char), 'mort');
});
test('récupérer le corps d’un vivant : erreur', () => assert.throws(() => R.recoverBody(adv('warrior', 1))));
test('nouvelle journée : défaveur remise à 1, sorts perdus vidés, brûlesort récupéré', () => {
  const c = adv('cleric', 1, { daily: { disapprovalRange: 4, lostSpells: ['x'], spellburn: { strength: 0, agility: 1, stamina: 0 } } });
  const { char, result } = R.startNewDay(c);
  assert.equal(char.daily.disapprovalRange, 1);
  assert.deepEqual(char.daily.lostSpells, []);
  assert.equal(char.daily.spellburn.agility, 0);
  assert.ok(result.summary.length >= 2);
});
test('halfelin : Chance remontée de son niveau', () => assert.equal(R.startNewDay(adv('halfling', 3, { luck: 4, initialLuck: 12 })).char.stats.luck.score, 7));
test('import : ordre conservé, remplacement en place, ajouts à la fin', () => {
  const a = lvl0({ id: 'a' }), b = lvl0({ id: 'b' });
  const r = R.applyImportMerge([a, b], [{ ...b, name: 'B2' }, lvl0({ id: 'c' })], true);
  assert.deepEqual(r.characters.map((c) => c.id), ['a', 'b', 'c']);
  assert.equal(r.characters[1].name, 'B2');
  assert.deepEqual([r.added, r.replaced, r.ignored], [1, 1, 0]);
  const plan = R.planImportMerge([a, b], [b, lvl0({ id: 'c' })]);
  assert.equal(plan.toAdd.length, 1);
  assert.equal(plan.conflicts.length, 1);
});

// --- Validation des fiches chargées / importées (protection XSS) ---
const XSS = '<img src=x onerror=alert(1)>';
const rejects = (mutate, pattern = /invalide/) => {
  const char = adv('warrior', 2);
  mutate(char);
  assert.throws(() => R.normalizeAdventurer(char), pattern);
};
test('validation : chaînes forgées rejetées avec une erreur française', () => {
  rejects((c) => { c.currentHp = XSS; });
  rejects((c) => { c.maxHp = 3.5; });
  rejects((c) => { c.ac = XSS; });
  rejects((c) => { c.stats.strength.score = XSS; });
  rejects((c) => { c.stats.luck.initialScore = XSS; });
  rejects((c) => { c.speed = XSS; });
  rejects((c) => { c.baseSpeed = XSS; });
  rejects((c) => { c.dying = { roundsLeft: XSS }; });
  rejects((c) => { c.dying = { roundsLeft: -1 }; });
  rejects((c) => { c.dying = { roundsLeft: 1.5 }; });
});
test('validation : niveau 0 agonisant ou mort rejeté', () => {
  assert.throws(() => R.normalizeAdventurer({ ...lvl0({}), dying: { roundsLeft: 1 } }), /niveau 0/);
  assert.throws(() => R.normalizeAdventurer({ ...lvl0({}), dead: { at: 'x', recoveryAttempted: false } }), /niveau 0/);
});
test('validation : les modificateurs sont recalculés, jamais crus', () => {
  const char = adv('warrior', 2, { str: 18 });
  char.stats.strength.mod = XSS;
  const out = R.normalizeAdventurer(char);
  assert.equal(out.stats.strength.mod, 3);
});
test('validation : fiche valide et agonie valide acceptées', () => {
  assert.doesNotThrow(() => R.normalizeAdventurer(adv('warrior', 2, { currentHp: 0, dying: { roundsLeft: 2 } })));
});

test('validateCharacterData exige un luckySign valide', () => {
  const ok = adv('warrior', 1);
  assert.doesNotThrow(() => R.validateCharacterData(structuredClone(ok)));
  const bad = (sign) => { const c = structuredClone(ok); if (sign === undefined) delete c.luckySign; else c.luckySign = sign; return c; };
  [undefined, null, 'x', [], {}, { roll: 0, modifier: 0 }, { roll: 31, modifier: 0 }, { roll: 1.5, modifier: 0 }, { roll: 5 }, { roll: 5, modifier: 'a' }]
    .forEach((sign) => assert.throws(() => R.validateCharacterData(bad(sign)), /augure/i, JSON.stringify(sign)));
});

test('chooseBackupKey : copie identique réutilisée, clé de base, clé horodatée', () => {
  const base = 'k_backup', now = '2026-01-01T00:00:00.000Z';
  assert.deepEqual(R.chooseBackupKey([['k_backup', 'A'], ['k_backup_x', 'B']], base, 'B', now), { key: 'k_backup_x', alreadySaved: true });
  assert.deepEqual(R.chooseBackupKey([], base, 'B', now), { key: base, alreadySaved: false });
  assert.deepEqual(R.chooseBackupKey([['k_backup', 'A']], base, 'B', now), { key: `${base}_${now}`, alreadySaved: false });
});
