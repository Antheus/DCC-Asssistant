# Conception technique : Notes partagees

**Statut :** validee par le demandeur  
**Date :** 2026-11-11

## Contraintes

- L'application reste dans `index.html` : HTML, CSS et code applicatif demeurent dans ce seul fichier.
- Aucun processus de build, fichier CSS/JavaScript separe ni copie locale de bibliotheque ou ressource.
- La page est publiee sur GitHub Pages et charge les dependances necessaires depuis des CDN HTTPS.
- L'espace de notes necessite une connexion Internet pour l'authentification et la synchronisation. Les fiches de personnages conservent leur fonctionnement local existant.

## Architecture retenue

- Utiliser GUN/GunDB et SEA pour le graphe de donnees distribue, l'identite et les signatures.
- Charger GUN/SEA depuis un CDN avec des versions fixees.
- Utiliser WebRTC et des services publics gratuits de signalisation/STUN pour aider les navigateurs a se decouvrir et a etablir des connexions directes.
- Ne pas deployer de relais de stockage toujours en ligne. Les appareils participants conservent des copies locales et peuvent propager les donnees qu'ils possedent.
- Utiliser un editeur WYSIWYG charge depuis un CDN, compatible avec l'enregistrement du contenu en Markdown. La bibliotheque et sa version exactes restent a choisir avant l'implementation, apres verification de leur compatibilite avec un fichier HTML autonome et de leur licence.

## Identite, parties et invitations

- L'authentification utilise un alias et un mot de passe GUN SEA.
- Aucun courriel ni service de recuperation de mot de passe n'est prevu. L'utilisateur doit conserver ses identifiants.
- Un compte peut etre membre de plusieurs parties; chaque partie a un identifiant, des metadonnees, un MJ designe et un ensemble de membres identifies par leur cle publique.
- Le code d'invitation est permanent et ne peut pas etre revoque dans cette version.

## Donnees et parcours d'acces

Le modele logique doit separer les donnees de partie, les membres, les invitations et les notes. Une note comprend au minimum un identifiant stable, un auteur, un titre, une date editable, un contenu Markdown, une visibilite, des droits d'edition, un etat d'archivage et les informations necessaires a la resolution de versions concurrentes.

- La date editable est initialisee lors de la creation, utilisee pour l'affichage et le tri, et n'est pas modifiee automatiquement quand le texte change.
- Les notes archivees sont marquees comme telles dans les donnees partagees; leur corbeille n'est presentee qu'a leur auteur.
- Les recherches sont effectuees dans le navigateur sur les notes presentes localement et accessibles dans l'interface.

## Permissions et confidentialite

- Les regles d'acces sont verifiees par le code client; GUN n'apporte pas d'ACL applicative integree a cette conception.
- Les donnees ne sont pas chiffrees de bout en bout. Un filtrage d'interface ne protege pas les notes contre un participant qui inspecte directement le graphe ou modifie le client.
- Les notes privees et les listes de lecteurs representent donc une convention coopérative pour un groupe de confiance, pas une garantie de confidentialite technique.
- Ne jamais inclure de secret d'administration dans le HTML public.

## Synchronisation, mode hors ligne et conflits

- Les changements sont propages aux pairs joignables. Les appareils hors ligne convergent eventuellement lorsqu'ils se reconnectent et retrouvent un pair detenant les donnees.
- Les modifications non synchronisees restent comme brouillons locaux et leur etat doit etre visible dans l'interface.
- Un verrou d'edition avec expiration est utilise comme indication. Il est renouvele pendant l'edition et expire apres 15 minutes sans renouvellement. Une partition du reseau peut autoriser plusieurs verrous simultanes; le verrou ne constitue donc pas une exclusion stricte.
- En cas d'editions concurrentes, conserver les versions distinctes et demander a l'utilisateur de les comparer ou de les fusionner.
- L'archivage et la suppression sont propages avec les mecanismes distribues de GUN. La suppression utilise un tombstone; elle ne garantit pas l'effacement immediat des copies d'appareils hors ligne ni des copies exportees.

## Deploiement et exploitation

- GitHub Pages ne stocke pas les notes : leur conservation depend des donnees locales des navigateurs participants et de leur connectivite P2P.
- Les services publics de signalisation/STUN sont des dependances externes sans garantie de disponibilite. Certains reseaux peuvent empecher une connexion directe.
- La solution n'a pas de garantie de disponibilite, de recuperation centralisee ou de sauvegarde serveur; ces limites doivent etre communiquees dans l'interface ou la documentation utilisateur.
- Toute dependance externe est chargee a distance par HTTPS; aucune ressource de bibliotheque n'est copiee dans le depot.

## Verification avant livraison

- Verifier le chargement depuis GitHub Pages en HTTPS et depuis les CDN choisis.
- Tester creation de compte, connexion, creation de partie, invitation, designation du MJ et participation a plusieurs parties dans deux profils/navigateurs.
- Tester les niveaux de visibilite et d'edition via l'interface normale, en rappelant que ces tests ne prouvent pas la confidentialite contre un client modifie.
- Tester recherche, tri par date et auteur, editeur WYSIWYG et conversion Markdown.
- Tester propagation en direct, brouillon hors ligne puis reconnexion, expiration du verrou, conflit d'edition, archivage, restauration et tombstone de suppression.
- Tester les cas de perte de mot de passe, code d'invitation permanent, navigateurs sans connexion P2P et donnees locales effacees; presenter les limites sans promettre de recuperation.

## Details a confirmer avant codage

- Choix et versions exacts des CDN pour GUN/SEA, l'editeur WYSIWYG et les services de signalisation/STUN.
- Format exact des noeuds GUN et implementation du verrou indicatif, des versions concurrentes et de leur resolution.
- Compatibilite de l'editeur choisi avec la conservation fidele du Markdown et la desactivation du HTML brut.

## References

- [GUN FAQ](https://gun.eco/docs/FAQ)
- [GUN SEA](https://gun.eco/docs/SEA)
- [Installation navigateur GUN](https://gun.eco/docs/Installation)
