# Conception fonctionnelle : Notes partagees

**Statut :** validee par le demandeur  
**Date :** 2026-11-11

## Objectif

Ajouter a l'application DCC un espace de notes de partie partagees, accessible depuis un nouvel onglet **Notes**, sans retirer les fiches de personnages.

## Participants et parties

- Les participants disposent d'un compte personnel identifie par un alias et un mot de passe.
- Un compte peut participer a plusieurs parties.
- Le createur d'une partie designe le MJ.
- Le MJ fournit un code d'invitation permanent aux joueurs.
- Le code ne peut pas etre revoque ni regenere dans la conception validee.

## Ecran Notes

- L'ecran presente une liste de notes a gauche et le detail de la note selectionnee a droite.
- Chaque ligne de la liste indique le titre, la date de la note et le nom de l'auteur.
- Le tri propose les dates les plus recentes d'abord ou les auteurs de A a Z.
- Un champ de recherche filtre les notes visibles par le participant en recherchant dans les titres et les contenus synchronises sur son appareil.
- Les notes archivees sont consultees dans une vue de corbeille distincte, personnelle a l'auteur.

## Creation et contenu

- Un bouton permet de creer une note avec un titre, une date et un corps de texte.
- La date est initialisee a la date et l'heure de creation. Elle est editable et sert a l'affichage et au tri; elle ne change pas automatiquement lors des modifications du contenu.
- Le corps est redige visuellement au moyen d'un editeur WYSIWYG charge depuis un CDN et stocke en Markdown.
- Le HTML brut integre dans Markdown est desactive.

## Visibilite

La visibilite par defaut est **Visible par tous**. L'auteur peut choisir :

- Visible par tous.
- Privee : visible uniquement par l'auteur.
- Visible par tous sauf le MJ.
- Visible par l'auteur et le MJ uniquement.
- Visibilite avancee : selection precise des joueurs autorises. Cette option est masquee dans les choix standards et accessible via une option avancee.

L'auteur conserve toujours l'acces a sa note. Une personne autorisee a modifier une note est egalement autorisee a la voir.

## Edition

- Par defaut, seul l'auteur peut modifier sa note.
- L'auteur peut autoriser l'edition par tous les participants qui ont le droit de voir la note.
- L'auteur peut aussi limiter l'edition a l'auteur et au MJ.

## Archivage

- Seul l'auteur peut archiver, restaurer ou vider les notes de sa corbeille personnelle.
- L'archivage retire la note de la liste active partagee.
- Vider la corbeille lance une suppression distribuee. Les copies d'appareils hors ligne peuvent subsister jusqu'a leur reconnexion; l'effacement absolu de toutes les copies n'est pas garanti.

## Synchronisation et disponibilite

- Les modifications sont synchronisees en temps reel lorsque des participants peuvent communiquer directement.
- Si aucun pair n'est joignable, un brouillon reste local et l'interface indique qu'il attend la synchronisation.
- La disponibilite est eventuelle : un appareil qui ne possede pas deja une note ne peut pas la recuperer si aucun pair possedant une copie n'est joignable.
- Un verrou d'edition indicatif limite les editions simultanees. Il expire apres 15 minutes sans renouvellement. En cas de conflit, les versions sont conservees pour comparaison ou fusion plutot que remplacees silencieusement.

## Limites fonctionnelles acceptees

Les regles de visibilite et d'edition sont appliquees par l'application cliente et ne constituent pas une protection contre un participant techniquement averti. Le contenu n'est pas chiffre de bout en bout. Le code d'invitation permanent ne peut pas etre revoque. La perte du mot de passe peut rendre un compte inaccessible, car aucun mecanisme de recuperation n'est prevu.
