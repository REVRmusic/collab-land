# Rebranding : Stemroom → CollabLand

## Objectif
Renommer l'app en **CollabLand** et adopter l'identité visuelle de la capture fournie : fond très sombre, accent **violet** (dégradé violet → violet profond) au lieu de l'orange actuel, logo carré arrondi violet avec une icône d'onde sonore blanche.

## Changements

### 1. Nom « CollabLand »
- Remplacer « Stemroom » par « CollabLand » dans toutes les pages et le titre de l'onglet : `src/components/AppShell.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/auth.tsx` et les autres routes qui mentionnent le nom (feed, friends, settings, notifications, projet, vitrine, nouveau projet).

### 2. Logo
- Nouveau logo façon capture : carré bien arrondi avec dégradé violet (clair en haut → foncé en bas) et icône d'onde blanche au centre.
- Mis à jour dans le composant `Logo` (barre latérale + barre du haut) et sur les pages d'accueil et de connexion si elles affichent le logo.
- Nouveau favicon dérivé du même logo (remplace `public/favicon.ico`).

### 3. Couleurs (src/styles.css)
- Accent principal : orange → **violet** (boutons, liens actifs, partie « jouée » des waveforms, anneaux de focus, lueur décorative).
- Les bulles de messages vocaux restent violettes (déjà proches du style visé), légèrement harmonisées avec le nouvel accent.
- Fond sombre conservé, très proche de l'actuel (déjà quasi noir comme sur la capture).
- Les textes, cartes et bordures ne changent pas.

### 4. Vérification
- Vérifier visuellement l'accueil, la page de connexion et le fil dans le navigateur (nom, logo, boutons violets, waveform violette).
- Mettre à jour la mémoire du projet (nom CollabLand, accent violet).

## Détails techniques
- Palette en `oklch` dans `src/styles.css` (tokens `--primary`, `--ring`, `--wave-played`, `--voice`, `--gradient-glow`, variantes sidebar) — aucune couleur en dur dans les composants.
- Logo : dégradé CSS sur le carré + icône Lucide existante (pas d'image à générer), favicon PNG 64×64 généré à partir du même rendu.
- Aucune donnée ni fonctionnalité n'est modifiée.
