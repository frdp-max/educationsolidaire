/**
 * UNISSON — Association Éducation Solidaire
 * Validation & normalisation des entrées utilisateurs
 */

import crypto from 'crypto';

export const DONATION_MIN_EUROS = 1;
export const DONATION_MAX_EUROS = 10000;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
// Numéros français ou internationaux : chiffres, espaces, points, tirets, parenthèses, + initial
const PHONE_RE = /^\+?[0-9 .()-]{6,25}$/;
const ZIP_RE = /^[0-9A-Za-z -]{0,10}$/;

/**
 * Normalise une chaîne : type string, trim, suppression des caractères de contrôle, longueur max.
 * Retourne null si la valeur dépasse la longueur autorisée.
 */
function cleanString(value, maxLength) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  // eslint-disable-next-line no-control-regex
  const str = String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return str.length > maxLength ? null : str;
}

/**
 * Valide un signalement d'urgence sociale.
 * @returns {{ ok: true, value: object } | { ok: false, error: string }}
 */
export function validateEmergencyAlert(body = {}) {
  const name = cleanString(body.name, 100);
  const phone = cleanString(body.phone, 25);
  const emergencyType = cleanString(body.emergencyType, 120);
  const location = cleanString(body.location, 120);
  const message = cleanString(body.message, 3000);

  if ([name, phone, emergencyType, location, message].includes(null)) {
    return { ok: false, error: 'Un ou plusieurs champs dépassent la longueur autorisée.' };
  }
  if (!phone || !emergencyType || !message) {
    return { ok: false, error: 'Veuillez remplir le téléphone, le motif d\'urgence et les précisions.' };
  }
  if (!PHONE_RE.test(phone) || phone.replace(/\D/g, '').length < 6) {
    return { ok: false, error: 'Le numéro de téléphone semble invalide.' };
  }

  return { ok: true, value: { name, phone, emergencyType, location, message } };
}

/**
 * Valide une demande de checkout HelloAsso (don ou adhésion).
 * Le montant est toujours exprimé en euros par le frontend et converti ici en centimes.
 * @returns {{ ok: true, value: object } | { ok: false, error: string }}
 */
export function validateCheckout(body = {}) {
  const name = cleanString(body.name, 120);
  const email = cleanString(body.email, 254);
  const title = cleanString(body.title, 250);
  const address = cleanString(body.address, 200);
  const zipCode = cleanString(body.zipCode, 10);
  const city = cleanString(body.city, 100);

  if ([name, email, title, address, zipCode, city].includes(null)) {
    return { ok: false, error: 'Un ou plusieurs champs dépassent la longueur autorisée.' };
  }

  const amount = typeof body.amount === 'string' ? Number(body.amount.replace(',', '.')) : body.amount;
  if (body.amount === undefined || body.amount === null || body.amount === '' || !name || !email) {
    return { ok: false, error: 'Paramètres manquants : amount, name et email sont obligatoires.' };
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount)
      || amount < DONATION_MIN_EUROS || amount > DONATION_MAX_EUROS) {
    return {
      ok: false,
      error: `Le montant doit être compris entre ${DONATION_MIN_EUROS} € et ${DONATION_MAX_EUROS} €.`,
    };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'L\'adresse email semble invalide.' };
  }
  if (zipCode && !ZIP_RE.test(zipCode)) {
    return { ok: false, error: 'Le code postal semble invalide.' };
  }

  const parts = name.split(/\s+/);
  return {
    ok: true,
    value: {
      amountInCents: Math.round(amount * 100),
      firstName: parts[0] || 'Adhérent',
      lastName: parts.slice(1).join(' ') || 'UNISSON',
      email,
      title: title || 'Adhésion / Don UNISSON',
      address,
      zipCode,
      city,
      isDonation: body.isDonation === true || body.isDonation === 'true',
    },
  };
}

/**
 * Comparaison à temps constant d'une clé fournie avec la clé attendue.
 */
export function safeCompare(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
