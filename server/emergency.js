/**
 * UNISSON — Association Éducation Solidaire
 * Gestionnaire des alertes de Premier Secours Social & Urgence
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { notifyEmergency } from './notify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ALERTS_FILE = process.env.EMERGENCY_ALERTS_FILE
  || path.join(__dirname, '../data/emergency_alerts.json');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Durée de conservation des demandes (RGPD) : 6 mois au plus, comme l'annonce
 * politique-confidentialite.html (§ 3). EMERGENCY_RETENTION_DAYS ne peut que la raccourcir.
 */
export const MAX_RETENTION_DAYS = 180;

export function getRetentionDays() {
  const value = Number.parseInt(process.env.EMERGENCY_RETENTION_DAYS, 10);
  if (!Number.isFinite(value) || value < 1) return MAX_RETENTION_DAYS;
  return Math.min(value, MAX_RETENTION_DAYS);
}

/**
 * Retire les demandes reçues il y a plus de `retentionDays` jours.
 * Une demande sans date lisible est retirée : on ne peut pas prouver qu'elle est encore dans le délai.
 */
export function purgeExpiredAlerts(list, now = Date.now(), retentionDays = getRetentionDays()) {
  const limit = now - retentionDays * DAY_MS;
  return list.filter((alert) => {
    const time = Date.parse(alert?.timestamp);
    return Number.isFinite(time) && time >= limit;
  });
}

// Toutes les lectures-écritures du fichier passent par cette file : la purge périodique
// et un nouvel enregistrement ne peuvent pas s'écraser mutuellement.
let queue = Promise.resolve();
function withFileLock(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

async function readAlerts() {
  try {
    const content = await fs.readFile(ALERTS_FILE, 'utf-8');
    const list = JSON.parse(content || '[]');
    return Array.isArray(list) ? list : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAlerts(list) {
  await fs.mkdir(path.dirname(ALERTS_FILE), { recursive: true });
  const tmp = `${ALERTS_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), 'utf-8');
  await fs.rename(tmp, ALERTS_FILE);
}

/**
 * Supprime du fichier les demandes dont le délai de conservation est dépassé.
 * Retourne le nombre de demandes supprimées (jamais leur contenu, pour ne rien journaliser de personnel).
 */
export function purgeAlertsFile(now = Date.now()) {
  return withFileLock(async () => {
    const list = await readAlerts();
    const kept = purgeExpiredAlerts(list, now);
    const removed = list.length - kept.length;
    if (removed > 0) {
      await writeAlerts(kept);
      console.log(`[RGPD] ${removed} demande(s) de plus de ${getRetentionDays()} jours supprimée(s).`);
    }
    return removed;
  });
}

/**
 * Lance la purge au démarrage puis une fois par jour (appelé par server/index.js).
 */
export function startRetentionSchedule() {
  const run = () => purgeAlertsFile().catch((err) => {
    console.error('[RGPD] Échec de la purge des demandes :', err.message);
  });
  run();
  const timer = setInterval(run, DAY_MS);
  timer.unref();
  return timer;
}

/**
 * Enregistre une alerte d'urgence
 */
export async function saveEmergencyAlert(alertData) {
  const alertEntry = {
    id: `URG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    status: 'NOUVELLE', // NOUVELLE | EN_COURS | PRISE_EN_CHARGE | CLOTUREE
    name: alertData.name || 'Anonyme',
    phone: alertData.phone || '',
    emergencyType: alertData.emergencyType || 'Non spécifié',
    location: alertData.location || 'Île-de-France',
    message: alertData.message || '',
    ip: alertData.ip || null,
  };

  try {
    await withFileLock(async () => {
      let list;
      try {
        list = await readAlerts();
      } catch {
        list = [];
      }
      list = purgeExpiredAlerts(list);
      list.unshift(alertEntry);
      // Conserver les 500 dernières alertes
      if (list.length > 500) list = list.slice(0, 500);
      await writeAlerts(list);
    });
  } catch (err) {
    console.error('Erreur écriture fichier alertes:', err);
  }

  // Notification de l'astreinte (Brevo + webhook) sans retarder la réponse à la personne
  notifyEmergency(alertEntry);

  return alertEntry;
}

/**
 * Récupère les alertes pour l'équipe d'astreinte (jamais celles dont le délai est dépassé)
 */
export async function getEmergencyAlerts(limit = 50) {
  try {
    const list = await withFileLock(readAlerts);
    return purgeExpiredAlerts(list).slice(0, limit);
  } catch {
    return [];
  }
}
