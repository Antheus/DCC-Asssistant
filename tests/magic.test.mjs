import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, scriptedRoller, adv, wizardWith1Spell, wizardWithSpellLevel, clericWith } from './helpers.mjs';

const R = loadRules();

// --- Emplacements et niveau maximum (table 1-1) ---
// Le livre donne +1 sort à INT 16 et +2 à INT 17-18 (la phrase de la brief « 16+ → +2 » est corrigée).
test('slots mage INT 17 niveau 1 = 6', () => assert.equal(R.getSpellSlots(adv('wizard', 1, { int: 17 })), 6));
test('slots mage INT 16 niveau 1 = 5 (+1 sort)', () => assert.equal(R.getSpellSlots(adv('wizard', 1, { int: 16 })), 5));
test('slots mage INT 3 = 0', () => assert.equal(R.getSpellSlots(adv('wizard', 1, { int: 3 })), 0));
test('slots mage INT 6 niveau 1 = 3 ; jamais < 1', () => {
  assert.equal(R.getSpellSlots(adv('wizard', 1, { int: 6 })), 3);
  assert.equal(R.getSpellSlots(adv('elf', 1, { int: 4 })), 1);
});
test('slots : niveau cible et elfe', () => {
  assert.equal(R.getSpellSlots(adv('wizard', 1, { int: 10 }), 5), 8);
  assert.equal(R.getSpellSlots(adv('elf', 1, { int: 14 })), 4);
});
test('slots clerc : tableau de la table de classe', () => assert.deepEqual(R.getSpellSlots(adv('cleric', 1)), [4, 0, 0, 0, 0]));
test('niveau de sort maximum = min(classe, plafond INT)', () => {
  assert.equal(R.getMaxSpellLevel(adv('wizard', 10, { int: 10 })), 3);
  assert.equal(R.getMaxSpellLevel(adv('wizard', 10, { int: 15 })), 5);
  assert.equal(R.getMaxSpellLevel(adv('wizard', 1, { int: 18 })), 1);
  assert.equal(R.getMaxSpellLevel(adv('wizard', 10, { int: 8 })), 2);
  assert.equal(R.getMaxSpellLevel(adv('wizard', 10, { int: 12 })), 4);
  assert.equal(R.getMaxSpellLevel(adv('wizard', 10, { int: 3 })), 0);
});

// --- Tirage des sorts et magie mercurielle ---
test('tirage : doublons relancés', () => {
  R.__setRoller(scriptedRoller([[27, 21], [27, 24]]));
  assert.deepEqual(R.drawRandomWizardSpell(1, [R.WIZARD_SPELLS[1][20].id], { hasPatronBond: false }).ids, [R.WIZARD_SPELLS[1][23].id]);
});
test('tirage impossible -> null', () => assert.equal(R.drawRandomWizardSpell(5, R.WIZARD_SPELLS[5].map(s => s.id), {}), null));
test('lier un patron donne aussi invoquer', () => {
  const lier = R.WIZARD_SPELLS[1].findIndex(s => s.name === 'Lier un patron');
  R.__setRoller(scriptedRoller([[27, lier + 1]]));
  const drawn = R.drawRandomWizardSpell(1, [], {});
  assert.equal(drawn.ids.length, 2);
  assert.deepEqual(drawn.rolls, [lier + 1]);
});
test('tirage : sort de patron relancé sans lien, accepté avec lien', () => {
  const last = R.WIZARD_SPELLS[1].length;
  R.__setRoller(scriptedRoller([[27, last], [27, 1]]));
  assert.deepEqual(R.drawRandomWizardSpell(1, [], { hasPatronBond: false }).ids, [R.WIZARD_SPELLS[1][0].id]);
  R.__setRoller(scriptedRoller([[27, last]]));
  assert.deepEqual(R.drawRandomWizardSpell(1, [], { hasPatronBond: true }).ids, ['sort-de-patron-1']);
});
test('tirage : invoquer un patron déjà connu relance la paire', () => {
  const lier = R.WIZARD_SPELLS[1].findIndex(s => s.name === 'Lier un patron');
  R.__setRoller(scriptedRoller([[27, lier + 1], [27, 1]]));
  assert.deepEqual(R.drawRandomWizardSpell(1, ['invoquer-un-patron'], {}).ids, [R.WIZARD_SPELLS[1][0].id]);
});
test('mercurielle Chance +2 = +20', () => { R.__setRoller(scriptedRoller([[100, 25]])); assert.equal(R.rollMercurialMagic(2).entries[0].roll, 45); });
test('mercurielle : le dé du test est conservé (castDie)', () => {
  R.__setRoller(scriptedRoller([[100, 2]]));
  const m = R.rollMercurialMagic(0);
  assert.equal(m.entries[0].castDie, '1d14'); assert.deepEqual(m.rolls, [2]);
});
test('mercurielle 99 : deux tirages', () => {
  R.__setRoller(scriptedRoller([[100, 99], [100, 2], [100, 5]]));
  const m = R.rollMercurialMagic(0);
  assert.deepEqual(m.entries.map(e => e.roll), [2, 5]);
  assert.deepEqual(m.rolls, [99, 2, 5]);
});
test('mercurielle 00 : deux tirages en 4d20 + 10 x Chance', () => {
  R.__setRoller(scriptedRoller([[100, 100], [20, 5], [20, 5], [20, 5], [20, 5], [20, 1], [20, 1], [20, 1], [20, 1]]));
  const m = R.rollMercurialMagic(1);
  assert.deepEqual(m.entries.map(e => e.roll), [30, 14]);
});

