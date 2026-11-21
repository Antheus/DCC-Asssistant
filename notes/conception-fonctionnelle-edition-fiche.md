# Conception Fonctionnelle — Mode Édition des Fiches & Création Manuelle

**Projet :** DCC Assistant (Dungeon Crawl Classics RPG)  
**Phase :** Phase 1 — Compréhension et analyse du besoin  
**Date :** 21 novembre 2026  
**Statut :** Validé par l'utilisateur (Choix : Options 1.A, 2.A, 3.A, 4.A + Données de classe éditables)

---

## 1. Contexte & Objectif

L'application *DCC Assistant* permet actuellement de générer des personnages niveau 0 en lot (l'Entonnoir) et de promouvoir les survivants au niveau 1 via un assistant pas-à-pas.

Cependant, les joueurs et le juge ont fréquemment besoin de :
1. **Intégrer un personnage déjà existant** (créé sur table papier, provenant d'une autre campagne ou d'un autre outil).
2. **Corriger ou ajuster manuellement une fiche** à tout moment (gain d'un objet magique modifiant une caractéristique, changement d'alignement, attribution d'un sort spécifique, ajustement de pièces d'or, etc.).
3. **Créer directement un aventurier de niveau 1+** sans devoir générer un niveau 0 au préalable.

L'objectif de cette fonctionnalité est donc d'ajouter un **Mode Édition in-situ** sur chaque fiche (Niveau 0 et Aventurier) ainsi qu'un bouton de **création directe d'aventurier**.

---

## 2. Décisions Validées & Périmètre

* **Périmètre des fiches (Option 1.A) :**
  * Les fiches **Niveau 0** (onglet *Niveau 0*) disposent du mode édition.
  * Les fiches **Aventuriers (Niveaux 1 à 10)** (onglet *Aventuriers*) disposent du mode édition.
* **Moteur de règles & Calculs (Option 2.A) :**
  * L'édition porte sur les **données sources fondamentales** (Caractéristiques brutes 3–18, Classe, Niveau, PV max/actuels, Chance courante/initiale, Armure, Arme, Équipement, Sorts, etc.).
  * À la validation, le moteur de règles DCC officiel recalculera automatiquement les valeurs dérivées (modificateurs de caractéristiques, sauvegardes de classe, Dé de prouesse, seuils de critique, dés d'action, profils d'attaque) pour maintenir la parfaite cohérence du système et la validité des lancers de dés automatisés.
* **Création d'un aventurier ex nihilo (Option 3.A) :**
  * Ajout d'un bouton **« ➕ Nouvel aventurier »** dans la barre d'outils de l'onglet *Aventuriers*.
  * Ce bouton génère une fiche d'aventurier de base et active immédiatement le mode édition pour permettre la saisie complète du personnage existant.
* **Ergonomie du Mode Édition (Option 4.A) :**
  * Bouton bascule **« ✏️ Modifier »** positionné en haut de chaque fiche, à proximité du badge de statut (vivant / inconscient / mort / agonisant / etc.).
  * En mode édition :
    * La fiche adopte un style visuel dédié (bordure mise en évidence, badge visuel « Mode Édition »).
    * Les éléments textuels deviennent des champs de saisie (`<input>`, `<select>`, `<textarea>`).
    * Les boutons de lancers de dés et actions de jeu (attaques, sorts, brûlesort) sont temporairement désactivés ou masqués pour éviter toute collision d'interaction.
    * Le bouton d'en-tête devient **« 💾 Terminer »**.
    * Un bouton **« ❌ Annuler »** apparaît à ses côtés pour permettre de quitter le mode sans conserver les modifications.
* **Données spécifiques de classe :**
  * Les informations propres aux classes sont éditables en mode édition :
    * **Clerc :** Sélection de la Divinité, valeur de désapprobation.
    * **Magicien / Elfe :** Sélection du Patron, gestion des sorts connus (ajout/suppression dans les listes de sorts DCC), points de brûlesort / corruption.
    * **Voleur :** Voie / Alignement, compétences de voleur.
    * **Guerrier / Nain :** Armes équipées, bonus spécifiques.

---

## 3. Spécifications Fonctionnelles Détaillées

### 3.1. Fiches Niveau 0 (Générateur d'Entonnoir)

#### A. En-tête de la fiche
* **Bouton d'action :** `✏️ Modifier` / `💾 Terminer` et `❌ Annuler`, situé dans `card-header` près du badge de statut.
* **Champs modifiables en mode édition :**
  * **Nom :** Champ texte.
  * **Race :** Sélecteur (`Humain`, `Elfe`, `Nain`, `Halfelin`).
  * **Métier :** Champ texte (avec proposition issue de la table des métiers d100 ou saisie libre).
  * **Alignement :** Sélecteur (`Loyal`, `Neutre`, `Chaotique`).
  * **Statut de vie :** Calculé automatiquement à partir des PV (actuels vs max), mais les PV sont librement éditables.
  * **Langues connues :** Champ texte (séparées par des virgules).

#### B. Vitales & Caractéristiques
* **PV actuels & PV max :** Saisie numérique.
* **Caractéristiques (FOR, AGI, END, PRE, INT, CHA) :** Scores bruts (3–18). Les modificateurs associés se mettent à jour automatiquement.
* **Chance :** Score actuel et score initial.
* **Signe Porte-bonheur :** Sélection parmi la table des 30 signes ou saisie libre du texte du signe et du jet.

#### C. Combat & Équipement
* **Armure équipée :** Sélecteur d'armure (Aucune, Cuir rembourré, Cuir, etc.) ou ajustement de la CA.
* **Arme de départ :** Sélecteur d'arme ou texte libre + dégâts.
* **Équipement & Marchandise :** Zone de texte multiligne (`<textarea>`).
* **Monnaie :** Pièces de cuivre (PC).

