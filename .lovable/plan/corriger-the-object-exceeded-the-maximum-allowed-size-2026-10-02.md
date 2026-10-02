# Corriger « The object exceeded the maximum allowed size »

## Constat
- Actuellement, un fichier est refusé au-delà d'environ 50 Mo (limite des fichiers audio, et limite générale qui s'applique aussi aux covers).
- Plusieurs fichiers peuvent dépasser cette limite :
  - une cover très lourde (photo haute résolution, PNG), envoyée sans être allégée ;
  - un MP3 long ou à fort débit (320 kbps), envoyé tel quel sans compression ;
  - un WAV que le navigateur n'arrive pas à décoder.
- Je ne sais pas encore lequel de ces fichiers a bloqué ton envoi. Je reproduirai d'abord le problème avec un gros fichier, avant de corriger.

## Corrections
1. **Covers allégées automatiquement** : redimensionnées à 2000 px maximum et converties en JPEG de bonne qualité avant l'envoi, à la création du projet et dans l'onglet Covers.
2. **MP3 recompressés si besoin** : un MP3 au-dessus de 192 kbps ou de plus de 15 Mo est recompressé en 192 kbps, comme les WAV.
3. **Limites relevées** : les fichiers audio, les covers et les avatars pourront aller jusqu'à 200 Mo, pour laisser passer les WAV avant compression.
4. **Message clair** : si un fichier reste trop lourd après compression, un message en français indique lequel et sa taille, au lieu de l'erreur technique.

## Vérification
- Publier un projet avec un gros WAV, un MP3 à 320 kbps et une cover de plus de 10 Mo, puis vérifier que tout passe.

## Détails techniques
- Nouvelle fonction `compressImage(file, maxSide=2000, quality=0.85)` via canvas, utilisée dans `projects.new.tsx` et dans l'onglet Covers.
- `compressAudio` : estimer le débit (taille × 8 / durée décodée) et ré-encoder un MP3 au-dessus de 200 kbps ou de 15 Mo.
- Outils de stockage : `configure_storage` à 200 Mo, puis `storage_update_bucket` pour les buckets audio, covers et avatars.
- Faire correspondre l'erreur de taille de `uploadFile` à un message lisible.
