import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, scriptedRoller, lvl0, adv } from './helpers.mjs';

const R = loadRules();

test('niveau 0 avec 9 PX refusé', () => assert.deepEqual(R.canLevelUp(lvl0({ xp: 9 })), { ok: false, reason: 'Il faut 10 PX (actuellement 9).' }));
test('niveau 0 mort refusé', () => assert.equal(R.canLevelUp(lvl0({ xp: 10, currentHp: 0 })).ok, false));
test('agonisant ou mort refusé', () => {
  assert.equal(R.canLevelUp(lvl0({ xp: 10, dying: { roundsLeft: 1 } })).reason, 'Le personnage est mort.');
  assert.equal(R.canLevelUp(lvl0({ xp: 10, dead: { at: 'x' } })).ok, false);
});
test('niveau 0 à 10 PX accepté', () => assert.equal(R.canLevelUp(lvl0({ xp: 10 })).ok, true));
test('niveau 3 à 190 PX : un seul niveau à la fois', () => assert.equal(R.canLevelUp(adv('warrior', 3, { xp: 190 })).ok, true));
test('niveau 10 refusé', () => assert.equal(R.canLevelUp(adv('warrior', 10, { xp: 5000 })).reason, 'Niveau maximum atteint.'));
test('classes autorisées', () => {
  assert.deepEqual(R.getAllowedClasses(lvl0({ race: 'Nain' })), ['dwarf']);
  assert.deepEqual(R.getAllowedClasses(lvl0({ race: 'Elfe' })), ['elf']);
  assert.deepEqual(R.getAllowedClasses(lvl0({ race: 'Halfelin' })), ['halfling']);
  assert.deepEqual(R.getAllowedClasses(lvl0({ race: 'Humain' })), ['cleric', 'warrior', 'wizard', 'thief']);
});
test('PV clerc END -2 minimum 1', () => {
  R.__setRoller(scriptedRoller([[8, 2]]));
  assert.deepEqual(R.rollClassHitPoints('cleric', -2), { die: 'd8', roll: 2, mod: -2, gain: 1 });
});
test('applyLevelUp niveau 1', () => {
  const c = lvl0({ xp: 10, maxHp: 3, currentHp: 2, hpBaseRoll: 3 });
  const n = R.applyLevelUp(c, { classId: 'warrior', targetLevel: 1, hp: { die: 'd12', roll: 7, mod: 0, gain: 7 }, classData: { luckyWeapon: 'epee-longue' }, newLanguages: [], summary: '' });
  assert.equal(n.level, 1); assert.equal(n.maxHp, 10); assert.equal(n.currentHp, 9);
  assert.equal(n.className, 'warrior');
  assert.equal(n.hpHistory.length, 2); assert.equal(c.level, 0);
  assert.deepEqual(n.hpHistory[0], { level: 0, die: 'd4', roll: 3, mod: 0, gain: 3 });
  assert.deepEqual(n.daily, { disapprovalRange: 1, lostSpells: [], spellburn: { strength: 0, agility: 0, stamina: 0 }, spellburnToday: false });
  assert.equal(n.levelHistory.length, 1);
  assert.equal(n.classData.luckyWeapon, 'epee-longue');
  assert.equal(c.className, undefined);
});
test('applyLevelUp conserve la vitesse de base (augure 30 inclus) et la vitesse effective', () => {
  const c = lvl0({ race: 'Nain', xp: 10 });
  c.baseSpeed = 4.5; c.speed = 4.5;
  const n = R.applyLevelUp(c, { classId: 'dwarf', targetLevel: 1, hp: { die: 'd10', roll: 4, mod: 0, gain: 4 }, classData: {}, summary: '' });
  assert.equal(n.baseSpeed, 4.5); assert.equal(n.speed, 4.5);
});
test('applyLevelUp sans hpBaseRoll : entrée niveau 0 sans NaN', () => {
  const c = lvl0({ xp: 10 }); delete c.hpBaseRoll;
  const n = R.applyLevelUp(c, { classId: 'warrior', targetLevel: 1, hp: { die: 'd12', roll: 5, mod: 0, gain: 5 }, classData: {}, summary: '' });
  assert.deepEqual(n.hpHistory[0], { level: 0, die: 'd4', roll: null, mod: 0, gain: c.maxHp });
});
test('applyLevelUp niveau 2 : sorts ajoutés, langues sans doublon, vitesse nain', () => {
  const c = adv('dwarf', 1, { classData: { spells: ['a'] } });
  const n = R.applyLevelUp(c, { classId: 'dwarf', targetLevel: 2, hp: { die: 'd10', roll: 4, mod: 1, gain: 5 }, classData: { spells: ['b', 'a'] }, newLanguages: ['Commun', 'Gobelin'], summary: 'x' });
  assert.deepEqual(n.classData.spells, ['a', 'b']);
  assert.deepEqual(n.knownLanguages, ['Commun', 'Gobelin']);
  assert.equal(n.baseSpeed, 6);
  assert.equal(n.hpHistory.length, 3);
  assert.equal(n.levelHistory.length, 2);
});
test('ancienne sauvegarde niveau 0 valide', () => assert.doesNotThrow(() => R.normalizeAdventurer(lvl0({}))));
test('niveau 2 sans classe rejeté', () => assert.throws(() => R.normalizeAdventurer({ ...lvl0({}), level: 2 }), /classe/));
test('niveau invalide rejeté', () => {
  assert.throws(() => R.normalizeAdventurer({ ...lvl0({}), level: 11 }), /niveau/i);
  assert.throws(() => R.normalizeAdventurer({ ...lvl0({}), level: 1.5 }), /niveau/i);
});
test('niveau 0 avec classe rejeté', () => assert.throws(() => R.normalizeAdventurer({ ...lvl0({}), className: 'warrior' }), /classe/));
test('niveau 1 sans classData rejeté', () => assert.throws(() => R.normalizeAdventurer({ ...adv('warrior', 1), classData: undefined }), /classe/i));
test('adv valide et complété', () => {
  const c = adv('thief', 3);
  assert.doesNotThrow(() => R.normalizeAdventurer(c));
  const n = R.normalizeAdventurer({ ...c, daily: undefined, hpHistory: undefined, levelHistory: undefined });
  assert.equal(n.daily.disapprovalRange, 1);
  assert.deepEqual(n.hpHistory, []);
  assert.deepEqual(n.levelHistory, []);
});

