import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { buildEmergencyEmail, escapeHtml, notifyEmergency, getEmergencyRecipients } from '../server/notify.js';

const alert = {
  id: 'URG-1-ABCD',
  timestamp: '2026-10-06T20:00:00.000Z',
  name: '<b>Léa</b>',
  phone: '06 12 34 56 78',
  emergencyType: 'Jeune isolé en détresse',
  location: 'Gennevilliers',
  message: 'Besoin d\'un abri ce soir <script>alert(1)</script> @everyone',
};

const ENV_KEYS = ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'BREVO_SENDER_NAME', 'EMERGENCY_NOTIFY_EMAILS', 'EMERGENCY_WEBHOOK_URL'];
let savedEnv;
let savedFetch;
let calls;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  ENV_KEYS.forEach((k) => delete process.env[k]);
  savedFetch = globalThis.fetch;
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return new Response('{"messageId":"x"}', { status: 201 });
  };
});

afterEach(() => {
  globalThis.fetch = savedFetch;
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
});

test('escapeHtml neutralise les balises saisies', () => {
  assert.equal(escapeHtml('<a href="x">\'&'), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
});

test('l\'email d\'alerte échappe les données de l\'usager', () => {
  const { subject, htmlContent, textContent } = buildEmergencyEmail(alert);
  assert.match(subject, /URG-1-ABCD/);
  assert.doesNotMatch(htmlContent, /<script>/);
  assert.doesNotMatch(htmlContent, /<b>Léa<\/b>/);
  assert.match(htmlContent, /&lt;script&gt;/);
  assert.match(htmlContent, /href="tel:0612345678"/);
  assert.match(textContent, /Gennevilliers/);
});

test('destinataires : liste séparée par des virgules', () => {
  process.env.EMERGENCY_NOTIFY_EMAILS = ' a@x.fr, ,b@y.fr ';
  assert.deepEqual(getEmergencyRecipients(), [{ email: 'a@x.fr' }, { email: 'b@y.fr' }]);
});

test('sans configuration : aucun appel réseau', async () => {
  const res = await notifyEmergency(alert);
  assert.deepEqual(res, { email: false, webhook: false });
  assert.equal(calls.length, 0);
});

test('Brevo configuré : appel de l\'API transactionnelle', async () => {
  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_SENDER_EMAIL = 'alertes@education-solidaire.org';
  process.env.EMERGENCY_NOTIFY_EMAILS = 'astreinte@example.fr';

  const res = await notifyEmergency(alert);
  assert.equal(res.email, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(calls[0].options.headers['api-key'], 'test-key');
  assert.deepEqual(calls[0].body.to, [{ email: 'astreinte@example.fr' }]);
  assert.equal(calls[0].body.sender.email, 'alertes@education-solidaire.org');
});

test('webhook d\'astreinte : mentions désactivées', async () => {
  process.env.EMERGENCY_WEBHOOK_URL = 'https://hooks.example.test/x';
  const res = await notifyEmergency(alert);
  assert.equal(res.webhook, true);
  assert.deepEqual(calls[0].body.allowed_mentions, { parse: [] });
});

test('un échec Brevo n\'interrompt pas le webhook et ne lève pas d\'erreur', async () => {
  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_SENDER_EMAIL = 'alertes@education-solidaire.org';
  process.env.EMERGENCY_NOTIFY_EMAILS = 'astreinte@example.fr';
  process.env.EMERGENCY_WEBHOOK_URL = 'https://hooks.example.test/x';
  globalThis.fetch = async (url) => {
    if (String(url).includes('brevo')) return new Response('unauthorized', { status: 401 });
    return new Response('ok', { status: 200 });
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    const res = await notifyEmergency(alert);
    assert.deepEqual(res, { email: false, webhook: true });
  } finally {
    console.error = originalError;
  }
});
