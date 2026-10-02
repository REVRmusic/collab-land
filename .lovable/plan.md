# Besoin d'aide + modification des projets et versions

## Ce que tu verras
1. **Champ « Besoin d'aide sur… »** (facultatif) à la création d'un projet, ex. « besoin d'un drop plus impactant ». Il s'affiche sur la page du projet dans un encart violet bien visible, et en petit badge sur les cartes de la vitrine et du fil.
2. **Bouton « Modifier le projet »** (propriétaire uniquement) sur la page du projet. Une fenêtre permet de changer : titre, genre, BPM, tonalité, description, besoin d'aide, lien de téléchargement, visibilité (tous les amis / amis choisis + liste).
3. **Bouton « Modifier » sur chaque version** (auteur de la version ou propriétaire du projet) : changer le titre et les notes de la version.
4. L'ancien petit outil « lien de téléchargement » est remplacé par la fenêtre de modification complète.

## Détails techniques
- Migration : `ALTER TABLE projects ADD COLUMN help_needed text` (nullable). Ajouter une politique UPDATE sur `project_versions` : `auth.uid() = author_id OR is_project_owner(project_id, auth.uid())`, avec un trigger empêchant de modifier autre chose que `title`/`notes` (audio, numéro, projet figés). `updated_at` des projets mis à jour à l'édition.
- Nouveaux composants `EditProjectDialog.tsx` et `EditVersionDialog.tsx` ; la visibilité « amis choisis » synchronise `project_members` (ajout/suppression).
- `projects.new.tsx` : champ help_needed. `projects.$id.tsx` : encart + boutons. Cartes de projet : badge si help_needed.
- Pas de notification envoyée lors d'une modification.
