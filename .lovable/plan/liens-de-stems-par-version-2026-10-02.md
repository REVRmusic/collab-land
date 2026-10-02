# Liens de STEMS par version

## Objectif
Permettre d’ajouter un lien de STEMS distinct sur chaque version d’un projet. Si ce lien existe, tous les collaborateurs ayant accès au projet peuvent l’ouvrir immédiatement. Sinon, ils peuvent envoyer une demande au propriétaire.

## Expérience utilisateur
- Ajouter un champ facultatif « Lien des STEMS » à la création d’un projet, à la publication d’une nouvelle version et à la modification d’une version.
- Distinguer clairement le lien du projet complet et le lien des STEMS dans les formulaires.
- Sur la fiche projet, afficher le bouton des STEMS de la version la plus récente qui en possède un, avec son numéro de version et le service utilisé.
- Dans l’historique, afficher le lien des STEMS propre à chaque version.
- Quand la version la plus récente n’a pas de lien de STEMS, proposer aux autres utilisateurs « Demander les STEMS » avec un message facultatif.
- Conserver l’état de la demande et les notifications existantes pour le propriétaire et le demandeur.
- Lorsqu’un propriétaire ajoute ensuite le lien demandé, celui-ci devient accessible à tous les collaborateurs autorisés du projet, sans partage manuel dans la discussion.

## Données et sécurité
- Ajouter une colonne facultative `stems_url` aux versions de projet.
- Étendre la protection des champs techniques afin que seul ce nouveau lien, le titre, les notes et le lien du projet restent modifiables selon les droits déjà en place.
- Réutiliser la validation stricte des liens HTTPS, avec une longueur maximale, côté formulaire et dans la base.
- Ne pas modifier la visibilité : seules les personnes autorisées à consulter le projet verront les liens.

## Vérifications
- Tester la création d’un projet avec les deux liens, puis une nouvelle version avec un lien de STEMS différent.
- Tester l’ajout et le remplacement du lien depuis « Modifier la version ».
- Vérifier l’affichage pour le propriétaire et un collaborateur, ainsi que le bouton de demande lorsqu’aucun lien n’existe.
- Vérifier les écrans téléphone et ordinateur, puis la compilation et les erreurs d’exécution.
