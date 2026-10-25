/**
 * UNISSON — Association Éducation Solidaire
 * Validation & normalisation des entrées utilisateurs
 */

import crypto from 'crypto';

// Numéros français ou internationaux : chiffres, espaces, points, tirets, parenthèses, + initial
const PHONE_RE = /^\+?[0-9 .()-]{6,25}$/;

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
 * Comparaison à temps constant d'une clé fournie avec la clé attendue.
 */
export function safeCompare(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
