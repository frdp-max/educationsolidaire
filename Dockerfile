# ==============================================================================
# UNISSON — Association Éducation Solidaire
# Multi-stage Dockerfile pour l'application Web & API Backend
# ==============================================================================

# Étape 1 : Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production
RUN npm ci --omit=dev

# Copie du code source
COPY . .

# Étape 2 : Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S unisson && \
    adduser -S unisson -u 1001

# Copie des fichiers depuis l'étape de build
COPY --from=builder --chown=unisson:unisson /app /app

# Création du dossier de stockage des données
RUN mkdir -p /app/data && chown -R unisson:unisson /app/data

USER unisson

EXPOSE 3000

# Sonde de santé Docker
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server/index.js"]
