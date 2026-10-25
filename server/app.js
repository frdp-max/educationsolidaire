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

import { verifyWebhookSignature, fetchNotifiedResource, hasHelloAssoCredentials } from './helloasso.js';
import { getFundingStatus } from './funding.js';
import { saveEmergencyAlert, getEmergencyAlerts } from './emergency.js';
import { validateEmergencyAlert, safeCompare } from './validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

/**
 * Liste blanche des fichiers publiés, chemins relatifs à la racine du dépôt.
 * Chaque fichier est servi à la racine du site sous son seul nom
 * (documents/communication/flyers/UNISSON_Flyer_A5.pdf → /UNISSON_Flyer_A5.pdf).
 * Tout le reste du dépôt (server/, data/, configuration, documents internes)
 * n'est jamais servi.
 */
const FLYERS_DIR = 'documents/communication/flyers';

export const PUBLIC_FILES = [
  'index.html',
  'mentions-legales.html',
  'politique-confidentialite.html',
  'conditions-generales.html',
  'statuts.html',
  `${FLYERS_DIR}/flyer-a3.html`,
  `${FLYERS_DIR}/flyer-a5.html`,
  `${FLYERS_DIR}/infographie-a5.html`,
  'logo.svg',
  'logo.png',
  'logo-192.png',
  'apple-touch-icon.png',
  'favicon.ico',
  'logo.jpg',
  'logo.jpeg',
  `${FLYERS_DIR}/flyer-visuel.jpg`,
  'hero-visuel.webp',
  `${FLYERS_DIR}/UNISSON_Affiche_A3.pdf`,
  `${FLYERS_DIR}/UNISSON_Flyer_A5.pdf`,
  `${FLYERS_DIR}/UNISSON_Infographie_A5.pdf`,
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
];

