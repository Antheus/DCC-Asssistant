# ⚔️ DCC RPG - Générateur d'Entonnoir (Niveaux 0 à 10)

Application web **100% autonome dans un seul fichier** pour créer et gérer des personnages de **Niveau 0**, puis des **aventuriers de niveau 1 à 10**, pour le jeu de rôle **Dungeon Crawl Classics** (DCC RPG) en français.

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
  * Choix de l’arme parmi les 23 armes de la table 3-1; les jets d’attaque, les dégâts et l’initiative à deux mains sont adaptés.
  * Statut du personnage (*Vivant*, *Blessé*, *Mort 💀*).
  * Jets de dés intégrés en 1 clic : cliquez sur n'importe quelle caractéristique, sauvegarde, initiative ou arme pour lancer les dés en direct avec détection des **Coups Critiques (20 naturel)** et des **Maladresses (1 naturel)** !
  * Catalogue d'astuces contextuelles, renouvelées après chaque action sur une fiche.
* **Chaîne de dés DCC intégrée :**
  * Lanceur de dés avec tous les dés bizarres de DCC : $d3, d4, d5, d6, d7, d8, d10, d12, d14, d16, d20, d24, d30, d100$.
* **Impression & PDF optimisés :**
  * Cliquez sur **Imprimer / PDF** (ou `Ctrl+P`) : seul l'onglet actif est imprimé, en noir et blanc haute lisibilité, sans les boutons de l'interface web.
  * Onglet **Niveau 0** : 4 fiches par page A4 (grille $2 \times 2$ prête à découper).
  * Onglet **Aventuriers** : 2 fiches par page A4 (grille $1 \times 2$) ; les blocs de classe restent lisibles.
* **Sauvegarde & Persistance :**
  * Sauvegarde automatique dans le navigateur (`LocalStorage`).
  * Boutons d'export et d'import au format **JSON** (l'import **fusionne** avec les fiches existantes, voir plus bas).

## 🛡️ Aventuriers (niveaux 1 à 10)

Les survivants de l'entonnoir peuvent devenir de vrais aventuriers.

* **Onglets :** **Niveau 0** (les paysans) et **Aventuriers** (niveau 1 et plus). Chaque onglet affiche son effectif ; l'impression suit l'onglet actif.
* **Assistant de passage de niveau :** un personnage de niveau 0 avec **10 PX** peut passer niveau 1 (bouton ⬆ sur sa fiche), puis chaque niveau suivant jusqu'au 10 selon la table des PX. L'assistant guide les choix : classe (selon la race et l'alignement), dieu du clerc, voie du voleur, sorts du clerc **choisis** (sans tirage), sorts du mage et de l'elfe **tirés au hasard** (la liste reste éditable à la main sur la fiche), puis le jet de points de vie. Tous les tirages sont affichés avec leur détail (dé, résultat brut, modificateurs). Aucun personnage mort ou agonisant ne peut monter de niveau.
* **Fiche d'aventurier :** dés d'action multiples, bonus d'attaque, dé de haut fait et table des coups critiques propres à la classe, jets de sauvegarde, initiative, Chance (brûler de la Chance), armure et bouclier, PX, PV (avec l'historique des dés de PV en infobulle) et titre libre à partir du niveau 6.
* **Fonctionnalités par classe :**
  * **Guerrier** : dé de haut fait d'armes, critique 19-20, initiative + niveau, arme fétiche de Chance, critiques et maladresses propres.
  * **Nain** : dé de haut fait d'armes, coup de bouclier, infravision 18 m, talents souterrains.
  * **Halfelin** : combat à deux armes, don de Chance aux alliés, +2 par point de Chance brûlé.
  * **Voleur** : compétences (outils de voleur), voie d'allégeance, dé de Chance supplémentaire par point brûlé.
  * **Clerc** : sorts, renvoi des impies, imposition des mains, aide divine, sacrifice, plage de défaveur et table de défaveur.
  * **Mage** : sorts connus, lancement avec le dé d'incantation, magie mercurielle, patron, familier, corruption, brûlesort.
  * **Elfe** : sorts de mage, sort fétiche, capacités raciales (immunité au sommeil, infravision, détection des passages secrets).
* **Agonie et mort :** à 0 PV un aventurier est *agonisant* (bouton « Round suivant ») ; tout gain de PV le sauve (avec −1 END définitif). Une fois mort, le bouton **Récupérer le corps** tente la récupération (test de Chance, une seule tentative). Le statut *Étourdi* (−4 aux jets) se lève par un bouton dédié.
* **Nouvelle journée :** un bouton ☀ restaure la plage de défaveur, les sorts perdus, le brûlesort et la Chance quand les règles le prévoient.
* **Import fusionné :** importer une sauvegarde **ajoute** les fiches nouvelles et, pour une fiche de même `id`, demande confirmation avant de l'écraser. Les anciennes sauvegardes (niveau 0 uniquement) se chargent sans migration : tout apparaît dans l'onglet Niveau 0.

**Limites :**

* L'effet des sorts n'est pas décrit dans l'application : il se lit dans le livre, à la page indiquée sur la fiche.
* Il n'existe pas de bouton « tout effacer » : supprimez les fiches une par une avec 🗑️.
* Si la sauvegarde du navigateur est illisible ou invalide, une copie du contenu est conservée sous la clé `dcc_rpg_funnel_roster_v2_backup` du `LocalStorage` (la clé principale est `dcc_rpg_funnel_roster_v2`).

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
* **`tests/`** : tests des règles (`node --test tests/*.test.mjs`), réservés au développement.
* **`conception-fonctionnelle-notes.md`** et **`conception-technique-notes.md`** : documents de conception validés pour la future fonctionnalité de prise de notes partagées.
