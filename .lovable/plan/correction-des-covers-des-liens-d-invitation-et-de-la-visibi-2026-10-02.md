# Correction des covers, des liens d'invitation et de la visibilité

## Ce qui est déjà établi
- Les 4 images de cover existent bien dans le stockage et sont liées à leurs projets. Le problème vient donc de l'affichage ou des droits de lecture, pas de fichiers perdus.
- Aucun lien d'invitation de projet n'a jamais été enregistré : la création du lien échoue avant même d'être partagée.
- La régénération d'un lien utilise une fonction de génération aléatoire introuvable dans le contexte où elle s'exécute. Le bouton « Régénérer » plante donc à coup sûr.
- La vitrine (/u/pseudo) est une page publique. Son affichage dépend de droits de lecture pour les visiteurs non connectés, qu'il faut vérifier un par un : profils, projets, versions, covers et audio.

## Ce qui sera fait
1. **Reproduire avant de corriger.** Je me connecterai dans l'aperçu avec ton compte, puis j'ouvrirai le fil, la page Projets, une fiche projet et ta vitrine. Je relèverai les erreurs exactes sur les covers, sur « Inviter par lien » et sur le partage de la vitrine. Je ferai la même chose déconnecté, comme un invité qui reçoit le lien.
2. **Covers.** Je corrigerai la cause trouvée : droits de lecture des images, adresse temporaire expirée ou mise en page. Objectif : cover principale et onglet Covers visibles partout (fil, Projets, fiche, vitrine), sur téléphone comme sur ordinateur.
3. **Invitations de projet.** Je réparerai la création et la régénération du lien. Je vérifierai ensuite tout le parcours : copier le lien, l'ouvrir déconnecté, créer un compte ou se connecter, revenir sur l'invitation, puis arriver sur le projet en tant que collaborateur.
4. **Lien de vitrine.** Un visiteur non connecté qui ouvre le lien verra le profil et les projets cochés « vitrine », avec leur cover et leur aperçu audio. Il ne verra rien d'autre.
5. **Cohérence de la visibilité.** Je vérifierai et alignerai ces règles :
   - « Tous mes amis » : visible par les amis et par les personnes invitées.
   - « Amis choisis » : visible seulement par les personnes choisies et les invités.
   - Modifier la visibilité d'un projet ne doit pas retirer les collaborateurs arrivés par lien d'invitation (aujourd'hui, l'ajout de membres est réservé aux amis).
   - Les projets en vitrine sont lisibles publiquement : titre, cover, aperçu audio. La discussion, les liens de téléchargement et les STEMS restent réservés aux collaborateurs.
   - Les badges « Privé » et « Vitrine » doivent correspondre à la réalité sur toutes les cartes.

## Limites
Tu n'as qu'un seul compte. Je testerai donc la vue « invité » et « visiteur » déconnectée ou avec un compte de test créé dans l'aperçu. Je te dirai précisément ce qui a été vérifié.

## Détails techniques
- Migration : corriger `get_or_create_project_invite` (`extensions.gen_random_bytes`, ou ajouter `extensions` au search_path). Revoir `accept_project_invite` et `revoke_project_invite`.
- Revoir les politiques sur les tables `project_members` (insertion/suppression par le propriétaire pour les membres invités) et le code de synchronisation dans `EditProjectDialog`. La synchronisation ne doit gérer que les amis cochés et ne doit pas supprimer les membres invités.
- Vérifier les droits anon (politiques de lecture vitrine sur projects/project_versions, colonnes de profiles, `is_showcase_media`). La requête de la vitrine ne doit pas sélectionner de colonnes cachées (`download_url`, `stems_url`).
- Covers : vérifier `useMediaUrl` (cache de 50 min pour des liens signés d'1 h, gestion des erreurs) et `can_read_media`. Changer la cover principale doit invalider le cache.
- Contrôle final avec Playwright : connecté, déconnecté et compte invité.
