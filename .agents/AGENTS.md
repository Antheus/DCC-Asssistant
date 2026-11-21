# Agent Instructions — DCC Assistant

> **Agent Directive:** Trust these instructions completely. Do not spend time searching, grepping, or re-exploring the repository unless information here is missing or an unexpected error occurs. When researching game rules, **always use `Dungeon Crawl Classics - Francais.md` (Markdown)**; never attempt to parse or read the `.pdf` file. **Zero implicit decisions & Strict Phased Workflow:** Tout développement doit obligatoirement suivre le processus en 3 phases séquentielles (Phase 1 : Analyse & Clarification → Phase 2 : Plan technique → Phase 3 : Spécification détaillée des changements en Markdown). Ne jamais toucher au code sans validation explicite des phases et fichiers Markdown correspondants.

---

## 1. Repository Overview

* **Purpose:** Single-file tabletop companion, Level 0 Character Funnel Generator (*Générateur d'Entonnoir*) and level 1-10 adventurer sheets for the official French edition of **Dungeon Crawl Classics (DCC RPG)**.
* **Core Architecture:** **Zero-build, 100% self-contained single-file web app** (`index.html`). All HTML, CSS, and Vanilla ES6 JavaScript reside in `index.html`.
* **Tech Stack & Dependencies:** Vanilla JavaScript (ES6+), semantic HTML5, modern CSS3 variables, Google Fonts (`Cinzel`, `MedievalSharp`). **Zero npm dependencies, zero build tools, zero bundlers.**
* **Target Runtime:** Any modern web browser (Chrome, Edge, Firefox, Safari) locally (`file:///`) or statically hosted via GitHub Pages.
* **Repository Size:** ~46 MB total. Most disk usage is the static rulebook reference (`Dungeon Crawl Classics - Francais.pdf` ~44 MB, and OCR text `Dungeon Crawl Classics - Francais.md` ~1.9 MB). The actual software application is solely `index.html` (~406 KB, ~7,950 lines).

---

## 2. Environment, Build & Validation Guide

### Environment Tools & Versions
* **Node.js:** v14.x+ / v18.x+ / v20.x+ (Used solely for syntax validation, NOT building)
* **Python:** 3.10+ / 3.12+ (Available for one-line validation scripts or local HTTP serving)
* **Git:** 2.30+

### Key Commands

| Action | Command (Bash / Linux / Cloud Agent) | Command (PowerShell / Windows) | Notes |
| :--- | :--- | :--- | :--- |
| **Bootstrap** | *(None needed)* | *(None needed)* | **Never run `npm install`**; `package.json` contains no dependencies or scripts. |
| **Run / Preview** | `python3 -m http.server 8000` | `python -m http.server 8000` | Access via `http://localhost:8000` or double-click `index.html`. |
| **Validate JS Syntax** | `node -e 'const fs=require("fs"),vm=require("vm"),h=fs.readFileSync("index.html","utf8"),s=h.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(s);console.log("JS Syntax OK");'` | `node -e "const fs=require('fs'),vm=require('vm'),h=fs.readFileSync('index.html','utf8'),s=h.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(s);console.log('JS Syntax OK');"` | Compiles extracted inline JS without executing; catches any syntax error. |
| **Validate HTML** | `python3 -c 'from html.parser import HTMLParser;p=HTMLParser();p.feed(open("index.html",encoding="utf-8").read());print("HTML OK")'` | `python -c "from html.parser import HTMLParser;p=HTMLParser();p.feed(open('index.html',encoding='utf-8').read());print('HTML OK')"` | Verifies tag parsing and well-formedness. |
| **Run Tests** | `node --test tests/*.test.mjs` | `node --test tests/*.test.mjs` | Node 22 built-in runner only; no npm needed. (`node --test tests/` fails on Node 22: directory arg is not supported.) |
| **Git Status** | `git status` | `git status` | Check modified and untracked files. |

> **Critical Caveats & Rules:**
> 1. **Do not introduce build steps:** Do NOT install Webpack, Vite, Parcel, Babel, or TypeScript unless explicitly requested by the user.
> 2. **Keep it single-file:** Per architecture decisions (`conception-technique-notes.md`), the app MUST stay self-contained in `index.html`. Do NOT split CSS or JS into separate files.
> 3. **External libraries:** Any future external dependency (e.g. GUN/SEA for the planned shared notes feature) must be imported via HTTPS CDN `<script>` tags, never npm modules.
> 4. **Gitignore rule:** `.gitignore` ignores `Dungeon Crawl Classics - Francais.pdf`. The `.agents/` folder and `AGENTS.md` are tracked.
> 5. **Rulebook format — Markdown ONLY:** Always consult and work with the rules using the Markdown file (`Dungeon Crawl Classics - Francais.md`). **Never use or parse the PDF (`Dungeon Crawl Classics - Francais.pdf`)**. The Markdown file contains the complete, search-ready official rules and avoids heavy/unreliable PDF extraction.
> 6. **Zero implicit decisions & Strict 3-Phase Workflow:** Pour tout développement, évolution ou modification, **AUCUN code ne doit être touché** tant que le processus par phase n'a pas été formellement validé. Vous devez poser toutes les questions nécessaires pour supprimer tout doute ou incertitude, expliquer les problèmes, exposer les options et attendre les décisions explicites de l'utilisateur. Chaque phase se conclut par l'écriture d'un fichier Markdown dédié.

---

## 3. Project Layout & Architecture Map

### Repository Root Layout
```
.
├── index.html                           # THE APPLICATION: HTML + CSS + JS in a single file (~7,950 lines)
├── tests/                               # Node built-in tests of the pure rules (`node --test tests/*.test.mjs`); helpers.mjs loads DCC_RULES in a vm
├── package.json                         # Project metadata only ("name": "dcc-assistant", "type": "module")
├── README.md                            # User documentation & feature list
├── conception-fonctionnelle-notes.md    # Functional specifications for upcoming P2P Shared Notes feature
├── conception-technique-notes.md        # Technical specifications for upcoming P2P Shared Notes (GUN/SEA, WebRTC)
├── .gitignore                           # Git ignore rules (ignores Dungeon Crawl Classics - Francais.pdf)
├── .agents/
│   ├── AGENTS.md                        # Agent instructions (this file)
│   └── skills/                          # Specialized local skills (anti-ui-slop, convert-pdf-to-md)
├── Dungeon Crawl Classics - Francais.md # Official rulebook in Markdown (ALWAYS use this file for rules reference)
└── Dungeon Crawl Classics - Francais.pdf# Source PDF (DO NOT USE: ignored by git; always use the .md file)
```

### Anatomical Map of `index.html` (Total: ~8,010 lines; line numbers are approximate)
* **Lines 1–11:** HTML `<head>` metadata, viewport, Google Fonts links.
* **Lines 12–2314:** CSS `<style>` block:
  * `:root` design tokens, reset, header, dice bar, `.tab-bar` (Niveau 0 / Aventuriers, ~L253), `.roster-grid`, `.char-card` parchment styling.
  * Adventurer sheet (`.adv-*`, ~L1099) and class blocks (`.class-block`, ~L1281), level-up wizard modal (`.modal-backdrop`, `.lu-*`), toasts (`.roll-toast`).
  * `@page` + `@media print` (~L1730–2190): black-and-white print of the active tab only; level 0 = 2×2 grid (4 per page), adventurers = 1×2 (`#adventurerGrid`, 2 per page, buttons hidden, class blocks left unclipped). Then the `@media screen and (max-width: 640px)` block.
* **Lines 2317–2434:** HTML `<body>`: `header.app-header` (generation, print, export/import buttons), `.dice-bar`, `nav.tab-bar`, `main` with the `#tabFunnel` and `#tabAdventurers` panels (hidden attribute switches them), `#levelup-modal` (wizard).
* **Lines 2436–7951:** JavaScript `<script>` IIFE `(function () { "use strict"; ... })()`:
  * **Section 1: DATA (L2446–2910):** level 0 tables (modifiers, occupations d100, lucky signs d30, equipment, weapons `RULE_WEAPONS`, armor, names).
  * **Section 2: DICE (L2913–2948):** currency, dice chain, replaceable `roll(sides)`, `rollDiceExpression`, `APP_TIPS`.
  * **Section 1b: DATA CLASSES & TABLES DE RÈGLES (L2949–3756):** `CLASSES` (per-level rows, titles), XP thresholds, deities, thief paths/skills, critical/fumble tables, turn-unholy, lay-on-hands, mercurial magic, corruption, disapproval, two-weapon tables, `WIZARD_SPELLS`, `CLERIC_SPELLS`, `PATRONS`.
  * **Section 3: GENERATOR (L3757–3961):** `generateLevelZeroCharacter()`, `generateFunnelBatch()`.
  * **Section 3b: RÈGLES DES AVENTURIERS (L3962–5119):** pure functions (no DOM/localStorage, `structuredClone`d results): attack profiles, saves, skills, Luck burning, `canLevelUp`, `applyLevelUp`, `normalizeAdventurer`, spell casting (`castSpell`, `drawRandomWizardSpell`, `rollMercurialMagic`), cleric powers (`turnUnholy`, `layOnHands`, `divineAid`, `sacrifice`), dying/death (`getStatusCode`, `applyHpChange`, `advanceDyingRound`, `recoverBody`), `startNewDay`, `planImportMerge`/`applyImportMerge`.
  * **Section 4: APP `class DCCApp` (L5120–7983):**
    * Core: `initElements`, `bindEvents`, `loadState`/`saveState` (key `dcc_rpg_funnel_roster_v2`, invalid save copied to `..._backup`), `render`, `exportJson`/`importJson` (merge by `id`), `showRollToast`.
    * Tabs: `setActiveTab` (~L5371).
    * Level-up wizard: `openLevelUpWizard` and its step renderers (~L5441–6150).
    * Level 0 card: `createCharacterCard` (~L6551).
    * Adventurer card: `createAdventurerCard` (~L7548) with actions (attack, stat/save/initiative rolls, HP/XP, new day, dying round, recover body).
    * Class blocks: `renderClassBlock` (~L6757) and `bindClassBlock` (~L6783): warrior/dwarf/halfling, thief, cleric, wizard/elf.
  * **`globalThis.DCC_RULES = Object.freeze({...})` (~L7985):** exports pure rule functions and data tables for `tests/` (also `__setRoller` to script dice).
  * `DOMContentLoaded` → `new DCCApp()`.

---

## 4. Development Workflow by Phases (Mandatory)

Tout développement ou modification du projet doit impérativement respecter les **3 phases séquentielles** suivantes. Il est formellement interdit de sauter une phase ou de toucher au code de l'application (`index.html`) sans autorisation explicite de l'utilisateur.

### Phase 1 : Compréhension et analyse du besoin
* **Objectif :** Comprendre la demande en profondeur et supprimer toute incertitude ou zone d'ombre.
* **Règles :**
  * Poser systématiquement des questions de clarification jusqu'à éliminer 100% des doutes.
  * **Zéro décision implicite :** expliquer le problème, exposer les options/alternatives concrètes avec leurs avantages/inconvénients, et attendre la décision explicite de l'utilisateur.
  * **Ne toucher à aucun code applicatif.**
* **Livrable obligatoire :** À la fin de cette phase, rédaction d'un fichier Markdown documentant l'analyse du besoin, les choix arrêtés par l'utilisateur, et la description précise de ce qui est à développer.

### Phase 2 : Plan de développement
* **Objectif :** Rédiger un plan de développement technique détaillé.
* **Règles :**
  * Poser des questions sur l'architecture, le CSS, le HTML ou le JS jusqu'à supprimer tout doute ou incertitude.
  * **Zéro décision implicite :** expliquer les contraintes techniques, exposer les options de conception et attendre la décision de l'utilisateur.
  * **Ne toucher à aucun code applicatif.**
* **Livrable obligatoire :** À la fin de cette phase, rédaction d'un fichier Markdown documentant le plan technique détaillé, l'architecture retenue, les choix techniques effectués et le découpage précis des étapes de développement.

### Phase 3 : Description détaillée des changements
* **Objectif :** Décrire précisément et de manière exhaustive l'ensemble des modifications à apporter dans le code.
* **Règles :**
  * Documenter les changements exacts (fichiers cibles, numéros de lignes approximatifs, blocs CSS/HTML/JS, contenu avant/après, gestion des cas limites et responsive).
  * Ce document doit être rédigé avec un niveau de rigueur et de précision tel qu'il peut être transmis directement à un agent IA pour exécuter la tâche de manière autonome et sans ambiguïté.
* **Livrable obligatoire :** Rédaction d'un fichier Markdown contenant la spécification détaillée des modifications de code.

---

### Exécution du code (Si et seulement si expressément demandée par l'utilisateur)
Lorsque l'utilisateur valide explicitement le passage au code après les phases documentées :
1. **Édition de `index.html` :** Respecter strictement la structure en fichier unique (CSS, HTML et JS dans leurs sections respectives).
2. **Contrôle syntaxique JS :**
   ```bash
   node -e "const fs=require('fs'),vm=require('vm'),h=fs.readFileSync('index.html','utf8'),s=h.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(s);console.log('JS Syntax OK');"
   ```
3. **Contrôle structurel HTML :**
   ```bash
   python -c "from html.parser import HTMLParser;p=HTMLParser();p.feed(open('index.html',encoding='utf-8').read());print('HTML OK')"
   ```
4. **Exécution des tests de non-régression :**
   ```bash
   node --test tests/*.test.mjs
   ```
5. **Vérification du git diff :** S'assurer de l'absence de modifications parasites, de duplications de balises ou de trailing whitespace.
