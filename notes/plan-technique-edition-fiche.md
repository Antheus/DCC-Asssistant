# Plan Technique — Mode Édition des Fiches & Création Manuelle

**Projet :** DCC Assistant (Dungeon Crawl Classics RPG)  
**Phase :** Phase 2 — Plan de développement technique  
**Date :** 21 novembre 2026  
**Livrable :** `notes/plan-technique-edition-fiche.md`  
**Référence fonctionnelle :** `notes/conception-fonctionnelle-edition-fiche.md`

---

## 1. Architecture Technique & Principes Directeurs

Conformément aux directives d'architecture du projet :
1. **Zéro build, fichier unique :** Tout le code (CSS, HTML, JS) s'intègre exclusivement dans `index.html`.
2. **Respect des règles pures (Section 3b) :** Les calculs et recalculs de règles (sauvegardes, modificateurs, dés de prouesse, CA, seuils de critique, normalisation) s'appuient sur les fonctions pures existantes (`getModifier`, `getAdventurerSaves`, `getAttackProfile`, `normalizeAdventurer`, `validateCharacterData`, `syncLegacyStatus`, `getStatusCode`).
3. **Étanchéité de l'état d'édition :**
   * L'application conserve un ensemble d'identifiants en cours d'édition : `this.editingCharacterIds = new Set()`.
   * Un état brouillon (*draft*) ou un snapshot initial est conservé en mémoire pour permettre l'annulation sans altérer les données sauvegardées.
4. **Ergonomie in-situ sans déstructuration :**
   * En mode normal, la fiche affiche ses boutons d'action de jeu (lancers de dés, attaques, sorts, prouesses).
   * En mode édition, la carte affiche un formulaire dédié, clair et aéré, structuré en sections logiques avec inputs, sélecteurs et boutons de validation/annulation en haut de carte.

---

## 2. Découpage Technique des Composants

### 2.1. Barre d'outils et Bouton Global « ➕ Nouvel aventurier » (HTML & CSS)
* **Emplacement :**
  * Dans l'en-tête de l'application `.actions-toolbar`, ajout du bouton `<button id="btnNewAdventurer" class="btn btn-gold" title="Créer un nouvel aventurier de niveau 1+"><span>➕</span> Nouvel aventurier</button>`.
  * Visibilité asservie à l'onglet actif :
    * Onglet *Niveau 0* : boutons `+1 Paysan`, `Escouade (4)`, `Table (16)` visibles ; `btnNewAdventurer` masqué.
    * Onglet *Aventuriers* : boutons de paysans masqués ; `btnNewAdventurer` visible.
  * Dans l'état vide `adventurerEmptyState` : ajout d'un bouton d'action principal « ➕ Créer un aventurier » pour guider l'utilisateur.

### 2.2. En-tête des Fiches & Boutons d'Action (HTML & CSS)
* Dans chaque fiche (Niveau 0 via `createCharacterCard` et Aventurier via `createAdventurerCard`) :
  * Ajout dans `card-header` (près du badge de statut) d'un conteneur d'actions d'édition :
    * En mode lecture : `<button type="button" class="btn btn-secondary btn-sm btn-edit-card" title="Modifier la fiche">✏️ Modifier</button>`.
    * En mode édition :
      * `<button type="button" class="btn btn-primary btn-sm btn-save-edit" title="Enregistrer les modifications">💾 Terminer</button>`
      * `<button type="button" class="btn btn-secondary btn-sm btn-cancel-edit" title="Annuler les modifications">❌ Annuler</button>`
* Classe CSS `.char-card-editing` : bordure dorée/bleutée, ombre portée d'accentuation, badge indicateur « Mode Édition ».

### 2.3. Rendu du Mode Édition (JavaScript)

#### A. Fiche Niveau 0 (`renderCharacterCardEdit`)
* **Section Identité :**
  * Nom (champ texte), Race (sélecteur : Humain, Elfe, Nain, Halfelin), Métier (champ texte avec autocomplétion/liste issue des 100 métiers DCC), Alignement (sélecteur : Loyal, Neutre, Chaotique), Langues (champ texte).
* **Section Vitales & Caractéristiques :**
  * PV actuels et PV max (nombres entiers ≥ 0).
  * 6 Caractéristiques (FOR, AGI, END, PRE, INT, CHA) en scores 3–18.
  * Chance initiale et Chance courante.
  * Signe porte-bonheur (sélecteur des 30 signes DCC).