// --- Incantation arcanique ---
test('castSpell refuse un sort au-dessus du niveau maximal (mage INT 8, clerc PER 5)', () => {
  assert.throws(() => R.castSpell(wizardWithSpellLevel(3, { level: 10, int: 8 }), 'eclair', {}), /non lançable/);
  const cleric = adv('cleric', 10, { per: 5 });
  cleric.classData.spells = [{ id: 'benediction', level: 2 }];
  assert.throws(() => R.castSpell(cleric, 'benediction', {}), /non lançable/);
});
test('sort mage niv. 1 : 11 = perdu', () => {
  R.__setRoller(scriptedRoller([[20, 10]]));
  const { result, char } = R.castSpell(wizardWith1Spell({ int: 10 }), 'sommeil', {});
  assert.equal(result.outcome, 'lost'); assert.deepEqual(char.daily.lostSpells, ['sommeil']);
});
test('sort mage niv. 2 : 13 = échec non perdu', () => {
  R.__setRoller(scriptedRoller([[20, 10]]));
  const { result, char } = R.castSpell(wizardWithSpellLevel(2, { level: 3, int: 10 }), 'invisibilite', {});
  assert.equal(result.outcome, 'failedKept'); assert.deepEqual(char.daily.lostSpells, []); assert.equal(result.dc, 14);
});
test('sort mage niv. 2 : 14 = réussite', () => {
  R.__setRoller(scriptedRoller([[20, 11]]));
  assert.equal(R.castSpell(wizardWithSpellLevel(2, { level: 3, int: 10 }), 'invisibilite', {}).result.outcome, 'success');
});
test('armure pénalise le mage', () => { R.__setRoller(scriptedRoller([[20, 12]])); assert.equal(R.castSpell(wizardWith1Spell({ int: 10, armorId: 'leather' }), 'sommeil', {}).result.outcome, 'success'); }); // 12+1-1=12
test('mage : INT + NI + augure 13 + extraModifier', () => {
  R.__setRoller(scriptedRoller([[20, 5]]));
  const c = wizardWith1Spell({ int: 16, luckySignRoll: 13, luckMod: 2 });
  const r = R.castSpell(c, 'sommeil', { extraModifier: 1 }).result;
  assert.equal(r.total, 5 + 2 + 1 + 2 + 1); assert.equal(r.natural, 5);
});
test('sort de clerc tiré par un mage : -2', () => {
  R.__setRoller(scriptedRoller([[20, 12]]));
  const c = wizardWith1Spell({ int: 10, spellId: 'detection-de-la-magie' });
  assert.equal(R.castSpell(c, 'detection-de-la-magie', {}).result.total, 12 + 1 - 2);
});
test('elfe : sort fétiche ajoute la Chance figée', () => {
  R.__setRoller(scriptedRoller([[20, 5]]));
  const c = adv('elf', 1, { int: 10, luckMod: 2, classData: { spells: [{ id: 'sommeil', level: 1 }], luckySpell: 'sommeil' } });
  assert.equal(R.castSpell(c, 'sommeil', {}).result.total, 5 + 1 + 2);
});
test('mercurielle castDie : le dé du test change', () => {
  R.__setRoller(scriptedRoller([[14, 9]]));
  const c = wizardWith1Spell({ int: 10, classData: { spells: [{ id: 'sommeil', level: 1, mercurial: { rolls: [2], entries: [{ roll: 2, text: 'x', castDie: '1d14' }] } }] } });
  const r = R.castSpell(c, 'sommeil', {}).result;
  assert.equal(r.natural, 9); assert.equal(r.die, '1d14');
});
test('sort inconnu : erreur française', () => assert.throws(() => R.castSpell(wizardWith1Spell(), 'eclair', {}), /inconnu/i));
test('1 naturel : fumble, corruption à tirer, sort perdu', () => {
  R.__setRoller(scriptedRoller([[20, 1]]));
  const { result, char } = R.castSpell(wizardWith1Spell({ int: 10 }), 'sommeil', {});
  assert.equal(result.outcome, 'fumble'); assert.equal(result.corruptionNeeded, true);
  assert.deepEqual(char.daily.lostSpells, ['sommeil']); assert.equal(result.permanentLossChoices, undefined);
});

