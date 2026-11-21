import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules } from './helpers.mjs';

const R = loadRules();

test('createBlankAdventurer retourne un aventurier niveau 1 valide', () => {
  const adv = R.createBlankAdventurer();
  assert.equal(adv.level, 1);
  assert.equal(adv.className, 'warrior');
  assert.equal(adv.name, 'Nouvel Aventurier');
  assert.equal(adv.race, 'Humain');
  assert.equal(adv.alignment, 'Neutre');
  assert.equal(adv.maxHp, 10);
  assert.equal(adv.currentHp, 10);
  assert.equal(adv.xp, 10);
  assert.equal(adv.ac, 10);
  assert.equal(adv.speed, 9);
  assert.equal(adv.armorId, 'none');
  assert.equal(adv.hasShield, false);
  assert.equal(adv.stats.strength.score, 10);
  assert.equal(adv.stats.strength.mod, 0);
  assert.equal(adv.stats.luck.score, 10);
  assert.equal(adv.stats.luck.initialScore, 10);
  assert.equal(adv.coinPurse.po, 10);
  assert.equal(Array.isArray(adv.hpHistory), true);
  assert.equal(Array.isArray(adv.levelHistory), true);
  assert.doesNotThrow(() => R.normalizeAdventurer(adv));
  assert.doesNotThrow(() => R.validateCharacterData(adv));
});

test('createBlankAdventurer avec surcharges', () => {
  const wizard = R.createBlankAdventurer({
    name: 'Archimage Eldrin',
    className: 'wizard',
    level: 2,
    xp: 50,
    maxHp: 8,
    currentHp: 8,
    race: 'Elfe'
  });
  assert.equal(wizard.name, 'Archimage Eldrin');
  assert.equal(wizard.className, 'wizard');
  assert.equal(wizard.level, 2);
  assert.equal(wizard.race, 'Elfe');
  assert.doesNotThrow(() => R.normalizeAdventurer(wizard));
});

test('Recalcul des modificateurs et sauvegardes après édition de caractéristiques', () => {
  const adv = R.createBlankAdventurer();
  adv.stats.strength.score = 18;
  adv.stats.strength.mod = 3;
  adv.stats.agility.score = 16;
  adv.stats.agility.mod = 2;
  adv.stats.stamina.score = 14;
  adv.stats.stamina.mod = 1;
  adv.stats.personality.score = 12;
  adv.stats.personality.mod = 0;

  const saves = R.getAdventurerSaves(adv);
  assert.equal(typeof saves.reflex, 'number');
  assert.equal(typeof saves.fortitude, 'number');
  assert.equal(typeof saves.will, 'number');

  assert.equal(R.getEffectiveMod(adv, 'strength'), 3);
  assert.equal(R.getEffectiveMod(adv, 'agility'), 2);
  assert.equal(R.getEffectiveMod(adv, 'stamina'), 1);
});

test('Recalcul du profil d attaque après modification d arme', () => {
  const adv = R.createBlankAdventurer();
  adv.weapon = { name: 'Épée longue', damage: '1d8', attackType: 'melee', twoHanded: false };
  const profile = R.getAttackProfile(adv, adv.weapon, 0);
  assert.equal(profile.actionDie, 20);
  assert.equal(profile.degraded, false);
});
