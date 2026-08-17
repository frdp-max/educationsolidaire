/**
 * UNISSON — Association Éducation Solidaire
 * Serveur d'Application & API Backend
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { createCheckoutIntent, getHelloAssoBaseUrl } from './helloasso.js';
import { saveEmergencyAlert, getEmergencyAlerts } from './emergency.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Sécurité & Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.helloasso.com", "https://api.helloasso-sandbox.com"],
      frameSrc: ["'self'", "https://www.helloasso.com", "https://widget.helloasso.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Fichiers statiques du frontend
app.use(express.static(rootDir));

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
 * Body attendu : { amount (en EUR ou centimes), title, name, email, address, zipCode, city, isDonation }
 */
app.post('/api/helloasso/checkout', async (req, res) => {
  try {
    const { amount, title, name, email, address, zipCode, city, isDonation } = req.body;

    if (!amount || !name || !email) {
      return res.status(400).json({
        error: 'Paramètres manquants : amount, name et email sont obligatoires.',
      });
    }

    // Séparation Prénom / Nom
    const parts = (name || '').trim().split(' ');
    const firstName = parts[0] || 'Adhérent';
    const lastName = parts.slice(1).join(' ') || 'UNISSON';

    // Montant en centimes (si l'UI envoie 25€ => 2500 centimes)
    const amountInCents = amount > 100 ? amount : Math.round(amount * 100);

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
      totalAmount: amountInCents,
      itemName: title || 'Adhésion / Don UNISSON',
      payerFirstName: firstName,
      payerLastName: lastName,
      payerEmail: email,
      payerAddress: address || '',
      payerZipCode: zipCode || '',
      payerCity: city || '',
      metadata: {
        formula: title,
        isDonation: Boolean(isDonation),
      },
    });

    res.json({
      success: true,
      redirectUrl: intent.redirectUrl,
      id: intent.id,
    });
  } catch (error) {
    console.error('[API HelloAsso Checkout Error]:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'initialisation du paiement.',
      details: error.message,
    });
  }
});

/**
 * Webhook HelloAsso pour écouter les paiements et adhésions confirmées
 */
app.post('/api/helloasso/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('[HelloAsso Webhook Received]:', JSON.stringify(event, null, 2));

    // Traitement selon le type d'événement HelloAsso (Order, Payment, Form, etc.)
    const eventType = event.eventType || event.type;
    if (eventType === 'Order' || eventType === 'Payment') {
      console.log(`[HelloAsso Webhook] Paiement validé pour la commande :`, event.data?.id);
    }

    // Répondre 200 OK pour acquitter le webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[HelloAsso Webhook Error]:', error);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
});

/**
 * Réception et enregistrement d'un signalement d'urgence sociale (48h/15j)
 */
app.post('/api/emergency/alert', async (req, res) => {
  try {
    const { name, phone, emergencyType, location, message } = req.body;

    if (!phone || !emergencyType || !message) {
      return res.status(400).json({
        error: 'Veuillez remplir le téléphone, le motif d\'urgence et les précisions.',
      });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const alert = await saveEmergencyAlert({
      name,
      phone,
      emergencyType,
      location,
      message,
      ip,
    });

    res.json({
      success: true,
      alertId: alert.id,
      timestamp: alert.timestamp,
      message: 'Votre alerte a été transmise à notre permanence d\'astreinte.',
    });
  } catch (error) {
    console.error('[API Emergency Alert Error]:', error);
    res.status(500).json({
      error: 'Impossible d\'enregistrer l\'alerte d\'urgence.',
      details: error.message,
    });
  }
});

/**
 * Consultation sécurisée des alertes d'urgence
 */
app.get('/api/emergency/alerts', async (req, res) => {
  const authKey = req.headers['x-admin-key'] || req.query.key;
  const expectedKey = process.env.ADMIN_SECRET_KEY || 'unisson-secure-2026';

  if (authKey !== expectedKey) {
    return res.status(401).json({ error: 'Accès non autorisé.' });
  }

  const alerts = await getEmergencyAlerts(50);
  res.json({ count: alerts.length, alerts });
});

// Pages légales et statutaires
app.get('/mentions-legales', (req, res) => {
  res.sendFile(path.join(rootDir, 'mentions-legales.html'));
});

app.get('/politique-confidentialite', (req, res) => {
  res.sendFile(path.join(rootDir, 'politique-confidentialite.html'));
});

app.get('/conditions-generales', (req, res) => {
  res.sendFile(path.join(rootDir, 'conditions-generales.html'));
});

app.get('/statuts', (req, res) => {
  res.sendFile(path.join(rootDir, 'statuts.html'));
});

// Fallback HTML pour toutes les autres routes
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Serveur UNISSON opérationnel sur http://localhost:${PORT}`);
  console.log(`🌐 Environnement : ${process.env.NODE_ENV || 'production'}`);
  console.log(`💳 HelloAsso API : ${process.env.HELLOASSO_ENV || 'sandbox'}`);
  console.log(`====================================================`);
});
