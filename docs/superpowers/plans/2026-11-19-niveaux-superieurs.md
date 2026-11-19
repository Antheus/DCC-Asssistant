# Personnages de niveau 1 à 10 — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** passer les survivants de l'entonnoir au niveau 1 via un assistant, puis gérer des aventuriers des 7 classes DCC du niveau 1 au niveau 10 dans un onglet dédié, avec toutes les règles de classe.

**Architecture :** tout reste dans `index.html`. Les règles de classe sont des **données** (`CLASSES` et tables de texte) consommées par des **fonctions de règles pures** (pas de DOM, pas de mutation : chaque action renvoie `{ result, char }` avec un clone). L'interface (onglets, assistant modal, fiche d'aventurier) ne fait qu'appeler ces fonctions et afficher. Les fonctions pures sont exposées sur `globalThis.DCC_RULES` et testées en Node avec `node:test` (intégré à Node, aucune dépendance npm).

**Tech Stack :** HTML/CSS/JS ES6 vanilla dans un fichier unique ; tests `node --test` (Node ≥ 18, v22 installée) avec `vm` pour charger le script inline.

**Spec :** `docs/superpowers/specs/2026-11-19-niveaux-superieurs-design.md` (à lire en entier avant toute tâche ; les numéros entre crochets renvoient à `Dungeon Crawl Classics - Francais.md`).

## Global Constraints

- Fichier unique `index.html` : aucun nouveau fichier CSS/JS servi, aucun build, aucune dépendance npm (`package.json` inchangé). Les tests vivent dans `tests/` et n'utilisent que des modules Node intégrés.
- Règles : consulter **uniquement** `Dungeon Crawl Classics - Francais.md`, jamais le PDF. Le texte des tables est recopié du livre en nettoyant l'OCR (blocs ```` ``` ```` parasites, lignes coupées, `-` en début de ligne qui valent `*` ou `+`), sans reformuler.
- Interface en français, style existant (tokens `:root`, Cinzel/MedievalSharp, cartes parchemin), sans régression sur la fiche de niveau 0.
- Sauvegarde : même clé `dcc_rpg_funnel_roster_v2`. Les anciennes sauvegardes (niveau 0 uniquement) se chargent sans migration ni erreur.
- Tout tirage aléatoire est affiché avec son détail (dé, résultat brut, modificateurs).
- Après chaque tâche : `node --test tests/`, puis les deux validations d'`AGENTS.md` (syntaxe JS, structure HTML) doivent passer.
- Le modificateur de Chance des effets d'augure reste celui du niveau 0, figé (`char.luckySign.modifier`).
- Choix du demandeur à respecter : 10 PX requis pour le niveau 1 ; sorts de clerc **choisis**, sans tirage ; sorts de mage/elfe **tirés au hasard obligatoirement** (pas de remplacement ni de « source ») mais liste éditable à la main sur la fiche ; agonie gérée complètement ; import en fusion par `id` ; bouton Vider supprimé.

## Review Focus

1. **Ancienne sauvegarde ou import de niveau 0** sans `className`, `classData`, `daily`, `hpHistory` : doit se charger, tout dans l'onglet Niveau 0 (test en Tâche 3).
2. **Mage ou elfe avec INT 3** (0 sort) ou aucun sort disponible au niveau tiré : l'assistant doit pouvoir être validé avec 0 sort et `drawRandomWizardSpell` ne doit jamais boucler (tests en Tâche 7).
3. **Variations de PV pendant l'agonie** : nouveaux dégâts sur un agonisant (le décompte ne repart pas), soin sur un mort (refusé), soin sur un agonisant (sauvé une seule fois, −1 END) (tests en Tâche 8).
4. **Scores qui tombent à 0 ou moins** par brûlesort ou Chance brûlée : refuser une dépense qui ferait passer un score sous 1 (Chance sous 0) ; récupération plafonnée à `initialScore` (tests en Tâches 6 et 8).
5. **Niveau 10 atteint** ou PX au-delà de plusieurs seuils : `canLevelUp` refuse au niveau 10 et ne fait monter que d'un niveau à la fois (tests en Tâche 3).

---

## Conventions communes (toutes les tâches)

**Emplacement dans `index.html`** (IIFE existante) :
- Nouvelle section `// 1b. DATA CLASSES & TABLES DE RÈGLES` juste après la section 1 (après `APP_TIPS`).
- Nouvelle section `// 3b. RÈGLES DES AVENTURIERS (fonctions pures)` juste après `generateFunnelBatch`.
- Juste avant `document.addEventListener('DOMContentLoaded', …)` : `globalThis.DCC_RULES = Object.freeze({ … })` qui exporte les fonctions et données listées dans les blocs **Produces**.

**Pureté** : une fonction de règle ne touche jamais au DOM ni à `localStorage` et ne mute pas son argument. Les actions renvoient `{ result, char }` où `char` est un `structuredClone` modifié.

**Dés** : `roll(sides)` passe par une implémentation remplaçable (Tâche 0). Les expressions de dés (`'1d12'`, `'2d20'`, `'1d30+2'`, `'d10+4'`) sont lancées par `rollDiceExpression(expr) -> { total, rolls, sides, count, plus }`.

**Structure d'une table de texte** : tableau trié `[{ min, max, text }]`, `min: -Infinity` pour « 0 ou moins », `max: Infinity` pour « N+ ». Lecture par `lookupTableEntry(table, total)`.

---

### Task 0 : Banc de test et exposition des règles

