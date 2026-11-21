# Conception : personnages de niveau 1 à 10

**Statut :** à valider par le demandeur (questions de relecture tranchées)
**Date :** 2026-11-19
**Source des règles :** `Dungeon Crawl Classics - Francais.md` (numéros de ligne entre crochets). Ne jamais utiliser le PDF.

## 1. Intention

L'application gère aujourd'hui l'entonnoir de niveau 0. Les survivants doivent pouvoir devenir des aventuriers de classe, et le juge comme les joueurs doivent pouvoir jouer ces personnages du niveau 1 au niveau 10 depuis la même application : fiches interactives, jets en un clic, règles de classe appliquées automatiquement.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Deux onglets : **Niveau 0** (l'entonnoir actuel) et **Aventuriers** (niveau ≥ 1).
- Bouton « Passer au niveau 1 » sur les fiches de niveau 0, actif uniquement si le personnage est vivant et a **≥ 10 PX** (choix du demandeur). Il ouvre un assistant à étapes.
- Bouton « Niveau suivant » sur les fiches d'aventurier, actif quand les PX atteignent le seuil de la table 1-4 [1034-1051] : 50, 110, 190, 290, 410, 550, 710, 890, 1090. Il ouvre le même assistant en mode « progression ».
- Fiche d'aventurier spécifique à chaque classe : les 7 classes (Clerc, Guerrier, Mage, Voleur, Elfe, Halfelin, Nain), niveaux 1 à 10, avec toutes les règles de classe.
- Magie selon l'**option A** (choix du demandeur) : sorts connus, test d'incantation, perte du sort, défaveur, corruption, maladresse et magie mercurielle. L'effet détaillé de chaque sort reste à lire dans le livre ; la fiche affiche le nom du sort et sa **page dans le livre imprimé** (numéros fournis par les tables 5-8, 5-9 et 5-10 [6952-7093]).

**Non-objectifs**
- Le texte des effets de chaque sort (tables de résultats par sort).
- Les résultats des sorts *invoquer un patron* et *appel de familier*, ainsi que le contenu des souillures de patron. On n'enregistre que le patron lié.
- Les tables de hauts faits d'armes (on ne fait que le jet et l'indication de réussite, ≥ 3 et touché).
- Les tables critiques des monstres, les duels arcaniques et les rituels.
- Les niveaux au-delà de 10.

**Anti-objectifs** (un échec même si « ça marche »)
- Casser la fiche de niveau 0 ou les sauvegardes existantes (localStorage `dcc_rpg_funnel_roster_v2` et JSON exportés).
- Sortir du fichier unique `index.html`, ou ajouter un build ou une dépendance npm.
- Modifier silencieusement une valeur de règle sans que l'utilisateur voie le jet (tout tirage aléatoire est affiché avec son détail).

## 3. Contraintes

- Tout reste dans `index.html` (HTML/CSS/JS en ligne, IIFE existante). Aucune nouvelle dépendance.
- Validation après chaque étape : vérification de syntaxe JS et HTML (commandes de `.agents/AGENTS.md`).
- Interface et textes en français, ton et style visuel identiques à l'existant (parchemin, Cinzel/MedievalSharp, tokens CSS `:root`).
- L'impression `@media print` doit continuer à fonctionner. On imprime l'onglet actif.

## 4. Approches envisagées

| Approche | Principe | Compromis |
|---|---|---|
| **A. Classes décrites par des données + fiche dédiée (retenue)** | Une table `CLASSES` décrit chaque classe : progression 1-10, dé de vie, armes, titres, capacités. `createAdventurerCard()` affiche l'en-tête commun puis un bloc propre à la classe. Une seule modale d'assistant sert pour le niveau 1 et la progression. | Plus de structure initiale. Les tables de règles sont corrigeables à un seul endroit, et les 10 niveaux sont couverts par les données. |
| B. Branches `if (level > 0)` dans `createCharacterCard` | Réutiliser la fiche existante (≈ 330 lignes). | Moins de code au départ, mais une fonction illisible avec 7 classes et un risque de régression sur le niveau 0. |

Le demandeur a choisi **A**. Toute approche sans fichier unique est exclue par les contraintes du projet.

