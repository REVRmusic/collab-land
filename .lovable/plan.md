# Plateforme de collaboration entre producteurs

## Vision
Une app web responsive (ordinateur + mobile) où chaque producteur a une vitrine de projets, partage des démos avec des amis choisis, suit l'historique des versions, discute par projet (texte + vocaux façon Instagram) et reçoit des notifications (cloche + résumé mail quotidien).

## Direction visuelle
- Thème sombre « studio » : fond quasi noir, surfaces graphite, un accent vif (orange/corail) pour la lecture et les actions.
- Typographie : Space Grotesk (titres) + DM Sans (texte).
- Lecteurs audio inspirés de SoundCloud : forme d'onde réelle calculée depuis le fichier, barres qui se colorent pendant la lecture, clic/glisser pour se déplacer, durée affichée.
- Vocaux façon Instagram : bulles avec mini forme d'onde, bouton lecture/pause, vitesse 1x/1.5x/2x, réponse citée au-dessus du message.

## Pages
1. **Connexion / inscription** (email + mot de passe, Google).
2. **Fil d'accueil** : nouveaux projets et versions des amis.
3. **Profil / vitrine** : photo, nom d'utilisateur, bio, grille de projets avec pré-écoute directe, bouton « Ajouter en ami ».
4. **Page projet** :
   - En-tête : cover principale, titre, genre, BPM, tonalité, lecteur de la dernière version.
   - Onglet **Versions** : historique chronologique, chaque version avec sa forme d'onde et ses notes.
   - Onglet **Discussion** : fil de messages texte + vocaux, réponses aux messages, publication d'une nouvelle version depuis le fil.
   - Onglet **Covers** : galerie d'artworks proposés par chacun.
   - Bouton **Demander les STEMS** (notifie le propriétaire, statut accepté/refusé) et **lien de téléchargement** (WeTransfer, SwissTransfer, Google Drive, Dropbox, iCloud) visible selon autorisation.
5. **Nouveau projet** : upload de la démo, cover, lien de téléchargement, visibilité « Tous mes amis » ou « Amis sélectionnés ».
6. **Amis** : recherche de producteurs, demandes envoyées/reçues, liste d'amis.
7. **Paramètres** : nom d'utilisateur, photo de profil, préférence du mail quotidien.
8. **Cloche de notifications** dans la barre principale (nouveau projet d'un ami, nouvelle version, nouveau message, demande d'ami, demande de STEMS) avec compteur non lu.

Navigation : barre latérale sur ordinateur, barre d'onglets en bas sur mobile.

## Notifications par mail
Un résumé envoyé une fois par jour à chaque producteur ayant des nouveautés non lues, regroupées par projet. Nécessite un domaine d'envoi d'emails (configuration guidée lors de la mise en place).

## Détails techniques
- Lovable Cloud : authentification, base de données, stockage de fichiers (audio, vocaux, covers, avatars).
- Tables : profiles, friendships (pending/accepted), projects (visibility: friends | selected), project_members (amis sélectionnés / collaborateurs), project_versions (audio, peaks JSON, notes, auteur), covers, messages (texte ou vocal, reply_to_id, version_id optionnel), stem_requests, notifications.
- Sécurité (RLS) : un projet n'est lisible que par son propriétaire, ses amis (si « tous mes amis ») ou les membres sélectionnés ; même règle pour versions, covers, messages et fichiers stockés.
- Formes d'onde : calcul des pics via Web Audio API à l'upload, stockés en JSON pour un affichage instantané ; rendu en canvas/SVG.
- Vocaux : enregistrement via MediaRecorder, upload, calcul des pics.
- Notifications créées par triggers en base ; temps réel pour la cloche.
- Mail quotidien : route serveur planifiée (cron) qui agrège les notifications non envoyées et envoie le résumé.
- TanStack Start : routes publiques (connexion) et routes protégées sous `_authenticated`.

## Ordre de réalisation
1. Design system, navigation, authentification, profils (nom + photo).
2. Amis.
3. Projets, visibilité, versions, lecteur waveform.
4. Discussion texte + vocaux avec réponses.
5. Covers, demandes de STEMS, liens de téléchargement.
6. Notifications in-app puis mail quotidien.
