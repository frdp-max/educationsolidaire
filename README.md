# 🌟 UNISSON — Association Éducation Solidaire

Plateforme web officielle, API d'intégration **HelloAsso v5** et architecture de déploiement conteneurisée pour **UNISSON — Association Éducation Solidaire** (Loi 1901, ESS & Agrément ESUS).

---

## 📋 Présentation du Projet

* **Organisation :** UNISSON — Association Éducation Solidaire
* **Siège Social :** 45, rue Henri Barbusse, 92230 Gennevilliers
* **Missions d'Utilité Sociale :**
  1. **Médiation Intrafamiliale et Scolaire :** Désamorçage des conflits parents/enfants, désescalade des tensions relationnelles et scolaires.
  2. **Permanence d'Écoute 7j/7 :** Accueil inconditionnel, soutien moral sans jugement et orientation médico-sociale.
  3. **Dispositif de Premier Secours Social (48h à 15 jours) :** Mise à l'abri immédiate à l'hôtel avec prise en charge des repas en relais avec les services sociaux (CCAS, AP-HP, Cochin, Hôtel-Dieu).
  4. **Protection des Femmes Victimes de Violences :** Accompagnement, orientation et mise en sécurité d'urgence.

---

## 🎨 Identité Visuelle & Charte Graphique

* **Violet Profond (dominant/structure) :** `#43006d`
* **Violet Médian (accents/actions) :** `#6b1d9e`
* **Lilas Lumineux (highlights/liens) :** `#b874ea`
* **Lavande Douce (fonds secondaires/badges) :** `#e9d5ff`
* **Fond de page soyeux :** `#faf7fd`
* **Alerte / Urgence sociale :** `#d92d20`
* **Typographies :** `Montserrat` (Headings) & `Open Sans` / `Inter` (Body).

---

## 🏛️ Formules d'Adhésion & Bénévolat

1. **Bénévole Actif - Équipe Mixte (10 €/an) :** Intervention sur le terrain au sein d'équipes paritaires (2H / 2F), assurance RC incluse, droit de vote ("1 membre = 1 voix").
2. **Cotisation Solidaire (5 €/an) :** Accès universel aux permanences d'écoute et ateliers pour personnes et familles à revenus modestes.
3. **Pass Famille / Duo (25 €/an - Recommandé) :** Couverture pour l'ensemble du foyer familial, accès prioritaire aux cycles de médiation et activités.
4. **Membre Bienfaiteur / Fonds d'Urgence (50 €/an) :** Finance directement 1 nuitée d'hôtel de secours et les repas de crise pour une personne ou famille en détresse.
5. **Abondement Libre du Fonds d'Urgence :** Dons ponctuels ou réguliers fléchés vers la mise à l'abri d'urgence 48h-15j.

---

## ⚙️ Architecture Technique & API HelloAsso v5

```
+-----------------------------------------------------------------------------------+
|                        NGINX REVERSE PROXY (Port 80 / 443)                        |
|  - Redirections 301 (education-solidaire.fr/.eu -> https://education-solidaire.org)|
|  - Certificats SSL Let's Encrypt / Certbot                                        |
|  - Headers de sécurité HSTS, CSP, Rate Limiting                                   |
+--------------------------+--------------------------------+-----------------------+
                           |                                |
                           v                                v
+------------------------------------------+  +-------------------------------------+
|         FRONTEND INTERACTIF              |  |         SERVEUR NODE.JS / EXPRESS   |
|  - UI/UX Responsive & Glassmorphism      |  |  - /api/helloasso/checkout          |
|  - Formulaire d'urgence 48h-15j          |  |  - /api/helloasso/webhook           |
|  - Modale Checkout interactive           |  |  - /api/emergency/alert             |
|  - Widget Don Libre                      |  |  - /api/health                      |
+------------------------------------------+  +-------------------------------------+
```

### Endpoints API

* `POST /api/helloasso/checkout` : Initialise une intention de paiement Checkout Intent via l'API v5 HelloAsso (`/v5/organizations/{slug}/checkout-intents`) et renvoie l'URL de redirection sécurisée.
* `POST /api/helloasso/webhook` : Point de terminaison pour la réception et l'acquittement des notifications d'adhésion et de paiement validés.
* `POST /api/emergency/alert` : Réception instantanée des demandes de prise en charge et de mise à l'abri (48h-15j) avec notification d'astreinte.
* `GET /api/emergency/alerts` : Consultation sécurisée de l'historique des alertes pour les membres autorisés (`x-admin-key`).
* `GET /api/health` : Sonde de santé pour Docker et Nginx.

---

## 🚀 Installation & Lancement Local

### Prérequis
* Node.js >= 18.x
* npm >= 9.x

### Étapes
```bash
# 1. Cloner ou ouvrir le projet
cd educationsolidaire

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env

# 4. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur **`http://localhost:3000`**.

---

## 🌐 Déploiement en Production (VPS Ubuntu OVH `vps-ffd2e750`)

### 1. Variables d'environnement de production (`.env`)
```ini
PORT=3000
NODE_ENV=production
PUBLIC_URL=https://education-solidaire.org

HELLOASSO_ENV=production
HELLOASSO_CLIENT_ID=votre_client_id_helloasso
HELLOASSO_CLIENT_SECRET=votre_client_secret_helloasso
HELLOASSO_ORGANIZATION_SLUG=unisson-association-education-solidaire

ADMIN_SECRET_KEY=cle_securisee_pour_acces_admin
```

### 2. Lancement avec Docker Compose
```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Exécuter le déploiement automatisé
./deploy.sh
```

Ou manuellement :
```bash
docker compose up -d --build
```

---

## 🔒 Sécurité & Redirections DNS

* Le domaine canonique est **`https://education-solidaire.org`**.
* Les domaines **`education-solidaire.fr`**, **`education-solidaire.eu`** ainsi que tous les sous-domaines **`www`** sont automatiquement redirigés en **301 permanent** vers `https://education-solidaire.org`.
* Renouvellement automatique des certificats SSL via le conteneur `certbot` toutes les 12h.
