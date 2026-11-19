import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules } from './helpers.mjs';

const R = loadRules();

test('guerrier niveau 10', () => {
  const r = R.CLASSES.warrior.levels[9];
  assert.deepEqual(r.attack, { deedDie: 10, plus: 4 });
  assert.deepEqual(r.crit, { dice: '2d20', table: 'V' });
  assert.equal(r.critMin, 17);
  assert.deepEqual(r.actionDice, [20, 20, 14]);
  assert.deepEqual(r.saves, { reflex: 4, fortitude: 6, will: 3 });
});
test('clerc niveau 9 sorts par niveau', () => assert.deepEqual(R.CLASSES.cleric.levels[8].spellsKnown, [8, 7, 5, 3, 1]));
test('mage niveau 1', () => {
  const r = R.CLASSES.wizard.levels[0];
  assert.equal(r.spellsKnown, 4);
  assert.equal(r.maxSpellLevel, 1);
  assert.deepEqual(r.crit, { dice: '1d6', table: 'I' });
});
test('voleur niveau 8 critique et dé de chance', () => {
  const r = R.CLASSES.thief.levels[7];
  assert.equal(r.crit.dice, '1d30+2');
  assert.equal(r.luckDie, 12);
});
test('nain niveau 4 table IV', () => assert.deepEqual(R.CLASSES.dwarf.levels[3].crit, { dice: '1d16', table: 'IV' }));
test('halfelin discrétion niveau 10', () => assert.equal(R.CLASSES.halfling.levels[9].stealth, 15));
test('elfe niveau 10 sorts', () => assert.equal(R.CLASSES.elf.levels[9].spellsKnown, 14));
test('dés de vie', () => assert.deepEqual(
  Object.fromEntries(Object.values(R.CLASSES).map(c => [c.id, c.hitDie])),
  { cleric: 8, warrior: 12, wizard: 4, thief: 6, elf: 6, halfling: 6, dwarf: 10 }));
test('voleur Escroc', () => {
  const s = R.THIEF_SKILLS.find(s => s.id === 'pickpocket');
  assert.equal(s.bonusByPath.Escroc[0], 3);
  assert.equal(R.THIEF_SKILLS.find(s => s.id === 'scroll').bonusByPath.Escroc[0], 'd12');
});
test('titres', () => {
  assert.equal(R.CLASSES.warrior.titles.Chaotique[0], 'Bandit');
  assert.equal(R.CLASSES.wizard.titles.Loyal[4], 'Élémentaliste');
});
test('toutes les classes ont 10 niveaux et des armes existantes', () => {
  for (const c of Object.values(R.CLASSES)) {
    assert.equal(c.levels.length, 10);
    if (c.weapons !== 'deity') c.weapons.forEach(id => assert.ok(R.RULE_WEAPONS.some(w => w.id === id), id));
  }
  for (const list of Object.values(R.DEITY_WEAPONS)) list.forEach(id => assert.ok(R.RULE_WEAPONS.some(w => w.id === id), id));
});
test('seuils de PX et listes complètes', () => {
  assert.deepEqual(R.XP_THRESHOLDS, [0, 10, 50, 110, 190, 290, 410, 550, 710, 890, 1090]);
  assert.equal(R.THIEF_SKILLS.length, 13);
  for (const s of R.THIEF_SKILLS) for (const p of Object.values(s.bonusByPath)) assert.equal(p.length, 10, s.id);
  assert.deepEqual(R.THIEF_PATHS, { Loyal: 'Boss', Chaotique: 'Assassin', Neutre: 'Escroc' });
  assert.equal(R.DEITIES.Loyal.length, 8);
  assert.equal(R.DEITIES.Neutre.length, 4);
  assert.equal(R.DEITIES.Chaotique.length, 7);
  assert.ok(R.ARMOR_TABLE.length > 0);
});
