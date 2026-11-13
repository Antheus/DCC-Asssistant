# ⚔️ DCC RPG - Générateur d'Entonnoir (Niveau 0)

Application web **100% autonome dans un seul fichier** pour créer et gérer des personnages de **Niveau 0** pour le jeu de rôle **Dungeon Crawl Classics** (DCC RPG) en français.

---

## 🚀 Comment lancer l'application ?

Le fichier **[`index.html`](index.html)** regroupe **tout le HTML, le CSS et le JavaScript en un seul fichier** :

1. **Double-cliquez** simplement sur [`index.html`](index.html).
2. L'application s'ouvre immédiatement dans votre navigateur par défaut (Chrome, Firefox, Edge, Safari, etc.).
3. **Aucune installation, aucun serveur, aucune connexion internet requise.** Vous pouvez même copier ou envoyer ce seul fichier `index.html` par email ou clé USB !

---

## ✨ Fonctionnalités

* **Règles officielles DCC (VF) :**
  * Tirage des 6 caractéristiques ($3d6$ dans l'ordre) avec les modificateurs DCC ($-3$ à $+3$).
  * Table complète des Métiers ($d100$) : arme de départ, dés de dégâts, et marchandises insolites (mouton, sac de navets, fiente d'aisance séchée...).
  * Table des Augures de Naissance / Chance ($d30$) avec calcul automatique des bonus impactés (PV si Résurrection, CA si Étoile du berger, etc.).
  * Équipement de départ aventurier ($d24$).
  * Points de vie de départ ($1d4 + \text{mod. END}$, min 1) et pièces de cuivre ($5d12$ pc).
  * Bourse en cuivre (PC), argent (PA), or (PO), électrum (PE) et platine (PP), avec ajout et retrait des pièces.
  * Jets de sauvegarde (Réflexes, Vigueur, Volonté).
* **Génération en lot :**
  * Bouton **+1 Paysan**
  * Bouton **Escouade (4)** : pour les 4 paysans d'un joueur.
  * Bouton **Table entière (16)** : pour équiper une table de 4 joueurs instantanément.
* **Fiche interactive en direct autour de la table :**
  * Suivi des PV en temps réel avec boutons `+` et `-`.
  * Suivi manuel de la Chance actuelle et initiale, avec dépense et restauration plafonnée au score initial.
  * Statut du personnage (*Vivant*, *Blessé*, *Mort 💀*).
  * Jets de dés intégrés en 1 clic : cliquez sur n'importe quelle caractéristique, sauvegarde, initiative ou arme pour lancer les dés en direct avec détection des **Coups Critiques (20 naturel)** et des **Maladresses (1 naturel)** !
  * Catalogue d'astuces contextuelles, renouvelées après chaque action sur une fiche.
* **Chaîne de dés DCC intégrée :**
  * Lanceur de dés avec tous les dés bizarres de DCC : $d3, d4, d5, d6, d7, d8, d10, d12, d14, d16, d20, d24, d30, d100$.
* **Impression & PDF optimisés (4 par page A4) :**
  * Cliquez sur **Imprimer / PDF** (ou `Ctrl+P`) : la mise en page passe automatiquement en noir et blanc haute lisibilité, formatée en grille $2 \times 2$ prête à découper, sans les boutons de l'interface web.
* **Sauvegarde & Persistance :**
  * Sauvegarde automatique dans le navigateur (`LocalStorage`).
  * Boutons d'export et d'import au format **JSON**.

## 📝 Notes partagées (conçues, à implémenter)

Un espace **Notes** est spécifié pour permettre aux participants d'une partie de rédiger et consulter des notes partagées. La fonctionnalité n'est pas encore disponible dans l'application.

La conception prévoit des comptes personnels, des parties avec code d'invitation, une liste triable et filtrable, un éditeur WYSIWYG stockant le contenu en Markdown, ainsi que des règles de visibilité et d'édition configurables. L'architecture envisagée utilise GUN/SEA et la synchronisation pair-à-pair depuis une page hébergée sur GitHub Pages.

Cette future fonctionnalité nécessitera une connexion Internet et dépendra de la présence de pairs joignables. Les règles de confidentialité seront appliquées par l'application cliente, sans chiffrement de bout en bout : elles ne constituent pas une garantie contre un participant techniquement averti. Les comptes n'auront pas de récupération de mot de passe, et les notes supprimées peuvent rester sur des appareils hors ligne jusqu'à leur reconnexion.

Consulter les documents de conception :

* [Conception fonctionnelle des Notes](conception-fonctionnelle-notes.md)
* [Conception technique des Notes](conception-technique-notes.md)

---

## 📁 Organisation

* **`index.html`** : **Le fichier principal tout-en-un** (contient le HTML + le CSS + le JavaScript). C'est le seul fichier dont vous avez besoin au quotidien !
* **`conception-fonctionnelle-notes.md`** et **`conception-technique-notes.md`** : documents de conception validés pour la future fonctionnalité de prise de notes partagées.
