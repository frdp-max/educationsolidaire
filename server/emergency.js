/**
 * UNISSON — Association Éducation Solidaire
 * Gestionnaire des alertes de Premier Secours Social & Urgence
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ALERTS_FILE = path.join(__dirname, '../data/emergency_alerts.json');

// Assurer l'existence du dossier data
async function ensureDataDir() {
  const dir = path.dirname(ALERTS_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(ALERTS_FILE);
    } catch {
      await fs.writeFile(ALERTS_FILE, JSON.stringify([]), 'utf-8');
    }
  } catch (err) {
    console.error('Erreur initialisation dossier data:', err);
  }
}

ensureDataDir();

/**
 * Enregistre une alerte d'urgence
 */
export async function saveEmergencyAlert(alertData) {
  await ensureDataDir();

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
    let list = [];
    try {
      const content = await fs.readFile(ALERTS_FILE, 'utf-8');
      list = JSON.parse(content || '[]');
    } catch {
      list = [];
    }

    list.unshift(alertEntry);
    // Conserver les 500 dernières alertes
    if (list.length > 500) list = list.slice(0, 500);

    await fs.writeFile(ALERTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur écriture fichier alertes:', err);
  }

  // Si un webhook d'astreinte (Discord, Slack ou SMS relay) est configuré
  if (process.env.EMERGENCY_WEBHOOK_URL) {
    try {
      await fetch(process.env.EMERGENCY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚨 **ALERTE URGENCE UNISSON (${alertEntry.id})**\n- **Type:** ${alertEntry.emergencyType}\n- **Demandeur:** ${alertEntry.name} (${alertEntry.phone})\n- **Commune:** ${alertEntry.location}\n- **Détails:** ${alertEntry.message}`,
        }),
      });
    } catch (e) {
      console.error('Erreur notification webhook astreinte:', e.message);
    }
  }

  return alertEntry;
}

/**
 * Récupère les alertes pour l'équipe d'astreinte
 */
export async function getEmergencyAlerts(limit = 50) {
  await ensureDataDir();
  try {
    const content = await fs.readFile(ALERTS_FILE, 'utf-8');
    const list = JSON.parse(content || '[]');
    return list.slice(0, limit);
  } catch {
    return [];
  }
}