// --- Brûlesort ---
test('brûlesort refusé sous 1', () => assert.throws(() => R.castSpell(wizardWith1Spell({ str: 5 }), 'sommeil', { spellburn: { strength: 5 } }), /brûlesort/i));
test('brûlesort : bonus, scores baissés, drapeau du jour, entrée intacte', () => {
  R.__setRoller(scriptedRoller([[20, 8]]));
  const c = wizardWith1Spell({ int: 10, str: 12 });
  const { result, char } = R.castSpell(c, 'sommeil', { spellburn: { strength: 2, agility: 1 } });
  assert.equal(result.total, 8 + 1 + 3); assert.equal(result.outcome, 'success');
  assert.deepEqual(char.daily.spellburn, { strength: 2, agility: 1, stamina: 0 }); assert.equal(char.daily.spellburnToday, true);
  assert.deepEqual(c.daily.spellburn, { strength: 0, agility: 0, stamina: 0 });
});
test('brûlesort cumulé avec le brûlesort du jour', () => {
  R.__setRoller(scriptedRoller([[20, 8]]));
  const c = wizardWith1Spell({ int: 10, str: 6, daily: { spellburn: { strength: 4, agility: 0, stamina: 0 } } });
  assert.throws(() => R.castSpell(c, 'sommeil', { spellburn: { strength: 2 } }), /brûlesort/i);
});
test('brûlesort interdit au clerc', () => assert.throws(() => R.castSpell(clericWith('benediction'), 'benediction', { spellburn: { strength: 1 } }), /brûlesort/i));
test('20 points de brûlesort : naturel 20 sans lancer', () => {
  R.__setRoller(scriptedRoller([]));
  const c = wizardWith1Spell({ int: 10, str: 18, agi: 18, sta: 18 });
  const r = R.castSpell(c, 'sommeil', { spellburn: { strength: 7, agility: 7, stamina: 6 } }).result;
  assert.equal(r.natural, 20); assert.equal(r.outcome, 'success');
});
test('sort perdu : brûlesort >= niveau requis, excédent seulement en bonus', () => {
  const lost = () => wizardWithSpellLevel(2, { level: 3, int: 10, daily: { lostSpells: ['invisibilite'] } });
  assert.throws(() => R.castSpell(lost(), 'invisibilite', {}), /brûlesort/i);
  assert.throws(() => R.castSpell(lost(), 'invisibilite', { spellburn: { strength: 1 } }), /brûlesort/i);
  R.__setRoller(scriptedRoller([[20, 9]]));
  const r = R.castSpell(lost(), 'invisibilite', { spellburn: { strength: 4 } });
  assert.equal(r.result.total, 9 + 3 + 2); assert.equal(r.result.outcome, 'success');
  assert.deepEqual(r.char.daily.lostSpells, []);
});
test('fumble avec brûlesort : choix de perte permanente', () => {
  R.__setRoller(scriptedRoller([[20, 1]]));
  const r = R.castSpell(wizardWith1Spell({ int: 10 }), 'sommeil', { spellburn: { strength: 1, stamina: 2 } });
  assert.deepEqual(r.result.permanentLossChoices, ['strength', 'stamina']);
});
test('perte permanente : -1 au score de base', () => {
  const c = wizardWith1Spell({ str: 10 });
  const r = R.applyPermanentLoss(c, 'strength');
  assert.equal(r.stats.strength.score, 9); assert.equal(r.stats.strength.mod, 0); assert.equal(c.stats.strength.score, 10);
});

