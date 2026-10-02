# Cloche en haut à droite + nouvel onglet « Projets »

## Ce que tu verras
1. **Cloche de notifications en haut à droite** sur ordinateur comme sur téléphone, avec un point violet et un compteur pour les non-lues. Un appui ouvre la liste. Sur téléphone, elle s'affiche en grand panneau, avec un lien « Tout voir » vers la page complète.
2. **Barre du bas sur téléphone** : Accueil · **Projets** · + · **Amis** · Vitrine. L'onglet « Alertes » disparaît et « Amis » prend sa place.
3. **Menu de gauche sur ordinateur** : ajout de « Projets » juste sous Accueil.
4. **Nouvelle page « Projets »** : tous les projets que tu peux voir, les tiens et ceux partagés par tes amis.
   - Triés par **version la plus récente en premier**. Un projet qui reçoit une nouvelle version remonte en haut.
   - Filtres : Tous · Les miens · Partagés avec moi.
   - Chaque ligne montre la cover, le titre, l'auteur, le numéro de la dernière version, qui l'a postée et quand (« V3 par Max · il y a 2 h »), ainsi que l'aperçu audio de cette version.

## Détails techniques
- Nouvelle route `src/routes/_authenticated/projects.index.tsx` (`/projects`). Elle récupère les projets visibles via la sécurité existante, avec leurs versions et l'auteur de chaque version. Le tri se fait côté client selon le `created_at` de la dernière version. Les filtres s'appuient sur `owner_id` et l'identifiant de l'utilisateur.
- `AppShell.tsx` : la cloche est affichée à toutes les tailles d'écran, la barre mobile est réordonnée et le lien « Projets » ajouté. La page `/notifications` reste accessible depuis le lien « Tout voir » de la cloche.
- `NotificationBell.tsx` : le panneau est élargi sur mobile, et le lien « Tout voir » est ajouté s'il n'existe pas déjà.
