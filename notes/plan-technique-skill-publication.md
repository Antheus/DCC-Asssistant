# Phase 2 : Plan Technique de Développement — Skill de Publication de Version

> **Date :** 21 novembre 2026  
> **Statut :** Plan technique complet (intégrant Changelog & Tooltip CSS)  
> **Emplacement du document :** `notes/plan-technique-skill-publication.md`

---

## 1. Architecture & Fichiers

### Structure des dossiers & fichiers créés ou modifiés :
```
.
├── CHANGELOG.md                         # Nouveau / Maintenu : historique des versions (format Keep a Changelog)
├── package.json                         # Mis à jour : champ "version": "X.Y.Z"
├── index.html                           # Mis à jour : CSS du tooltip + badge version avec tooltip
└── .agents/skills/publish-release/
    ├── SKILL.md                         # Instructions opérationnelles du skill pour l'agent
    └── scripts/
        └── bump.mjs                     # Script utilitaire Node.js (SemVer, MAJ package/index/changelog)
```

---

## 2. Conception Technique des Composants

### 2.1. Fichier `CHANGELOG.md`
* Format standardisé :
  ```markdown
  # Journal des Modifications (Changelog)

  Toutes les modifications notables de ce projet sont documentées dans ce fichier.
  Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

  ## [X.Y.Z] - AAAA-MM-JJ
  ### Ajouts
  - ...
  ### Corrections
  - ...
  ```
* À chaque release, la nouvelle section est insérée en tête de fichier (sous l'en-tête principal).

### 2.2. Tooltip CSS dans `index.html`
* **Style CSS :**
  Ajout dans le bloc `<style>` de `index.html` des règles pour `.app-version-wrapper` et `.version-tooltip` :
  ```css
  .app-version-wrapper {
    position: relative;
    display: inline-block;
    cursor: help;
  }
  .app-version-wrapper .version-tooltip {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    top: 130%;
    left: 50%;
    transform: translateX(-50%);
    background: #1c1c24;
    border: 1px solid var(--accent-gold);
    color: var(--text-light);
    border-radius: 6px;
    padding: 0.6rem 0.8rem;
    font-size: 0.75rem;
    font-family: var(--font-sans);
    font-style: normal;
    font-weight: normal;
    white-space: pre-line;
    width: max-content;
    max-width: 320px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.6);
    z-index: 100;
    transition: opacity 0.2s ease, visibility 0.2s ease;
    pointer-events: none;
    line-height: 1.4;
    text-align: left;
  }
  .app-version-wrapper .version-tooltip::after {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent var(--accent-gold) transparent;
  }
  .app-version-wrapper:hover .version-tooltip,
  .app-version-wrapper:focus-within .version-tooltip {
    visibility: visible;
    opacity: 1;
  }
  ```
* **Balisage HTML dans `header.app-header` :**
  ```html
  <span class="app-version-wrapper" tabindex="0">v<span class="app-version">X.Y.Z</span>
    <span class="version-tooltip"><strong>Nouveautés vX.Y.Z :</strong>
  • Ajout de...
  • Correction de...</span>
  </span>
  ```
  Le texte dans `<span class="app-version">` est strictement `X.Y.Z`, identique à `package.json`.

### 2.3. Script utilitaire `scripts/bump.mjs`
Script Node.js autonome (sans dépendances npm) supportant 3 actions :
1. **Inspection (`node bump.mjs --inspect`) :**
   - Lit `package.json` et `index.html`.
   - Extrait les versions et détermine la version la plus haute.
   - Calcule les trois propositions : `patch`, `minor`, `major`.
   - Retourne un JSON ou un affichage texte pour l'agent.
2. **Historique Git (`node bump.mjs --commits`) :**
   - Récupère via `git log` les commits depuis le dernier tag (ou HEAD~10 si pas de tag) pour aider l'agent à synthétiser les nouveautés.
3. **Application (`node bump.mjs --apply <version> --notes "<texte des notes>"`) :**
   - Met à jour `package.json` (`"version": "<version>"`).
   - Met à jour `index.html` (numéro dans `.app-version` + contenu de `.version-tooltip`).
   - Met à jour ou crée `CHANGELOG.md` en insérant la nouvelle section datée.
   - Contrôle d'intégrité strict : vérifie que la version écrite est identique dans `package.json` et `index.html`.

### 2.4. Instructions `SKILL.md`
Guide orchestré étape par étape :
- Pré-requis : Quality Gates exécutées et réussies.
- Exécution de `--inspect` et `--commits`.
- Dialogue avec l'utilisateur : validation du numéro de version et validation des notes de version.
- Exécution de `--apply`.
- Quality Gates de confirmation.
- Commandes Git séquentielles (`commit` sur main, `push` sur main, `tag` annoté, `push` tag, `checkout publish`, `merge main`, `push publish`, `checkout main`).

---

## 3. Plan de Test & Robustesse

1. **Vérification de synchronisation des versions :** Le script vérifie par lecture immédiate que `package.json` et `index.html` contiennent exactement la même chaîne semver.
2. **Quality Gates non régressives :** Les commandes de validation `node -e ...`, `python -c ...` et `node --test tests/*.test.mjs` sont intégrées au workflow et doivent obligatoirement réussir.
3. **Robustesse Git :** Gestion des cas où `publish` est déjà à jour ou nécessite un fast-forward propre.

---

Ce plan technique est prêt pour validation avant rédaction de la spécification détaillée de Phase 3.