test('sorts objets fusionnés par id sur deux montées successives', () => {
  const draft = (level, spells) => ({ classId: 'wizard', targetLevel: level, hp: { die: 'd4', roll: 2, mod: 0, gain: 2 }, classData: { spells }, newLanguages: [], summary: '' });
  const n1 = R.applyLevelUp(lvl0({ xp: 10 }), draft(1, [{ id: 'a', level: 1, mercurial: 1 }, { id: 'b', level: 1, mercurial: 2 }]));
  const n2 = R.applyLevelUp({ ...n1, xp: 50 }, draft(2, [{ id: 'b', level: 1, mercurial: 9 }, { id: 'c', level: 1, mercurial: 3 }]));
  assert.deepEqual(n2.classData.spells, [{ id: 'a', level: 1, mercurial: 1 }, { id: 'b', level: 1, mercurial: 9 }, { id: 'c', level: 1, mercurial: 3 }]);
});
test('applyLevelUp refuse les passages invalides', () => {
  const hp = { die: 'd8', roll: 3, mod: 0, gain: 3 };
  const base = { hp, classData: {}, newLanguages: [], summary: '' };
  assert.throws(() => R.applyLevelUp(lvl0({ xp: 10 }), { ...base, classId: 'warrior', targetLevel: 2 }), /Niveau/);
  assert.throws(() => R.applyLevelUp(lvl0({ race: 'Nain' }), { ...base, classId: 'warrior', targetLevel: 1 }), /classe/);
  assert.throws(() => R.applyLevelUp(adv('warrior', 1), { ...base, classId: 'wizard', targetLevel: 2 }), /classe/);
});
