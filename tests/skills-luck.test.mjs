import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, scriptedRoller, adv } from './helpers.mjs';

const R = loadRules();

test('voleur assassin déplacement silencieux niv. 1 en cuir', () => assert.equal(R.getSkillCheckProfile(adv('thief', 1, { alignment: 'Chaotique', agi: 13, armorId: 'leather' }), 'sneak').total, 3 + 1 - 1));
test('se déguiser utilise PER', () => assert.equal(R.getSkillCheckProfile(adv('thief', 1, { alignment: 'Neutre', per: 16 }), 'disguise').abilityMod, 2));
test('crocheter sans outils signalé', () => assert.equal(R.getSkillCheckProfile(adv('thief', 1, { classData: { hasTools: false } }), 'locks').missingTools, true));
test('désamorcer : 1 naturel déclenche', () => { R.__setRoller(scriptedRoller([[20, 1]])); assert.equal(R.rollSkillCheck(adv('thief', 1), 'disableTraps').trapTriggered, true); });
test('Chance voleur niveau 2 : 2d4', () => assert.equal(R.burnLuck(adv('thief', 2, { luck: 10 }), 2).result.bonusDice, '2d4'));
test('Chance halfelin x2', () => assert.equal(R.burnLuck(adv('halfling', 1, { luck: 10 }), 3).result.flatBonus, 6));
test('Chance insuffisante', () => assert.equal(R.burnLuck(adv('warrior', 1, { luck: 1 }), 2).result.ok, false));
test('halfelin AGI 12 deux armes d16 crit 16', () => assert.deepEqual(R.getHalflingTwoWeaponProfile(adv('halfling', 1, { agi: 12 })), { actionDie: 16, offhandDie: 16, critOnNatural: 16, critAutoHit: true, critMainOnly: false, fumbleRequiresBoth: true, usesClassAttackBonus: true }));
test('coup de bouclier nain', () => { R.__setRoller(scriptedRoller([[14, 9], [3, 2], [3, 3]])); const r = R.rollShieldBash(adv('dwarf', 1, { hasShield: true, str: 10 })); assert.equal(r.total, 11); assert.equal(r.damage, 5); });

