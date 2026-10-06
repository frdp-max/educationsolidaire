# CLAUDE.md — Directives & Architecture du Projet UNISSON

## 1. Contexte & Identité de l'Organisation
- **Nom officiel** : UNISSON — Association Éducation Solidaire (loi du 1ᵉʳ juillet 1901)
- **SIREN** : 108 606 260 | **RNA** : W922023505
- **Siège social** : 45, rue Henri Barbusse, 92230 Gennevilliers
- **Site officiel** : [https://education-solidaire.org](https://education-solidaire.org)
- **Contact** : `contact@education-solidaire.org`
- **Président & Directeur de publication** : Sabri TOUJANI
- **Statut fiscal** : Dons éligibles à la déduction fiscale de 66 % (art. 200 du CGI, limite 20 % du revenu net imposable).

### Les 3 Missions Fondamentales
1. **Urgence sociale & mise à l'abri** : Hébergement temporaire à l'hôtel, sécurisation des familles, femmes victimes de violences et jeunes en rupture de ban, fourniture de repas d'urgence, articulation avec le 115/CCAS.
2. **Le Café Solidaire** : Accueil inconditionnel de jour, écoute bienveillante, principe du « café suspendu » (offert à une personne en difficulté), animation de quartier, permanence sociale.
3. **L'Épicerie Solidaire** : Produits alimentaires et d'hygiène de première nécessité à tarif solidaire, confection des paniers repas distribués aux familles mises à l'abri.

---

## 2. Architecture Technique

### Stack
- **Frontend** : HTML5 sémantique, CSS3 moderne (variables CSS, flexbox/grid responsive), Vanilla JavaScript (sans framework lourd pour un temps de chargement optimal et un SEO maximal).
- **Backend** : Node.js (v18+) avec Express configuré en modules ECMAScript (`"type": "module"`).
- **Sécurité** : `helmet` (avec CSP configuré pour autoriser Google Fonts, FontAwesome, HelloAsso), `cors`, `morgan`, `dotenv`.
- **Intégrations** : HelloAsso v5 API (OAuth2, checkout intents pour dons et adhésions), Brevo / SMTP pour les alertes urgences.
- **Infrastructure** : Docker & Docker Compose, Nginx Reverse Proxy avec HTTP/2 et SSL Let's Encrypt automatique (Certbot), hébergé sur VPS Ubuntu OVH (`51.178.47.78`).

### Arborescence des Fichiers Clés
```
├── index.html                   # Page d'accueil officielle (vitrine, missions, simulateur fiscal, sticky bar don)
├── mentions-legales.html         # Mentions légales obligatoires (loi 1901, SIREN, RNA, hébergeur)
├── politique-confidentialite.html# Conformité RGPD et politique de gestion des données
├── conditions-generales.html     # CGU et conditions des dons/adhésions
├── statuts.html                 # Statuts officiels de l'association
├── flyer-a3.html                # Affiche grand format A3 (297 x 420 mm) print-ready
├── flyer-a5.html                # Flyer/tract A5 (148 x 210 mm) print-ready
├── UNISSON_Affiche_A3.pdf       # Export PDF HD de l'affiche A3
├── UNISSON_Flyer_A5.pdf         # Export PDF HD du flyer A5
├── flyer-visuel.jpg             # Visuel cinématographique d'illustration des 3 missions
├── logo.png                     # Logo officiel UNISSON
├── deploy.sh                    # Script de déploiement automatique sur le VPS
├── docker-compose.yml           # Définition des services conteneurisés (app, nginx, certbot)
├── Dockerfile                   # Build de l'application Node.js
├── server/
│   ├── index.js                 # Point d'entrée (dotenv + démarrage du serveur)
│   ├── app.js                   # App Express : CSP, routes API, liste blanche des fichiers publics (PUBLIC_FILES)
│   ├── validation.js            # Validation des entrées (urgence, checkout en euros → centimes), comparaison sûre
│   ├── helloasso.js             # Client API HelloAsso v5 (auth token + checkout)
│   └── emergency.js             # Gestionnaire des signalements et alertes d'urgence
├── test/                        # Tests node:test (validation, routes, fichiers non exposés)
└── package.json                 # Dépendances et scripts npm
```

---

## 3. Commandes Usuelles

```bash
# Installation des dépendances
npm install

# Lancer en environnement de développement (Node watch)
npm run dev

# Lancer en production
npm start

# Exécuter les tests unitaires
npm test

# Exporter un flyer en PDF (via Chrome headless)
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --user-data-dir="temp_dir" --no-pdf-header-footer --virtual-time-budget=6000 --print-to-pdf="UNISSON_Flyer_A5.pdf" "file:///ABSOLUTE_PATH/flyer-a5.html"

# Déploiement sur le VPS (exécuter sur le serveur OVH 51.178.47.78)
git pull && bash deploy.sh
```

---

## 4. Charte Graphique & Tokens CSS

| Élément | Valeur HEX | Rôle |
|---|---|---|
| Deep Purple | `#350b52` | Couleur primaire identitaire UNISSON, fonds de nav/footer, titres |
| Royal Violet | `#6b1d9e` | Accents forts, boutons d'action secondaires |
| Lilac / Purple | `#a855f7` | Badges, surbrillances, hover states |
| Soft Lavender | `#f3e8ff` / `#faf5ff` | Fonds de cartes, bordures légères, lisibilité |
| Urgence Red | `#d92d20` | Alerte mise à l'abri d'urgence, badges critiques |
| Épicerie Green | `#059669` | Épicerie solidaire, dons écologiques/durables |

- **Typographies** :
  - Titres et accroches : `'Montserrat', sans-serif` (poids 700, 800, 900)
  - Textes courants : `'Open Sans', sans-serif` (poids 400, 600, 700)

---

## 5. Règles & Bonnes Pratiques pour Claude Code

1. **Sécurité stricte** : Ne jamais commiter de secrets, tokens ou clés privées dans git. Utiliser exclusivement les variables d'environnement (`.env`).
2. **Politique de Sécurité du Contenu (CSP)** : Toute nouvelle ressource externe (script, CDN, iframe) doit être déclarée dans la configuration `helmet` de `server/app.js`.
   **Fichiers publics** : seuls les fichiers listés dans `PUBLIC_FILES` (`server/app.js`) sont servis. Tout nouvel asset public doit y être ajouté.
3. **Rétrocompatibilité des routes** : Conserver impérativement les routes d'alias `/mentions-legales`, `/politique-confidentialite`, `/conditions-generales`, `/statuts`, `/flyer-a3`, `/flyer-a5`.
4. **Précision juridique et éthique** :
   - Mentionner systématiquement les informations légales exactes (SIREN 108 606 260, RNA W922023505, art. 200 CGI pour la déduction 66%).
   - Conserver un ton empreint d'empathie, de respect de la dignité humaine, sans misérabilisme.
5. **Impression & Supports Print** : Les gabarits `flyer-a3.html` et `flyer-a5.html` doivent respecter scrupuleusement les contraintes de dimensionnement `@page`, la non-pollution des marges d'impression et l'inclusion du QR code vectoriel officiel.
