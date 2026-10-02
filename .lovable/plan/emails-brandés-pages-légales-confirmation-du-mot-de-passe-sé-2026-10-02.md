# Emails brandés, pages légales, confirmation du mot de passe, sécurité

## 1. Un seul modèle d'email CollabLand pour tous les mails
- Un même habillage pour les 6 emails de compte (création de compte, mot de passe oublié, lien de connexion, invitation, changement d'email, code de vérification) :
  - en-tête avec le logo CollabLand (squircle violet) et le nom
  - carte blanche aux coins arrondis, titre en Space Grotesk (avec une police de secours), texte en DM Sans/Arial
  - gros bouton violet en dégradé, plus le lien en clair en dessous si le bouton ne marche pas
  - pied de page : « CollabLand — Faites de la musique ensemble », liens vers les conditions d'utilisation et les mentions légales
- Tous les textes passent en français, avec des objets clairs (ex. « Bienvenue sur CollabLand — confirme ton email »).
- L'email de création de compte devient un vrai mail de bienvenue : une accroche, 3 points rapides (partager, faire évoluer les versions, discuter en vocal) et le bouton de confirmation.
- Le futur résumé quotidien utilisera le même habillage.

## 2. Pages légales
- Page « Conditions d'utilisation » : le service, le compte, le contenu publié (l'utilisateur garde ses droits sur sa musique et accorde seulement la licence nécessaire pour l'afficher aux personnes choisies), les liens externes (WeTransfer, etc.), le respect des droits d'auteur, la suspension, la responsabilité, le droit français.
- Page « Mentions légales » remplie avec les infos de ta capture : RIVIERE Bastien, entrepreneur individuel (micro-entreprise), SIREN 913 486 072, RCS Paris, TVA FR66913486072, 47 rue Vivienne 75002 Paris, directeur de la publication Bastien Rivière, hébergeur Lovable / Cloudflare. Plus une section données personnelles (RGPD) : données collectées, finalité, durée de conservation, droits d'accès et de suppression.
- Liens vers ces deux pages en bas de l'accueil, sur l'écran de connexion et dans les emails.
- À la création du compte : case obligatoire « J'accepte les conditions d'utilisation ».
- **À confirmer :** l'adresse email de contact à afficher. J'utiliserai provisoirement contact@lm-music.com, que tu pourras remplacer.

## 3. Confirmation du mot de passe
- Ajout d'un champ « Confirmer le mot de passe » à l'inscription, avec un message « Les mots de passe ne correspondent pas » et le bouton bloqué tant qu'ils ne correspondent pas.
- Minimum 8 caractères.

## 4. Sécurité
- Activation du blocage des mots de passe connus pour avoir fuité.
- La règle qui laisse tout membre connecté lire les profils est voulue : elle sert à trouver des amis par nom d'utilisateur. Les emails y sont déjà cachés depuis la correction précédente. Je te proposerai de marquer cette alerte comme acceptée, avec cette explication.
- Nouvelle analyse de sécurité complète et vérification automatique de la base, puis correction de tout ce qui ressort.

## Détails techniques
- Partager un layout `src/lib/email-templates/_layout.tsx` (logo via l'URL absolue de l'image, styles en ligne, Body #ffffff). Réécrire les 6 templates par-dessus, et mettre à jour les objets en français dans la route du webhook auth.
- Nouvelles routes publiques `src/routes/terms.tsx` et `src/routes/legal.tsx`, chacune avec son propre head().
- `auth.tsx` : champs confirmation et acceptation des conditions, validation zod.
- `configure_auth` avec `password_hibp_enabled: true`. `run_security_scan` et `linter`, corrections par migration si nécessaire. Proposer d'ignorer l'alerte sur les profils en dernière action.