test('brûler la Chance baisse le score et le modificateur, sans muter ni toucher au score initial', () => {
  const c = adv('warrior', 1, { luck: 13 });
  const r = R.burnLuck(c, 3);
  assert.deepEqual([r.char.stats.luck.score, r.char.stats.luck.mod, r.char.stats.luck.initialScore], [10, 0, 13]);
  assert.equal(r.result.flatBonus, 3); assert.equal(r.result.bonusDice, null);
  assert.equal(c.stats.luck.score, 13);
});
test('Chance : refus de 0 point ou de points non entiers', () => {
  assert.equal(R.burnLuck(adv('warrior', 1), 0).result.ok, false);
  assert.equal(R.burnLuck(adv('warrior', 1), 1.5).result.ok, false);
  assert.equal(R.burnLuck(adv('warrior', 1, { luck: 1 }), 2).result.reason, 'Chance insuffisante.');
});
test('augure 10 : Chance figée sur toutes les compétences ; augure 11 : pièges seulement', () => {
  const a = adv('thief', 1, { luckySignRoll: 10, luckMod: 2 });
  assert.equal(R.getSkillCheckProfile(a, 'locks').luckSignBonus, 2);
  const b = adv('thief', 1, { luckySignRoll: 11, luckMod: 2 });
  assert.equal(R.getSkillCheckProfile(b, 'locks').luckSignBonus, 0);
  assert.equal(R.getSkillCheckProfile(b, 'findTraps').luckSignBonus, 2);
  assert.equal(R.getSkillCheckProfile(b, 'disableTraps').luckSignBonus, 2);
});
test('halfelin : discrétion = table + AGI + armure', () => {
  const p = R.getSkillCheckProfile(adv('halfling', 1, { agi: 16, armorId: 'leather' }), 'hide');
  assert.deepEqual([p.bonus, p.abilityMod, p.armorPenalty, p.total], [3, 2, -1, 4]);
});
test('elfe passage secret +4 + INT ; nain souterrain + niveau', () => {
  assert.equal(R.getSkillCheckProfile(adv('elf', 1, { int: 16 }), 'secretDoor').total, 4 + 2);
  assert.equal(R.getSkillCheckProfile(adv('dwarf', 3), 'underground').total, 3);
});
test('parchemin : dé de la table, pas de pénalité d’armure', () => {
  const p = R.getSkillCheckProfile(adv('thief', 3, { alignment: 'Loyal', int: 16, armorId: 'chainmail' }), 'scroll');
  assert.deepEqual([p.die, p.armorPenalty, p.abilityMod, p.total], [12, 0, 2, 2]);
});
test('compétence inconnue pour la classe : erreur française', () => {
  assert.throws(() => R.getSkillCheckProfile(adv('warrior', 1), 'sneak'), /compétence/i);
  assert.throws(() => R.getSkillCheckProfile(adv('thief', 1), 'secretDoor'), /compétence/i);
});
test('jet de compétence : détail et pas de piège hors 1 naturel', () => {
  R.__setRoller(scriptedRoller([[20, 12]]));
  const r = R.rollSkillCheck(adv('thief', 1, { alignment: 'Neutre' }), 'disableTraps');
  assert.equal(r.natural, 12); assert.equal(r.total, 12 + 1); assert.equal(r.trapTriggered, false);
  assert.match(r.detail, /d20/);
});
test('Chance donnée par le halfelin à un allié vivant', () => {
  const h = adv('halfling', 1, { luck: 10 });
  const ally = adv('warrior', 1, { currentHp: 5 });
  const r = R.giveHalflingLuck(h, ally, 2);
  assert.equal(r.result.ok, true); assert.equal(r.result.bonus, 4);
  assert.match(r.result.text, /\+4/); assert.equal(r.char.stats.luck.score, 8);
});
test('Chance donnée : allié mort ou agonisant refusé, Chance insuffisante refusée', () => {
  const h = adv('halfling', 1, { luck: 10 });
  assert.equal(R.giveHalflingLuck(h, adv('warrior', 1, { currentHp: 0 }), 1).result.ok, false);
  assert.equal(R.giveHalflingLuck(h, adv('warrior', 1, { dying: true }), 1).result.ok, false);
  assert.equal(R.giveHalflingLuck(adv('halfling', 1, { luck: 1 }), adv('warrior', 1), 2).result.ok, false);
});
test('halfelin AGI 18 : table 4-3 normale, critique normal', () => {
  const p = R.getHalflingTwoWeaponProfile(adv('halfling', 1, { agi: 18 }));
  assert.deepEqual(p, { actionDie: 20, offhandDie: 16, critOnNatural: null, critAutoHit: false, critMainOnly: true, fumbleRequiresBoth: false, usesClassAttackBonus: true });
});
test('halfelin AGI 16 : règle spéciale ; AGI 17 : règles normales (table 4-3 ligne 16-17)', () => {
  assert.equal(R.getHalflingTwoWeaponProfile(adv('halfling', 1, { agi: 16 })).critAutoHit, true);
  const p = R.getHalflingTwoWeaponProfile(adv('halfling', 1, { agi: 17 }));
  assert.deepEqual(p, { actionDie: 16, offhandDie: 16, critOnNatural: 16, critAutoHit: false, critMainOnly: true, fumbleRequiresBoth: false, usesClassAttackBonus: true });
});
test('coup de bouclier : erreur sans bouclier ou hors nain', () => {
  assert.throws(() => R.rollShieldBash(adv('dwarf', 1)), /bouclier/i);
  assert.throws(() => R.rollShieldBash(adv('warrior', 1, { hasShield: true })), /nain/i);
});

// --- Attaque à deux armes du halfelin (jets : principale, secondaire, dégâts principaux, dégâts secondaires) ---
const dagger = { name: 'Dague', damage: '1d4' };
const twoWeapon = (agi, dice) => { R.__setRoller(scriptedRoller(dice)); return R.rollHalflingTwoWeaponAttack(adv('halfling', 1, { agi }), dagger); };

