# Suppressions et confirmations de lecture

## 1. Suppressions
Toutes les suppressions demandent une confirmation (« Supprimer ce message ? » avec boutons Annuler / Supprimer).

| Élément | Qui peut supprimer | Où |
|---|---|---|
| Message texte ou vocal | Son auteur | Menu « ⋯ » au survol (ordinateur) ou appui long (mobile) sur la bulle |
| Version | Son auteur ou le propriétaire du projet | Onglet Versions, menu « ⋯ » sur chaque version |
| Cover | Son auteur ou le propriétaire du projet | Onglet Covers (le bouton existe déjà, ajout de la confirmation) |
| Projet | Son propriétaire | Menu « ⋯ » en haut de la page projet |

- **Projet** : la suppression retire aussi ses versions, covers, messages, demandes de STEMS et notifications, puis te ramène sur ta vitrine.
- **Version** : si tu supprimes la dernière version d'un projet, c'est la version précédente qui sert de pré-écoute. On ne peut pas supprimer la seule version restante : il faut supprimer le projet.
- **Message** : si quelqu'un avait répondu au message supprimé, sa réponse affiche « Message supprimé » à la place de la citation.
- Les fichiers audio et les images sont aussi effacés du stockage.

## 2. Confirmations de lecture
- Sous chacun de **tes** messages (texte, vocal, version), une ligne discrète indique « Vu » ou « Vu par » avec les petits avatars des personnes qui l'ont lu (3 maximum, puis « +2 »).
- Appuyer dessus affiche la liste complète avec l'heure de lecture.
- Un message est considéré comme lu quand la personne ouvre la discussion du projet et que le message s'affiche à l'écran.
- Mise à jour en temps réel. Les autres ne voient pas qui a lu les messages qui ne sont pas les leurs.

## Détails techniques
- Nouvelle table `message_reads(message_id, user_id, read_at)`, clé primaire composite, avec cascade à la suppression du message.
  - GRANT SELECT et INSERT à authenticated, ALL à service_role ; RLS activé.
  - Insertion : `user_id = auth.uid()`, le lecteur peut voir le projet, et ce n'est pas l'auteur du message.
  - Lecture : `user_id = auth.uid()` ou l'auteur du message est `auth.uid()`.
  - Table ajoutée à la publication realtime.
- Côté client : un IntersectionObserver dans `Discussion` regroupe les messages vus, puis un `upsert` avec ignoreDuplicates. On ne charge que les lectures de ses propres messages.
- Suppressions via le client avec les règles d'accès existantes. Ajout d'une règle de suppression des versions pour le propriétaire du projet (`OR is_project_owner`). Le blocage de la dernière version se fait côté interface et par un trigger.
- Effacement des fichiers avec `storage.from(bucket).remove([...])`. Règles de suppression des objets de stockage à vérifier et ajouter si elles manquent.
- Composant `ConfirmDelete` réutilisable, basé sur AlertDialog.
