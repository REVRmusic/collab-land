# Discussion et formulaires adaptés au téléphone

## Résultat attendu
- Aucun champ de saisie ne provoque de zoom automatique sur iPhone.
- Sur téléphone, la discussion s’ouvre comme une messagerie plein écran, sans devoir descendre dans la page du projet.
- La zone d’écriture reste toujours visible, y compris avec le clavier ouvert et les zones de sécurité de l’écran.
- Un vocal s’enregistre en maintenant le micro, avec glissement vers la gauche pour annuler et vers le haut pour verrouiller.

## Mise en œuvre

### 1. Supprimer le zoom des champs sur téléphone
- Conserver une taille de texte minimale de 16 px sur mobile pour les champs texte, nombres, liens, mots de passe et zones multilignes.
- Corriger les éléments encore trop petits : champ de discussion, sélecteurs partagés et éventuels champs spécialisés.
- Garder la taille plus compacte actuelle sur ordinateur.
- Vérifier les écrans de connexion, profil, amis, création/modification de projet, création/modification de version, demandes de STEMS et covers.

### 2. Transformer la discussion mobile en messagerie plein écran
- Sur téléphone, ouvrir l’onglet Discussion dans une vue fixe occupant l’espace entre le haut de l’écran et la zone de sécurité basse.
- Ajouter un en-tête compact avec le nom du projet et une action retour pour retrouver la fiche projet.
- Faire défiler uniquement la liste des messages ; conserver la zone d’écriture ancrée en bas.
- Ajuster automatiquement la hauteur au clavier mobile avec les unités d’écran dynamiques et les zones de sécurité.
- Masquer la navigation mobile derrière cette vue afin qu’elle ne concurrence pas la saisie.
- Conserver l’affichage actuel intégré à la page sur ordinateur.

### 3. Refaire l’enregistrement vocal
- Démarrer l’enregistrement par maintien du bouton micro avec les événements tactiles unifiés.
- Pendant le maintien : afficher durée, niveau audio, indication « glisser pour annuler » et verrouillage vers le haut.
- Relâcher pour envoyer ; glisser à gauche au-delà du seuil pour annuler.
- Une fois verrouillé, permettre de relâcher le doigt puis proposer des boutons visibles pour annuler ou envoyer.
- Garder un fonctionnement accessible au clavier et au simple appui comme solution alternative.
- Empêcher les débordements : éléments fixes non compressibles, waveform réellement réductible et bouton d’envoi toujours dans l’écran.
- Annuler proprement si le geste est interrompu, si l’autorisation micro est refusée ou si la vue est fermée.

### 4. Validation mobile
- Tester au format petit iPhone et téléphone Android : ouverture/fermeture de la discussion, clavier visible, envoi texte, maintien puis envoi vocal, annulation par glissement et verrouillage.
- Vérifier visuellement que chaque champ reste à l’échelle au focus, que rien ne déborde et que le dernier message ainsi que la zone d’écriture restent accessibles.
- Contrôler aussi l’affichage ordinateur pour éviter toute régression.

## Détails techniques
- Les composants partagés de saisie utilisent déjà 16 px sur mobile ; la correction ciblera les exceptions plutôt qu’un changement global risqué.
- La discussion mobile utilisera une hauteur dynamique (`100dvh`) et les marges de sécurité de l’appareil.
- L’enregistrement conservera le traitement audio et l’envoi existants ; seule l’interaction et sa présentation seront remaniées.
