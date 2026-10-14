import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'unisson-test-'));
process.env.NODE_ENV = 'test';
process.env.EMERGENCY_ALERTS_FILE = path.join(tmpDir, 'emergency_alerts.json');
process.env.ADMIN_SECRET_KEY = 'cle-de-test-suffisamment-longue';
delete process.env.HELLOASSO_CLIENT_ID;
delete process.env.HELLOASSO_CLIENT_SECRET;
delete process.env.EMERGENCY_WEBHOOK_URL;

const { app } = await import('../server/app.js');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const post = (url, body) => fetch(base + url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

test('les routes d\'alias historiques répondent', async () => {
  for (const route of ['/', '/mentions-legales', '/politique-confidentialite',
    '/conditions-generales', '/statuts', '/flyer-a3', '/flyer-a5', '/infographie-a5']) {
    const res = await fetch(base + route);
    assert.equal(res.status, 200, route);
    assert.match(res.headers.get('content-type'), /text\/html/, route);
  }
});

test('les ressources publiques sont servies', async () => {
  for (const file of ['/logo.svg', '/logo.png', '/logo-192.png', '/favicon.ico', '/apple-touch-icon.png', '/hero-visuel.webp',
    '/flyer-visuel.jpg', '/UNISSON_Flyer_A5.pdf', '/UNISSON_Infographie_A5.pdf']) {
    const res = await fetch(base + file);
    assert.equal(res.status, 200, file);
    assert.doesNotMatch(res.headers.get('content-type'), /text\/html/, file);
  }
});

test('les fichiers internes et les données ne sont jamais servis', async () => {
  for (const file of ['/data/emergency_alerts.json', '/server/index.js', '/server/helloasso.js',
    '/.env', '/package.json', '/deploy.sh', '/docker-compose.yml', '/nginx/default.conf',
    '/UNISSON_Feuille_de_route_operationnelle.docx', '/CLAUDE.md']) {
    const res = await fetch(base + file);
    const body = await res.text();
    // Le fallback renvoie la page 404, jamais le fichier demandé
    assert.equal(res.status, 404, file);
    assert.match(res.headers.get('content-type'), /text\/html/, file);
    assert.match(body, /Cette page n'existe pas/, file);
  }
});

test('une URL inconnue renvoie une vraie 404 (pas l\'accueil)', async () => {
  const res = await fetch(`${base}/page-inexistante`);
  assert.equal(res.status, 404);
  const body = await res.text();
  assert.match(body, /noindex/);
  assert.match(body, /tel:115/);
});

test('robots.txt et sitemap.xml sont servis avec le bon type', async () => {
  const robots = await fetch(`${base}/robots.txt`);
  assert.equal(robots.status, 200);
  assert.match(robots.headers.get('content-type'), /text\/plain/);
  assert.match(await robots.text(), /Sitemap: https:\/\/education-solidaire\.org\/sitemap\.xml/);

  const sitemap = await fetch(`${base}/sitemap.xml`);
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('content-type'), /xml/);
  const xml = await sitemap.text();
  for (const route of ['/', '/statuts', '/mentions-legales', '/politique-confidentialite', '/conditions-generales']) {
    assert.ok(xml.includes(`<loc>https://education-solidaire.org${route}</loc>`), route);
  }
  assert.ok(!xml.includes('flyer'), 'les supports print ne sont pas dans le sitemap');
});

test('llms.txt est servi en texte et renvoie vers les numéros d\'urgence', async () => {
  const res = await fetch(`${base}/llms.txt`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/plain/);
  const body = await res.text();
  assert.match(body, /SIREN 108 606 260/);
  assert.match(body, /115/);
});

test('la FAQ visible et son JSON-LD FAQPage restent identiques', async () => {
  const html = await (await fetch(base + '/')).text();
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]));
  const faq = blocks.find((b) => b['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage présent');
  const questions = [...html.matchAll(/<article class="faq-item">\s*<h3>(.*?)<\/h3>/g)].map((m) => m[1]);
  assert.deepEqual(faq.mainEntity.map((q) => q.name), questions);
});

test('les URL en .html redirigent (301) vers l\'URL canonique', async () => {
  const cases = { '/index.html': '/', '/statuts.html': '/statuts', '/index.html?checkout=success': '/?checkout=success' };
  for (const [from, to] of Object.entries(cases)) {
    const res = await fetch(base + from, { redirect: 'manual' });
    assert.equal(res.status, 301, from);
    assert.equal(res.headers.get('location'), to, from);
  }
});

test('la page 404 n\'est pas accessible directement en 200', async () => {
  assert.equal((await fetch(`${base}/404.html`)).status, 404);
});

