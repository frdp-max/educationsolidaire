/**
 * UNISSON — Association Éducation Solidaire
 * Service d'intégration API HelloAsso v5 (OAuth2 Client Credentials)
 */

import crypto from 'crypto';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Récupère l'URL de base de l'API selon le mode (Sandbox ou Production)
 */
export function getHelloAssoBaseUrl() {
  const env = process.env.HELLOASSO_ENV || 'production';
  return env === 'sandbox'
    ? 'https://api.helloasso-sandbox.com'
    : 'https://api.helloasso.com';
}

/**
 * Récupère l'URL de base pour l'authentification OAuth2
 */
export function getHelloAssoAuthUrl() {
  const env = process.env.HELLOASSO_ENV || 'production';
  return env === 'sandbox'
    ? 'https://api.helloasso-sandbox.com/oauth2/token'
    : 'https://api.helloasso.com/oauth2/token';
}

/**
 * Vrai si les identifiants API HelloAsso sont renseignés (et ne sont pas les valeurs d'exemple)
 */
export function hasHelloAssoCredentials() {
  const id = process.env.HELLOASSO_CLIENT_ID;
  const secret = process.env.HELLOASSO_CLIENT_SECRET;
  return Boolean(id && secret && !id.startsWith('VOTRE_') && !secret.startsWith('VOTRE_'));
}

/**
 * Obtient un jeton d'accès OAuth2 (avec mise en cache automatique)
 */
export async function getAccessToken() {
  const now = Date.now();

  // Si le token en cache est encore valide (avec 60s de marge), on le réutilise
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const clientId = process.env.HELLOASSO_CLIENT_ID;
  const clientSecret = process.env.HELLOASSO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Variables HELLOASSO_CLIENT_ID ou HELLOASSO_CLIENT_SECRET non configurées');
  }

  const authUrl = getHelloAssoAuthUrl();

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Échec authentification HelloAsso (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in * 1000);

  return cachedToken;
}

/**
 * Vérifie la signature HMAC-SHA256 d'une notification HelloAsso (en-tête x-ha-signature).
 * Fonctionnalité réservée aux comptes partenaires HelloAsso.
 * @param {Buffer|string} rawBody - Corps brut de la requête
 * @param {string} signature - Valeur de l'en-tête x-ha-signature (hex)
 * @param {string} signatureKey - Clé fournie par HelloAsso à la configuration de l'URL
 */
export function verifyWebhookSignature(rawBody, signature, signatureKey) {
  if (!rawBody || typeof signature !== 'string' || !signatureKey) return false;
  const expected = crypto.createHmac('sha256', signatureKey).update(rawBody).digest('hex');
  const provided = signature.trim().toLowerCase();
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/**
 * Relit auprès de l'API HelloAsso l'objet annoncé par une notification,
 * pour ne jamais se fier au seul contenu du webhook.
 * @param {'Payment'|'Order'} eventType
 * @param {number|string} id
 */
export async function fetchNotifiedResource(eventType, id) {
  const safeId = encodeURIComponent(String(id));
  const resource = eventType === 'Payment' ? 'payments' : 'orders';
  const token = await getAccessToken();

  const response = await fetch(`${getHelloAssoBaseUrl()}/v5/${resource}/${safeId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Lecture ${resource}/${safeId} impossible (${response.status})`);
  }
  return response.json();
}
