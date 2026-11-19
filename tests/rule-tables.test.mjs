import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules } from './helpers.mjs';

const R = loadRules();

test('critique I bornes', () => {
  assert.match(R.lookupTableEntry(R.CRIT_TABLES.I, -2).text, /lâcher votre arme/);
  assert.match(R.lookupTableEntry(R.CRIT_TABLES.I, 25).text, /entamez le crâne/);
});
test('tables critiques : max', () => {
  for (const [t, max] of [['I', 20], ['II', 24], ['III', 28], ['IV', 24], ['V', 28]])
    assert.equal(R.CRIT_TABLES[t].at(-1).min, max, t);
});
test('table critique V : lignes groupées 8-12 et 13-14', () => {
  assert.deepEqual(R.CRIT_TABLES.V.filter(r => Number.isFinite(r.min) && r.max > r.min && Number.isFinite(r.max)).map(r => [r.min, r.max]), [[8, 12], [13, 14]]);
});
test('notes de bas de page des critiques', () => {
  assert.match(R.CRIT_FOOTNOTES['*'], /armes magiques/);
  assert.match(R.CRIT_FOOTNOTES['**'], /rage/);
});
test('maladresse 16+', () => assert.match(R.lookupTableEntry(R.FUMBLE_TABLE, 30).text, /DD16/));
test('tables continues sans trou', () => {
  for (const t of [...Object.values(R.CRIT_TABLES), R.FUMBLE_TABLE, R.DISAPPROVAL_TABLE, ...Object.values(R.CORRUPTION_TABLES),
    R.TURN_UNHOLY_TABLE, R.LAY_ON_HANDS_TABLE, R.TWO_WEAPON_TABLE])
    for (let i = 1; i < t.length; i++) assert.equal(t[i].min, t[i - 1].max + 1);
});
test('mercurielle : 100 entrées couvrant 1-100', () => {
  const t = R.MERCURIAL_TABLE;
  assert.equal(t[0].min, 1);
  assert.equal(t.at(-1).max, 100);
  for (let i = 1; i < t.length; i++) assert.equal(t[i].min, t[i - 1].max + 1);
  assert.equal(t.length, 100 - 20 + 1);
});
test('mercurielle 41-60 sans changement', () => assert.match(R.lookupTableEntry(R.MERCURIAL_TABLE, 50).text, /Pas de changement/));
test('mercurielle : 00 = 100, 99 relancer deux fois', () => {
  assert.match(R.lookupTableEntry(R.MERCURIAL_TABLE, 100).text, /4d20/);
  assert.match(R.lookupTableEntry(R.MERCURIAL_TABLE, 99).text, /Relancez deux fois/);
});
test('mercurielle : castDie uniquement sur les entrées qui changent le dé', () => {
  const withDie = R.MERCURIAL_TABLE.filter(e => e.castDie).map(e => [e.min, e.castDie]);
  assert.deepEqual(withDie, [[2, '1d14'], [5, '1d16'], [35, '2d10'], [96, '1d24'], [98, '1d30']]);
});
test('corruptions : bornes', () => {
  for (const t of Object.values(R.CORRUPTION_TABLES)) {
    assert.equal(t[0].min, -Infinity);
    assert.equal(t.at(-1).min, 10);
    assert.equal(t.at(-1).max, Infinity);
  }
  assert.match(R.lookupTableEntry(R.CORRUPTION_TABLES.greater, -3).text, /seigneur démon/);
});
test('défaveur 20+', () => {
  assert.equal(R.DISAPPROVAL_TABLE.at(-1).min, 20);
  assert.match(R.lookupTableEntry(R.DISAPPROVAL_TABLE, 25).text, /imposer les mains/);
  assert.match(R.lookupTableEntry(R.DISAPPROVAL_TABLE, 0).text, /expier ses péchés/);
});
test('repousser 20-23', () => { const row = R.lookupTableEntry(R.TURN_UNHOLY_TABLE, 21); assert.equal(row.range, '18 m'); assert.equal(row.byHd['1'], 'R1d6+NI'); });
test('repousser 32+ : pas de JS ajouté en 3-4 DV', () => {
  const row = R.lookupTableEntry(R.TURN_UNHOLY_TABLE, 40);
  assert.equal(row.byHd['3-4'], 'R1d8+NI, D1d4 (pas de JS)');
  assert.deepEqual(Object.keys(row.byHd), ['1', '2', '3-4', '5-6', '7-8', '9-10', '11-12']);
});
test('imposition 14-19', () => assert.deepEqual(R.lookupTableEntry(R.LAY_ON_HANDS_TABLE, 15), { min: 14, max: 19, same: 3, adjacent: 2, opposed: 1 }));
test('imposition : échec ≤ 11 et états', () => {
  assert.equal(R.lookupTableEntry(R.LAY_ON_HANDS_TABLE, 5).same, 0);
  assert.deepEqual(R.LAY_ON_HANDS_CONDITIONS.map(c => c.dice), [1, 2, 2, 3, 3, 4]);
});
test('deux armes', () => {
  assert.deepEqual(R.lookupTableEntry(R.TWO_WEAPON_TABLE, 10), { min: 9, max: 11, primaryDieSteps: -2, offhandDieSteps: -3, crit: 'Coups critiques impossibles' });
  assert.equal(R.lookupTableEntry(R.TWO_WEAPON_TABLE, 18).primaryDieSteps, 0);
  assert.equal(R.lookupTableEntry(R.TWO_WEAPON_TABLE, 3).primaryDieSteps, -3);
});
test('listes de sorts', () => {
  assert.equal(R.WIZARD_SPELLS[1].length, 27); assert.equal(R.WIZARD_SPELLS[4].length, 6);
  assert.deepEqual([1, 2, 3, 4, 5].map(l => R.WIZARD_SPELLS[l].length), [27, 24, 24, 6, 5]);
  assert.deepEqual([1, 2, 3, 4, 5].map(l => R.CLERIC_SPELLS[l].length), [11, 11, 7, 4, 3]);
  assert.equal(R.CLERIC_SPELLS[1].length, 11); assert.equal(R.CLERIC_SPELLS[5].length, 3);
  assert.equal(R.WIZARD_SPELLS[1][0].page, 129);
  assert.ok(R.WIZARD_SPELLS[1].every(s => s.text === undefined)); // option A : pas de texte d'effet
});
test('sorts : notes de mage', () => {
  assert.equal(R.WIZARD_SPELLS[1].at(-1).note, 'patronSpell');
  assert.equal(R.WIZARD_SPELLS[2].at(-1).note, 'patronSpell');
  assert.equal(R.WIZARD_SPELLS[3].at(-1).note, 'patronSpell');
  assert.deepEqual(R.WIZARD_SPELLS[1].filter(s => s.note === 'patronPair').map(s => s.id), ['invoquer-un-patron', 'lier-un-patron']);
  assert.deepEqual(R.WIZARD_SPELLS[1].filter(s => s.note === 'cleric').map(s => s.id), ['detection-de-la-magie']);
  assert.deepEqual(R.WIZARD_SPELLS[2].filter(s => s.note === 'cleric').map(s => s.id), ['detection-du-mal']);
  assert.deepEqual(R.WIZARD_SPELLS[3].filter(s => s.note === 'cleric').map(s => s.id), ['paralysie', 'soumission']);
});
test('ids de sorts : slugs ASCII et uniques par liste', () => {
  for (const list of [R.WIZARD_SPELLS, R.CLERIC_SPELLS]) {
    const ids = Object.values(list).flat().map(s => s.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  }
  const wizardIds = Object.values(R.WIZARD_SPELLS).flat().map(s => s.id);
  for (const id of ['sommeil', 'invisibilite', 'projectile-magique', 'pattes-d-araignees']) assert.ok(wizardIds.includes(id), id);
  assert.ok(Object.values(R.CLERIC_SPELLS).flat().some(s => s.id === 'benediction'));
  assert.ok(Object.values(R.CLERIC_SPELLS).flat().some(s => s.id === 'consacrer-deconsacrer'));
});
test('patrons', () => {
  assert.equal(R.PATRONS.length, 8);
  assert.deepEqual(R.PATRONS.filter(p => p.spells.length === 0).map(p => p.id), ['yddgrrl', 'obitu-que', 'ithha']);
  assert.ok(R.PATRONS.filter(p => p.spells.length).every(p => p.spells.length === 3));
});
test('aucun reste OCR', () => {
  const blob = JSON.stringify([R.CRIT_TABLES, R.FUMBLE_TABLE, R.MERCURIAL_TABLE, R.CORRUPTION_TABLES, R.DISAPPROVAL_TABLE,
    R.TURN_UNHOLY_TABLE, R.TWO_WEAPON_TABLE, R.WIZARD_SPELLS, R.CLERIC_SPELLS, R.PATRONS]);
  assert.ok(!blob.includes('```'));
  assert.ok(!/Page \d|\s{2}|, ,/.test(blob));
});
