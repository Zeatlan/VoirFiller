# VoirFiller Chrome Extension

![VoirFiller Logo](public/images/icon128.png)

## Description

VoirFiller est une extension Chrome conçue pour détecter si l'épisode que vous regardez sur le site web "[voiranime](https://v5.voiranime.com)" est un filler ou non. Cette extension est développée en TypeScript pour garantir une meilleure maintenabilité et robustesse du code.

## Fonctionnalités

- Détection automatique des épisodes fillers sur "[voiranime](https://v5.voiranime.com)".
- Indicateur visuel pour signaler les épisodes fillers.
- Interface utilisateur intuitive et facile à utiliser.

## Installation

1. Clonez ce dépôt sur votre machine locale.
    ```bash
    git clone https://github.com/votre-utilisateur/voirfiller.git
    ```
2. Accédez au répertoire du projet.
    ```bash
    cd voirfiller
    ```
3. Ouvrez Chrome et accédez à `chrome://extensions/`.
4. Activez le "Mode développeur" en haut à droite.
5. Compilez le projet.
    ```bash
    npm run build
    ```
6. Cliquez sur "Charger l'extension non empaquetée" et sélectionnez le répertoire `dist` du projet.

## Utilisation

1. Accédez au site web "voiranime".
2. Lancez un épisode.
3. L'extension détectera automatiquement si l'épisode est un filler et affichera un indicateur visuel.

## Développement

Pour contribuer au développement de cette extension :

1. Assurez-vous d'avoir Node.js et npm installés.
2. Installez les dépendances du projet.
    ```bash
    npm install
    ```
3. Lancez le projet en mode développement.
    ```bash
    npm run dev
    ```

