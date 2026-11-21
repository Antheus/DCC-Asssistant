# Phase 1 : Compréhension et Analyse du Besoin — Skill de Publication de Version

> **Date :** 21 novembre 2026  
> **Statut :** Validé par l'utilisateur (avec extension Changelog & Tooltip)  
> **Emplacement du document :** `notes/analyse-besoin-skill-publication.md`

---

## 1. Contexte & Objectifs

Le projet **DCC Assistant** est une application web monopage (`index.html`), sans bundler ni dépendances npm de production. Pour formaliser les livraisons, garantir la traçabilité des versions et synchroniser les branches Git (`main` pour le développement/intégration et `publish` pour la production / GitHub Pages), un skill spécialisé doit être créé sous `.agents/skills/publish-release/`.

Ce skill doit guider l'agent (et l'utilisateur) dans un processus de release rigoureux, standardisé et automatisé :
1. Détection de la version actuelle la plus haute et calcul des propositions SemVer.
2. Choix interactif de la nouvelle version (Patch, Minor, Major ou valeur sur-mesure).
3. Inspection de l'historique Git et rédaction collaborative des notes de version dans `CHANGELOG.md`.
4. Intégration des notes de la version courante dans un tooltip CSS personnalisé façon parchemin sur le badge de version dans `index.html`.
5. Exécution stricte des Quality Gates (tests de syntaxe JS, conformité HTML, tests unitaires).
6. Synchronisation exacte du numéro de version dans `package.json` et `index.html`.
7. Commit et push sur la branche `main`.
8. Pose d'un tag Git annoté et push de ce tag.
9. Bascule sur la branche `publish`, merge de `main`, push de `publish`.
10. Retour propre sur la branche `main`.

---

## 2. Décisions Validées avec l'Utilisateur

| Point analysé | Décision validée | Détail d'implémentation |
| :--- | :--- | :--- |
| **1. Format de version** | **Option A** | Format SemVer strict (ex: `1.1.0`) dans `package.json` et dans `index.html`. Dans `index.html`, le "v" préfixe d'affichage est situé à l'extérieur de la balise version (ex: `v<span class="app-version">1.1.0</span>`), garantissant une valeur textuelle identique dans les deux fichiers. |
| **2. Proposition de version** | **Plus haute trouvée + Option A** | Détection de la version dans `package.json` et `index.html`, prise de la valeur la plus haute existante comme référence. Présentation à l'utilisateur des 3 choix SemVer (Patch `X.Y.Z+1`, Minor `X.Y+1.0`, Major `X+1.0.0`) avec suggestion recommandée basée sur l'historique récent, plus possibilité de saisie personnalisée. |
| **3. Push & Gestion des branches** | **Oui pour publish, retour à main** | Après commit et push sur `main`, bascule sur `publish`, merge fast-forward (ou standard) de `main`, push vers `origin/publish`, puis checkout final de retour sur `main`. |
| **4. Tag Git** | **Oui, tag annoté** | Création d'un tag Git annoté sous la forme `vX.Y.Z` (ex: `git tag -a v1.1.0 -m "Release vX.Y.Z"`), pushé avec `git push origin vX.Y.Z` (ou `git push origin --tags`). |
| **5. Quality Gates** | **Oui (obligatoires)** | Avant toute mise à jour de version ou commit, exécution impérative de :<br>1. Syntaxe JS (`node -e ...`)<br>2. Intégrité HTML (`python -c ...`)<br>3. Tests unitaires (`node --test tests/*.test.mjs`)<br>4. Vérification de l'état du working tree Git (pas de conflits ni de fichiers non commités inattendus). Échec immédiat si un test échoue. |
| **6. Emplacement du skill** | **`.agents/skills/publish-release/`** | Structure standard de skill avec `SKILL.md` et un script utilitaire sécurisé pour la manipulation des fichiers (Node.js natif sans dépendance externe). |
| **7. Fichier Changelog** | **Option A (Génération interactive)** | Fichier `CHANGELOG.md` à la racine (format *Keep a Changelog*). Le skill inspecte l'historique Git depuis le dernier tag/commit de release, propose un résumé structuré des changements (Ajouts, Corrections, etc.), et attend la validation ou l'ajustement de l'utilisateur. |
| **8. Tooltip de version dans l'UI** | **Option B (Tooltip visuel CSS)** | Bulle d'information au survol/focus sur le badge `.app-version` stylée selon la charte DCC (fond sombre/parchemin, bordure dorée, ombrage, texte clair) affichant les changements clés de la version en cours. |

---

## 3. Workflow Global de Publication

```
[Étape 0: Vérifications d'intégrité (Quality Gates)]
   ├── Contrôle git status (working tree propre)
   ├── Exécution tests unitaires (node --test)
   ├── Exécution syntaxe JS (node vm)
   └── Exécution parser HTML (python)
          │
          ▼ (Si tout est vert)
[Étape 1: Détection & Proposition de Version]
   ├── Extraction version package.json
   ├── Extraction version index.html (.app-version)
   ├── Calcul version courante max (SemVer)
   ├── Calcul des candidats : Patch, Minor, Major
   └── Présentation à l'utilisateur & confirmation
          │
          ▼
[Étape 2: Génération du Changelog & Tooltip]
   ├── Analyse git log depuis le dernier tag/commit
   ├── Proposition du texte des changements pour cette version
   ├── Validation / édition par l'utilisateur
   ├── Mise à jour / Création de CHANGELOG.md
   └── Préparation du contenu du tooltip pour index.html
          │
          ▼
[Étape 3: Mise à jour des fichiers applicatifs]
   ├── package.json : mise à jour de "version": "X.Y.Z"
   └── index.html : mise à jour du texte de <span class="app-version"> et de son tooltip
          │
          ▼
[Étape 4: Re-validation de sécurité (Quality Gates)]
   └── Vérification syntaxe JS + HTML + tests unitaires
          │
          ▼
[Étape 5: Commit & Push sur main]
   ├── git add package.json index.html CHANGELOG.md
   ├── git commit -m "chore(release): vX.Y.Z"
   └── git push origin main
          │
          ▼
[Étape 6: Tag Git]
   ├── git tag -a vX.Y.Z -m "Release vX.Y.Z"
   └── git push origin vX.Y.Z
          │
          ▼
[Étape 7: Déploiement sur publish & Retour]
   ├── git checkout publish
   ├── git merge main --no-edit (ou fast-forward)
   ├── git push origin publish
   └── git checkout main
```
