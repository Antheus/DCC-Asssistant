/**
 * Fabriques de personnages : lvl0(overrides) et adv(classId, level, overrides).
 * Surcharges prises en charge (les modificateurs sont recalculés avec la table du livre) :
 *   str, agi, sta, per, int   scores de caractéristiques (défaut 10)
 *   luck, initialLuck         score de Chance (défaut 10) / score initial (défaut = luck)
 *   luckMod                   force luckySign.modifier (sinon mod. de la Chance)
 *   luckySignRoll             luckySign.roll (défaut 5, augure sans effet de combat)
 *   allMods                   force tous les modificateurs de caractéristiques (ex. 0)
 *   alignment, race, xp, currentHp, maxHp, hpBaseRoll, armorId, hasShield, customTitle, id
 *   classData, daily          fusionnés (superficiellement) avec les défauts
 *   toute autre clé           assignée telle quelle sur le personnage
 * adv() : race issue de CLASSES[classId], xp = XP_THRESHOLDS[level], classData par défaut
 * (voleur : { hasTools: true }), daily, hpHistory et levelHistory présents.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function memoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => store.clear()
  };
}

// Fresh vm context on every call so tests never share roller state.
export function loadRules() {
  const context = vm.createContext({
    document: { addEventListener() {} },
    localStorage: memoryStorage(),
    console,
    structuredClone
  });
  new vm.Script(script).runInContext(context);
  return hostRealm(context.DCC_RULES);
}

// Objects built inside the vm have another realm's prototypes, which makes
// assert.deepEqual (strict) fail. Re-create results in the host realm.
function toHost(value) {
  if (value === null || typeof value !== 'object') return value;
  return structuredClone(value);
}
function hostRealm(rules) {
  const out = {};
  for (const [key, member] of Object.entries(rules)) {
    out[key] = typeof member === 'function'
      ? (...args) => toHost(member(...args))
      : toHost(member);
  }
  return Object.freeze(out);
}

// pairs: [sides, value][]. Throws if the die asked for differs or the queue is empty.
export function scriptedRoller(pairs) {
  const queue = pairs.slice();
  return (sides) => {
    if (queue.length === 0) throw new Error(`Roller vide : d${sides} demandé`);
    const [expected, value] = queue.shift();
    if (expected !== sides) throw new Error(`Mauvais dé : d${expected} attendu, d${sides} lancé`);
    return value;
  };
}

const BOOK_MODS = (score) => (score <= 3 ? -3 : score <= 5 ? -2 : score <= 8 ? -1 : score <= 12 ? 0 : score <= 15 ? 1 : score <= 17 ? 2 : 3);
const STAT_KEYS = { str: 'strength', agi: 'agility', sta: 'stamina', per: 'personality', int: 'intelligence' };
const HANDLED = new Set([...Object.keys(STAT_KEYS), 'luck', 'initialLuck', 'luckMod', 'luckySignRoll', 'allMods',
  'alignment', 'race', 'xp', 'currentHp', 'maxHp', 'hpBaseRoll', 'armorId', 'hasShield', 'customTitle', 'id', 'classData', 'daily']);
let idCounter = 0;

export function defaultDaily() {
  return { disapprovalRange: 1, lostSpells: [], spellburn: { strength: 0, agility: 0, stamina: 0 }, spellburnToday: false };
}

export function lvl0(o = {}) {
  const mod = (score) => (o.allMods !== undefined ? o.allMods : BOOK_MODS(score));
  const stats = {};
  for (const [short, key] of Object.entries(STAT_KEYS)) {
    const score = o[short] ?? 10;
    stats[key] = { score, mod: mod(score), rolls: [] };
  }
  const luck = o.luck ?? 10;
  stats.luck = { score: luck, initialScore: o.initialLuck ?? luck, mod: mod(luck), rolls: [] };
  const maxHp = o.maxHp ?? 4;
  const char = {
    id: o.id ?? `test_${++idCounter}`,
    name: 'Testeur',
    level: 0,
    xp: o.xp ?? 0,
    race: o.race ?? 'Humain',
    occupation: 'Écuyer',
    alignment: o.alignment ?? 'Neutre',
    knownLanguages: ['Commun'],
    stats,
    currentHp: o.currentHp ?? maxHp,
    maxHp,
    hpBaseRoll: o.hpBaseRoll ?? 4,
    ac: 10,
    baseSpeed: 9,
    speed: 9,
    initiative: stats.agility.mod,
    saves: { reflex: stats.agility.mod, fortitude: stats.stamina.mod, will: stats.personality.mod },
    attack: { melee: stats.strength.mod, ranged: stats.agility.mod },
    damageMods: { melee: stats.strength.mod, ranged: 0 },
    weapon: { name: 'Épée longue', damage: '1d8', attackType: 'melee', catalogId: 'epee-longue', ammunition: null },
    armorId: o.armorId ?? 'none',
    hasShield: o.hasShield ?? false,
    tradeGoods: '',
    farmCrop: '',
    startingItem: '',
    luckySign: { roll: o.luckySignRoll ?? 5, name: 'Test', modifier: o.luckMod ?? stats.luck.mod },
    coinPurse: { pc: 0, pa: 0, po: 0, pe: 0, pp: 0 },
    status: 'Vivant',
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z'
  };
  if (o.customTitle !== undefined) char.customTitle = o.customTitle;
  for (const [k, v] of Object.entries(o)) if (!HANDLED.has(k)) char[k] = v;
  return char;
}

let rulesForFactories = null;
export function adv(classId, level, o = {}) {
  rulesForFactories ??= loadRules();
  const cls = rulesForFactories.CLASSES[classId];
  if (!cls) throw new Error('Classe inconnue : ' + classId);
  const maxHp = o.maxHp ?? 4 + 5 * level;
  const char = lvl0({ ...o, race: o.race ?? cls.race, xp: o.xp ?? rulesForFactories.XP_THRESHOLDS[level], maxHp });
  const hpHistory = [{ level: 0, die: 'd4', roll: 4, mod: 0, gain: 4 }];
  const levelHistory = [];
  for (let l = 1; l <= level; l++) {
    hpHistory.push({ level: l, die: 'd' + cls.hitDie, roll: 5, mod: 0, gain: 5 });
    levelHistory.push({ level: l, date: '2026-01-01T00:00:00.000Z', summary: '' });
  }
  const defaultData = classId === 'thief' ? { hasTools: true } : {};
  return Object.assign(char, {
    level,
    className: classId,
    classData: { ...defaultData, ...(o.classData || {}) },
    daily: { ...defaultDaily(), ...(o.daily || {}) },
    hpHistory,
    levelHistory,
    ...(cls.baseSpeed !== undefined && o.baseSpeed === undefined ? { baseSpeed: cls.baseSpeed, speed: cls.baseSpeed } : {})
  });
}

// Arme de personnage { name, damage, attackType, catalogId, ammunition } issue de RULE_WEAPONS.
export function weapon(id) {
  rulesForFactories ??= loadRules();
  const w = rulesForFactories.RULE_WEAPONS.find((entry) => entry.id === id);
  if (!w) throw new Error('Arme inconnue : ' + id);
  return { name: w.name, damage: w.damage, attackType: w.attackType, catalogId: id, ammunition: null };
}

// --- Fabriques de lanceurs de sorts (Tâche 7) ---

// Mage de niveau o.level (défaut 1) connaissant un sort du niveau donné. Surcharges : celles de adv(),
// plus spellId (défaut : un sort connu du niveau demandé) ; les autres clés passent à adv().
const DEFAULT_WIZARD_SPELL = { 1: 'sommeil', 2: 'invisibilite', 3: 'eclair', 4: 'metamorphose', 5: 'duplication' };
export function wizardWithSpellLevel(spellLevel, o = {}) {
  const { spellId = DEFAULT_WIZARD_SPELL[spellLevel], level = 1, classData, ...rest } = o;
  return adv('wizard', level, { ...rest, classData: { spells: [{ id: spellId, level: spellLevel }], ...(classData || {}) } });
}

// Mage de niveau 1 connaissant « Sommeil » (sort de niveau 1).
export function wizardWith1Spell(o = {}) {
  return wizardWithSpellLevel(1, o);
}

// Clerc de niveau 1 connaissant un sort de clerc de niveau 1 ; dailyOverrides fusionné dans daily.
export function clericWith(spellId, dailyOverrides = {}, o = {}) {
  const { classData, daily, ...rest } = o;
  return adv('cleric', 1, {
    ...rest,
    classData: { deity: 'test', spells: [{ id: spellId, level: 1 }], ...(classData || {}) },
    daily: { ...(daily || {}), ...dailyOverrides }
  });
}
