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
> **État au 11 octobre 2026** : l'association vient d'être créée, **aucune mission n'est encore opérationnelle**. Priorité n°1 : le premier secours social (mise à l'abri, repas d'urgence), présenté avec le badge « Priorité » et au futur (« financera »). Le Café Solidaire et l'Épicerie Solidaire sont **en projet** (badge « En projet »). Ne jamais affirmer de permanence 7j/7, d'astreinte, de partenariats ou d'agrément non obtenus. Le formulaire du site est un formulaire de contact : il doit toujours renvoyer vers le 115, 3919, 119, 17 et 112 en cas de danger.

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
├── 404.html                     # Page 404 (noindex, rappel des numéros d'urgence), servie pour toute URL inconnue
├── robots.txt                   # Autorise l'indexation (sauf /api/) et déclare le sitemap
├── sitemap.xml                  # Pages indexables (accueil + pages légales) — mettre à jour lastmod à chaque modif
├── llms.txt                     # Fiche de présentation pour les assistants IA — à tenir à jour avec l'état réel des missions
├── flyer-a3.html                # Affiche grand format A3 (297 x 420 mm) print-ready
├── flyer-a5.html                # Flyer/tract A5 (148 x 210 mm) print-ready
├── UNISSON_Affiche_A3.pdf       # Export PDF HD de l'affiche A3
├── UNISSON_Flyer_A5.pdf         # Export PDF HD du flyer A5
├── infographie-a5.html          # Infographie A5 (parcours, impact des dons, numéros d'urgence) print-ready
├── UNISSON_Infographie_A5.pdf   # Export PDF HD de l'infographie A5
├── cartes-visite.html           # Cartes de visite 85 x 55 mm du Bureau (recto nominatif + verso commun) — usage interne, non servi
├── UNISSON_Cartes_Visite.pdf    # Export PDF des cartes (4 pages : Président R/V, Trésorier R/V)
├── gouvernance/                 # Dossier de gouvernance (phases 1 à 3 de la feuille de route) — usage interne, non servi
│   ├── word/ pdf/               # 27 documents : 00 sommaire, 01-09 socle, 10 règlement intérieur, 11-17 permanence, 18-26 mise à l'abri
│   └── _source/                 # Générateur docx (à n'utiliser qu'avant adoption : ensuite, modifier dans Word)
├── textile/                     # Kit textile (flex, sérigraphie, DTF) — usage interne, non servi
│   ├── generate.py              # Générateur des logos vectoriels + logo.svg du site (fonttools + shapely, police Montserrat OFL)
│   ├── svg/ pdf/ eps/           # 4 logos (symbole, cœur, horizontal, écusson) × 3 versions (couleur, mono, blanc)
│   ├── fiche-technique.html     # Fiche d'atelier A4 (emplacements, seuils, export)
│   ├── UNISSON_Kit_Textile_Fiche_Technique.pdf
│   ├── mockups.py               # Maquettes à plat hoodie/parka (logos à taille réelle) → maquettes/*.svg|png
│   ├── maquettes.html           # Planches A4 paysage des maquettes
│   └── UNISSON_Maquettes_Textiles.pdf
├── flyer-visuel.jpg             # Visuel cinématographique d'illustration des 3 missions
├── logo.svg                     # Symbole officiel UNISSON (vectoriel, généré par textile/generate.py) — utilisé sur le site et les supports print
├── logo.png                     # Logo complet (écusson) 1024 px — schema.org ; logo-192.png, favicon.ico, apple-touch-icon.png = symbole
├── deploy.sh                    # Script de déploiement automatique sur le VPS
├── docker-compose.yml           # Définition des services conteneurisés (app, nginx, certbot)
├── Dockerfile                   # Build de l'application Node.js
├── server/
│   ├── index.js                 # Point d'entrée (dotenv + démarrage du serveur)
│   ├── app.js                   # App Express : CSP, routes API, liste blanche des fichiers publics (PUBLIC_FILES)
│   ├── validation.js            # Validation des entrées (urgence, checkout en euros → centimes), comparaison sûre
│   ├── helloasso.js             # Client API HelloAsso v5 (auth token, checkout, signature & relecture des webhooks)
│   ├── emergency.js             # Gestionnaire des signalements et alertes d'urgence
│   └── notify.js                # Notifications d'astreinte : email Brevo + webhook Discord/Slack
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

Palette validée le 12 octobre 2026 : **deux violets seulement + un abricot chaleureux**. Ne pas réintroduire d'autres violets (`#350b52`, `#6b1d9e`, `#8b5cf6`, `#a855f7`…) ni de rose-rouge `#e11d48`.

| Élément | Valeur HEX | Rôle |
|---|---|---|
| Encre | `#2A0E45` | Couleur identitaire (logo), titres, fonds de nav/footer/hero |
| Violet | `#6D28D9` | Liens, boutons secondaires, second ruban du logo (7,1:1 sur blanc) ; survol `#5B21B6` |
| Lavande | `#EDE4FB` / `#F7F3FD` | Fonds de cartes et de badges, bordures légères — jamais en texte |
| Lavande claire | `#C4B5FD` | Texte secondaire sur fond encre |
| Abricot | `#F4A259` | Don, adhésion, accents chaleureux (titres sur fond sombre, liserés) ; survol `#E8893A`. **Toujours avec texte encre, jamais en texte sur blanc (2,1:1)** |
| Urgence Red | `#D92D20` | Réservé au danger : numéros d'urgence, badge « Priorité ». Jamais pour le don |
| Épicerie Green | `#059669` | Épicerie solidaire, dons écologiques/durables |

Tout texte doit atteindre un contraste ≥ 4,5:1 (WCAG AA). Comparatif avant/après : `design/palette-comparatif.html`.

- **Typographies** :
  - Titres et accroches : `'Montserrat', sans-serif` (poids 700, 800 — pas de 900, pour un ton plus chaleureux)
  - Textes courants : `'Atkinson Hyperlegible Next', sans-serif` (poids 400, 600, 700) — police conçue pour la lisibilité (malvoyance, faible littératie), cohérente avec le public accueilli
  - Chargement unique via Google Fonts : `family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@500;600;700;800`

---

## 5. Règles & Bonnes Pratiques pour Claude Code

1. **Sécurité stricte** : Ne jamais commiter de secrets, tokens ou clés privées dans git. Utiliser exclusivement les variables d'environnement (`.env`).
2. **Politique de Sécurité du Contenu (CSP)** : Toute nouvelle ressource externe (script, CDN, iframe) doit être déclarée dans la configuration `helmet` de `server/app.js`.
   **Fichiers publics** : seuls les fichiers listés dans `PUBLIC_FILES` (`server/app.js`) sont servis. Tout nouvel asset public doit y être ajouté.
3. **Rétrocompatibilité des routes** : Conserver impérativement les routes d'alias `/mentions-legales`, `/politique-confidentialite`, `/conditions-generales`, `/statuts`, `/flyer-a3`, `/flyer-a5`, `/infographie-a5`.
4. **Précision juridique et éthique** :
   - Mentionner systématiquement les informations légales exactes (SIREN 108 606 260, RNA W922023505, art. 200 CGI pour la déduction 66%).
   - Conserver un ton empreint d'empathie, de respect de la dignité humaine, sans misérabilisme.
5. **Impression & Supports Print** : Les gabarits `flyer-a3.html` et `flyer-a5.html` doivent respecter scrupuleusement les contraintes de dimensionnement `@page`, la non-pollution des marges d'impression et l'inclusion du QR code vectoriel officiel.
