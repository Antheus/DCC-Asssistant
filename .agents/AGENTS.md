# Agent Instructions — DCC Assistant

> **Agent Directive:** Trust these instructions completely. Do not spend time searching, grepping, or re-exploring the repository unless information here is missing or an unexpected error occurs. When researching game rules, **always use `Dungeon Crawl Classics - Francais.md` (Markdown)**; never attempt to parse or read the `.pdf` file.

---

## 1. Repository Overview

* **Purpose:** Single-file tabletop companion and Level 0 Character Funnel Generator (*Générateur d'Entonnoir*) for the official French edition of **Dungeon Crawl Classics (DCC RPG)**.
* **Core Architecture:** **Zero-build, 100% self-contained single-file web app** (`index.html`). All HTML, CSS, and Vanilla ES6 JavaScript reside in `index.html`.
* **Tech Stack & Dependencies:** Vanilla JavaScript (ES6+), semantic HTML5, modern CSS3 variables, Google Fonts (`Cinzel`, `MedievalSharp`). **Zero npm dependencies, zero build tools, zero bundlers.**
* **Target Runtime:** Any modern web browser (Chrome, Edge, Firefox, Safari) locally (`file:///`) or statically hosted via GitHub Pages.
* **Repository Size:** ~46 MB total. Most disk usage is the static rulebook reference (`Dungeon Crawl Classics - Francais.pdf` ~44 MB, and OCR text `Dungeon Crawl Classics - Francais.md` ~1.9 MB). The actual software application is solely `index.html` (~110 KB).

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
| **Git Status** | `git status` | `git status` | Check modified and untracked files. |

> **Critical Caveats & Rules:**
> 1. **Do not introduce build steps:** Do NOT install Webpack, Vite, Parcel, Babel, or TypeScript unless explicitly requested by the user.
> 2. **Keep it single-file:** Per architecture decisions (`conception-technique-notes.md`), the app MUST stay self-contained in `index.html`. Do NOT split CSS or JS into separate files.
> 3. **External libraries:** Any future external dependency (e.g. GUN/SEA for the planned shared notes feature) must be imported via HTTPS CDN `<script>` tags, never npm modules.
> 4. **Gitignore rule:** `.gitignore` ignores `Dungeon Crawl Classics - Francais.pdf`. The `.agents/` folder and `AGENTS.md` are tracked.
> 5. **Rulebook format — Markdown ONLY:** Always consult and work with the rules using the Markdown file (`Dungeon Crawl Classics - Francais.md`). **Never use or parse the PDF (`Dungeon Crawl Classics - Francais.pdf`)**. The Markdown file contains the complete, search-ready official rules and avoids heavy/unreliable PDF extraction.

---

## 3. Project Layout & Architecture Map

### Repository Root Layout
```
.
├── index.html                           # THE APPLICATION: HTML + CSS + JS in a single file (~2,887 lines)
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

### Anatomical Map of `index.html` (Total: ~2,887 lines)
* **Lines 1–11:** HTML `<head>` metadata, viewport, Google Fonts links.
* **Lines 12–1304:** CSS `<style>` block:
  * `:root`: Design tokens (`--bg-primary`, `--accent-gold`, `--accent-red`, `--font-serif`, etc.).
  * Reset, typography, app header, sticky action toolbar.
  * Responsive character grid (`.roster-grid`), card styles (`.character-card`, parchment styling).
  * Modal styling (`#dice-modal`), toast notifications, interactive badges.
  * `@media print`: Clean black-and-white 4-up 2×2 grid layout optimized for A4 paper printing.
* **Lines 1305–1389:** HTML `<body>` markup:
  * `<header class="app-header">`: Title and generation buttons (`+1 Paysan`, `Escouade (4)`, `Table (16)`).
  * `<main>`: Roster summary counter and `#roster-container` grid.
  * `#dice-modal` & `#toast-container`: Floating overlays for dice rolling and feedback.
* **Lines 1390–2884:** JavaScript `<script>` IIFE `(function () { "use strict"; ... })()`:
  * **Section 1: DATA (Lines 1400–1807):** Official DCC rules tables in French (ability modifiers 3–18, alignments, occupations d100, lucky birth augurs d30, equipment d24, starting weapons, racial languages, names).
  * **Section 2: DICE & UTILITIES (Lines 1808–1865):** Currency structure (`pc`, `pa`, `po`, `pe`, `pp`), DCC dice chain (`d3` to `d30`), dice evaluation engine `rollDie(faces)`, contextual gameplay tips (`APP_TIPS`).
  * **Section 3: GENERATOR (Lines 1866–2070):** Level 0 character creation logic: `generateLevelZeroCharacter()`, ability rolling (3d6 in order), HP calculation ($1d4 + \text{END mod}$), occupation resolution, luck augur modifier attachment, group livestock allocation.
  * **Section 4: APP CONTROLLER (Lines 2071–2883):** `class DCCApp`:
    * `this.characters`: Array of active character objects.
    * Storage: `localStorage.getItem('dcc_rpg_funnel_roster_v2')` / `saveState()`.
    * Lifecycle: `initElements()`, `bindEvents()`, `renderRoster()`, `renderCard(char)`.
    * Actions: Stat check rolls, save rolls, attack rolls with crit (natural 20) and fumble (natural 1) detection, luck burning/restoration, coin counters, JSON export/import.

---

## 4. Development Workflow & Change Verification

When making changes or adding features:
1. **Edit `index.html`:** Keep HTML, CSS, and JS strictly within their designated sections.
2. **Run JS syntax check:**
   ```bash
   node -e 'const fs=require("fs"),vm=require("vm"),h=fs.readFileSync("index.html","utf8"),s=h.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(s);console.log("JS Syntax OK");'
   ```
3. **Run HTML structure check:**
   ```bash
   python3 -c 'from html.parser import HTMLParser;p=HTMLParser();p.feed(open("index.html",encoding="utf-8").read());print("HTML OK")'
   ```
4. **Confirm git diff:** Ensure no spurious whitespace or duplicate tags at end of file (`</body></html>` must appear once).