**Files :**
- Modify : `index.html` (`roll`, fin de l'IIFE)
- Create : `tests/helpers.mjs`, `tests/harness.test.mjs`
- Modify : `.agents/AGENTS.md` (tableau « Key Commands » et §4 : ajouter `node --test tests/`)

**Interfaces :**
- Produces :
  - `DCC_RULES.__setRoller(fn: (sides:number) => number | null)` : `null` rétablit `Math.random`.
  - `DCC_RULES.rollDiceExpression(expr: string) -> { total, rolls: number[], sides, count, plus }`.
  - `tests/helpers.mjs` exporte `loadRules() -> DCC_RULES` et `scriptedRoller(pairs: [sides, value][]) -> fn`. Le roller lève une erreur si le dé demandé ne correspond pas à `sides` ou si la file est vide. C'est ainsi que les tests vérifient **quel dé** est lancé.
  - `loadRules` extrait le contenu de `<script>…</script>` d'`index.html` et l'exécute dans `vm.createContext({ document: { addEventListener() {} }, localStorage: memoryStorage, console, structuredClone })`, puis renvoie `context.DCC_RULES`.

- [ ] **Step 1 : écrire `tests/harness.test.mjs`**

```js
test('rollDiceExpression lance 1d30+2 avec le bon dé', () => {
  const R = loadRules();
  R.__setRoller(scriptedRoller([[30, 17]]));
  assert.deepEqual(R.rollDiceExpression('1d30+2'), { total: 19, rolls: [17], sides: 30, count: 1, plus: 2 });
});
test('rollDiceExpression 2d20', () => {
  const R = loadRules();
  R.__setRoller(scriptedRoller([[20, 3], [20, 11]]));
  assert.equal(R.rollDiceExpression('2d20').total, 14);
});
test('d10+4 sans compte vaut 1d10+4', () => {
  const R = loadRules();
  R.__setRoller(scriptedRoller([[10, 10]]));
  assert.equal(R.rollDiceExpression('d10+4').total, 14);
});
```

- [ ] **Step 2 :** `node --test tests/`, attendu : FAIL (`DCC_RULES` indéfini).
- [ ] **Step 3 :** implémenter `let rollImpl = null; function roll(sides) { return rollImpl ? rollImpl(sides) : Math.floor(Math.random() * sides) + 1; }`, puis `rollDiceExpression` et l'export `DCC_RULES`.
- [ ] **Step 4 :** `node --test tests/` PASS, puis validations JS et HTML d'AGENTS.md : `JS Syntax OK` et `HTML OK`.
- [ ] **Step 5 :** commit `test: add node test harness exposing DCC_RULES`.

---

### Task 1 : Données de classes (progression, titres, armes, dieux, compétences)

**Files :**
- Modify : `index.html` (section 1b)
- Create : `tests/classes-data.test.mjs`

**Interfaces :**
- Produces :

```js
CLASSES: Record<ClassId, {
  id, label,                        // 'Guerrier'…
  race: 'Humain'|'Nain'|'Elfe'|'Halfelin',
  hitDie: number,                   // 8,12,4,6,6,6,10
  weapons: string[] | 'deity',      // ids RULE_WEAPONS ; 'deity' pour le clerc
  caster: null | 'arcane' | 'divine',
  castAbility: null | 'intelligence' | 'personality',
  baseSpeed?: number,               // 6 pour halfelin et nain
  titles: { Loyal: string[5], Chaotique: string[5], Neutre: string[5] },  // même liste ×3 si titre unique (elfe, halfelin)
  levels: Array<{                   // index 0 = niveau 1, 10 entrées
    attack: number | { deedDie: number, plus: number },
    crit: { dice: string, table: 'I'|'II'|'III'|'IV'|'V' },
    critMin: number,                // 20 sauf guerrier : 19 (1-4), 18 (5-8), 17 (9-10)
    actionDice: number[],           // [20] ou [20,14]…
    saves: { reflex, fortitude, will },
    spellsKnown?: number | number[],// mage/elfe : nombre ; clerc : [n1..n5]
    maxSpellLevel?: number,
    luckDie?: number,               // voleur
    stealth?: number                // halfelin
  }>
}>
ClassId = 'cleric'|'warrior'|'wizard'|'thief'|'elf'|'halfling'|'dwarf'
XP_THRESHOLDS = [0,10,50,110,190,290,410,550,710,890,1090]   // index = niveau
DEITIES = { Loyal: [{ id, name, domain }], Neutre: [...], Chaotique: [...] }
DEITY_WEAPONS = { Loyal: ['baton','fronde','gourdin','masse','marteau-guerre'],
                  Neutre: ['baton','dague','epee-courte','epee-longue','epee-deux-mains','fronde','masse'],
                  Chaotique: ['arc-court','arc-long','dague','fleau','flechette','hachette','hache-bataille'] }
UNHOLY_CREATURES = { Loyal: string, Neutre: string, Chaotique: string }
THIEF_PATHS = { Loyal: 'Boss', Chaotique: 'Assassin', Neutre: 'Escroc' }
THIEF_SKILLS = [{ id, label, ability: 'agility'|'intelligence'|'personality'|null,
                  armorPenalty: boolean, needsTools: boolean, dcHint: string,
                  bonusByPath: { Boss: (number|string)[10], Assassin: [...], Escroc: [...] } }]
  // ids : backstab, sneak, hide, pickpocket, climb, locks, findTraps, disableTraps,
  //       forge, disguise, readLanguages, poison, scroll (valeurs 'd10'… pour scroll)
  // armorPenalty true pour : sneak, hide, pickpocket, climb, locks, disableTraps
  // needsTools true pour : locks, findTraps, disableTraps, climb, forge, poison
CLASS_WEAPON_LISTS : armes de chaque classe d'après la spec §7 (guerrier : « hache » = hachette ; « armes d'hast » = hallebarde)
```

Sources : tables 1-5 [1476], 1-6, 1-7 [1750], 1-8, 1-9 [1932], 1-10, 1-11 [2204], 1-12, 1-13 [2227-2281], 1-14 [2399], 1-15, 1-16 [2564], 1-17, 1-18 [2736], 1-19 ; dieux [1507-1582]. Les titres des niveaux 6 à 10 n'existent pas (champ libre).

- [ ] **Step 1 : tests (valeurs exactes du livre)**

```js
test('guerrier niveau 10', () => {
  const r = R.CLASSES.warrior.levels[9];
  assert.deepEqual(r.attack, { deedDie: 10, plus: 4 });
  assert.deepEqual(r.crit, { dice: '2d20', table: 'V' });
  assert.equal(r.critMin, 17);
  assert.deepEqual(r.actionDice, [20, 20, 14]);
  assert.deepEqual(r.saves, { reflex: 4, fortitude: 6, will: 3 });
});
test('clerc niveau 9 sorts par niveau', () => assert.deepEqual(R.CLASSES.cleric.levels[8].spellsKnown, [8,7,5,3,1]));
test('mage niveau 1', () => { const r = R.CLASSES.wizard.levels[0]; assert.equal(r.spellsKnown, 4); assert.equal(r.maxSpellLevel, 1); assert.deepEqual(r.crit, { dice: '1d6', table: 'I' }); });
test('voleur niveau 8 critique et dé de chance', () => { const r = R.CLASSES.thief.levels[7]; assert.equal(r.crit.dice, '1d30+2'); assert.equal(r.luckDie, 12); });
test('nain niveau 4 table IV', () => assert.deepEqual(R.CLASSES.dwarf.levels[3].crit, { dice: '1d16', table: 'IV' }));
test('halfelin discrétion niveau 10', () => assert.equal(R.CLASSES.halfling.levels[9].stealth, 15));
test('elfe niveau 10 sorts', () => assert.equal(R.CLASSES.elf.levels[9].spellsKnown, 14));
test('dés de vie', () => assert.deepEqual(Object.fromEntries(Object.values(R.CLASSES).map(c => [c.id, c.hitDie])),
  { cleric: 8, warrior: 12, wizard: 4, thief: 6, elf: 6, halfling: 6, dwarf: 10 }));
test('voleur Escroc', () => { const s = R.THIEF_SKILLS.find(s => s.id === 'pickpocket'); assert.equal(s.bonusByPath.Escroc[0], 3); assert.equal(R.THIEF_SKILLS.find(s => s.id === 'scroll').bonusByPath.Escroc[0], 'd12'); });
test('titres', () => { assert.equal(R.CLASSES.warrior.titles.Chaotique[0], 'Bandit'); assert.equal(R.CLASSES.wizard.titles.Loyal[4], 'Élémentaliste'); });
test('toutes les classes ont 10 niveaux et des armes existantes', () => {
  for (const c of Object.values(R.CLASSES)) {
    assert.equal(c.levels.length, 10);
    if (c.weapons !== 'deity') c.weapons.forEach(id => assert.ok(R.RULE_WEAPONS.some(w => w.id === id), id));
  }
});
```

(Exporter aussi `RULE_WEAPONS` et `ARMOR_TABLE` dans `DCC_RULES`.)

- [ ] **Step 2 :** FAIL. **Step 3 :** transcrire les données. **Step 4 :** PASS + validations. **Step 5 :** commit `feat(data): class progression tables`.

---

### Task 2 : Tables de texte (combat et magie)

**Files :**
- Modify : `index.html` (section 1b)
- Create : `tests/rule-tables.test.mjs`

**Interfaces :**
- Produces :
  - `lookupTableEntry(table, total) -> { min, max, text }`
  - Tables :
    - `CRIT_TABLES` = `{ I, II, III, IV, V }` [3510-3951] (⚠ le titre de chaque table vient **après** son contenu dans l'OCR)
    - `FUMBLE_TABLE` [3436-3479]
    - `TURN_UNHOLY_TABLE` = lignes `{ min, max, range, holySmite, byHd: { '1','2','3-4','5-6','7-8','9-10','11-12' } }` [4929-5011]. Ajouter « (pas de JS) » en 32+ / 3-4 DV.
    - `LAY_ON_HANDS_TABLE` = `[{ min, max, same, adjacent, opposed }]` (nombre de dés, 0 = échec) [1438-1448]
    - `LAY_ON_HANDS_CONDITIONS` (membre 1, organe 2, maladie 2, paralysie 3, poison 3, cécité ou surdité 4)
    - `MERCURIAL_TABLE` (d100, entrées 1-100 avec `castDie?`) [5946-6358]
    - `CORRUPTION_TABLES` = `{ minor, major, greater }` [6379-6520]
    - `DISAPPROVAL_TABLE` [6582-6690]
    - `TWO_WEAPON_TABLE` [4702-4716]
  - Sorts :
    - `WIZARD_SPELLS` = `{ 1: [{ id, name, page, note?: 'cleric'|'patronPair'|'patronSpell' }], …5 }`, dans l'ordre et avec les pages de la table 5-8 [6952-7093] ;
    - `CLERIC_SPELLS` (table 5-9) ;
    - `PATRONS` = `[{ id, name, spells: [l1, l2, l3] | [] }]` [1890-1901, table 5-10].
  - `castDie` dans `MERCURIAL_TABLE` : renseigné uniquement pour les entrées qui changent le dé du test (02, 05, 35, 96, 98… à vérifier une par une) ; la valeur est une expression (`'1d16'`, `'2d10'`, `'1d24'`).

- [ ] **Step 1 : tests**

```js
test('critique I bornes', () => {
  assert.match(R.lookupTableEntry(R.CRIT_TABLES.I, -2).text, /lâcher votre arme/);
  assert.match(R.lookupTableEntry(R.CRIT_TABLES.I, 25).text, /entamez le crâne/);
});
test('tables critiques : max', () => {
  for (const [t, max] of [['I', 20], ['II', 24], ['III', 28], ['IV', 24], ['V', 28]])
    assert.equal(R.CRIT_TABLES[t].at(-1).min, max, t);
});
test('maladresse 16+', () => assert.match(R.lookupTableEntry(R.FUMBLE_TABLE, 30).text, /DD16/));
test('tables continues sans trou', () => {
  for (const t of [...Object.values(R.CRIT_TABLES), R.FUMBLE_TABLE, R.DISAPPROVAL_TABLE, ...Object.values(R.CORRUPTION_TABLES)])
    for (let i = 1; i < t.length; i++) assert.equal(t[i].min, t[i-1].max + 1);
});
test('mercurielle 41-60 sans changement', () => assert.match(R.lookupTableEntry(R.MERCURIAL_TABLE, 50).text, /Pas de changement/));
test('repousser 20-23', () => { const row = R.lookupTableEntry(R.TURN_UNHOLY_TABLE, 21); assert.equal(row.range, '18 m'); assert.equal(row.byHd['1'], 'R1d6+NI'); });
test('imposition 14-19', () => assert.deepEqual(R.lookupTableEntry(R.LAY_ON_HANDS_TABLE, 15), { min: 14, max: 19, same: 3, adjacent: 2, opposed: 1 }));
test('listes de sorts', () => {
  assert.equal(R.WIZARD_SPELLS[1].length, 27); assert.equal(R.WIZARD_SPELLS[4].length, 6);
  assert.equal(R.CLERIC_SPELLS[1].length, 11); assert.equal(R.CLERIC_SPELLS[5].length, 3);
  assert.equal(R.WIZARD_SPELLS[1][0].page, 129);
  assert.ok(R.WIZARD_SPELLS[1].every(s => s.text === undefined)); // option A : pas de texte d'effet
});
test('aucun reste OCR', () => assert.ok(!JSON.stringify([R.CRIT_TABLES, R.FUMBLE_TABLE, R.MERCURIAL_TABLE, R.CORRUPTION_TABLES, R.DISAPPROVAL_TABLE]).includes('```')));
```

- [ ] **Step 2 :** FAIL. **Step 3 :** transcrire. Contre-vérifier une ligne par table avec le livre, et noter les corrections OCR dans le message de commit. **Step 4 :** PASS + validations. **Step 5 :** commit `feat(data): crit, fumble, magic and spell tables`.

---

### Task 3 : Passage de niveau (règles pures) et normalisation

**Files :** Modify `index.html` (section 3b, `loadState`/`normalize*`) ; Create `tests/level-up.test.mjs`

**Interfaces :**
- Consumes : `CLASSES`, `XP_THRESHOLDS`, `rollDiceExpression`.
- Produces :
  - `canLevelUp(char) -> { ok: boolean, reason: string }`. Raisons exactes :
    - `'Le personnage est mort.'` (mort ou agonisant)
    - `'Il faut ${n} PX (actuellement ${xp}).'`
    - `'Niveau maximum atteint.'`
  - `getAllowedClasses(char) -> ClassId[]` : Humain → `['cleric','warrior','wizard','thief']` ; Nain → `['dwarf']` ; Elfe → `['elf']` ; Halfelin → `['halfling']`.
  - `rollClassHitPoints(classId, staminaMod) -> { die: 'd8', roll, mod, gain }`, avec `gain = max(1, roll + mod)`.
  - `applyLevelUp(char, draft) -> char` (clone) avec `draft = { classId, targetLevel, hp: {die,roll,mod,gain}, classData: object, newLanguages: string[], summary: string }`. Effets :
    - `level = targetLevel` ; `className` fixé au niveau 1 ;
    - `maxHp` et `currentHp` augmentés de `gain` ;
    - `hpHistory` : au niveau 1, entrée niveau 0 construite depuis `hpBaseRoll` puis entrée du niveau ;
    - `classData` fusionné (les sorts sont ajoutés, pas remplacés) ;
    - `knownLanguages` complétées sans doublon ;
    - `daily` initialisé à `{ disapprovalRange: 1, lostSpells: [], spellburn: { strength: 0, agility: 0, stamina: 0 }, spellburnToday: false }` ;
    - `levelHistory` complété ;
    - `baseSpeed` = `CLASSES[c].baseSpeed` s'il est défini.
  - `normalizeAdventurer(char)` : lève une `Error` en français si `level` n'est pas un entier de 0 à 10, si `level ≥ 1` sans `className` connu ou sans `classData` objet, ou si `level === 0` avec un `className`. Complète `daily`, `hpHistory`, `levelHistory` absents. Appelée dans `loadState` et à l'import, après les normalisations existantes.

- [ ] **Step 1 : tests**

```js
test('niveau 0 avec 9 PX refusé', () => assert.deepEqual(R.canLevelUp(lvl0({ xp: 9 })), { ok: false, reason: 'Il faut 10 PX (actuellement 9).' }));
test('niveau 0 mort refusé', () => assert.equal(R.canLevelUp(lvl0({ xp: 10, currentHp: 0 })).ok, false));
test('niveau 3 à 190 PX : un seul niveau à la fois', () => assert.equal(R.canLevelUp(adv('warrior', 3, { xp: 190 })).ok, true)); // vers 4
test('niveau 10 refusé', () => assert.equal(R.canLevelUp(adv('warrior', 10, { xp: 5000 })).reason, 'Niveau maximum atteint.'));
test('classes autorisées', () => { assert.deepEqual(R.getAllowedClasses(lvl0({ race: 'Nain' })), ['dwarf']); assert.equal(R.getAllowedClasses(lvl0({ race: 'Humain' })).length, 4); });
test('PV clerc END -2 minimum 1', () => { R.__setRoller(scriptedRoller([[8, 2]])); assert.deepEqual(R.rollClassHitPoints('cleric', -2), { die: 'd8', roll: 2, mod: -2, gain: 1 }); });
test('applyLevelUp niveau 1', () => {
  const c = lvl0({ xp: 10, maxHp: 3, currentHp: 2, hpBaseRoll: 3 });
  const n = R.applyLevelUp(c, { classId: 'warrior', targetLevel: 1, hp: { die: 'd12', roll: 7, mod: 0, gain: 7 }, classData: { luckyWeapon: 'epee-longue' }, newLanguages: [], summary: '' });
  assert.equal(n.level, 1); assert.equal(n.maxHp, 10); assert.equal(n.currentHp, 9);
  assert.equal(n.hpHistory.length, 2); assert.equal(c.level, 0); // pas de mutation
});
test('ancienne sauvegarde niveau 0 valide', () => assert.doesNotThrow(() => R.normalizeAdventurer(lvl0({}))));
test('niveau 2 sans classe rejeté', () => assert.throws(() => R.normalizeAdventurer({ ...lvl0({}), level: 2 }), /classe/));
```

`lvl0(overrides)` et `adv(classId, level, overrides)` (arme par défaut : épée longue ; toutes les caractéristiques à 10 sauf surcharge ; `luckMod` règle `luckySign.modifier`) sont des fabriques dans `tests/helpers.mjs` qui construisent des personnages complets, au format de `generateLevelZeroCharacter`.

- [ ] Steps 2-5 : FAIL → implémenter → PASS + validations → commit `feat(rules): level-up eligibility and application`.

---

### Task 4 : Valeurs dérivées de combat des aventuriers

**Files :** Modify `index.html` (3b) ; Create `tests/combat-profile.test.mjs`

**Interfaces :**
- Produces :
  - `getClassRow(char) -> levelRow`
  - `getAdventurerTitle(char) -> string` : niveaux 1-5 depuis `titles[alignment]`, au-delà `char.customTitle || ''`.
  - `getProficientWeaponIds(char) -> string[]` (clerc : `DEITY_WEAPONS[alignment]`)
  - `getEffectiveScore(char, statKey) -> number` = `score − daily.spellburn[statKey]` ; `getEffectiveMod(char, statKey)`.
  - `getArmorCheckPenalty(char) -> number` (≤ 0) : armure + bouclier ; elfe avec `classData.mithril` : `Math.trunc(armorPenalty / 2)` sur l'armure seulement.
  - `getAttackProfile(char, weapon) -> { actionDie, degraded: boolean, fixedBonus, deedDie: null|{deedDie,plus}, abilityMod, luckBonus, attackFixed, damageFixed, critMin, critDice, critTable }`, avec :
    - `actionDie = stepDiceChain(levelRow.actionDice[0], -1)` si l'arme n'est pas maîtrisée ;
    - `luckBonus` = augures d'attaque existants + Chance figée si `weapon.catalogId === classData.luckyWeapon` (guerrier, nain : attaque seulement) ;
    - `damageFixed` = mod. FOR (mêlée) + augures de dégâts existants ;
    - `fixedBonus` = 0 si `attack` est un dé de haut fait.
  - `rollAdventurerAttack(char, { mightyDeed?: boolean, actionDieIndex?: number }) -> { natural, deedRoll, total, damage, critical: 'auto'|'if-hit'|false, fumble: boolean, deedSuccessIfHit: boolean, detail: string }` :
    - `critical = 'auto'` si naturel = maximum du dé ; `'if-hit'` si `natural ≥ critMin` et dé d20 ;
    - `deedSuccessIfHit = deedRoll ≥ 3`.
  - `getAdventurerSaves(char) -> { reflex, fortitude, will }` = classe + mod. effectif + augures (règles de `SAVE_MODIFIER_SOURCES`).
  - `getAdventurerInitiative(char) -> number` = mod. AGI + augure 24 + niveau (guerrier).

- [ ] **Step 1 : tests**

```js
test('guerrier dé de haut fait ajouté au toucher et aux dégâts', () => {
  R.__setRoller(scriptedRoller([[20, 12], [3, 3], [8, 5]]));
  const r = R.rollAdventurerAttack(adv('warrior', 1, { str: 16 }), {});
  assert.equal(r.total, 12 + 3 + 2); assert.equal(r.damage, 5 + 3 + 2); assert.equal(r.deedSuccessIfHit, true);
});
test('guerrier 19 naturel = critique si touche', () => { R.__setRoller(scriptedRoller([[20, 19], [3, 1], [8, 1]])); assert.equal(R.rollAdventurerAttack(adv('warrior', 1), {}).critical, 'if-hit'); });
test('mage avec épée à deux mains : dé dégradé d16', () => assert.equal(R.getAttackProfile(adv('wizard', 1), weapon('epee-deux-mains')).actionDie, 16));
test('clerc loyal maîtrise la masse, pas la dague', () => { const ids = R.getProficientWeaponIds(adv('cleric', 1, { alignment: 'Loyal' })); assert.ok(ids.includes('masse')); assert.ok(!ids.includes('dague')); });
test('arme fétiche : Chance sur l’attaque seulement', () => {
  const c = adv('warrior', 1, { luckMod: 2, classData: { luckyWeapon: 'epee-longue' } });
  const p = R.getAttackProfile(c, weapon('epee-longue')); assert.equal(p.luckBonus, 2); assert.equal(p.damageFixed, c.stats.strength.mod);
});
test('initiative guerrier niveau 4 = AGI + 4', () => assert.equal(R.getAdventurerInitiative(adv('warrior', 4, { agi: 13 })), 1 + 4));
test('sauvegardes voleur niveau 6', () => assert.deepEqual(R.getAdventurerSaves(adv('thief', 6, { allMods: 0 })), { reflex: 4, fortitude: 2, will: 2 }));
test('mithril divise la pénalité', () => assert.equal(R.getArmorCheckPenalty(adv('elf', 1, { armorId: 'chainmail', classData: { mithril: true } })), -2));
test('titre niveau 7 libre', () => assert.equal(R.getAdventurerTitle(adv('thief', 7, { customTitle: 'Prince des voleurs' })), 'Prince des voleurs'));
```

- [ ] Steps 2-5 : FAIL → implémenter → PASS + validations → commit `feat(rules): adventurer combat profile`.

---

### Task 5 : Critiques et maladresses (tous niveaux)

**Files :** Modify `index.html` (3b) ; Create `tests/crit-fumble.test.mjs`

**Interfaces :**
- Produces :
  - `rollCritical(char) -> { dice, roll: {total,rolls}, luckMod, total, table, text }`. Niveau 0 : `'1d4'`, table I. Sinon : `levelRow.crit`. `luckMod` = Chance figée, ×2 si augure 26.
  - `rollFumble(char) -> { die, roll, luckMod, total, text, canBurnLuckToCancel }`. Dé = pire entre armure et bouclier (`getWorstFumbleDie`). `total = roll − luckMod`, avec Chance ×2 si augure 28. `canBurnLuckToCancel` vrai pour le guerrier et le nain.
  - `cancelFumbleWithLuck(char) -> { result, char }` : Chance −1 ; refusée si la Chance vaut 0.

- [ ] **Step 1 : tests**

```js
test('critique niveau 0 : 1d4 table I + Chance', () => { R.__setRoller(scriptedRoller([[4, 3]])); const r = R.rollCritical(lvl0({ luckMod: 1 })); assert.equal(r.total, 4); assert.equal(r.table, 'I'); });
test('augure 26 double la Chance au critique', () => { R.__setRoller(scriptedRoller([[12, 5]])); assert.equal(R.rollCritical(adv('warrior', 1, { luckMod: 1, luckySignRoll: 26 })).total, 7); });
test('maladresse inverse la Chance', () => { R.__setRoller(scriptedRoller([[12, 5]])); assert.equal(R.rollFumble(adv('warrior', 1, { luckMod: 2, armorId: 'chainmail' })).total, 3); });
test('annuler une maladresse sans Chance refusé', () => assert.equal(R.cancelFumbleWithLuck(adv('dwarf', 1, { luck: 0 })).result.ok, false));
```

- [ ] Steps 2-5 : FAIL → implémenter → PASS + validations → commit `feat(rules): critical and fumble tables`.

---

### Task 6 : Compétences, Chance et capacités martiales spéciales

**Files :** Modify `index.html` (3b) ; Create `tests/skills-luck.test.mjs`

**Interfaces :**
- Produces :
  - `getSkillCheckProfile(char, skillId) -> { bonus, abilityMod, armorPenalty, luckSignBonus, total, die: 20 | number, needsTools, missingTools, dcHint }`. Couvre :
    - les compétences de voleur (voie selon l'alignement) ;
    - halfelin `sneak` / `hide` (`levelRow.stealth` + AGI + armure) ;
    - `secretDoor` de l'elfe (+4 + INT) ;
    - `underground` du nain (+ niveau) ;
    - `scroll` : dé de la table, pas d'armure.
    - Augure 10 : toutes les compétences ; augure 11 : `findTraps` et `disableTraps`.
  - `rollSkillCheck(char, skillId) -> { natural, total, detail, trapTriggered: boolean }`. `trapTriggered` vaut vrai pour `disableTraps` sur un 1 naturel.
  - `burnLuck(char, points) -> { result: { ok, bonusDice: string|null, flatBonus, reason? }, char }` :
    - voleur : `${points}d${luckDie}` ;
    - halfelin : `flatBonus = 2 × points` ;
    - autres : `points` ;
    - refus si `points > luck.score` (raison `'Chance insuffisante.'`).
  - `giveHalflingLuck(halfling, ally, points) -> { result: { ok, bonus, text }, char }` : refus si l'allié n'est pas vivant.
  - `getHalflingTwoWeaponProfile(char) -> { actionDie, critOnNatural: 16 | null, fumbleRequiresBoth, usesClassAttackBonus: false }`. AGI ≤ 16 : traité comme AGI 16 (−1d, 16 naturel = critique) ; AGI > 16 : ligne de `TWO_WEAPON_TABLE`.
  - `rollShieldBash(char) -> { natural, deedRoll, total, damage }` (d14, dégâts 1d3 + haut fait) ; erreur si pas de bouclier.

- [ ] **Step 1 : tests**

```js
test('voleur assassin déplacement silencieux niv. 1 en cuir', () => assert.equal(R.getSkillCheckProfile(adv('thief', 1, { alignment: 'Chaotique', agi: 13, armorId: 'leather' }), 'sneak').total, 3 + 1 - 1));
test('se déguiser utilise PER', () => assert.equal(R.getSkillCheckProfile(adv('thief', 1, { alignment: 'Neutre', per: 16 }), 'disguise').abilityMod, 2));
test('crocheter sans outils signalé', () => assert.equal(R.getSkillCheckProfile(adv('thief', 1, { classData: { hasTools: false } }), 'locks').missingTools, true));
test('désamorcer : 1 naturel déclenche', () => { R.__setRoller(scriptedRoller([[20, 1]])); assert.equal(R.rollSkillCheck(adv('thief', 1), 'disableTraps').trapTriggered, true); });
test('Chance voleur niveau 2 : 2d4', () => assert.equal(R.burnLuck(adv('thief', 2, { luck: 10 }), 2).result.bonusDice, '2d4'));
test('Chance halfelin x2', () => assert.equal(R.burnLuck(adv('halfling', 1, { luck: 10 }), 3).result.flatBonus, 6));
test('Chance insuffisante', () => assert.equal(R.burnLuck(adv('warrior', 1, { luck: 1 }), 2).result.ok, false));
test('halfelin AGI 12 deux armes d16 crit 16', () => assert.deepEqual(R.getHalflingTwoWeaponProfile(adv('halfling', 1, { agi: 12 })), { actionDie: 16, critOnNatural: 16, fumbleRequiresBoth: true, usesClassAttackBonus: false }));
test('coup de bouclier nain', () => { R.__setRoller(scriptedRoller([[14, 9], [3, 2], [3, 3]])); const r = R.rollShieldBash(adv('dwarf', 1, { hasShield: true, str: 10 })); assert.equal(r.total, 11); assert.equal(r.damage, 5); });
```

- [ ] Steps 2-5 : FAIL → implémenter → PASS + validations → commit `feat(rules): skills, luck and martial specials`.

---

### Task 7 : Magie (sorts, incantation, défaveur, corruption, brûlesort, pouvoirs du clerc)

**Files :** Modify `index.html` (3b) ; Create `tests/magic.test.mjs`

**Interfaces :**
- Produces :
  - `SPELL_DC = { arcane: [12,14,16,18,18], divine: [12,14,16,18,20] }`
  - `getSpellSlots(char, level?) -> number | number[]` :
    - mage et elfe : `levelRow.spellsKnown` + ajustement INT (3 → 0 au total ; 4-5 → −2 ; 6-7 → −1 ; 14-15 → +1 ; 16+ → +2 ; minimum 1 sauf INT 3) ;
    - clerc : `levelRow.spellsKnown`.
    - `level` permet de calculer pour un niveau cible.
  - `getMaxSpellLevel(char) -> number` = min(table de classe, plafond d'INT de la table 1-1 [456-476]).
  - `drawRandomWizardSpell(spellLevel, knownIds, { hasPatronBond }) -> { ids: string[], rolls: number[] } | null` :
    - tire dans `WIZARD_SPELLS[spellLevel]` ;
    - relance les doublons et les sorts de patron sans lien ;
    - `patronPair` renvoie les deux ids ;
    - renvoie `null` si aucun sort n'est disponible (plus de 50 essais ou liste épuisée).
  - `rollMercurialMagic(luckMod) -> { rolls: number[], entries: { roll, text, castDie? }[] }` : d100 + 10 × luckMod ; 99 → deux tirages ; 00 (100 naturel) → deux tirages en 4d20 + 10 × luckMod.
  - `castSpell(char, spellId, { spellburn: { strength, agility, stamina }, extraModifier }) -> { result, char }`, avec `result = { natural, die, total, dc, outcome: 'success'|'failedKept'|'lost'|'fumble'|'disapproval', critBonus, disapproval?, corruptionNeeded?: boolean, detail }` :
    - modificateurs : arcane INT + NI + pénalité d'armure + augure 13 + Chance figée si sort fétiche elfe + −2 si `note === 'cleric'` ; divin PER + NI + augure 13 ;
    - arcane : < 12 → `lost` (ajout à `daily.lostSpells`), 12..dc−1 → `failedKept`, ≥ dc → `success` ; 1 naturel → `fumble` et `corruptionNeeded` (plus −1 permanent à une caractéristique brûlée si brûlesort > 0 : renvoyer `permanentLossChoices`) ;
    - divin : naturel ≤ `disapprovalRange` → `disapproval` (jet `n`d4 − luckMod sur `DISAPPROVAL_TABLE`) ; échec → `disapprovalRange + 1` ;
    - brûlesort : soustrait aux scores via `daily.spellburn`, marque `spellburnToday` ; refus si un score effectif passerait sous 1 ; 20 points ou plus → naturel traité comme 20.
  - `castLostSpellWithSpellburn` n'est **pas** une fonction séparée : `castSpell` d'un sort perdu exige un brûlesort ≥ niveau du sort et ne compte que l'excédent comme bonus.
  - `rollCorruption(char, spellLevel, severity: 'minor'|'major'|'greater') -> { roll, total, text }` = 1d10 − niveau + Chance (augure 27 ajouté).
  - `avoidCorruptionWithLuck(char) -> { result, char }` (Chance −1).
  - `addCorruption(char, text) -> char`
  - `turnUnholy(char) -> { result: { natural, total, row }, char }` : 1d20 + PER + NI + Chance + augure 15 ; un échec (< 12) augmente la plage de défaveur.
  - `layOnHands(char, relation: 'same'|'adjacent'|'opposed') -> { result: { total, dice }, char }` (augure 16 ajouté).
  - `divineAid(char, dc) -> { result, char }` : plage de défaveur +10 dans tous les cas.
  - `sacrifice(char, gp) -> { result: { reduction }, char }` : `floor(gp / 50)`, plage minimum 1.
  - `addKnownSpell(char, spellId, level) -> { result: { mercurial? }, char }` et `removeKnownSpell(char, spellId) -> char` (édition manuelle, magie mercurielle pour mage et elfe).

- [ ] **Step 1 : tests**

```js
test('slots mage INT 16 niveau 1 = 6', () => assert.equal(R.getSpellSlots(adv('wizard', 1, { int: 16 })), 6));
test('slots mage INT 3 = 0', () => assert.equal(R.getSpellSlots(adv('wizard', 1, { int: 3 })), 0));
test('slots mage INT 6 niveau 1 = 3 ; jamais < 1', () => assert.equal(R.getSpellSlots(adv('wizard', 1, { int: 6 })), 3));
test('tirage : doublons relancés', () => { R.__setRoller(scriptedRoller([[27, 21], [27, 24]])); assert.deepEqual(R.drawRandomWizardSpell(1, [R.WIZARD_SPELLS[1][20].id], { hasPatronBond: false }).ids, [R.WIZARD_SPELLS[1][23].id]); });
test('tirage impossible -> null', () => assert.equal(R.drawRandomWizardSpell(5, R.WIZARD_SPELLS[5].map(s => s.id), {}), null));
test('lier un patron donne aussi invoquer', () => { const lier = R.WIZARD_SPELLS[1].findIndex(s => s.name === 'Lier un patron'); R.__setRoller(scriptedRoller([[27, lier + 1]])); assert.equal(R.drawRandomWizardSpell(1, [], {}).ids.length, 2); });
test('mercurielle Chance +2 = +20', () => { R.__setRoller(scriptedRoller([[100, 25]])); assert.equal(R.rollMercurialMagic(2).entries[0].roll, 45); });
test('sort mage niv. 1 : 11 = perdu', () => { R.__setRoller(scriptedRoller([[20, 10]])); const { result, char } = R.castSpell(wizardWith1Spell({ int: 10 }), 'sommeil', {}); assert.equal(result.outcome, 'lost'); assert.deepEqual(char.daily.lostSpells, ['sommeil']); });
test('sort mage niv. 2 : 13 = échec non perdu', () => { R.__setRoller(scriptedRoller([[20, 10]])); assert.equal(R.castSpell(wizardWithSpellLevel(2, { level: 3, int: 10 }), 'invisibilite', {}).result.outcome, 'failedKept'); });
test('armure pénalise le mage', () => { R.__setRoller(scriptedRoller([[20, 12]])); assert.equal(R.castSpell(wizardWith1Spell({ int: 10, armorId: 'leather' }), 'sommeil', {}).result.outcome, 'success'); }); // 12+1-1=12
test('clerc : échec augmente la plage, 1 naturel = défaveur', () => {
  R.__setRoller(scriptedRoller([[20, 5]])); let { char } = R.castSpell(clericWith('benediction'), 'benediction', {}); assert.equal(char.daily.disapprovalRange, 2);
  R.__setRoller(scriptedRoller([[20, 2], [4, 1], [4, 1]])); assert.equal(R.castSpell(char, 'benediction', {}).result.outcome, 'disapproval');
});
test('brûlesort refusé sous 1', () => assert.throws(() => R.castSpell(wizardWith1Spell({ str: 5 }), 'sommeil', { spellburn: { strength: 5 } }), /brûlesort/i));
test('corruption 1d10 - niveau + Chance', () => { R.__setRoller(scriptedRoller([[10, 6]])); assert.equal(R.rollCorruption(adv('wizard', 1, { luckMod: 1 }), 1, 'minor').total, 6); });
test('sacrifice 120 po = -2, minimum 1', () => assert.equal(R.sacrifice(clericWith('benediction', { disapprovalRange: 2 }), 120).char.daily.disapprovalRange, 1));
test('aide divine +10', () => { R.__setRoller(scriptedRoller([[20, 15]])); assert.equal(R.divineAid(clericWith('benediction'), 10).char.daily.disapprovalRange, 11); });
```

Fabriques supplémentaires dans `tests/helpers.mjs` : `wizardWith1Spell`, `wizardWithSpellLevel`, `clericWith`. Les ids de sorts sont des slugs ASCII du nom (`'sommeil'`, `'invisibilite'`, `'benediction'`), et un test de Tâche 2 doit vérifier qu'ils sont uniques.

- [ ] Steps 2-5 : FAIL → implémenter → PASS + validations → commit `feat(rules): spellcasting, disapproval, corruption and cleric powers`.

---

### Task 8 : Agonie, nouvelle journée, fusion d'import

**Files :** Modify `index.html` (3b) ; Create `tests/status-day-import.test.mjs`

**Interfaces :**
- Produces :
  - `getStatusCode(char) -> 'vivant'|'blesse'|'agonisant'|'mort'|'groggy'`. Le libellé de `getDerivedStatus` (méthode existante) délègue à cette fonction ; le niveau 0 se comporte comme avant.
  - `applyHpChange(char, delta) -> { result: { events: ('dying'|'saved'|'dead'|'refused')[] }, char }` :
    - niveau 0 : comportement actuel ;
    - aventurier vivant tombant à ≤ 0 : `currentHp = 0`, `dying = { roundsLeft: level }` ;
    - dégâts pendant l'agonie : aucun changement du décompte ;
    - soin pendant l'agonie : `currentHp = delta`, suppression de `dying`, END de base −1 (avec mod recalculé), ajout à `classData.scars` ;
    - soin d'un mort : `'refused'` ;
    - PV plafonnés à `maxHp`.
  - `advanceDyingRound(char) -> char` : décrémente ; à 0, supprime `dying` et pose `dead = { at, recoveryAttempted: false }`.
  - `recoverBody(char) -> { result: { natural, success, statLoss?: 'strength'|'agility'|'stamina' }, char }` :
    - d20 ≤ score de Chance ;
    - réussite : 1 PV, `groggy = true`, −1 définitif sur une caractéristique tirée au d3 ;
    - échec : `dead.recoveryAttempted = true`.
    - Erreur si le personnage n'est pas mort ou si une tentative a déjà eu lieu.
  - `clearGroggy(char) -> char`.
  - `startNewDay(char) -> { result: { summary: string[] }, char }` :
    - plage de défaveur remise à 1 et `lostSpells` vidé ;
    - brûlesort : +1 par caractéristique brûlée **si** `spellburnToday` est faux, puis `spellburnToday = false` ;
    - voleur et halfelin : Chance + niveau, plafonnée à `initialScore`.
  - `planImportMerge(existing, incoming) -> { toAdd: char[], conflicts: char[] }` et `applyImportMerge(existing, incoming, overwriteConflicts: boolean) -> { characters, added, replaced, ignored }`. L'ordre est conservé : les remplacements restent en place, les ajouts vont à la fin.

- [ ] **Step 1 : tests**

```js
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
```

- [ ] Steps 2-5 : FAIL → implémenter → PASS + validations → commit `feat(rules): dying, new day and import merge`.

---

### Task 9 : Interface — onglets, suppression de Vider, import fusionné, critiques au niveau 0

**Files :** Modify `index.html` (HTML de l'en-tête et du `<main>`, CSS, `DCCApp` : `initElements`, `bindEvents`, `render`, `importJson`, `rollAttack`, `getDerivedStatus`, `updateHp`)

**Interfaces :**
- Consumes : `getStatusCode`, `applyHpChange`, `canLevelUp`, `rollCritical`, `rollFumble`, `planImportMerge`, `applyImportMerge`, `normalizeAdventurer`.
- Produces :
  - `this.activeTab: 'funnel'|'adventurers'` (localStorage `dcc_active_tab`, lecture et écriture dans un try/catch) ;
  - `this.setActiveTab(tab)` ;
  - conteneurs `#tabFunnel`, `#tabAdventurers`, `#adventurerGrid`, `#adventurerEmptyState` ;
  - `this.openLevelUpWizard(id)` (stub vide ici, réalisé en Tâche 10) ;
  - bouton `.btn-level-up[data-id]` sur la fiche de niveau 0.

- [ ] **Step 1 :** supprimer `#btnClearAll` (HTML, `initElements`, écouteur).
- [ ] **Step 2 : onglets.** Barre `role="tablist"` sous `.dice-bar`, deux boutons `role="tab"` avec compteur. `render()` remplit `rosterGrid` avec `level === 0` et `adventurerGrid` avec `level >= 1`. Les boutons de génération sont masqués quand l'onglet Aventuriers est actif. Les compteurs « recrues / encore en vie » portent sur l'onglet actif.
  - État vide Aventuriers : « Aucun aventurier : un survivant avec 10 PX peut passer au niveau 1 depuis l'onglet Niveau 0. »
- [ ] **Step 3 : bouton « ⬆ Niveau 1 »** dans la zone d'actions de la fiche de niveau 0. Il est désactivé, avec `title = canLevelUp(char).reason`, si `ok` est faux.
- [ ] **Step 4 : `updateHp`** passe par `applyHpChange` (comportement du niveau 0 identique).
- [ ] **Step 5 : niveau 0, attaque.** Sur un 20 naturel, `rollAttack` ajoute au toast le texte `rollCritical` (« Critique : 1d4(3)+1 = 4 — … ») ; sur un 1 naturel, le texte `rollFumble`.
- [ ] **Step 6 : import.**
  - Valider tout le fichier (normalisations existantes + `normalizeAdventurer`) avant de toucher au roster.
  - `planImportMerge` ; s'il y a des conflits, `confirm("Écraser N fiche(s) existante(s) ? (noms)")`.
  - `applyImportMerge`, puis toast « X ajoutés, Y remplacés, Z ignorés ».
- [ ] **Step 7 : vérification manuelle** avec `python3 -m http.server 8000`, dans le navigateur (outils chrome-devtools si disponibles) :
  - générer 4 paysans : onglet Niveau 0 (4), Aventuriers (0) avec son état vide ;
  - recharger : l'onglet actif est conservé ;
  - le bouton Niveau 1 est désactivé à 0 PX, avec l'infobulle « Il faut 10 PX (actuellement 0). », puis actif après +10 PX ;
  - exporter, réimporter le même fichier, refuser l'écrasement : toast « 0 ajoutés, 0 remplacés, 4 ignorés » ;
  - aucune erreur dans la console.
- [ ] **Step 8 :** `node --test tests/` + validations, puis commit `feat(ui): funnel/adventurer tabs, merged import, level-0 crit text`.

---

### Task 10 : Interface — assistant de passage de niveau

**Files :** Modify `index.html` (HTML de `#levelup-modal`, CSS, `DCCApp`)

**Interfaces :**
- Consumes : `getAllowedClasses`, `rollClassHitPoints`, `applyLevelUp`, `DEITIES`, `CLERIC_SPELLS`, `drawRandomWizardSpell`, `rollMercurialMagic`, `getSpellSlots`, `getMaxSpellLevel`, `rollAdditionalLanguage` (existant), `canLevelUp`.
- Produces :
  - `this.openLevelUpWizard(id)` ;
  - `this.wizardState = { charId, mode: 'first'|'next', step, draft }` ;
  - `this.renderWizardStep()` ;
  - `this.confirmLevelUp()`.

Étapes et règles d'affichage : spec §5.3. Précisions qui fixent le comportement :
- Les dés (PV, tirages de sorts, magie mercurielle, langues) sont lancés **à l'entrée de l'étape**, une seule fois, et stockés dans `draft`. Revenir en arrière ne relance pas.
- Choix de classe :
  - clerc : `<select>` du dieu (dieux de `DEITIES[alignment]`) + cases à cocher par niveau de sort, compteur « n / max » ; Suivant est désactivé tant que le compte n'est pas exact ;
  - guerrier et nain : `<select>` de l'arme fétiche parmi les armes maîtrisées de la classe ;
  - mage et elfe : pour chaque emplacement, un `<select>` du niveau de sort (1..max), puis un bouton « Tirer » qui fige le résultat et la magie mercurielle ; validation possible avec 0 emplacement (INT 3) ; elfe : ajout automatique de *lier un patron* + *invoquer un patron* (sans magie mercurielle supplémentaire), case « armure en mithril », `<select>` du sort fétiche ;
  - voleur : voie affichée + case « possède des outils de voleur » ;
  - halfelin : rien à choisir.
- Langues au niveau 1 :
  - voleur : `Argot des voleurs` ;
  - elfe, halfelin, nain : langues raciales manquantes + 1 aléatoire (elfe, nain) ;
  - mage, elfe, halfelin, nain : + mod. INT positif en aléatoire.
  - Ajouter `'Argot des voleurs'` à `LANGUAGE_NAMES`.
- Récapitulatif : tableau avant/après + alertes de la spec §5.3.
- `confirmLevelUp` : `applyLevelUp`, `saveState`, bascule sur l'onglet Aventuriers, `scrollIntoView` de la fiche, toast.
- Mode « next » : pas d'étape classe ; PV ; nouveautés (diff de `levelRow` N → N+1) ; nouveaux sorts (`getSpellSlots(niveau cible) − sorts connus`) ; récapitulatif.
- Fermeture : Échap, bouton Annuler ou clic sur le fond, sans rien enregistrer. Le focus est piégé dans la modale et rendu au bouton d'origine.

- [ ] **Step 1 :** HTML, CSS et navigation de la modale.
- [ ] **Step 2 :** étapes du mode « first » pour les 7 classes.
- [ ] **Step 3 :** mode « next » (le bouton « Niveau suivant » est câblé en Tâche 11).
- [ ] **Step 4 : vérification manuelle.**
  - Pour chaque race : un paysan à 10 PX passe au niveau 1. Classes proposées : Nain → seulement Nain, Humain → 4 classes.
  - Annuler ne change rien ; rouvrir relance les dés.
  - Un mage avec INT 3 se valide avec 0 sort.
  - Un clerc ne peut pas continuer sans le bon nombre de sorts.
  - Après validation, la fiche est dans l'onglet Aventuriers et ses PV = anciens PV + gain.
- [ ] **Step 5 :** tests + validations, puis commit `feat(ui): level-up wizard`.

---

### Task 11 : Interface — fiche d'aventurier commune

**Files :** Modify `index.html` (CSS, `DCCApp.createAdventurerCard(char)`, gestion des clics)

**Interfaces :**
- Consumes : `getAdventurerTitle`, `getAttackProfile`, `rollAdventurerAttack`, `getAdventurerSaves`, `getAdventurerInitiative`, `getArmorCheckPenalty`, `getEffectiveScore`, `rollCritical`, `rollFumble`, `cancelFumbleWithLuck`, `burnLuck`, `applyHpChange`, `advanceDyingRound`, `recoverBody`, `clearGroggy`, `startNewDay`, `canLevelUp`.
- Produces :
  - `createAdventurerCard(char) -> HTMLElement` ;
  - point d'extension `this.renderClassBlock(char) -> string` (HTML), renvoie `''` dans cette tâche.

Contenu de la fiche :
- **En-tête** : nom, classe, niveau, titre (champ éditable au niveau 6 et plus), alignement, dieu ou voie.
- **Vitaux** : PV ± ; CA ; vitesse ; initiative cliquable ; PX ± avec le seuil suivant ; statut (vivant, blessé, agonisant N rounds avec bouton « Round suivant », mort avec bouton « Récupérer le corps » si aucune tentative, groggy avec −4 et bouton « Fin de l'étourdissement »).
- **Caractéristiques cliquables** : score effectif, et score de base barré s'il est réduit par brûlesort.
- **Sauvegardes** cliquables.
- **Bloc d'attaque** :
  - un bouton par dé d'action (pour le mage, le 2e dé ne sert qu'à l'incantation : pas de bouton d'attaque), avec l'arme, le dé (signalé « dégradé » si l'arme n'est pas maîtrisée) et le critique « 19-20 · 1d12/III » ;
  - le toast d'attaque enchaîne automatiquement le texte du critique (20 naturel) ou propose « Critique ? (si l'attaque touche) » (plage élargie) ; sur une maladresse, il enchaîne le texte de maladresse avec le bouton d'annulation par la Chance si autorisé.
- **Chance** : score, bouton « Brûler… » (saisie du nombre de points, résultat selon la classe).
- **Repris de la fiche de niveau 0** : arme, armure, bouclier, bourse, langues, notes, augure.
- **Boutons** « Nouvelle journée » (résumé en toast) et « ⬆ Niveau N+1 » (désactivé avec la raison).
- **Historique des PV** en infobulle.

- [ ] **Step 1 :** rendu et câblage.
- [ ] **Step 2 : vérification manuelle** avec un guerrier niveau 1 (PX ajoutés jusqu'au niveau 5) :
  - au niveau 5, deux boutons de dé d'action (d20, d14) et critique 18-20 ;
  - dégâts jusqu'à l'agonie, puis Round suivant, mort, Récupérer le corps ; soin pendant l'agonie : END −1 visible ;
  - Nouvelle journée.
- [ ] **Step 3 :** tests + validations, puis commit `feat(ui): adventurer sheet`.

---

### Task 12 : Interface — blocs de classe

**Files :** Modify `index.html` (`renderClassBlock` et ses gestionnaires, CSS)

Un sous-bloc par classe, tous dans `renderClassBlock(char)` :

- **Guerrier et nain** :
  - dé de haut fait affiché ; bouton « Attaque + haut fait » (toast « Haut fait réussi si l'attaque touche » quand le dé ≥ 3) ;
  - arme fétiche ;
  - nain : bouton « Coup de bouclier (d14) » si un bouclier est équipé ; bouton « Détecter sous terre » ; texte « Odorat de l'or » et infravision.
- **Voleur** :
  - tableau des 13 compétences cliquables (bonus total ; « outils requis » si les outils manquent ; DD indicatifs en infobulle) ;
  - bouton « Attaque sournoise » (attaque + bonus ; si elle touche, critique automatique et seconds dégâts de l'arme) ;
  - case outils ; dé de chance affiché.
- **Halfelin** :
  - Déplacement silencieux et Se cacher (cliquables) ;
  - case « deux armes » + `<select>` de l'arme secondaire, et bouton d'attaque à deux armes (deux jets, maladresse seulement sur double 1) ;
  - « Donner de la Chance » : `<select>` des aventuriers vivants + nombre de points ;
  - infravision et petite taille.
- **Clerc** :
  - liste des sorts par niveau, chacun cliquable (test d'incantation), avec la page du livre ;
  - plage de défaveur ;
  - boutons Repousser les impies (affiche la ligne de table complète), Imposition des mains (`<select>` identique, adjacent ou opposé, puis nombre de dés et rappel des états soignables), Aide divine (saisie du DD), Sacrifice (saisie des po ; bouton « Débiter la bourse » optionnel) ;
  - créatures impies de l'alignement.
- **Mage et elfe** :
  - liste des sorts (page, effet de magie mercurielle en infobulle, état « perdu aujourd'hui » grisé) ; bouton Lancer → petite modale de brûlesort (FOR, AGI, END) → résultat ;
  - sur une maladresse, `<select>` de gravité, puis jet de corruption, bouton « Brûler 1 Chance pour éviter », et choix de la caractéristique perdue si un brûlesort était engagé ;
  - corruptions listées et éditables ; patron (`<select>` de `PATRONS`) ; familier (texte) ;
  - ajout manuel d'un sort (`<select>` niveau + sort) et retrait ;
  - elfe : sort fétiche marqué ★, bouton « Chercher un passage secret », mithril, immunités, vulnérabilité au fer.

- [ ] **Step 1 :** guerrier, nain, halfelin. **Step 2 :** voleur. **Step 3 :** clerc. **Step 4 :** mage et elfe.
- [ ] **Step 5 : vérification manuelle** : un aventurier par classe, chaque bouton du bloc cliqué au moins une fois ; un mage lance jusqu'à perdre un sort (grisé), puis Nouvelle journée (restauré) ; un clerc rate jusqu'à une plage de 3, puis Sacrifice de 100 po (plage 1) ; aucune erreur dans la console.
- [ ] **Step 6 :** tests + validations, puis commit `feat(ui): class-specific sheet blocks`.

---

### Task 13 : Impression, documentation, passe finale

**Files :** Modify `index.html` (`@media print`), `README.md`, `.agents/AGENTS.md` (carte des sections d'`index.html`, commandes de test)

- [ ] **Step 1 : impression.** On imprime l'onglet actif seulement. Les fiches d'aventurier sont imprimées 2 par page (grille 1×2) ; les fiches de niveau 0 restent en 2×2. Boutons, modales et barre d'onglets sont masqués.
- [ ] **Step 2 : README.** Section « Aventuriers (niveaux 1 à 10) » : onglets, assistant, fonctionnalités par classe, limites (option A : l'effet des sorts se lit dans le livre, à la page indiquée). Retirer la mention du bouton Vider.
- [ ] **Step 3 : AGENTS.md.** Mettre à jour la carte d'`index.html` (sections 1b et 3b, `DCC_RULES`) et ajouter `node --test tests/` aux commandes et au workflow.
- [ ] **Step 4 : vérification complète** de la spec §10 :
  - aperçu d'impression des deux onglets ;
  - chargement d'une sauvegarde JSON produite **avant** cette branche (`git show main:index.html` ne suffit pas : générer un export depuis la version de `main` dans un autre onglet, puis l'importer).
- [ ] **Step 5 :** tests + validations, puis commit `docs: document adventurer features; print layout`.