// Routes d'alias historiques (à conserver impérativement)
const PAGE_ALIASES = {
  '/mentions-legales': 'mentions-legales.html',
  '/politique-confidentialite': 'politique-confidentialite.html',
  '/conditions-generales': 'conditions-generales.html',
  '/statuts': 'statuts.html',
  '/flyer-a3': `${FLYERS_DIR}/flyer-a3.html`,
  '/flyer-a5': `${FLYERS_DIR}/flyer-a5.html`,
  '/infographie-a5': `${FLYERS_DIR}/infographie-a5.html`,
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
app.use(express.json({
  limit: '20kb',
  // Corps brut conservé pour vérifier la signature HMAC des webhooks HelloAsso
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/helloasso/webhook')) req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
// Journal d'accès au format combined, sans le secret éventuel de l'URL du webhook
morgan.token('safe-url', (req) => (req.originalUrl || req.url).replace(/([?&](?:secret|token)=)[^&]*/gi, '$1***'));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :safe-url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));
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
 * Jauge publique du premier palier de financement (montants agrégés, aucune donnée personnelle)
 */
app.get('/api/funding', async (req, res) => {
  try {
    const status = await getFundingStatus();
    res.set('Cache-Control', 'public, max-age=300');
    res.json(status);
  } catch (error) {
    console.error('[API Funding Error]:', error);
    res.status(503).json({ error: 'Suivi de la collecte momentanément indisponible.' });
  }
});

/**
 * Compatibilité avec les pages encore en cache qui appelaient le Checkout HelloAsso :
 * dons et adhésions passent désormais par les campagnes HelloAsso (reçus fiscaux,
 * liste des membres), le site n'y crée plus de paiement.
 * Body attendu : { isDonation }
 */
app.post('/api/helloasso/checkout', (req, res) => {
  const isDonation = req.body?.isDonation === true || req.body?.isDonation === 'true';
  res.json({
    success: true,
    redirectUrl: isDonation
      ? process.env.HELLOASSO_DONATION_FORM_URL ||
        'https://www.helloasso.com/associations/education-solidaire/formulaires/1'
      : process.env.HELLOASSO_MEMBERSHIP_FORM_URL ||
        'https://www.helloasso.com/associations/education-solidaire/adhesions/adhesion-unisson-2026-2027',
  });
});

/**
 * Authentifie une notification HelloAsso.
 * 1. Comptes partenaires : signature HMAC (en-tête x-ha-signature, HELLOASSO_WEBHOOK_SIGNATURE_KEY)
 * 2. Associations : secret dans l'URL déclarée chez HelloAsso (?secret=…, HELLOASSO_WEBHOOK_SECRET)
 * Sans aucune des deux variables, la notification est acceptée (compatibilité) mais jamais crue sur parole :
 * le paiement est toujours relu auprès de l'API HelloAsso.
 */
function authenticateHelloAssoWebhook(req) {
  const signatureKey = process.env.HELLOASSO_WEBHOOK_SIGNATURE_KEY;
  if (signatureKey) {
    return verifyWebhookSignature(req.rawBody, req.get('x-ha-signature'), signatureKey);
  }
  const secret = process.env.HELLOASSO_WEBHOOK_SECRET;
  if (secret) {
    return safeCompare(req.query.secret, secret);
  }
  return true;
}

/**
 * Relit le paiement ou la commande notifiés auprès de l'API HelloAsso et journalise le résultat.
 */
async function confirmHelloAssoEvent(eventType, data) {
  if (!hasHelloAssoCredentials()) {
    console.warn(`[HelloAsso Webhook] ${eventType} ${data.id} non vérifié : clés API HelloAsso absentes.`);
    return null;
  }
  try {
    const resource = await fetchNotifiedResource(eventType, data.id);
    const amount = eventType === 'Payment' ? resource.amount : resource.amount?.total;
    const state = eventType === 'Payment' ? resource.state : (resource.payments || []).map((p) => p.state).join(',');
    console.log(`[HelloAsso Webhook] ${eventType} ${data.id} confirmé par l'API : ${(amount ?? 0) / 100} €, état ${state || 'n/a'}.`);
    return resource;
  } catch (error) {
    console.error(`[HelloAsso Webhook] ${eventType} ${data.id} introuvable via l'API, notification ignorée :`, error.message);
    return null;
  }
}

/**
 * Webhook HelloAsso pour écouter les paiements et adhésions confirmées
 */
app.post('/api/helloasso/webhook', (req, res) => {
  if (!authenticateHelloAssoWebhook(req)) {
    console.warn(`[HelloAsso Webhook] Notification rejetée (authentification invalide) depuis ${req.ip}.`);
    return res.status(401).json({ error: 'Notification non authentifiée.' });
  }

  const event = req.body || {};
  const eventType = event.eventType || event.type;
  const id = event.data?.id;

  // Pas de journalisation du contenu complet : il contient les données personnelles des payeurs
  console.log(`[HelloAsso Webhook] Événement reçu : ${eventType || 'inconnu'} (id: ${id ?? 'n/a'})`);

  // Acquittement immédiat (HelloAsso relance tant qu'il ne reçoit pas de 200), vérification ensuite
  res.status(200).json({ received: true });

  if ((eventType === 'Order' || eventType === 'Payment') && /^\d{1,20}$/.test(String(id ?? ''))) {
    confirmHelloAssoEvent(eventType, event.data);
  }
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
      message: 'Votre message a bien été reçu. En cas de danger, appelez le 115 ou le 17.',
    });
  } catch (error) {
    console.error('[API Emergency Alert Error]:', error);
    res.status(500).json({ error: 'Impossible d\'enregistrer votre message. En cas de danger, appelez le 115 ou le 17.' });
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

app.get('/', (req, res) => res.sendFile(path.join(rootDir, 'index.html')));

for (const [route, file] of Object.entries(PAGE_ALIASES)) {
  app.get(route, (req, res) => res.sendFile(path.join(rootDir, file)));
}

/**
 * Une seule URL par page (SEO) : /index.html → /, /statuts.html → /statuts.
 * La chaîne de requête est conservée.
 */
const CANONICAL_PATHS = {
  '/index.html': '/',
  ...Object.fromEntries(Object.entries(PAGE_ALIASES).map(([route, file]) => [`/${path.posix.basename(file)}`, route])),
};

for (const [from, to] of Object.entries(CANONICAL_PATHS)) {
  app.get(from, (req, res) => {
    const query = req.originalUrl.slice(req.path.length);
    res.redirect(301, to + query);
  });
}

for (const file of PUBLIC_FILES) {
  const url = `/${path.posix.basename(file)}`;
  if (CANONICAL_PATHS[url]) continue;
  app.get(url, (req, res) => res.sendFile(path.join(rootDir, file)));
}

// Toute autre route : vraie page 404 (évite les doublons de l'accueil dans Google)
app.use((req, res) => {
  res.status(404).sendFile(path.join(rootDir, '404.html'));
});
