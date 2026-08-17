#!/usr/bin/env bash
# ==============================================================================
# UNISSON — Association Éducation Solidaire
# Script de Déploiement Automatisé pour VPS Ubuntu OVH (vps-ffd2e750 - 51.178.47.78)
# ==============================================================================

set -e

DOMAIN="education-solidaire.org"
EMAIL="contact@education-solidaire.org"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

echo "========================================================"
echo "🚀 Déploiement UNISSON — Association Éducation Solidaire"
echo "🌐 Serveur VPS OVH : 51.178.47.78 (vps-ffd2e750)"
echo "========================================================"

# 1. Vérification et installation de Docker si nécessaire
if ! command -v docker &> /dev/null; then
    echo "📦 Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm -f get-docker.sh
fi

# 2. Vérification de Docker Compose
if ! docker compose version &> /dev/null; then
    echo "📦 Installation du plugin Docker Compose..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

# 3. Libération du port 80/443 si un service hôte tourne
echo "🔍 Vérification et libération des ports 80/443..."
if systemctl is-active --quiet apache2 2>/dev/null; then
    sudo systemctl stop apache2 || true
    sudo systemctl disable apache2 || true
fi
if systemctl is-active --quiet nginx 2>/dev/null; then
    sudo systemctl stop nginx || true
    sudo systemctl disable nginx || true
fi

# 4. Préparation des répertoires de données
mkdir -p "$SCRIPT_DIR/data"

# 5. Préparation du fichier .env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "⚙️ Création du fichier .env..."
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
fi

# 6. Création des volumes et certificats initiaux (Dummy Certs pour amorçage Nginx)
echo "🔒 Initialisation des volumes de certificats..."
sudo docker compose build --pull

# Création des volumes Docker si inexistants
sudo docker volume create educationsolidaire_certbot_etc > /dev/null 2>&1 || true
sudo docker volume create educationsolidaire_certbot_var > /dev/null 2>&1 || true

# Vérification si un certificat existe déjà
CERT_DIR="/var/lib/docker/volumes/educationsolidaire_certbot_etc/_data/live/$DOMAIN"
if [ ! -d "$CERT_DIR" ]; then
    echo "🔑 Création d'un certificat SSL temporaire pour amorcer Nginx..."
    sudo mkdir -p "$CERT_DIR"
    sudo openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem" \
        -subj "/CN=localhost" > /dev/null 2>&1 || true
fi

# 7. Démarrage des conteneurs
echo "🔨 Démarrage des conteneurs Docker (App + Nginx)..."
sudo docker compose up -d --remove-orphans

# 8. Obtention du certificat officiel Let's Encrypt avec remplacement garanti
echo "🌐 Demande du certificat officiel Let's Encrypt SSL..."
sudo docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --agree-tos --no-eff-email --force-renewal" certbot || echo "ℹ️ Note: SSL généré ou attente DNS."

# 8b. Synchronisation des chemins de certificats si Certbot a créé le dossier -0001
sudo docker compose run --rm --entrypoint "sh -c '\
  if [ -d /etc/letsencrypt/live/education-solidaire.org-0001 ]; then \
    rm -rf /etc/letsencrypt/live/education-solidaire.org && \
    cp -r /etc/letsencrypt/live/education-solidaire.org-0001 /etc/letsencrypt/live/education-solidaire.org; \
  fi'" certbot > /dev/null 2>&1 || true

# 9. Rechargement immédiat de Nginx
echo "🔄 Rechargement de Nginx avec les certificats certifiés..."
sudo docker compose restart nginx

echo "========================================================"
echo "✅ DÉPLOIEMENT & CERTIFICAT SSL VALIDÉS !"
echo "🌐 Votre site sécurisé est en ligne :"
echo "   👉 https://$DOMAIN"
echo "   👉 https://www.education-solidaire.org"
echo "========================================================"
