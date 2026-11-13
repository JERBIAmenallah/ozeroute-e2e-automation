# Dockerfile pour lancer les tests Playwright Ozeroute en conteneur
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copie des manifestes de dépendances
COPY package*.json ./

# Installation des dépendances sans lancer de scripts inutiles
RUN npm install

# Copie du code source complet
COPY . .

# Variables d'environnement par défaut pour l'exécution conteneurisée
ENV HEADLESS=true
ENV BROWSER_CHANNEL=chromium
ENV NODE_ENV=test

# Commande d'exécution de la suite complète
CMD ["npm", "test"]