// --- Clerc ---
test('clerc : échec augmente la plage, 1 naturel = défaveur', () => {
  R.__setRoller(scriptedRoller([[20, 5]])); let { char } = R.castSpell(clericWith('benediction'), 'benediction', {}); assert.equal(char.daily.disapprovalRange, 2);
  R.__setRoller(scriptedRoller([[20, 2], [4, 1], [4, 1]])); assert.equal(R.castSpell(char, 'benediction', {}).result.outcome, 'disapproval');
});
test('défaveur : n d4 - Chance sur la table', () => {
  R.__setRoller(scriptedRoller([[20, 3], [4, 2], [4, 2], [4, 3]]));
  const r = R.castSpell(clericWith('benediction', { disapprovalRange: 3 }, { luckMod: 1 }), 'benediction', {}).result;
  assert.equal(r.disapproval.total, 6); assert.deepEqual(r.disapproval.rolls, [2, 2, 3]);
  assert.match(r.disapproval.text, /pénalité/);
});
test('clerc : réussite sans effet sur la plage, 20 naturel = bonus NI', () => {
  R.__setRoller(scriptedRoller([[20, 20]]));
  const { result, char } = R.castSpell(clericWith('benediction', { disapprovalRange: 3 }), 'benediction', {});
  assert.equal(result.outcome, 'success'); assert.equal(result.critBonus, 1); assert.equal(char.daily.disapprovalRange, 3);
});
test('clerc : PER + NI, DD 12 au niveau 1', () => {
  R.__setRoller(scriptedRoller([[20, 8]]));
  const r = R.castSpell(clericWith('benediction', {}, { per: 16 }), 'benediction', {}).result;
  assert.equal(r.total, 8 + 2 + 1); assert.equal(r.dc, 12); assert.equal(r.outcome, 'failedKept');
});
test('sacrifice 120 po = -2, minimum 1', () => assert.equal(R.sacrifice(clericWith('benediction', { disapprovalRange: 2 }), 120).char.daily.disapprovalRange, 1));
test('sacrifice : réduction renvoyée', () => assert.equal(R.sacrifice(clericWith('benediction', { disapprovalRange: 6 }), 120).result.reduction, 2));
test('aide divine +10', () => { R.__setRoller(scriptedRoller([[20, 15]])); assert.equal(R.divineAid(clericWith('benediction'), 10).char.daily.disapprovalRange, 11); });
test('aide divine : DD, succès et échec', () => {
  R.__setRoller(scriptedRoller([[20, 15]]));
  const ok = R.divineAid(clericWith('benediction', {}, { per: 10 }), 17).result;
  assert.equal(ok.total, 16); assert.equal(ok.success, false);
  R.__setRoller(scriptedRoller([[20, 15]]));
  assert.equal(R.divineAid(clericWith('benediction'), 16).result.success, true);
});
test('repousser les impies : 1d20 + PER + NI + Chance, lecture de table', () => {
  R.__setRoller(scriptedRoller([[20, 13]]));
  const { result, char } = R.turnUnholy(clericWith('benediction', {}, { per: 16, luckMod: 1 }));
  assert.equal(result.total, 13 + 2 + 1 + 1); assert.equal(result.row.range, '9 m'); assert.equal(char.daily.disapprovalRange, 1);
});
test('repousser les impies : échec augmente la plage', () => {
  R.__setRoller(scriptedRoller([[20, 3]]));
  const { result, char } = R.turnUnholy(clericWith('benediction'));
  assert.equal(result.total, 4); assert.equal(char.daily.disapprovalRange, 2);
});
test('imposition des mains : dés lus selon la relation', () => {
  R.__setRoller(scriptedRoller([[20, 12]]));
  const { result, char } = R.layOnHands(clericWith('benediction', {}, { per: 10 }), 'adjacent');
  assert.equal(result.total, 13); assert.equal(result.dice, 1); assert.equal(char.daily.disapprovalRange, 1);
});
test('imposition des mains : échec augmente la plage, augure 16 affiché', () => {
  R.__setRoller(scriptedRoller([[20, 3]]));
  const { result, char } = R.layOnHands(clericWith('benediction', {}, { luckySignRoll: 16, luckMod: 2 }), 'same');
  assert.equal(result.dice, 0); assert.equal(char.daily.disapprovalRange, 2); assert.equal(result.healBonus, 2);
});
test('pouvoirs de clerc refusés aux autres classes', () => assert.throws(() => R.sacrifice(adv('warrior', 1), 100), /clerc/i));

