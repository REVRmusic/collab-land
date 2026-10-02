# Landing page — discours « Collaboration »

## Objectif
Réécrire la landing (`src/routes/index.tsx`) pour que tout le discours place la **collaboration entre producteurs** au centre, plutôt que la simple vitrine de projets. Uniquement du texte (et les métadonnées) — aucune modification visuelle ou fonctionnelle.

## Nouveaux textes

**Métadonnées (title / description / og)**
- Title : « CollabLand — Fais tes morceaux à plusieurs »
- Description : « Partage tes projets en cours, échange des versions et des vocaux avec tes amis producteurs, et faites avancer le morceau ensemble. »

**Eyebrow (petit texte violet)**
- « Faites de la musique ensemble »

**Titre principal (H1)**
- « Un morceau ne se fait jamais seul. Fais-le évoluer à plusieurs. »

**Sous-titre**
- « Dépose ton projet en cours, invite tes amis producteurs, et faites avancer le morceau ensemble — chaque version s'écoute, se commente et s'améliore, du premier brouillon au master. »

**Bouton principal**
- « Commencer à collaborer » (au lieu de « Créer mon studio »)

**Carte démo audio** (légère touche collab)
- Titre : « Night Drive — V4 par Max » · sous-texte inchangé (124 BPM · A min)

**Cartes fonctionnalités, réécrites sous l'angle collab**
1. GitBranch — « Faites avancer le morceau » : « Chaque V2, V3… avec sa pré-écoute : tout le monde suit où en est le projet. »
2. Lock — « À plusieurs, à ta manière » : « Ouvre le projet à tous tes amis ou seulement à ceux que tu choisis. »
3. Mic — « Discutez, en vocal » : « Réagis à une version d'un simple vocal, comme sur Instagram. »
4. Download — « Échangez les stems » : « Demande les stems ou récupère la dernière version en un clic. »
5. Palette — « Construisez l'identité » : « Chacun propose des covers, le morceau trouve sa pochette. »
6. Bell — « Personne ne rate un passage » : « Cloche en temps réel : une nouvelle version, un vocal, et chacun le sait. »

## Fichiers touchés
- `src/routes/index.tsx` — textes ci-dessus + métadonnées head(). Rien d'autre.

## Vérification
- Ouvrir `/` en navigation privée dans l'aperçu et contrôler les nouveaux textes, le bouton et la carte démo.
