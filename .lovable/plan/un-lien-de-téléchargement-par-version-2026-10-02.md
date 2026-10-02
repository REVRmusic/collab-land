# Un lien de téléchargement par version

## Ce que tu verras
1. **Nouvelle version** : la fenêtre « Nouvelle version » a un champ « Lien de téléchargement (WeTransfer, SwissTransfer, Drive, Dropbox, iCloud…) », facultatif.
2. **En haut du projet** : le bouton « Télécharger » pointe toujours vers la **dernière version**. Il affiche par exemple « Télécharger V3 · WeTransfer ». Si la dernière version n'a pas de lien, on reprend le lien de la version précédente la plus récente qui en a un. Le bouton précise alors « V2 » pour éviter toute confusion. Le lecteur du haut joue déjà la dernière version ; ça ne change pas.
3. **Onglet Versions** : chaque version affiche son propre bouton de téléchargement. On peut ainsi récupérer une ancienne version.
4. **Modifier une version** (le crayon) : on peut ajouter ou changer le lien après coup. C'est utile quand un lien WeTransfer expire.
5. **Discussion** : la bulle « nouvelle version » affiche aussi le bouton de téléchargement quand un lien existe.
6. **Fenêtre « Modifier le projet »** : le champ lien du projet disparaît pour ne garder qu'une seule source, les liens par version. À la création d'un projet, le lien saisi est rattaché à la V1.

## Détails techniques
- Migration : `ALTER TABLE project_versions ADD COLUMN download_url text`. On recopie le `projects.download_url` existant dans la version la plus récente de chaque projet. `projects.download_url` est marqué DEPRECATED. Le trigger `lock_version_fields` laisse déjà passer cette colonne.
- `NewVersionDialog`, `EditVersionDialog`, `projects.new.tsx` (le lien va à la V1), `projects.$id.tsx` : le bouton du haut est calculé depuis les versions, et chaque version de la liste a son bouton. `Discussion.tsx` : bouton sur les messages de type version. Les liens sont validés en URL http(s).