test('deux armes AGI 12 : d16 / d16, 16 naturel critique, le bonus d’attaque de classe s’applique aux deux mains', () => {
  const r = twoWeapon(12, [[16, 16], [16, 9], [8, 5], [4, 2]]);
  assert.equal(r.main.die, 16); assert.equal(r.off.die, 16);
  assert.equal(r.main.critical, true); assert.equal(r.off.critical, false);
  const bonus = R.getAttackProfile(adv('halfling', 1, { agi: 12 }), adv('halfling', 1).weapon, 0).fixedBonus;
  assert.ok(bonus > 0);
  assert.equal(r.main.total, 16 + bonus); assert.equal(r.off.total, 9 + bonus);
  assert.equal(r.main.damage, 5); assert.equal(r.off.damage, 2);
  assert.equal(r.criticalCount, 1);
});
test('deux armes AGI 12 : maladresse seulement sur double 1', () => {
  assert.equal(twoWeapon(12, [[16, 1], [16, 7], [8, 2], [4, 2]]).fumble, false);
  assert.equal(twoWeapon(12, [[16, 1], [16, 1], [8, 2], [4, 2]]).fumble, true);
});
test('deux armes AGI 16 : 16 naturel critique et réussite automatique, maladresse double 1', () => {
  const r = twoWeapon(16, [[16, 3], [16, 16], [8, 2], [4, 2]]);
  assert.equal(r.off.critical, true); assert.equal(r.main.critical, false); assert.equal(r.conditionalCritical, false);
  assert.equal(twoWeapon(16, [[16, 1], [16, 3], [8, 2], [4, 2]]).fumble, false);
});
test('deux armes AGI 17 : règles normales, critique principal sur 16 seulement si touche, maladresse sur un 1', () => {
  const r = twoWeapon(17, [[16, 16], [16, 16], [8, 2], [4, 2]]);
  assert.equal(r.main.die, 16); assert.equal(r.off.die, 16);
  assert.equal(r.main.critical, false); assert.equal(r.conditionalCritical, true);
  assert.equal(r.off.critical, false); assert.equal(r.critical, false);
  assert.match(r.detail, /passe la CA/);
  const none = twoWeapon(17, [[16, 5], [16, 16], [8, 2], [4, 2]]);
  assert.equal(none.conditionalCritical, false); assert.equal(none.off.critical, false);
  assert.equal(twoWeapon(17, [[16, 1], [16, 3], [8, 2], [4, 2]]).fumble, true);
  assert.equal(twoWeapon(17, [[16, 3], [16, 1], [8, 2], [4, 2]]).fumble, true);
});
test('deux armes AGI 18 : d20 / d16, critique au 20 naturel principal seulement, maladresse sur un 1', () => {
  const crit = twoWeapon(18, [[20, 20], [16, 16], [8, 2], [4, 2]]);
  assert.equal(crit.main.die, 20); assert.equal(crit.off.die, 16);
  assert.equal(crit.main.critical, true); assert.equal(crit.off.critical, false);
  assert.equal(twoWeapon(18, [[20, 16], [16, 3], [8, 2], [4, 2]]).critical, false);
  assert.equal(twoWeapon(18, [[20, 1], [16, 9], [8, 2], [4, 2]]).fumble, true);
  assert.equal(twoWeapon(18, [[20, 9], [16, 1], [8, 2], [4, 2]]).fumble, true);
});
test('deux armes : classe invalide ou arme secondaire absente refusées', () => {
  assert.throws(() => R.rollHalflingTwoWeaponAttack(adv('warrior', 1), dagger), /halfelin/i);
  assert.throws(() => R.rollHalflingTwoWeaponAttack(adv('halfling', 1), null), /secondaire/i);
});

test('deux armes : bonus d’attaque de classe aux deux mains à tout AGI (décision utilisateur)', () => {
  [12, 16, 17, 18].forEach((agi) => {
    const profile = R.getAttackProfile(adv('halfling', 1, { agi }), adv('halfling', 1).weapon, 0);
    const r = twoWeapon(agi, [[agi >= 18 ? 20 : 16, 5], [16, 5], [8, 2], [4, 2]]);
    assert.equal(R.getHalflingTwoWeaponProfile(adv('halfling', 1, { agi })).usesClassAttackBonus, true);
    assert.equal(r.main.total, 5 + profile.attackFixed, `main AGI ${agi}`);
    assert.equal(r.off.total, 5 + profile.attackFixed, `off AGI ${agi}`);
  });
});
