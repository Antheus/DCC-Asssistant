import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, scriptedRoller, adv, weapon } from './helpers.mjs';

const R = loadRules();

test('guerrier dé de haut fait ajouté au toucher et aux dégâts', () => {
  R.__setRoller(scriptedRoller([[20, 12], [3, 3], [8, 5]]));
  const r = R.rollAdventurerAttack(adv('warrior', 1, { str: 16 }), {});
  assert.equal(r.total, 12 + 3 + 2); assert.equal(r.damage, 5 + 3 + 2); assert.equal(r.deedSuccessIfHit, true);
});
test('guerrier 19 naturel = critique si touche', () => { R.__setRoller(scriptedRoller([[20, 19], [3, 1], [8, 1]])); assert.equal(R.rollAdventurerAttack(adv('warrior', 1), {}).critical, 'if-hit'); });
test('20 naturel = critique automatique, 1 naturel = maladresse', () => {
  R.__setRoller(scriptedRoller([[20, 20], [3, 1], [8, 1]]));
  assert.equal(R.rollAdventurerAttack(adv('warrior', 1), {}).critical, 'auto');
  R.__setRoller(scriptedRoller([[20, 1], [3, 1], [8, 1]]));
  assert.equal(R.rollAdventurerAttack(adv('warrior', 1), {}).fumble, true);
});
test('mage avec épée à deux mains : dé dégradé d16', () => assert.equal(R.getAttackProfile(adv('wizard', 1), weapon('epee-deux-mains')).actionDie, 16));
test('clerc loyal maîtrise la masse, pas la dague', () => { const ids = R.getProficientWeaponIds(adv('cleric', 1, { alignment: 'Loyal' })); assert.ok(ids.includes('masse')); assert.ok(!ids.includes('dague')); });
test('arme fétiche : Chance sur l’attaque seulement', () => {
  const c = adv('warrior', 1, { luckMod: 2, classData: { luckyWeapon: 'epee-longue' } });
  const p = R.getAttackProfile(c, weapon('epee-longue')); assert.equal(p.luckBonus, 2); assert.equal(p.damageFixed, c.stats.strength.mod);
});
test('arme fétiche reconnue sans catalogId', () => {
  const c = adv('warrior', 1, { luckMod: 2, classData: { luckyWeapon: 'epee-longue' } });
  const w = weapon('epee-longue'); delete w.catalogId;
  assert.equal(R.getAttackProfile(c, w).luckBonus, 2);
});
test('augure de mêlée et brûlesort sur le modificateur effectif', () => {
  const c = adv('wizard', 1, { str: 16, luckySignRoll: 1, luckMod: 1, daily: { spellburn: { strength: 4, agility: 0, stamina: 0 } } });
  assert.equal(R.getEffectiveScore(c, 'strength'), 12);
  assert.equal(R.getEffectiveMod(c, 'strength'), 0);
  assert.equal(R.getAttackProfile(c, weapon('dague')).luckBonus, 1);
});
test('distance : mod. AGI, sans FOR aux dégâts', () => {
  const p = R.getAttackProfile(adv('thief', 1, { str: 16, agi: 16 }), weapon('arbalete'));
  assert.equal(p.abilityMod, 2); assert.equal(p.damageFixed, 0);
});
test('initiative guerrier niveau 4 = AGI + 4', () => assert.equal(R.getAdventurerInitiative(adv('warrior', 4, { agi: 13 })), 1 + 4));
test('sauvegardes voleur niveau 6', () => assert.deepEqual(R.getAdventurerSaves(adv('thief', 6, { allMods: 0 })), { reflex: 4, fortitude: 2, will: 2 }));
test('mithril divise la pénalité', () => assert.equal(R.getArmorCheckPenalty(adv('elf', 1, { armorId: 'chainmail', classData: { mithril: true } })), -2));
test('pénalité armure et bouclier', () => assert.equal(R.getArmorCheckPenalty(adv('warrior', 1, { armorId: 'leather', hasShield: true })), -2));
test('titres : niveau 1 par alignement, niveau 7 libre', () => {
  assert.equal(R.getAdventurerTitle(adv('warrior', 1, { alignment: 'Loyal' })), 'Écuyer');
  assert.equal(R.getAdventurerTitle(adv('thief', 7, { customTitle: 'Prince des voleurs' })), 'Prince des voleurs');
});

test('dé dégradé d16 : le maximum naturel n’est pas un critique automatique', () => {
  const c = adv('wizard', 1); c.weapon = weapon('epee-deux-mains');
  R.__setRoller(scriptedRoller([[16, 16], [10, 1]]));
  const r = R.rollAdventurerAttack(c, {});
  assert.equal(r.critical, false);
});
test('brûlesort : FOR réduit les dégâts et l’attaque, AGI réduit initiative et Réflexes', () => {
  const daily = { spellburn: { strength: 4, agility: 4, stamina: 0 } };
  const base = adv('thief', 1, { str: 16, agi: 16 });
  const burned = adv('thief', 1, { str: 16, agi: 16, daily });
  const mace = weapon('masse');
  assert.equal(R.getAttackProfile(base, mace).abilityMod, 2);
  assert.equal(R.getAttackProfile(burned, mace).abilityMod, 0);
  assert.equal(R.getAttackProfile(base, mace).damageFixed, 2);
  assert.equal(R.getAttackProfile(burned, mace).damageFixed, 0);
  assert.equal(R.getAdventurerInitiative(base) - R.getAdventurerInitiative(burned), 2);
  assert.equal(R.getAdventurerSaves(base).reflex - R.getAdventurerSaves(burned).reflex, 2);
});
test('arme fétiche : sans effet pour une autre classe, valable pour le nain', () => {
  const thief = adv('thief', 1, { luckMod: 2, classData: { luckyWeapon: 'epee-longue' } });
  assert.equal(R.getAttackProfile(thief, weapon('epee-longue')).luckBonus, 0);
  const dwarf = adv('dwarf', 1, { luckMod: 2, classData: { luckyWeapon: 'epee-longue' } });
  assert.equal(R.getAttackProfile(dwarf, weapon('epee-longue')).luckBonus, 2);
});
test('second dé d’action dégradé avec une arme non maîtrisée', () => {
  const c = adv('wizard', 5);
  const p = R.getAttackProfile(c, weapon('epee-deux-mains'), 1);
  assert.equal(p.degraded, true);
  assert.equal(p.actionDie, 12); // d14 -> d12
  assert.equal(R.getAttackProfile(c, weapon('dague'), 1).actionDie, 14);
});
