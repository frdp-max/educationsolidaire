/**
 * UNISSON — Association Éducation Solidaire
 * Service d'intégration API HelloAsso v5 (OAuth2 Client Credentials)
 */

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
 * Initialise une intention de paiement / adhésion (Checkout Intent API v5)
 * @param {Object} options
 * @param {number} options.totalAmount - Montant en centimes (ex: 2500 pour 25€)
 * @param {string} options.itemName - Nom de la formule / adhésion
 * @param {string} options.payerFirstName - Prénom de l'adhérent
 * @param {string} options.payerLastName - Nom de l'adhérent
 * @param {string} options.payerEmail - Email de l'adhérent
 * @param {string} [options.payerAddress] - Adresse postale optionnelle
 * @param {string} [options.payerZipCode] - Code postal
 * @param {string} [options.payerCity] - Ville
 * @param {string} [options.metadata] - Données complémentaires (formule, etc.)
 */
export async function createCheckoutIntent({
  totalAmount,
  itemName,
  payerFirstName,
  payerLastName,
  payerEmail,
  payerAddress = '',
  payerZipCode = '',
  payerCity = '',
  metadata = {},
}) {
  const token = await getAccessToken();
  const baseUrl = getHelloAssoBaseUrl();
  const orgSlug = process.env.HELLOASSO_ORGANIZATION_SLUG || 'unisson-association-education-solidaire';
  const siteUrl = process.env.PUBLIC_URL || 'https://education-solidaire.org';

  const payload = {
    totalAmount: Math.round(totalAmount), // En centimes d'euro
    initialAmount: Math.round(totalAmount),
    itemName: itemName || 'Adhésion / Don UNISSON',
    backUrl: `${siteUrl}/?checkout=canceled`,
    errorUrl: `${siteUrl}/?checkout=error`,
    returnUrl: `${siteUrl}/?checkout=success`,
    containsDonation: metadata.isDonation || false,
    payer: {
      firstName: payerFirstName,
      lastName: payerLastName,
      email: payerEmail,
      address: payerAddress || undefined,
      zipCode: payerZipCode || undefined,
      city: payerCity || undefined,
      country: 'FRA',
    },
    metadata: {
      association: 'UNISSON - Éducation Solidaire',
      ...metadata,
    },
  };

  const endpoint = `${baseUrl}/v5/organizations/${orgSlug}/checkout-intents`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur HelloAsso Checkout Intent (${response.status}): ${errText}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    redirectUrl: result.redirectUrl,
  };
}

/**
 * Récupère le statut d'un checkout intent
 * @param {string} checkoutIntentId
 */
export async function getCheckoutIntentStatus(checkoutIntentId) {
  const token = await getAccessToken();
  const baseUrl = getHelloAssoBaseUrl();
  const orgSlug = process.env.HELLOASSO_ORGANIZATION_SLUG;

  const endpoint = `${baseUrl}/v5/organizations/${orgSlug}/checkout-intents/${checkoutIntentId}`;

  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur récupération statut HelloAsso (${response.status}): ${errText}`);
  }

  return await response.json();
}