test('route API inconnue : 404 JSON', async () => {
  const res = await fetch(`${base}/api/inexistante`);
  assert.equal(res.status, 404);
});

test('signalement d\'urgence : validation puis enregistrement', async () => {
  let res = await post('/api/emergency/alert', { phone: '0612345678' });
  assert.equal(res.status, 400);

  res = await post('/api/emergency/alert', {
    name: 'Test', phone: '06 12 34 56 78', emergencyType: 'Autre urgence sociale',
    location: 'Gennevilliers', message: 'Test automatisé',
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.match(data.alertId, /^URG-/);
});

test('consultation des alertes : clé uniquement via en-tête', async () => {
  assert.equal((await fetch(`${base}/api/emergency/alerts`)).status, 401);
  assert.equal((await fetch(`${base}/api/emergency/alerts?key=${process.env.ADMIN_SECRET_KEY}`)).status, 401);
  assert.equal((await fetch(`${base}/api/emergency/alerts`, { headers: { 'X-Admin-Key': 'mauvaise' } })).status, 401);

  const res = await fetch(`${base}/api/emergency/alerts`, {
    headers: { 'X-Admin-Key': process.env.ADMIN_SECRET_KEY },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.count, 1);
});

test('consultation des alertes désactivée sans clé configurée', async () => {
  const saved = process.env.ADMIN_SECRET_KEY;
  delete process.env.ADMIN_SECRET_KEY;
  try {
    const res = await fetch(`${base}/api/emergency/alerts`, { headers: { 'X-Admin-Key': 'unisson-secure-2026' } });
    assert.equal(res.status, 503);
  } finally {
    process.env.ADMIN_SECRET_KEY = saved;
  }
});

test('checkout : montant invalide refusé, montant valide redirigé (mode simulation)', async () => {
  let res = await post('/api/helloasso/checkout', { amount: 0, name: 'A B', email: 'a@b.fr' });
  assert.equal(res.status, 400);

  res = await post('/api/helloasso/checkout', { amount: 150, name: 'A B', email: 'a@b.fr', isDonation: true });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.simulated, true);
  assert.match(data.redirectUrl, /^https:\/\/www\.helloasso\.com\//);
});

test('la CSP autorise les gestionnaires inline du site (onclick)', async () => {
  const res = await fetch(base + '/');
  const csp = res.headers.get('content-security-policy');
  assert.match(csp, /script-src-attr 'unsafe-inline'/);
  assert.doesNotMatch(csp, /img-src[^;]*http:/);
});

test('webhook HelloAsso : secret dans l\'URL (compte association)', async () => {
  process.env.HELLOASSO_WEBHOOK_SECRET = 'secret-webhook-de-test';
  try {
    const payload = { eventType: 'Form', data: { id: 1 } };
    assert.equal((await post('/api/helloasso/webhook', payload)).status, 401);
    assert.equal((await post('/api/helloasso/webhook?secret=mauvais', payload)).status, 401);
    assert.equal((await post('/api/helloasso/webhook?secret=secret-webhook-de-test', payload)).status, 200);
  } finally {
    delete process.env.HELLOASSO_WEBHOOK_SECRET;
  }
});

test('webhook HelloAsso : signature HMAC x-ha-signature (compte partenaire)', async () => {
  const { createHmac } = await import('crypto');
  process.env.HELLOASSO_WEBHOOK_SIGNATURE_KEY = 'cle-signature-de-test';
  try {
    const body = JSON.stringify({ eventType: 'Form', data: { id: 2 } });
    const sign = (b) => createHmac('sha256', 'cle-signature-de-test').update(b).digest('hex');
    const send = (signature, b = body) => fetch(`${base}/api/helloasso/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(signature ? { 'x-ha-signature': signature } : {}) },
      body: b,
    });

    assert.equal((await send(null)).status, 401);
    assert.equal((await send('00'.repeat(32))).status, 401);
    // Corps modifié après signature
    assert.equal((await send(sign(body), body.replace('2', '3'))).status, 401);
    assert.equal((await send(sign(body))).status, 200);
  } finally {
    delete process.env.HELLOASSO_WEBHOOK_SIGNATURE_KEY;
  }
});

test('webhook HelloAsso : sans secret configuré, acquitté (compatibilité)', async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const res = await post('/api/helloasso/webhook', { eventType: 'Payment', data: { id: 123 } });
    assert.equal(res.status, 200);
  } finally {
    console.warn = originalWarn;
  }
});

test('jauge du premier palier : objectif et montants hors HelloAsso, sans clés API', async () => {
  const res = await fetch(`${base}/api/funding`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.goal, 16000);
  assert.equal(data.raised, 0);
  assert.equal(data.percent, 0);
  assert.equal(data.online, false);
});
