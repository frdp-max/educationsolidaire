#!/usr/bin/env bash
# ==============================================================================
# UNISSON — Association Éducation Solidaire
# Script de Déploiement Automatisé pour VPS Ubuntu OVH (vps-ffd2e750 - 51.178.47.78)
# ==============================================================================

set -e

DOMAIN="education-solidaire.org"
EMAIL="contact@educationsolidaire.fr"
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

# 3. Libération du port 80/443 si un service hôte (Apache/Nginx) tourne déjà
echo "🔍 Vérification de la disponibilité du port 80..."
if systemctl is-active --quiet apache2 2>/dev/null; then
    echo "⚠️ Apache2 actif sur le port 80. Arrêt et désactivation pour laisser la place à Docker Nginx..."
    sudo systemctl stop apache2 || true
    sudo systemctl disable apache2 || true
fi

if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "⚠️ Nginx hôte actif sur le port 80. Arrêt et désactivation pour laisser la place à Docker Nginx..."
    sudo systemctl stop nginx || true
    sudo systemctl disable nginx || true
fi

# 4. Préparation des répertoires de données
mkdir -p "$SCRIPT_DIR/data"

# 5. Préparation du fichier .env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "⚙️ Création du fichier .env à partir de .env.example..."
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
fi

# 6. Build et lancement des conteneurs
echo "🔨 Construction et lancement des services Docker..."
sudo docker compose build --pull
sudo docker compose up -d --remove-orphans

# 7. Initialisation SSL Let's Encrypt si le domaine est propagé
echo "🔒 Vérification des certificats SSL..."
sudo docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d education-solidaire.fr \
    -d www.education-solidaire.fr \
    -d education-solidaire.eu \
    -d www.education-solidaire.eu \
    --agree-tos --no-eff-email --keep-until-expiring" certbot || echo "ℹ️ Note: SSL initialisé ou en attente de propagation DNS."

# 8. Redémarrage de Nginx pour recharger les configurations
sudo docker compose restart nginx || true

echo "========================================================"
echo "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "🌐 Application en ligne sur http://51.178.47.78 et https://$DOMAIN"
echo "========================================================"