## 5. Interface

### 5.1 Onglets
- Barre d'onglets sous la barre de dés : `Niveau 0 (n)` et `Aventuriers (n)`, avec les compteurs. L'onglet actif est mémorisé dans localStorage (`dcc_active_tab`, avec try/catch).
- Onglet **Niveau 0** : en-tête, boutons de génération, compteurs « recrues / encore en vie » et état vide inchangés. Il ne liste que les personnages avec `level === 0`.
- Onglet **Aventuriers** : liste `level >= 1`. Les boutons de génération y sont masqués. Sauvegarder, Importer et Imprimer restent communs.
  - État vide : « Aucun aventurier : un survivant avec 10 PX peut passer au niveau 1 depuis l'onglet Niveau 0. »
- **Le bouton Vider (🗑️, `btnClearAll`) est supprimé** (choix du demandeur), ainsi que son code (élément, référence et écouteur). La suppression se fait fiche par fiche, avec le bouton existant de chaque carte.
- Après validation du passage au niveau 1, on bascule automatiquement sur l'onglet Aventuriers et on fait défiler jusqu'à la fiche.

### 5.2 Bouton sur la fiche de niveau 0
- « ⬆ Niveau 1 », affiché dans la zone d'actions de la carte.
- Désactivé, avec une infobulle explicative, si le personnage est mort ou a < 10 PX.

### 5.3 Assistant (modale à étapes)