// --- Corruption ---
test('corruption 1d10 - niveau + Chance', () => { R.__setRoller(scriptedRoller([[10, 6]])); assert.equal(R.rollCorruption(adv('wizard', 1, { luckMod: 1 }), 1, 'minor').total, 6); });
test('corruption : texte lu sur la table de gravité', () => {
  R.__setRoller(scriptedRoller([[10, 10]]));
  const r = R.rollCorruption(adv('wizard', 1, { luckMod: 0 }), 1, 'greater');
  assert.equal(r.roll, 10); assert.equal(r.total, 9); assert.ok(r.text.length > 10);
  assert.throws(() => R.rollCorruption(adv('wizard', 1), 1, 'enorme'), /gravité|corruption/i);
});
test('éviter la corruption : -1 Chance', () => {
  const c = adv('wizard', 1, { luck: 10 });
  const r = R.avoidCorruptionWithLuck(c);
  assert.equal(r.result.ok, true); assert.equal(r.char.stats.luck.score, 9); assert.equal(c.stats.luck.score, 10);
  assert.equal(R.avoidCorruptionWithLuck(adv('wizard', 1, { luck: 0 })).result.ok, false);
});
test('ajout de corruption', () => {
  const c = adv('wizard', 1);
  assert.deepEqual(R.addCorruption(R.addCorruption(c, 'Cornes'), 'Queue').classData.corruptions, ['Cornes', 'Queue']);
  assert.equal(c.classData.corruptions, undefined);
});

// --- Liste de sorts éditable ---
test('ajout manuel mage : magie mercurielle lancée', () => {
  R.__setRoller(scriptedRoller([[100, 2]]));
  const { result, char } = R.addKnownSpell(adv('wizard', 1), 'eclair', 3);
  assert.equal(result.mercurial.entries[0].castDie, '1d14');
  assert.deepEqual(char.classData.spells, [{ id: 'eclair', level: 3, mercurial: result.mercurial }]);
});
test('ajout manuel clerc : sans magie mercurielle ; doublon et sort inconnu refusés', () => {
  const { result, char } = R.addKnownSpell(adv('cleric', 1), 'sanctuaire', 1);
  assert.equal(result.mercurial, undefined); assert.deepEqual(char.classData.spells, [{ id: 'sanctuaire', level: 1 }]);
  assert.throws(() => R.addKnownSpell(char, 'sanctuaire', 1), /déjà/i);
  assert.throws(() => R.addKnownSpell(char, 'zzz', 1), /inconnu/i);
});
test('retrait : sort et sort perdu', () => {
  const c = wizardWith1Spell({ daily: { lostSpells: ['sommeil'] } });
  const r = R.removeKnownSpell(c, 'sommeil');
  assert.deepEqual(r.classData.spells, []); assert.deepEqual(r.daily.lostSpells, []);
  assert.equal(c.classData.spells.length, 1);
});

// --- Points de vie et augures (compléments) ---
test('modificateur de PV : END effective + augure 25', () => {
  assert.equal(R.getHitPointModifier(adv('warrior', 1, { sta: 16 })), 2);
  assert.equal(R.getHitPointModifier(adv('warrior', 1, { sta: 16, luckySignRoll: 25, luckMod: 1 })), 3);
  assert.equal(R.getHitPointModifier(adv('warrior', 1, { sta: 16, luckySignRoll: 24, luckMod: 1 })), 2);
});
test('augure 12 : Chance figée sur le passage secret de l’elfe', () => {
  assert.equal(R.getSkillCheckProfile(adv('elf', 1, { int: 10, luckySignRoll: 12, luckMod: 2 }), 'secretDoor').total, 4 + 2);
  assert.equal(R.getSkillCheckProfile(adv('elf', 1, { int: 10, luckySignRoll: 5, luckMod: 2 }), 'secretDoor').total, 4);
});

