# Phase 3 : Spécification Détaillée des Changements — Skill de Publication de Version

> **Date :** 21 novembre 2026  
> **Statut :** Spécification prête pour implémentation  
> **Emplacement :** `notes/spec-detaillee-skill-publication.md`

---

## 1. Fichiers créés

### 1.1. `.agents/skills/publish-release/SKILL.md`
Fichier d'instructions du skill (frontmatter YAML + instructions Markdown complètes).

### 1.2. `.agents/skills/publish-release/scripts/bump.mjs`
Script Node.js (ES module, zéro dépendance npm) avec trois modes :
- `--inspect` : lecture et comparaison des versions, affichage des 3 propositions semver.
- `--commits` : affichage des commits depuis le dernier tag.
- `--apply <version> --notes "<texte>"` : écriture dans `package.json`, `index.html`, `CHANGELOG.md`.

### 1.3. `CHANGELOG.md` (racine)
Créé lors de la première release si inexistant. Format *Keep a Changelog*.

---

## 2. Modifications dans `index.html`

### 2.1. CSS — Ajout des styles du tooltip version (~après ligne 86, après `.title-group p {}`)
Insertion de `.app-version-wrapper` et `.version-tooltip` entre `.title-group p` (L82-86) et `.actions-toolbar` (L88).

### 2.2. CSS responsive — Ajout du max-width du tooltip en mobile (~après L2464)
Dans le bloc `@media screen and (max-width: 640px)`, ajout d'une règle limitant la largeur du tooltip.

### 2.3. HTML — Restructuration du badge de version (L2592-2593)
Remplacement de :
```html
<span class="app-version"
    style="font-size: 0.85em; opacity: 0.8; font-weight: bold; color: var(--accent-gold);">v1.0.2</span>
```
Par :
```html
<span class="app-version-wrapper" tabindex="0">v<span class="app-version"
    style="font-size: 0.85em; opacity: 0.8; font-weight: bold; color: var(--accent-gold);">1.0.2</span>
  <span class="version-tooltip">Version initiale</span>
</span>
```

---

## 3. Validation
Après création de tous les fichiers, exécution des quality gates :
- Syntaxe JS
- Intégrité HTML  
- Tests unitaires (`node --test tests/*.test.mjs`)
