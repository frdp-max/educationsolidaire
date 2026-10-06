/**
 * UNISSON — Association Éducation Solidaire
 * Application Express (routes, sécurité, fichiers publics)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { createCheckoutIntent } from './helloasso.js';
import { saveEmergencyAlert, getEmergencyAlerts } from './emergency.js';
import { validateEmergencyAlert, validateCheckout, safeCompare } from './validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

/**
 * Liste blanche des fichiers publiés. Tout le reste du dépôt (server/, data/,
 * configuration, documents internes) n'est jamais servi.
 */
export const PUBLIC_FILES = [
  'index.html',
  'mentions-legales.html',
  'politique-confidentialite.html',
  'conditions-generales.html',
  'statuts.html',
  'flyer-a3.html',
  'flyer-a5.html',
  'logo.png',
  'logo.jpg',
  'logo.jpeg',
  'flyer-visuel.jpg',
  'UNISSON_Affiche_A3.pdf',
  'UNISSON_Flyer_A5.pdf',
];

// Routes d'alias historiques (à conserver impérativement)
const PAGE_ALIASES = {
  '/mentions-legales': 'mentions-legales.html',
  '/politique-confidentialite': 'politique-confidentialite.html',
  '/conditions-generales': 'conditions-generales.html',
  '/statuts': 'statuts.html',
  '/flyer-a3': 'flyer-a3.html',
  '/flyer-a5': 'flyer-a5.html',
};

export const app = express();

// Derrière le reverse proxy Nginx (un seul saut) : req.ip = IP réelle du visiteur
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Sécurité & Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      // Helmet ajoute par défaut script-src-attr 'none', ce qui bloquerait les onclick du site
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.helloasso.com", "https://api.helloasso-sandbox.com"],
      frameSrc: ["'self'", "https://www.helloasso.com", "https://widget.helloasso.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// L'API n'est appelée que par le site lui-même : CORS restreint à l'origine officielle
app.use(cors({ origin: process.env.PUBLIC_URL || 'https://education-solidaire.org' }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

/* -------------------------------------------------------------
 * ROUTES API
 * ------------------------------------------------------------- */

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'UNISSON - Association Éducation Solidaire',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    helloassoMode: process.env.HELLOASSO_ENV || 'not-configured',
  });
});

/**
 * Initialisation d'un Checkout HelloAsso v5
 * Body attendu : { amount (en EUR), title, name, email, address, zipCode, city, isDonation }
 */
app.post('/api/helloasso/checkout', async (req, res) => {
  const check = validateCheckout(req.body);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }
  const input = check.value;

  try {
    const clientId = process.env.HELLOASSO_CLIENT_ID;
    const clientSecret = process.env.HELLOASSO_CLIENT_SECRET;

    // Si les clés API HelloAsso ne sont pas encore fournies dans l'environnement, mode simulation sécurisé
    if (!clientId || !clientSecret || clientId === 'VOTRE_CLIENT_ID') {
      const fallbackUrl = process.env.HELLOASSO_DEFAULT_FORM_URL ||
        'https://www.helloasso.com/associations/unisson-association-education-solidaire';

      console.warn('[HelloAsso] Clés non configurées, redirection vers la page de campagne par défaut.');
      return res.json({
        success: true,
        simulated: true,
        redirectUrl: fallbackUrl,
        message: 'Redirection vers l\'espace de paiement associatif HelloAsso.',
      });
    }

    const intent = await createCheckoutIntent({
      totalAmount: input.amountInCents,
      itemName: input.title,
      payerFirstName: input.firstName,
      payerLastName: input.lastName,
      payerEmail: input.email,
      payerAddress: input.address,
      payerZipCode: input.zipCode,
      payerCity: input.city,
      metadata: {
        formula: input.title,
        isDonation: input.isDonation,
      },
    });

    res.json({
      success: true,
      redirectUrl: intent.redirectUrl,
      id: intent.id,
    });
  } catch (error) {
    console.error('[API HelloAsso Checkout Error]:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation du paiement.' });
  }
});

/**
 * Webhook HelloAsso pour écouter les paiements et adhésions confirmées
 */
app.post('/api/helloasso/webhook', (req, res) => {
  const event = req.body || {};
  const eventType = event.eventType || event.type;

  // Pas de journalisation du contenu complet : il contient les données personnelles des payeurs
  console.log(`[HelloAsso Webhook] Événement reçu : ${eventType || 'inconnu'} (id: ${event.data?.id ?? 'n/a'})`);

  // Répondre 200 OK pour acquitter le webhook
  res.status(200).json({ received: true });
});

/**
 * Réception et enregistrement d'un signalement d'urgence sociale
 */
app.post('/api/emergency/alert', async (req, res) => {
  const check = validateEmergencyAlert(req.body);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    const alert = await saveEmergencyAlert({ ...check.value, ip: req.ip });

    res.json({
      success: true,
      alertId: alert.id,
      timestamp: alert.timestamp,
      message: 'Votre alerte a été transmise à notre permanence d\'astreinte.',
    });
  } catch (error) {
    console.error('[API Emergency Alert Error]:', error);
    res.status(500).json({ error: 'Impossible d\'enregistrer l\'alerte d\'urgence.' });
  }
});

/**
 * Consultation sécurisée des alertes d'urgence (clé dans l'en-tête X-Admin-Key uniquement)
 */
app.get('/api/emergency/alerts', async (req, res) => {
  const expectedKey = process.env.ADMIN_SECRET_KEY;

  if (!expectedKey || expectedKey.length < 16) {
    console.error('[Admin] ADMIN_SECRET_KEY absente ou trop courte (16 caractères minimum) : accès désactivé.');
    return res.status(503).json({ error: 'Consultation des alertes indisponible.' });
  }
  if (!safeCompare(req.get('x-admin-key'), expectedKey)) {
    return res.status(401).json({ error: 'Accès non autorisé.' });
  }

  const alerts = await getEmergencyAlerts(50);
  res.set('Cache-Control', 'no-store');
  res.json({ count: alerts.length, alerts });
});

// Toute autre route /api inconnue : 404 JSON (pas de fallback HTML)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route API inconnue.' });
});

/* -------------------------------------------------------------
 * PAGES & FICHIERS PUBLICS
 * ------------------------------------------------------------- */

for (const [route, file] of Object.entries(PAGE_ALIASES)) {
  app.get(route, (req, res) => res.sendFile(path.join(rootDir, file)));
}

for (const file of PUBLIC_FILES) {
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(rootDir, file)));
}

// Fallback HTML pour toutes les autres routes
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});
