# Dockerfile pour dashboard-invoicePack
# Multi-stage build pour optimiser la taille de l'image finale

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration du workspace
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/shared/package*.json ./packages/shared/

# Installer toutes les dépendances (dev et prod)
RUN npm ci

# Copier tout le code source
COPY . .

# Build le package shared d'abord (dépendance des autres)
RUN npm run build --workspace=packages/shared

# Build le frontend (génère les fichiers statiques)
RUN npm run build --workspace=packages/frontend

# Build le backend
RUN npm run build --workspace=packages/backend

# Stage 2: Production stage
FROM node:18-alpine AS production

# Installer dumb-init pour une gestion propre des signaux
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration du workspace
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

# Installer uniquement les dépendances de production
RUN npm ci --only=production && \
    npm cache clean --force

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/frontend/dist ./packages/frontend/dist

# Copier les fichiers de configuration nécessaires
COPY --chown=nodejs:nodejs packages/backend/tsconfig.json ./packages/backend/
COPY --chown=nodejs:nodejs packages/shared/tsconfig.json ./packages/shared/

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port (ajustez selon votre configuration)
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001

# Commande de démarrage avec dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
