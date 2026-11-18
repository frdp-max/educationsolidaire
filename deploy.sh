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

# 6. Construction de l'image et volumes de certificats
echo "🔒 Initialisation des volumes de certificats..."
sudo docker compose build --pull

sudo docker volume create educationsolidaire_certbot_etc > /dev/null 2>&1 || true
sudo docker volume create educationsolidaire_certbot_var > /dev/null 2>&1 || true

# Nginx lit un chemin fixe, /etc/letsencrypt/unisson/, rempli par certbot/install-cert.py
# à partir de la lignée Let's Encrypt valide (quel que soit son nom : -0001, etc.).
# Ne jamais écrire dans /etc/letsencrypt/live/ : c'est le domaine réservé de certbot.
echo "🔑 Installation du certificat Let's Encrypt existant..."
sudo docker compose run --rm --no-deps --entrypoint "python3 /opt/unisson/install-cert.py" certbot || true

SERVED_DIR="/var/lib/docker/volumes/educationsolidaire_certbot_etc/_data/unisson"
if ! sudo test -f "$SERVED_DIR/fullchain.pem"; then
    echo "🔑 Premier déploiement : certificat temporaire pour amorcer Nginx..."
    sudo mkdir -p "$SERVED_DIR"
    sudo openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "$SERVED_DIR/privkey.pem" \
        -out "$SERVED_DIR/fullchain.pem" \
        -subj "/CN=localhost" > /dev/null 2>&1
fi

# 7. Démarrage des conteneurs
echo "🔨 Démarrage des conteneurs Docker (App + Nginx + Certbot)..."
sudo docker compose up -d --remove-orphans

# 8. Obtention du certificat si absent ou proche de l'expiration (sinon conservé)
echo "🌐 Vérification du certificat officiel Let's Encrypt..."
sudo docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --agree-tos --no-eff-email --keep-until-expiring --non-interactive \
    --deploy-hook 'python3 /opt/unisson/install-cert.py'" certbot || echo "⚠️ certbot certonly a échoué : voir les logs ci-dessus."

# 9. Contrôle du certificat installé et rechargement de Nginx
if ! sudo docker compose run --rm --no-deps --entrypoint "python3 /opt/unisson/install-cert.py" certbot; then
    echo "❌ Aucun certificat Let's Encrypt valide n'est installé : le site HTTPS est en erreur."
    exit 1
fi
sudo docker compose exec nginx nginx -s reload

echo "========================================================"
echo "✅ DÉPLOIEMENT & CERTIFICAT SSL VALIDÉS !"
echo "🌐 Votre site sécurisé est en ligne :"
echo "   👉 https://$DOMAIN"
echo "   👉 https://www.education-solidaire.org"
echo "========================================================"
