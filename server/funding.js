/**
 * UNISSON — Association Éducation Solidaire
 * Suivi du premier palier de financement (jauge publique du site)
 *
 * Montant collecté = paiements HelloAsso autorisés depuis FUNDING_START_DATE
 *                  + FUNDING_OFFLINE_EUR (virements, chèques, mécénat hors HelloAsso).
 */

import { getAccessToken, getHelloAssoBaseUrl, hasHelloAssoCredentials } from './helloasso.js';

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_PAGES = 50;

let cache = null; // { value, expiresAt }

function eurosFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(String(raw).replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function getFundingConfig() {
  return {
    goal: eurosFromEnv('FUNDING_GOAL_EUR', 16000),
    offline: eurosFromEnv('FUNDING_OFFLINE_EUR', 0),
    startDate: process.env.FUNDING_START_DATE || '2026-10-01',
  };
}

/**
 * Somme (en centimes) des paiements HelloAsso autorisés depuis `from`.
 */
export async function sumHelloAssoPayments(from) {
  const token = await getAccessToken();
  const orgSlug = process.env.HELLOASSO_ORGANIZATION_SLUG || 'education-solidaire';
  let totalCents = 0;
  let continuationToken = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const params = new URLSearchParams({ from, pageSize: '100', states: 'Authorized' });
    if (continuationToken) params.set('continuationToken', continuationToken);
    else params.set('pageIndex', String(page));

    const response = await fetch(`${getHelloAssoBaseUrl()}/v5/organizations/${orgSlug}/payments?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`Lecture des paiements HelloAsso impossible (${response.status})`);
    }

    const { data = [], pagination = {} } = await response.json();
    for (const payment of data) {
      if (payment.state === 'Authorized' && Number.isFinite(payment.amount)) totalCents += payment.amount;
    }

    const lastPage = data.length === 0 || (pagination.totalPages !== undefined && page >= pagination.totalPages);
    if (lastPage) break;
    // Pagination par jeton si l'API en fournit un, sinon par numéro de page
    continuationToken = pagination.continuationToken || null;
  }
  return totalCents;
}

/**
 * État du palier : { goal, raised, percent, online, updatedAt }.
 * Mis en cache 10 minutes ; en cas d'indisponibilité de HelloAsso, la dernière valeur connue est conservée.
 */
export async function getFundingStatus({ now = Date.now() } = {}) {
  if (cache && cache.expiresAt > now) return cache.value;

  const { goal, offline, startDate } = getFundingConfig();
  let onlineEuros = null;

  if (hasHelloAssoCredentials()) {
    try {
      onlineEuros = (await sumHelloAssoPayments(startDate)) / 100;
    } catch (error) {
      console.error('[Palier] HelloAsso indisponible :', error.message);
      if (cache) return cache.value;
    }
  }

  const raised = Math.round((offline + (onlineEuros ?? 0)) * 100) / 100;
  const value = {
    goal,
    raised,
    percent: goal > 0 ? Math.min(100, Math.floor((raised / goal) * 100)) : 0,
    online: onlineEuros !== null,
    updatedAt: new Date(now).toISOString(),
  };
  cache = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}

export function resetFundingCache() {
  cache = null;
}
