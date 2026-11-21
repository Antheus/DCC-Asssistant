---
name: publish-release
description: >-
  Publie une nouvelle version de DCC Assistant : propose un numéro SemVer,
  génère le changelog, met à jour package.json + index.html (version & tooltip),
  commite, tague, merge dans publish et pousse le tout.
---

# Skill : Publication de Version (publish-release)

Ce skill guide l'agent pas à pas dans le processus complet de publication d'une
version de DCC Assistant. **Chaque étape doit être exécutée séquentiellement et
validée avant de passer à la suivante.**

> **Prérequis :** L'agent doit être sur la branche `main` et le working tree
> doit être propre (pas de modifications non commitées sauf celles de la release
> en cours).

---

## Étape 0 — Quality Gates (pré-publication)

Exécuter les commandes suivantes. **Si l'une d'elles échoue, ARRÊTER
immédiatement et signaler l'erreur à l'utilisateur.** Ne jamais continuer la
publication si un test échoue.

```bash
# 1. Vérifier qu'on est bien sur main
git branch --show-current
# Doit afficher : main

# 2. Vérifier que le working tree est propre
git status --porcelain
# Doit être vide (ou ne contenir que des fichiers non trackés acceptables)

# 3. Syntaxe JavaScript
node -e "const fs=require('fs'),vm=require('vm'),h=fs.readFileSync('index.html','utf8'),s=h.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(s);console.log('JS Syntax OK');"

# 4. Intégrité HTML
python -c "from html.parser import HTMLParser;p=HTMLParser();p.feed(open('index.html',encoding='utf-8').read());print('HTML OK')"

# 5. Tests unitaires
node --test tests/*.test.mjs
```

---

## Étape 1 — Détection de version & proposition SemVer

Exécuter le script d'inspection :

```bash
node .agents/skills/publish-release/scripts/bump.mjs --inspect
```

Ce script affiche :
- La version actuelle dans `package.json`
- La version actuelle dans `index.html`
- La version de référence (la plus haute des deux)
- Les 3 propositions : **patch**, **minor**, **major**

**Présenter ces options à l'utilisateur** avec l'outil `ask_question` ou en texte
clair. L'utilisateur peut aussi saisir une version personnalisée. Attendre sa
validation explicite.

---

## Étape 2 — Génération du changelog

Récupérer l'historique des commits depuis le dernier tag :

```bash
node .agents/skills/publish-release/scripts/bump.mjs --commits
```

À partir de cette liste de commits :
1. **Rédiger une proposition de notes de version** structurée (sections : Ajouts,
   Corrections, Modifications, etc.). Synthétiser les commits en entrées
   lisibles par un utilisateur final (pas de jargon Git).
2. **Présenter la proposition à l'utilisateur** pour validation ou modification.
3. Conserver le texte validé pour l'étape suivante.

---

## Étape 3 — Application de la version et du changelog

Une fois le numéro de version ET les notes validés par l'utilisateur :

```bash
node .agents/skills/publish-release/scripts/bump.mjs --apply <VERSION> --notes "<NOTES_VALIDÉES>"
```

Le script met à jour automatiquement :
- `package.json` : champ `"version"`
- `index.html` : texte dans `<span class="app-version">` et contenu du
  tooltip `<span class="version-tooltip">`
- `CHANGELOG.md` : insertion de la nouvelle section datée en tête de fichier

**Important :** Les notes passées via `--notes` doivent utiliser `\n` pour les
retours à la ligne. Par exemple :
```
--notes "Ajouts :\n• Nouvelle fonctionnalité X\n\nCorrections :\n• Bug Y corrigé"
```

---

## Étape 4 — Quality Gates (post-modification)

Ré-exécuter les 3 validations pour s'assurer qu'aucune régression n'a été
introduite par la mise à jour des fichiers :

```bash
node -e "const fs=require('fs'),vm=require('vm'),h=fs.readFileSync('index.html','utf8'),s=h.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(s);console.log('JS Syntax OK');"
python -c "from html.parser import HTMLParser;p=HTMLParser();p.feed(open('index.html',encoding='utf-8').read());print('HTML OK')"
node --test tests/*.test.mjs
```

**Si un test échoue, NE PAS continuer. Corriger le problème d'abord.**

---

## Étape 5 — Commit & Push sur main

```bash
git add package.json index.html CHANGELOG.md
git commit -m "chore(release): v<VERSION>"
git push origin main
```

---

## Étape 6 — Tag Git annoté

```bash
git tag -a v<VERSION> -m "Release v<VERSION>"
git push origin v<VERSION>
```

---

## Étape 7 — Merge dans publish & retour sur main

```bash
git checkout publish
git merge main -m "Merge branch 'main' into publish for v<VERSION>"
git push origin publish
git checkout main
```

**Confirmer à l'utilisateur** que la publication est terminée avec un résumé :
- Version publiée : `vX.Y.Z`
- Tag créé : `vX.Y.Z`
- Branches synchronisées : `main` et `publish` pushées
- Branche active : `main`