* **Section Combat & Équipement :**
  * Armure (sélecteur d'armures de base + case à cocher bouclier).
  * Arme (sélecteur parmi `RULE_WEAPONS`).
  * Vitesse de base (mètres).
  * Équipement & Marchandise (zone de texte multiligne).
  * Monnaie (PC).
  * Notes libres.

#### B. Fiche Aventurier (`renderAdventurerCardEdit`)
* **Section Identité & Classe :**
  * Nom, Classe (`Guerrier`, `Clerc`, `Voleur`, `Magicien`, `Nain`, `Elfe`, `Halfelin`), Niveau (1 à 10), Titre personnalisé (ou automatique), Alignement, Race, Langues.
* **Section Vitales, XP & Caractéristiques :**
  * PV actuels et PV max.
  * PX actuels.
  * 6 Caractéristiques brutes (3–18), Chance courante et Chance initiale.
  * Signe porte-bonheur (sélecteur des 30 augures).
* **Section Combat, Armures & Armes :**
  * Armure équipée (sélecteur) et bouclier.
  * Arme principale (sélecteur parmi `RULE_WEAPONS`).
  * Vitesse (mètres).
* **Section Données Spécifiques de Classe :**
  * *Clerc :* Sélecteur de Divinité (`DEITIES[char.alignment]`), valeur de désapprobation courante.
  * *Magicien / Elfe :* Sélecteur de Patron surnaturel (`PATRONS`), sélection multiple des sorts connus parmi la table `WIZARD_SPELLS` filtrée par niveau de sort.
  * *Voleur :* Voie du voleur (affichée selon l'alignement), bonus de compétences.
  * *Guerrier / Nain :* Arme de prédilection / chanceuse.
* **Section Inventaire & Bourse :**
  * Monnaies : PC, PA, PE, PO, PP.
  * Équipement / paquetage (textarea).
  * Notes libres.

---

## 3. Logique Applicative & Flux de Données

```
[Utilisateur clique sur ✏️ Modifier]
         │
         ▼
  this.startEditing(char.id)
  ├─ Enregistre snapshot: this.characterSnapshots.set(char.id, structuredClone(char))
  ├─ this.editingCharacterIds.add(char.id)
  └─ this.render()
         │
         ▼
  Rendu de la fiche avec .char-card-editing et formulaire complet
         │
         ├──► [Clic sur ❌ Annuler]
         │        │
         │        ▼
         │    this.cancelEditing(char.id)
         │    ├─ Si le perso était un "nouveau" jamais validé -> suppression du tableau
         │    ├─ Sinon -> restauration depuis snapshot
         │    ├─ this.editingCharacterIds.delete(char.id)
         │    └─ this.render()
         │
         └──► [Clic sur 💾 Terminer]
                  │
                  ▼
              this.saveEditing(char.id, cardElement)
              ├─ Extraction des valeurs du formulaire
              ├─ Recalcul des modificateurs: stat.mod = getModifier(stat.score)
              ├─ Recalcul des sauvegardes & valeurs dérivées
              ├─ Validation & normalisation: normalizeAdventurer(char)
              ├─ Mise à jour dans this.characters
              ├─ this.saveState() (persistance localStorage)
              ├─ this.editingCharacterIds.delete(char.id)
              ├─ this.render()
              └─ Affichage du toast de confirmation
```

---

## 4. Création d'un Nouvel Aventurier (`createBlankAdventurer`)

Une fonction pure dédiée sera créée dans la section des règles :
```javascript
function createBlankAdventurer(customProps = {}) {
  const id = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  // Initialisation Guerrier Niv. 1 humain par défaut avec caractéristiques standard (10)
  // ou tirage équilibré, armure de cuir, épée courte, bourse standard
  ...
}
```
Lors du clic sur « ➕ Nouvel aventurier » :
1. `const newAdv = createBlankAdventurer();`
2. `newAdv._isNew = true;` (indicateur pour suppression propre si l'utilisateur annule immédiatement)
3. `this.characters.push(newAdv);`
4. `this.startEditing(newAdv.id);`
5. `this.setActiveTab('adventurers');`
6. Défilement vers la nouvelle carte (`scrollIntoView`).

---

## 5. Modifications CSS Prévues

* Styles du mode édition :
  * `.char-card.char-card-editing` : bordure lumineuse, fond légèrement contrasté, ruban/badge `Mode Édition`.
  * `.edit-grid` / `.edit-section` : organisation claire en deux colonnes pour inputs et labels.
  * `.edit-field-group` : label au-dessus de l'input avec style typographique Cinzel/sans-serif homogène.
  * Responsive : passage en une seule colonne sur mobile (`@media screen and (max-width: 640px)`).
  * Impression : masquage des contrôles d'édition ou forçage du rendu lecture lors de `@media print`.

---

## 6. Options Techniques Validées par l'Utilisateur

Les 3 choix techniques d'implémentation ont été formellement validés par l'utilisateur :
1. **Caractéristiques initiales du « Nouvel aventurier » : Option A**
   * Valeurs neutres par défaut (10 partout, modificateurs à 0, PV max calculés selon le dé de vie de la classe choisie). L'utilisateur saisit directement les chiffres de son personnage existant sans devoir effacer un tirage aléatoire.
2. **Sélection des sorts connus (Magicien / Elfe) : Option A**
   * Sélection via liste de cases à cocher organisées par niveau de sort parmi les sorts officiels DCC de la base `WIZARD_SPELLS`. Cela garantit que les descriptions officielles et les boutons de lancers de sorts DCC (tables, mercuriale, corruption) fonctionnent immédiatement.
3. **Comportement de l'annulation d'un « Nouvel aventurier » : Option A**
   * Si l'utilisateur clique sur « ➕ Nouvel aventurier » puis sur « ❌ Annuler » sans avoir validé, la fiche temporaire est immédiatement supprimée du roster (pas de fiche fantôme non désirée).

---

## 7. Plan de Tests & Non-Régression

1. **Syntaxe JS & HTML :**
   * Validation syntaxique Node.js VM (`node -e "..."`).
   * Validation structurelle HTML Python (`python -c "..."`).
2. **Tests unitaires automatisés existants :**
   * Exécution de `node --test tests/*.test.mjs` pour garantir l'absence de régression sur les fonctions pures.
3. **Nouveaux tests unitaires à ajouter dans `tests/` :**
   * Test de création d'aventurier vierge (`createBlankAdventurer`).
   * Test de recalcul des modificateurs et sauvegardes après édition d'une fiche.
   * Test de normalisation et validation des données éditées.
4. **Vérification manuelle dans le navigateur :**
   * Bascule en mode édition d'un niveau 0 -> modification -> sauvegarde -> vérification des jets.
   * Bascule en mode édition d'un aventurier -> modification de caractéristiques/classe -> recalcul immédiat.
   * Annulation d'une édition en cours -> rétablissement fidèle des valeurs initiales.
   * Clic sur `➕ Nouvel aventurier` -> saisie complète d'un PJ niveau 3 -> sauvegarde et fonctionnement des attaques et sorts.
