# CollabLand

CollabLand est une application web pour les producteurs de musique. Chacun y dépose un morceau en cours, le partage à son cercle, et le fait avancer ensemble : versions, pré-écoute, discussion, stems et artworks.

L’interface est pensée pour l’ordinateur et le téléphone.

## Ce que tu peux faire

- **Vitrine.** Chaque producteur a un profil public dans l’app : nom d’artiste, photo, bio, et les projets qu’il choisit de montrer.
- **Projet.** Un morceau en cours, avec son genre, son BPM, sa tonalité, et une cover affichée au format carré.
- **Versions.** Chaque nouvelle version (V1, V2, V3…) a son extrait démo. La lecture affiche la forme d’onde, comme sur SoundCloud.
- **Visibilité.** Un projet est ouvert à tous tes amis, ou seulement aux collaborateurs que tu choisis.
- **Fichiers.** Chaque version peut avoir un lien de téléchargement du projet et un lien séparé pour les stems (iCloud, Drive, Dropbox, WeTransfer, SwissTransfer…). Quelqu’un qui n’a pas encore le lien peut demander les stems.
- **Discussion.** Un fil par projet : messages écrits, messages vocaux, et réponses à un vocal.
- **Covers.** Chacun peut proposer une ou plusieurs pochettes. Le propriétaire choisit la cover principale.
- **Amis.** Tu ajoutes d’autres producteurs et tu suis leurs projets dans le fil d’actualité.
- **Invitation par lien.** Tu peux inviter quelqu’un hors de ton cercle : après connexion, il devient collaborateur du projet.
- **Vitrine publique.** Ton profil `/u/pseudo` est partageable ; les projets cochés « Sur ma vitrine » montrent cover + pré-écoute sans compte.
- **Notifications.** Une cloche signale une nouvelle version, un vocal ou une demande. Un e-mail récapitulatif peut partir une fois par jour.

## Lancer l’app en local

Il faut [Node.js](https://nodejs.org) et npm.

```sh
git clone https://github.com/REVRmusic/collab-land.git
cd collab-land
npm install
npm run dev
```

L’app s’ouvre sur [http://localhost:8080](http://localhost:8080).

Le fichier `.env` à la racine contient la connexion à la base (Supabase). Sans lui, l’app ne démarre pas. Pour arrêter le serveur : `Ctrl + C` dans le terminal.
