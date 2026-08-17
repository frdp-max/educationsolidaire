#!/usr/bin/env bash
# ==============================================================================
# UNISSON — Association Éducation Solidaire
# Script de Déploiement Automatisé pour VPS Ubuntu OVH (vps-ffd2e750)
# ==============================================================================

set -e

DOMAIN="education-solidaire.org"
EMAIL="contact@educationsolidaire.fr"
APP_DIR="/opt/unisson"

echo "========================================================"
echo "🚀 Déploiement UNISSON — Association Éducation Solidaire"
echo "========================================================"

# 1. Vérification des prérequis Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installation en cours..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose plugin n'est pas installé. Installation..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# 2. Préparation du répertoire de déploiement
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/data"
mkdir -p "$APP_DIR/nginx"

# 3. Vérification du fichier .env
if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚠️ Aucun fichier .env trouvé. Copie depuis .env.example..."
    cp .env.example "$APP_DIR/.env"
    echo "❗ Veuillez éditer $APP_DIR/.env avec vos clés HelloAsso de production."
fi

# 4. Initialisation du premier certificat Let's Encrypt si inexistant
if [ ! -d "/var/lib/docker/volumes/unisson_certbot_etc/_data/live/$DOMAIN" ]; then
    echo "🔒 Initialisation du certificat SSL Let's Encrypt..."
    docker compose run --rm --entrypoint "\
      certbot certonly --webroot -w /var/www/certbot \
        --email $EMAIL \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d education-solidaire.fr \
        -d www.education-solidaire.fr \
        -d education-solidaire.eu \
        -d www.education-solidaire.eu \
        --agree-tos --no-eff-email --force-renewal" certbot || true
fi

# 5. Build et démarrage des conteneurs
echo "📦 Construction et lancement des conteneurs Docker..."
docker compose build --pull
docker compose up -d --remove-orphans

# 6. Vérification de santé du service
echo "🩺 Vérification du statut des services..."
sleep 5
docker compose ps

echo "========================================================"
echo "✅ Déploiement terminé avec succès !"
echo "🌐 URL Canonique : https://$DOMAIN"
echo "========================================================"