---

### 3.2. Fiches Aventuriers (Niveau 1 à 10)

#### A. En-tête & Identité
* **Bouton d'action :** `✏️ Modifier` / `💾 Terminer` et `❌ Annuler`, situé dans `card-header` près du badge de statut.
* **Champs modifiables en mode édition :**
  * **Nom :** Champ texte.
  * **Classe :** Sélecteur parmi les 7 classes DCC (`Guerrier`, `Clerc`, `Voleur`, `Magicien`, `Nain`, `Elfe`, `Halfelin`).
  * **Niveau :** Sélecteur numérique de 1 à 10.
  * **Titre :** Champ texte (automatique selon classe/niveau/alignement par défaut, mais personnalisable).
  * **Alignement :** Sélecteur (`Loyal`, `Neutre`, `Chaotique`).
  * **Race :** Sélecteur de race.
  * **Langues connues :** Champ texte modifiable.

#### B. Vitales & Statistiques
* **Points de Vie (PV) :** PV actuels et PV maximum (saisie numérique).
* **Points d'Expérience (PX) :** Saisie numérique libre. Le seuil de niveau suivant reste calculé automatiquement.
* **Caractéristiques :**
  * 6 caractéristiques : Force, Agilité, Endurance, Personnalité, Intelligence, Chance.
  * Pour la Chance : Score actuel et Score initial.
  * Pour les lanceurs de sorts : indication ou réinitialisation du brûlesort.
* **Vitesse :** Saisie numérique (mètres).
* **Signe Porte-bonheur :** Sélecteur ou descriptif personnalisé.

#### C. Équipement, Armes & CA
* **Armure & Bouclier :** Choix de l'armure et port du bouclier (recalcul de la CA, du malus de désencombrement et du dé de vitesse selon règles).
* **Armes :** Sélection d'arme principale (et d'éventuelle arme secondaire) parmi la table `RULE_WEAPONS` ou saisie personnalisée (dégâts, type mêlée/tir, deux mains).
* **Équipement général :** Édition du texte d'inventaire.
* **Trésor / Monnaies :** PC (cuivre), PA (argent), PE (électrum), PO (or), PP (platine).

#### D. Données spécifiques de classe
* **Clerc :**
  * Sélecteur de la Divinité (filtrée ou libre selon alignement).
  * Désapprobation courante (compteur/score).
* **Magicien / Elfe :**
  * Sélecteur du Patron surnaturel (liste des patrons DCC ou « Aucun »).
  * Liste des sorts connus : interface d'ajout / retrait de sorts parmi les tables de sorts DCC (niveaux 1 à 5).
* **Voleur :**
  * Voie du voleur (affichée selon l'alignement).
  * Scores ou modificateurs de compétences de voleur.

---

### 3.3. Bouton Global « ➕ Nouvel aventurier »

* **Emplacement :** Dans l'en-tête de l'onglet *Aventuriers* (près des filtres de statut et du bouton d'impression).
* **Action :**
  1. Instancie un objet aventurier valide conforme aux schémas existants (Guerrier niveau 1 humain, scores par défaut 10/10/10/10/10/10, équipement de base).
  2. L'ajoute à la liste des aventuriers de l'application (`state.adventurers`).
  3. Fait défiler la vue jusqu'à cette nouvelle fiche.
  4. Active immédiatement le **Mode Édition** sur cette fiche pour que l'utilisateur n'ait plus qu'à remplir ses valeurs.

---

### 3.4. Cycle de Vie du Mode Édition (Sauvegarde & Annulation)

```
[Mode Normal : Lecture / Jets de dés]
       │
       ▼ (Clic sur ✏️ Modifier)
[Mode Édition activé]
  ├─ Clone de sauvegarde de l'état initial du personnage
  ├─ Remplacement des affichages statiques par des contrôles de formulaire
  ├─ Désactivation temporaire des boutons de dés et d'attaques
  │
  ├──► Clic sur ❌ Annuler ──────► Rétablissement du clone initial ──► Retour Mode Normal
  │
  └──► Clic sur 💾 Terminer ────► Validation & Recalcul DCC ───────► Sauvegarde localStorage ──► Retour Mode Normal
```

---

## 4. Règles de Gestion & Cas Limites

1. **Persistance :**
   * Toutes les modifications validées sont immédiatement persistées dans le `localStorage` (`dcc_rpg_funnel_roster_v2`) et exportables en JSON.
2. **Cohérence des règles :**
   * Si la classe ou le niveau d'un aventurier est modifié, le dé de prouesse, les dés d'action, et les sauvegardes de base de la classe sont immédiatement alignés sur la table officielle DCC correspondante.
3. **Cas de mort ou inconscience :**
   * Le statut (vivant, inconscient, agonisant, mort) reste lié aux règles de PV et au statut `dead` ; si l'utilisateur saisit des PV > 0 sur un personnage mort ou agonisant, la fiche repasse en état valide et le personnage peut à nouveau agir.
4. **Impression & Export :**
   * Si l'utilisateur lance une impression (`Ctrl+P` ou bouton Imprimer), la fiche en mode édition est imprimée proprement (les valeurs des champs sont visibles ou la fiche repasse automatiquement en mode lecture avant l'impression).

---

## 5. Prochaine Étape

Ce document formalise et conclut la **Phase 1**.  
Dès validation par l'utilisateur de ce document, nous passerons à la **Phase 2 : Plan de développement technique**, qui définira l'architecture logicielle, les fonctions à ajouter ou adapter dans `index.html`, et le séquençage technique précis.