Modale réutilisant le style de `#dice-modal`, avec navigation Précédent/Suivant/Annuler. Rien n'est enregistré avant « Valider ». Annuler abandonne tous les tirages ; rouvrir l'assistant relance tout (*mon choix* : les dés sont lancés à l'étape où ils apparaissent et restent figés tant que la modale est ouverte, sans bouton « relancer »).

**Mode niveau 1** :
1. **Classe**
   - Cartes des classes autorisées. Si `race` est Nain, Elfe ou Halfelin, une seule classe est possible, celle de la race [1059-1063]. Si `race` est Humain : Clerc, Guerrier, Mage, Voleur.
   - Chaque carte rappelle le dé de vie, les armes et 2-3 capacités clés.
2. **Choix de classe** (selon la classe, voir §7) :
   - Clerc : dieu.
   - Guerrier et Nain : arme fétiche de Chance.
   - Mage et Elfe : sorts aléatoires et magie mercurielle.
   - Elfe : sort fétiche de Chance.
   - Voleur : voie (déduite de l'alignement, affichée).
   - Halfelin : rien à choisir.
3. **Points de vie** : lancer `dé de vie + mod. END` (minimum 1) [419-427], afficher le détail et le nouveau total. Le gain s'ajoute à `maxHp` **et** à `currentHp`.
4. **Langues** : tirages supplémentaires selon la classe (§7), via `rollAdditionalLanguage` existant.
5. **Récapitulatif** : avant/après (titre, PV, attaque, sauvegardes, CA, armes maîtrisées, alertes), puis **Valider**.

**Alertes** du récapitulatif (non bloquantes) :
- l'arme actuelle n'est pas maîtrisée par la classe (le dé d'action sera dégradé) ;
- l'armure gêne l'incantation (mage, elfe) ;
- voleur sans outils ;
- le métier ne donnait pas de race semi-humaine, etc.

**Mode progression** (niveau N → N+1) :
1. PV.
2. Nouveautés de la table de classe : bonus, dés, sauvegardes, titre, compétences.
3. Nouveaux sorts : mage et elfe tirent les sorts gagnés + magie mercurielle ; le clerc choisit ses nouveaux sorts.
4. Récapitulatif.

### 5.4 Agonie et mort des aventuriers (choix du demandeur : gestion complète)

Règles [4560-4605]. Le niveau 0 ne change pas : 0 PV = mort.

- **Agonisant** : un aventurier qui tombe à 0 PV ou moins prend le statut « Agonisant (N rounds) », avec N = niveau. `currentHp` est ramené à 0 ; on stocke `dying: { roundsLeft: N }`.
- Bouton **« Round suivant »** : décrémente `roundsLeft`. À 0, le statut devient « Mort 💀 » et on stocke `dead: { at: ISO }`.
- **Sauvé** : tout gain de PV (bouton + ou soin) pendant l'agonie remet le personnage à 0 + gain. On retire alors **1 point d'Endurance définitif** (`stats.stamina.score − 1`, modificateur recalculé) et on ajoute une note « cicatrice » dans `classData.scars`. Le toast l'annonce.
- **Récupérer le corps** : bouton sur un aventurier mort. Test de Chance : d20 ≤ score de Chance actuel [512-517].
  - Réussite : le personnage revient à **1 PV**, statut « Groggy » (−4 à tous les jets pendant 1 heure, rappelé sur la fiche ; un bouton efface le statut) et **perte définitive de 1 point** de Force, Agilité ou Endurance, tirée au hasard et annoncée [4598-4610].
  - Échec : il est définitivement mort et le bouton disparaît.
- Les compteurs « encore en vie » comptent les agonisants comme vivants. Ni un mort ni un agonisant ne peut monter de niveau, et aucun des deux ne peut être ciblé par le « Donner de la Chance » du halfelin.

### 5.5 Import JSON (choix du demandeur : fusion par identifiant)

- Les personnages importés dont l'`id` est absent du roster sont **ajoutés**.
- Pour ceux dont l'`id` existe déjà : une seule confirmation liste leurs noms (« Écraser N fiche(s) existante(s) ? »). Oui : on les remplace. Non : on les ignore et on n'ajoute que les nouveaux.
- Rien n'est supprimé par un import.
- Le fichier entier est validé avant toute modification (normalisation §6). Une erreur annule tout l'import.
- Le toast final résume : X ajoutés, Y remplacés, Z ignorés.

## 6. Modèle de données

Les personnages restent dans le même tableau `this.characters` et la même clé localStorage. C'est `level` qui détermine l'onglet. Les champs existants ne changent pas.

Champs ajoutés aux personnages de niveau ≥ 1 :

```js
{
  level: 1,                       // 1..10
  className: 'cleric' | 'warrior' | 'wizard' | 'thief' | 'elf' | 'halfling' | 'dwarf',
  hpHistory: [                    // traçabilité de chaque gain de PV
    { level: 0, die: 'd4', roll: 3, mod: 1, gain: 4 },  // construit depuis hpBaseRoll au passage au niveau 1
    { level: 1, die: 'd8', roll: 5, mod: 1, gain: 6 }
  ],
  classData: { /* spécifique, voir §7 */ },
  daily: {                        // état « journée », remis à zéro par « Nouvelle journée »
    disapprovalRange: 1,          // clerc
    lostSpells: [],               // ids de sorts perdus (mage/elfe)
    spellburn: { strength: 0, agility: 0, stamina: 0 }  // points brûlés non récupérés
  },
  levelHistory: [ { level: 1, date: ISO, summary: '...' } ]
}
```

- Les valeurs calculées (bonus d'attaque, sauvegardes, CA, initiative, dé critique, titre…) **ne sont pas stockées** : elles sont recalculées à l'affichage depuis `CLASSES[className].levels[level-1]` et les caractéristiques. Exception : les champs de niveau 0 existants (`saves`, `attack`, `initiative`), conservés tels quels pour le niveau 0.
- Les caractéristiques réduites par brûlesort : `stats.X.score` reste le score de base ; le score effectif vaut `score − daily.spellburn.X`. Le modificateur affiché et utilisé dans les jets est calculé sur le score effectif.
- **Normalisation au chargement et à l'import** : un personnage sans `className` est de niveau 0 ; `level ≥ 1` exige un `className` valide et des `classData` cohérentes, sinon on affiche une erreur explicite (même style que les validations actuelles). Les anciennes sauvegardes, toutes de niveau 0, restent valides sans migration.

## 7. Règles par classe

### 7.0 Règles communes aux aventuriers

- **Bonus d'attaque** :
  - fixe pour la plupart des classes ;
  - **dé de haut fait** pour le guerrier et le nain, lancé à chaque attaque et ajouté au toucher **et** aux dégâts [1617-1629].
- **Jet d'attaque** :
  - **dé d'action** + bonus de classe + mod. FOR (mêlée) ou AGI (distance) + augure applicable ;
  - **dé dégradé d'un cran** si l'arme n'est pas maîtrisée [1082-1086, 3366] ;
  - dégâts : dé de l'arme + mod. FOR (mêlée) + augures + dé de haut fait le cas échéant.
- **Dés d'action multiples** (niveau 5 et plus, par exemple 1d20+1d14) : la fiche affiche un bouton par dé d'action. Les classes dont le 2e dé est réservé à l'incantation (mage) ne l'affichent qu'en incantation [1923-1930].
- **Critique** :
  - 20 naturel, ou la plage de la classe si l'attaque touche [3496-3507] ;
  - jet du **dé critique de la classe + mod. Chance** sur la table de la classe (I à V), avec le texte du résultat affiché ;
  - si le dé d'action dépasse le d20, critique sur le maximum ;
  - le résultat « touché ? » est laissé au joueur : le toast indique « critique si l'attaque touche » pour les plages élargies.
- **Maladresse** :
  - 1 naturel : dé de maladresse de l'armure (le pire avec le bouclier, comme aujourd'hui) **− mod. Chance** sur la table 4-2, texte affiché ;
  - guerrier et nain : bouton « Brûler 1 Chance pour annuler la maladresse » [3420-3423].
- **Sauvegardes** : bonus de classe + mod. caractéristique + augure (la logique de `getSaveTooltip` est réutilisée).
- **Augure de naissance** :
  - le modificateur reste **celui du niveau 0, figé** [478-498] ;
  - les augures liés aux classes s'appliquent automatiquement : 10 (compétences), 11 (pièges), 13 (tests d'incantation), 14 (dégâts des sorts : affiché seulement), 15 (repousser les impies), 16 (soins), 24 (initiative), 26/28 (critiques/maladresses doublés), 27 (corruption), 29 (langues).
- **Initiative** : d20 (ou dé de l'arme à deux mains) + mod. AGI + augure 24 + **niveau pour le guerrier** [1685-1687].
- **Titre** :
  - niveaux 1-5 par classe et alignement (tables 1-6, 1-8, 1-10, 1-12, 1-15, 1-17, 1-19) ;
  - à partir du niveau 6, champ libre éditable [1118-1121].
- **Chance brûlée** : bouton existant, généralisé avec la règle de classe :
  - +1 par point ;
  - voleur : +1 dé de chance par point ;
  - halfelin : +2 par point.
- **Nouvelle journée** : bouton par fiche d'aventurier. Il :
  - remet la plage de défaveur à 1 ;
  - restaure les sorts perdus ;
  - récupère 1 point de brûlesort par caractéristique **si aucun brûlesort ce jour-là** (*mon choix* : on récupère 1 point par jour et par caractéristique brûlée, la case « brûlesort aujourd'hui » étant gérée par un drapeau `daily.spellburnToday`) ;
  - restaure la Chance du voleur et du halfelin de `niveau` points, plafonnée à `initialScore`.
- **Langues** : ajout au passage au niveau 1 seulement [598-616, 31709-31731].

### 7.1 Clerc [1123-1582]

- **Dé de vie** : d8.
- **Progression** : table 1-5 [1476-1487], critique table III.
- **Dieu** : choisi dans l'assistant parmi les dieux de l'alignement [1507-1582]. Le dieu détermine les **armes maîtrisées** (liste par alignement) et les créatures impies (affichées). Stocké dans `classData.deity`.
- **Armures** : sans pénalité d'incantation.
- **Sorts connus** :
  - nombre par niveau de sort selon la table 1-5 ;
  - **choisis librement** par le joueur dans l'assistant parmi la liste des sorts de clerc, sans tirage aléatoire (choix du demandeur ; le livre ne précise pas le mode d'acquisition [1217-1222]) ;
  - stockés dans `classData.spells = [{ id, level }]`.
- **Test d'incantation** :
  - 1d20 + mod. PER + NI (+ augure 13), comparé à 10 + 2 × niveau du sort ;
  - un échec augmente `daily.disapprovalRange` de 1 ;
  - un résultat naturel ≤ plage déclenche la **défaveur** : échec automatique + jet de `n` d4 (n = résultat naturel) − mod. Chance sur la **table 5-7** (texte intégré) [1238-1309, 6573-6690] ;
  - 20 naturel : bonus = NI, signalé.
- **Sacrifice** : saisie d'un montant en po ; 50 po = −1 sur la plage, minimum 1 [1311-1336]. *Mon choix* : on ne débite pas automatiquement la bourse ; le bouton propose de débiter.
- **Repousser les impies** :
  - 1d20 + PER + NI + mod. Chance (+ augure 15) ;
  - résultat lu sur la **table 4-4** (intégrée) et affiché par colonne de DV ;
  - un échec augmente la plage de défaveur [4896-5011].
- **Imposition des mains** :
  - test 1d20 + PER + NI (+ augure 16) ;
  - le joueur choisit l'alignement de la cible (identique, adjacent, opposé) ; le nombre de dés est lu dans la table [1348-1448] ;
  - le toast indique « soigne N dés du type du dé de vie de la cible (plafonnés à ses DV) » ;
  - un échec augmente la plage de défaveur.
- **Aide divine** : test d'incantation avec DD saisi ; plage de défaveur +10 cumulatif [1449-1469].
- **Langues** : aucune.

### 7.2 Guerrier [1584-1774]

- **Dé de vie** : d12.
- **Progression** : table 1-7 [1750-1766].
- **Armes maîtrisées** [1596-1603] (« hache » = hachette, hallebarde = arme d'hast).
- **Dé de haut fait** : d3 → d10+4, ajouté à l'attaque et aux dégâts.
  - Bouton « Attaque avec haut fait d'armes » : même jet, et le toast indique « Haut fait réussi si dé de haut fait ≥ 3 et l'attaque touche » [1641-1672].
- **Critique** :
  - 19-20 aux niveaux 1-4, 18-20 aux niveaux 5-8, 17-20 aux niveaux 9-10 ;
  - plage perdue en combat à deux armes.
- **Initiative** : + niveau.
- **Arme fétiche** : type d'arme choisi au niveau 1 parmi la table 3-1. Le mod. Chance figé s'ajoute aux **jets d'attaque** avec ce type [1689-1696]. Stocké dans `classData.luckyWeapon`.
- **Maladresse** : peut brûler 1 Chance pour l'annuler.
- **Langues** : aucune.

### 7.3 Mage [1776-1952, 5607-6765]

- **Dé de vie** : d4.
- **Progression** : table 1-9 [1932-1943], critique table I.
- **Armes** : arc court, arc long, bâton, dague, épée courte, épée longue.
- **Armure** : sa pénalité s'ajoute aux tests d'incantation.
- **Sorts connus** :
  - nombre de la table 1-9 + modificateur d'INT (table 1-1 : INT 3 → 0 sort, 4-5 → −2, 6-7 → −1, 14-15 → +1, 16+ → +2 ; minimum 1 sauf INT 3) ;
  - niveau de sort maximum = min(table 1-9, plafond d'INT) [456-476] ;
  - dans l'assistant, pour chaque nouveau sort : choisir le niveau (≤ max), puis tirage aléatoire dans la liste de ce niveau (table 5-8), doublons retirés ;
  - notes de la table 5-8 :
    - un sort de clerc tiré (*) donne −2 au test ;
    - *lier un patron* ou *invoquer un patron* (**) donne les deux ;
    - « sort de patron » (***) est ignoré sans *lier un patron* ;
  - **tirage aléatoire obligatoire** (choix du demandeur) : ni l'option du livre permettant de remplacer jusqu'à 2 sorts au niveau 1 [6758-6764], ni le choix d'un sort trouvé dans une « source » [6731-6738] ne sont proposés. Le juge peut toujours corriger la liste à la main (voir ci-dessous) ;
  - la liste des sorts connus reste **éditable manuellement** sur la fiche (ajout et retrait d'un sort, avec son tirage de magie mercurielle à l'ajout), pour les sorts appris en jeu (grimoires, parchemins [20887-20930]).
- **Magie mercurielle** :
  - un d100 + mod. Chance × 10 par sort appris, lu sur la **table 5-2** (texte intégré) [5918-6358] ;
  - 99 et 00 : relancer deux fois (00 : 4d20 + Chance × 10) ;
  - stocké avec le sort ;
  - si l'effet change le dé du test (02, 05, 35, 96, 98…), le dé est stocké dans `spell.castDie` (*mon choix* : seul l'effet sur le dé est automatisé, le reste est un texte affiché).
- **Test d'incantation** :
  - dé (d20 ou `castDie`) + mod. INT + NI + pénalité d'armure (+ augure 13) + brûlesort saisi avant le jet ;
  - **résultat < 12** : sort **perdu** pour la journée, ajouté à `daily.lostSpells` ;
  - **12 ≤ résultat < DD** (sorts de niveau 2 et plus) : échec, mais le sort n'est pas perdu ;
  - **≥ DD** : réussite (lire la table du sort, ligne indiquée) ;
  - DD = 10 + 2 × niveau du sort. ⚠ Les sorts de mage de niveau 4-5 réussissent dès 18 dans leurs tables [16429] : le DD est donc stocké **par niveau de sort** dans les données (12/14/16/18/18 pour le mage, 12/14/16/18/20 pour le clerc) ;
  - un sort perdu reste lançable par brûlesort d'un nombre de points égal à son niveau [5785-5797].
- **1 naturel** :
  - échec + **corruption** : 1d10 − niveau du sort + mod. Chance (+ augure 27) ;
  - corruption mineure, majeure ou supérieure selon un sélecteur (le livre renvoie à la table du sort) ; tables 5-3, 5-4, 5-5 intégrées [6379-6520] ;
  - bouton « Brûler 1 Chance pour éviter la corruption » [6375-6378] ;
  - si un brûlesort était engagé : en plus, −1 permanent sur une caractéristique brûlée (choix de l'utilisateur) [5798-5804] ;
  - la corruption obtenue est ajoutée à `classData.corruptions` (liste de textes éditables).
- **Brûlesort** : saisie FOR, AGI, END avant le jet ; +1 par point ; 20 points = 20 naturel ; le score effectif baisse jusqu'à récupération.
- **Patron** : champ `classData.patron` (liste des patrons [1890-1901]), renseigné quand *lier un patron* réussit ; le test de ce sort propose la sélection.
- **Familier** : champ texte libre.
- **Dé d'action** : au niveau 5 et plus, le 2e dé n'est utilisable que pour l'incantation.
- **Langues** : +1 langue aléatoire par point de mod. INT positif [31716-31721].

### 7.4 Voleur [1954-2281]

- **Dé de vie** : d6.
- **Progression** : table 1-11 [2204-2215], critique table II.
- **Armes** : arbalète, bâton, dague, épée courte, épée longue, fléchette, fronde, garrot, matraque, sarbacane.
  - Garrot, matraque et sarbacane sont absents de la table 3-1 actuelle : **à ajouter aux données d'armes** (dégâts et seconds dégâts en attaque sournoise d'après [2996-3025]).
- **Voie** selon l'alignement : Loyal = Boss, Chaotique = Assassin, Neutre = Escroc. Table 1-13 complète intégrée (les 3 colonnes de valeurs).
- **Compétences** : une ligne cliquable par compétence, d20 + bonus de voie + mod. caractéristique (* AGI, † INT, ‡ PER, sans marque : aucun) + augure 10 (et 11 pour les pièges).
  - Pénalité d'armure ajoutée à : Déplacement silencieux, Se cacher dans l'ombre, Escalader, Vol à la tire, Crocheter, Désamorcer (*mon choix* : compétences physiques et de dextérité, le livre ne donnant que « activités similaires »).
  - Le toast rappelle les DD indicatifs de la compétence [2055-2177].
  - **Désamorcer** : sur un 1 naturel, le toast indique que le piège se déclenche.
  - **Incanter avec un parchemin** : dé de la table 1-13 + mod. INT, pas de brûlesort.
  - **Attaque sournoise** : bouton dédié, attaque + bonus ; si elle touche, critique automatique (dé critique de la classe, table II). Les armes à seconds dégâts utilisent ceux-ci.
- **Outils de voleur** : case à cocher ; si décochée, les compétences qui en ont besoin sont marquées « outils requis » (jet autorisé, avertissement).
- **Brûler la Chance** : chaque point ajoute **un dé de chance** (d3 → d16).
- **Récupération** : la Chance remonte de `niveau` points par Nouvelle journée.
- **Langues** : argot des voleurs ajouté automatiquement.

### 7.5 Elfe [2290-2422]

- **Dé de vie** : d6.
- **Progression** : table 1-14, critique table II.
- **Armes** : arc court, arc long, bâton, dague, épée à deux mains, épée courte, épée longue, javelot, lance.
- **Magie** :
  - comme le mage (aléatoire, mercurielle, corruption, brûlesort, pénalité d'armure) ;
  - nombre de sorts selon la table 1-14 ± INT ;
  - reçoit **en plus** *lier un patron* et *invoquer un patron* au niveau 1 [2342-2346].
- **Sort fétiche** : le mod. Chance figé s'ajoute aux tests de ce sort, choisi dans l'assistant [2363-2370].
- **Mithril** : à l'assistant de niveau 1, case « armure en mithril » (une pièce d'armure gratuite). *Mon choix* : une armure en mithril a la même CA et **la moitié de la pénalité** (arrondie vers zéro), faute de valeur chiffrée [2307-2316, 2966].
- **Capacités affichées** : infravision 18 m ; immunité au sommeil magique et à la paralysie ; vulnérabilité au fer (1 dégât par jour de contact) ; +4 et détection automatique des passages secrets à moins de 3 m.
  - Bouton « Chercher un passage secret » (d20 + INT + 4) (*mon choix* : le livre ne nomme pas la caractéristique ; INT par cohérence avec les autres tests de perception).
- **Langues** : commun, elfique, 1 autre + 1 par point de mod. INT. Les langues de niveau 0 sont conservées ; l'assistant ajoute celles qui manquent.

### 7.6 Halfelin [2424-2587]

- **Dé de vie** : d6.
- **Progression** : table 1-16, critique table III ; mouvement 6 m.
- **Armes** : arbalète, arc court, bâton, dague, épée courte, fronde, gourdin, hachette, javelot.
- **Combat à deux armes** : case « deux armes » (arme secondaire choisie parmi les armes à une main de taille égale).
  - Les deux attaques utilisent le dé d'action dégradé selon AGI (minimum 16 traité : −1d sur chaque).
  - Critique et réussite automatique sur un **16 naturel**.
  - Maladresse seulement si **les deux** dés font 1.
  - Le bonus d'attaque de classe s'applique aux deux attaques, à tout Agilité (décision utilisateur).
  - Si AGI > 16, on applique la table 4-3 normale.
- **Discrétion** : Déplacement silencieux et Se cacher dans l'ombre avec le bonus de la table 1-16 + AGI (+ pénalité d'armure).
- **Porte-bonheur** :
  - brûler la Chance donne **+2 par point** ;
  - récupère `niveau` points par Nouvelle journée ;
  - bouton « Donner de la Chance à un allié » : choix d'un aventurier vivant du roster, retire N points au halfelin et affiche « +2N au prochain jet de X » (*mon choix* : le bonus n'est pas stocké sur l'allié, juste annoncé) ;
  - règle « un seul halfelin porte-bonheur par groupe » rappelée en infobulle.
- **Capacités affichées** : infravision 9 m, petite taille.
- **Langues** : commun, halfelin + 1 par point de mod. INT.

### 7.7 Nain [2589-2761]

- **Dé de vie** : d10.
- **Progression** : table 1-18, critique III → IV → V ; mouvement 6 m.
- **Armes** : dague, épée à deux mains, épée longue, épée courte, gourdin, hachette, hache de bataille, lance, marteau de guerre, masse, arbalète, arc court, fronde, javelot.
- **Dé de haut fait** et **haut fait d'armes** comme le guerrier.
- **Arme fétiche** comme le guerrier.
- **Brûler 1 Chance contre une maladresse.**
- **Coup de bouclier** : si un bouclier est équipé, bouton d'attaque secondaire **d14 + dé de haut fait**, dégâts 1d3, un par round [2670-2687].
- **Talents souterrains** :
  - bouton « Détecter (sous terre) » : d20 + niveau ;
  - odorat de l'or et des gemmes rappelé en texte (30 m / 12 m).
- **Capacités affichées** : infravision 18 m.
- **Langues** : commun, nain, 1 aléatoire + 1 par point de mod. INT.

## 8. Données à intégrer (section DATA)

| Donnée | Source | Taille estimée |
|---|---|---|
| `CLASSES` : progression 1-10, titres, armes, dé de vie, DD par niveau de sort | tables 1-5 à 1-19 | ~400 lignes JS |
| Table 1-13 compétences voleur (3 voies) | [2227-2281] | ~60 |
| Dieux par alignement, armes et impies | [1507-1582] | ~40 |
| Listes de sorts mage (niv. 1-5), clerc (niv. 1-5), sorts de patron (avec numéro de page), liste des patrons | tables 5-8 à 5-10 [6952-7093], patrons [1890-1901] | ~150 |
| Table 4-2 Maladresses | [3436-3479] | ~20 |
| Tables critiques I à V | [3510-3951] (attention : titre **après** le contenu) | ~400 |
| Table 4-4 Repousser les impies | [4929-5011] | ~20 |
| Table imposition des mains | [1438-1448] | ~10 |
| Table 5-2 Magie mercurielle | [5946-6358] | ~250 |
| Tables 5-3, 5-4, 5-5 Corruption | [6379-6520] | ~120 |
| Table 5-7 Défaveur | [6582-6690] | ~100 |
| Armes garrot, matraque, sarbacane + second dé | [2996-3025] | ~5 |

Le fichier passerait d'environ 110 Ko à environ 350-450 Ko, ce qui reste raisonnable pour un fichier autonome. Le texte des tables est **recopié du livre** en corrigeant les artefacts d'OCR (blocs ```` ``` ```` parasites, lignes coupées), sans reformulation.

Niveau 0 : aujourd'hui, `rollAttack` annonce seulement « COUP CRITIQUE » ou « MALADRESSE » sans lire de table. Les tables étant désormais intégrées, le niveau 0 lira aussi la table I (1d4 + Chance) et la table 4-2. C'est le seul changement de comportement de l'onglet Niveau 0 (*mon choix*).

## 9. Impression

- On imprime l'onglet actif.
- La fiche d'aventurier en impression garde la grille 2×2 et masque tous les boutons.
- Les blocs de classe longs (compétences de voleur, sorts) peuvent faire passer une fiche sur une demi-page : on accepte une grille **1×2** (2 fiches par page) pour l'onglet Aventuriers (*mon choix*).

## 10. Vérification avant livraison

- Syntaxe JS et HTML (commandes AGENTS.md) après chaque étape.
- Test manuel dans le navigateur (`python3 -m http.server`), pour chaque classe :
  - passage au niveau 1 depuis un personnage de la bonne race ;
  - fiche affichée dans l'onglet Aventuriers ;
  - jets d'attaque, critique et maladresse ;
  - capacités de classe ;
  - montée jusqu'au niveau 10 (en ajoutant des PX) ; vérifier que les valeurs affichées suivent la table ;
  - Nouvelle journée.
- Rechargement de la page : état conservé. Export puis import JSON : identique.
- Import d'une ancienne sauvegarde de niveau 0 : aucune erreur, tout dans l'onglet Niveau 0.
- Impression des deux onglets.
- Contrôle croisé d'un échantillon des données transcrites avec le livre (une ligne par table).

## 11. Laissé au constructeur

- Découpage exact des fonctions de rendu et noms internes, tant qu'ils respectent §6.
- Présentation visuelle précise des blocs de classe, dans le style existant (skill `anti-ui-slop` disponible dans `.agents/skills/`).
- Ordre d'implémentation (proposé : onglets → modèle et migration → assistant niveau 1 → fiche commune → classes martiales → voleur et halfelin → magie → tables textes → progression → impression).