// --- Corrections de la revue (tour 1) ---
test('critique arcanique : 20 naturel ajoute le niveau', () => {
  R.__setRoller(scriptedRoller([[20, 20]]));
  const r = R.castSpell(wizardWith1Spell({ int: 10 }), 'sommeil', {}).result;
  assert.equal(r.critBonus, 1); assert.equal(r.total, 20 + 0 + 1 + 1); assert.match(r.detail, /critique/);
});
test('critique : 20 points de brûlesort, détail sans dé lancé', () => {
  R.__setRoller(scriptedRoller([]));
  const c = wizardWith1Spell({ int: 10, str: 18, agi: 18, sta: 18 });
  const r = R.castSpell(c, 'sommeil', { spellburn: { strength: 7, agility: 7, stamina: 6 } }).result;
  assert.equal(r.critBonus, 1); assert.match(r.detail, /20 naturel grâce au brûlesort/); assert.doesNotMatch(r.detail, /d20 : 20/);
});
test('critique : maximum d’un d24 (castDie), pas d’un d14', () => {
  const m = (castDie) => ({ rolls: [1], entries: [{ roll: 1, text: 'x', castDie }] });
  const withDie = (castDie) => wizardWith1Spell({ int: 10, classData: { spells: [{ id: 'sommeil', level: 1, mercurial: m(castDie) }] } });
  R.__setRoller(scriptedRoller([[24, 24]]));
  assert.equal(R.castSpell(withDie('1d24'), 'sommeil', {}).result.critBonus, 1);
  R.__setRoller(scriptedRoller([[14, 14]]));
  assert.equal(R.castSpell(withDie('1d14'), 'sommeil', {}).result.critBonus, 0);
});
test('repousser les impies : défaveur si naturel dans la plage', () => {
  R.__setRoller(scriptedRoller([[20, 2], [4, 1], [4, 2]]));
  const { result, char } = R.turnUnholy(clericWith('benediction', { disapprovalRange: 3 }, { per: 18 }));
  assert.equal(result.disapproval.dice, 2); assert.deepEqual(result.disapproval.rolls, [1, 2]);
  assert.equal(char.daily.disapprovalRange, 3);
});
test('imposition des mains : défaveur si naturel dans la plage', () => {
  R.__setRoller(scriptedRoller([[20, 3], [4, 1], [4, 1], [4, 1]]));
  const { result, char } = R.layOnHands(clericWith('benediction', { disapprovalRange: 3 }, { per: 18 }), 'same');
  assert.equal(result.dice, 0); assert.equal(result.disapproval.total, 3); assert.equal(char.daily.disapprovalRange, 3);
});
test('tirage : un seul sort restant après 50 essais', () => {
  const list = R.WIZARD_SPELLS[5];
  const known = list.slice(1).map(s => s.id);
  R.__setRoller(scriptedRoller([...Array(50).fill([5, 5]), [1, 1]]));
  const r = R.drawRandomWizardSpell(5, known, {});
  assert.deepEqual(r.ids, [list[0].id]); assert.equal(r.rolls.length, 51); assert.equal(r.rolls[50], 1);
});
test('mercurielle : total au-delà de 100 lu comme 00', () => {
  R.__setRoller(scriptedRoller([[100, 95], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1]]));
  const m = R.rollMercurialMagic(1);
  assert.deepEqual(m.entries.map(e => e.roll), [14, 14]);
});
test('mercurielle : « relancez deux fois » abandonné à la profondeur limite', () => {
  R.__setRoller(scriptedRoller(Array(1 + 2 + 4 + 8).fill([100, 99])));
  const m = R.rollMercurialMagic(0);
  assert.deepEqual(m.entries, []);
});
test('modificateur supplémentaire invalide', () => assert.throws(() => R.castSpell(wizardWith1Spell(), 'sommeil', { extraModifier: NaN }), /modificateur/i));

test('repousser les impies : success et detail avec les modificateurs', () => {
  R.__setRoller(scriptedRoller([[20, 15]]));
  const { result } = R.turnUnholy(clericWith('benediction', {}, { per: 16, luckMod: 1 }));
  assert.equal(result.success, true);
  assert.match(result.detail, /d20 \(15\)/); assert.match(result.detail, /PER \+2/); assert.match(result.detail, /niveau \+1/); assert.match(result.detail, /Chance \+1/);
  R.__setRoller(scriptedRoller([[20, 2]]));
  assert.equal(R.turnUnholy(clericWith('benediction', { disapprovalRange: 1 }, { per: 10 })).result.success, false);
});
test('aide divine : detail avec PER, niveau et augure', () => {
  R.__setRoller(scriptedRoller([[20, 15]]));
  const { result } = R.divineAid(clericWith('benediction', {}, { per: 14, luckMod: 2, luckySignRoll: 13 }), 10);
  assert.match(result.detail, /PER \+1/); assert.match(result.detail, /niveau \+1/); assert.match(result.detail, /augure \+2/);
});
test('corruption : renvoie le modificateur de Chance utilisé', () => {
  R.__setRoller(scriptedRoller([[10, 6]]));
  const r = R.rollCorruption(adv('wizard', 1, { luckMod: 1 }), 1, 'minor');
  assert.equal(r.luckMod, 1); assert.equal(r.total, 6);
});
