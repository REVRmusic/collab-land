# Fiabilité, compression audio et recadrage d'avatar

## 1. Corriger les plantages
- Passer chaque page connectée (fil, profil, projet, nouveau projet, paramètres, notifications, amis) avec un vrai compte : créer un projet, publier une version, envoyer texte + vocal, répondre à un vocal, ajouter une cover, demander des STEMS, ajouter un ami. Noter chaque erreur rencontrée.
- Corriger chaque problème trouvé à sa source.
- Ajouter un écran d'erreur propre (« Une erreur est survenue, réessayer ») sur chaque page à la place de l'écran blanc.
- Quand une action échoue (envoi, téléversement), afficher un message clair au lieu de rester bloqué.
- Éviter les rechargements en cours de session qui provoquent « Importing a module script failed » : précharger toutes les librairies utilisées.

## 2. Compression audio à l'envoi (WAV accepté)
- Accepter WAV, AIFF, FLAC, MP3 et M4A pour les projets et les versions.
- Tout fichier non-MP3 est converti en MP3 192 kbps dans le navigateur avant l'envoi, avec une barre de progression (« Compression… 45 % »).
- La waveform est calculée sur le fichier d'origine, comme aujourd'hui.
- Les fichiers déjà en MP3 ≤ 192 kbps sont envoyés tels quels.
- Limite d'envoi augmentée pour que les gros WAV passent.

## 3. Recadrage de la photo de profil
- Après le choix d'une image, une fenêtre s'ouvre avec un cadre rond : déplacer, zoomer (curseur + pinch sur mobile).
- L'image est recadrée en carré 512×512 et allégée avant l'envoi.
- Aperçu immédiat de l'avatar dans les paramètres.

## Détails techniques
- Encodage : `@breezystack/lamejs` (pur JS) dans un Web Worker, décodage via `AudioContext.decodeAudioData`, stéréo 44,1 kHz, 192 kbps. Fichier stocké en `.mp3`, `audio/mpeg`.
- Recadrage : `react-easy-crop` dans une Dialog, export canvas en JPEG qualité 0,9.
- `errorComponent` / `notFoundComponent` sur les routes ; toasts `sonner` sur les échecs.
- `optimizeDeps.include` complété avec toutes les dépendances importées.
- Limite des buckets `audio` ajustée via les outils de stockage.
