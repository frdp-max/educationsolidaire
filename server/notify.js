/**
 * UNISSON — Association Éducation Solidaire
 * Notifications de l'astreinte : email transactionnel Brevo + webhook optionnel (Discord / Slack / SMS)
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const NOTIFY_TIMEOUT_MS = 8000;

/**
 * Échappe les caractères HTML des données saisies par les usagers.
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/**
 * Liste des destinataires de l'astreinte (EMERGENCY_NOTIFY_EMAILS, séparés par des virgules).
 */
export function getEmergencyRecipients() {
  return (process.env.EMERGENCY_NOTIFY_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

/**
 * Construit l'email d'alerte envoyé à l'astreinte.
 */
export function buildEmergencyEmail(alert) {
  const date = new Date(alert.timestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  const rows = [
    ['Référence', alert.id],
    ['Reçue le', date],
    ['Motif', alert.emergencyType],
    ['Demandeur', alert.name],
    ['Téléphone', alert.phone],
    ['Commune', alert.location],
  ];

  const htmlRows = rows.map(([label, value]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;color:#6b1d9e;font-weight:700;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="padding:6px 0">${escapeHtml(value)}</td>
        </tr>`).join('');

  const phoneHref = String(alert.phone || '').replace(/[^0-9+]/g, '');

  return {
    subject: `🚨 Urgence sociale ${alert.id} — ${alert.emergencyType} (${alert.location})`.slice(0, 250),
    htmlContent: `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:24px;background:#faf5ff;font-family:'Open Sans',Arial,sans-serif;color:#1f2937">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f3e8ff">
    <div style="background:#d92d20;color:#fff;padding:16px 24px;font-family:Montserrat,Arial,sans-serif;font-weight:800;font-size:18px">
      Nouveau signalement d'urgence sociale
    </div>
    <div style="padding:20px 24px">
      <table style="border-collapse:collapse;font-size:15px">${htmlRows}
      </table>
      <p style="margin:18px 0 6px;color:#6b1d9e;font-weight:700">Situation décrite</p>
      <p style="margin:0;white-space:pre-wrap;background:#faf5ff;border-radius:8px;padding:12px">${escapeHtml(alert.message)}</p>
      ${phoneHref ? `<p style="margin:20px 0 0"><a href="tel:${phoneHref}" style="display:inline-block;background:#350b52;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">Rappeler le ${escapeHtml(alert.phone)}</a></p>` : ''}
    </div>
    <div style="padding:12px 24px;background:#f3e8ff;font-size:12px;color:#350b52">
      UNISSON — Association Éducation Solidaire · Données confidentielles : ne pas transférer hors de l'équipe d'astreinte.
    </div>
  </div>
</body></html>`,
    textContent: [
      `Nouveau signalement d'urgence sociale ${alert.id}`,
      ...rows.map(([label, value]) => `${label} : ${value}`),
      '',
      'Situation décrite :',
      alert.message,
    ].join('\n'),
  };
}

/**
 * Envoie l'alerte par email via l'API transactionnelle Brevo.
 * Ne fait rien si Brevo n'est pas configuré.
 */
export async function sendEmergencyEmail(alert) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const to = getEmergencyRecipients();

  if (!apiKey || !senderEmail || to.length === 0) {
    return { sent: false, reason: 'not-configured' };
  }

  const { subject, htmlContent, textContent } = buildEmergencyEmail(alert);
  const response = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || 'UNISSON — Alertes urgence' },
      to,
      subject,
      htmlContent,
      textContent,
      tags: ['urgence-sociale'],
    }),
    signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo (${response.status}): ${body.slice(0, 300)}`);
  }
  return { sent: true };
}

/**
 * Envoie l'alerte au webhook d'astreinte optionnel (format Discord / Slack).
 */
export async function sendEmergencyWebhook(alert) {
  const url = process.env.EMERGENCY_WEBHOOK_URL;
  if (!url) return { sent: false, reason: 'not-configured' };

  const text = `🚨 **ALERTE URGENCE UNISSON (${alert.id})**\n- **Type:** ${alert.emergencyType}\n- **Demandeur:** ${alert.name} (${alert.phone})\n- **Commune:** ${alert.location}\n- **Détails:** ${alert.message}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // content = Discord, text = Slack ; allowed_mentions empêche les @everyone saisis par un tiers
    body: JSON.stringify({ content: text.slice(0, 2000), text, allowed_mentions: { parse: [] } }),
    signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Webhook astreinte (${response.status})`);
  }
  return { sent: true };
}

/**
 * Notifie l'astreinte par tous les canaux configurés. Ne lève jamais d'erreur :
 * l'alerte est déjà enregistrée, un échec de notification est seulement journalisé.
 */
export async function notifyEmergency(alert) {
  const results = await Promise.allSettled([sendEmergencyEmail(alert), sendEmergencyWebhook(alert)]);
  const [email, webhook] = results;

  if (email.status === 'rejected') console.error(`[Astreinte] Échec email Brevo pour ${alert.id}:`, email.reason.message);
  if (webhook.status === 'rejected') console.error(`[Astreinte] Échec webhook pour ${alert.id}:`, webhook.reason.message);

  const anySent = results.some((r) => r.status === 'fulfilled' && r.value.sent);
  if (!anySent) {
    console.warn(`[Astreinte] Aucune notification envoyée pour ${alert.id} : vérifier BREVO_* / EMERGENCY_NOTIFY_EMAILS.`);
  }
  return {
    email: email.status === 'fulfilled' ? email.value.sent : false,
    webhook: webhook.status === 'fulfilled' ? webhook.value.sent : false,
  };
}
