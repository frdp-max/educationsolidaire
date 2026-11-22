import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'unisson-rgpd-'));
const file = path.join(tmpDir, 'emergency_alerts.json');
process.env.EMERGENCY_ALERTS_FILE = file;
delete process.env.BREVO_API_KEY;
delete process.env.EMERGENCY_WEBHOOK_URL;

const {
  purgeExpiredAlerts, purgeAlertsFile, getRetentionDays, saveEmergencyAlert, getEmergencyAlerts, MAX_RETENTION_DAYS,
} = await import('../server/emergency.js');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-22T12:00:00Z');
const at = (daysAgo, id) => ({ id, timestamp: new Date(NOW - daysAgo * DAY).toISOString() });

const quiet = { log: console.log, warn: console.warn };
before(() => { console.log = () => {}; console.warn = () => {}; });
after(async () => {
  Object.assign(console, quiet);
  await fs.rm(tmpDir, { recursive: true, force: true });
});
beforeEach(() => { delete process.env.EMERGENCY_RETENTION_DAYS; });

test('durée de conservation : 180 jours par défaut, jamais plus', () => {
  assert.equal(getRetentionDays(), MAX_RETENTION_DAYS);
  process.env.EMERGENCY_RETENTION_DAYS = '30';
  assert.equal(getRetentionDays(), 30);
  process.env.EMERGENCY_RETENTION_DAYS = '400';
  assert.equal(getRetentionDays(), 180);
  process.env.EMERGENCY_RETENTION_DAYS = 'abc';
  assert.equal(getRetentionDays(), 180);
  process.env.EMERGENCY_RETENTION_DAYS = '0';
  assert.equal(getRetentionDays(), 180);
});

test('purgeExpiredAlerts garde les demandes de moins de 180 jours et retire les autres', () => {
  const list = [at(1, 'recente'), at(179, 'limite'), at(181, 'ancienne'), { id: 'sans-date' }, { id: 'date-invalide', timestamp: 'x' }];
  assert.deepEqual(purgeExpiredAlerts(list, NOW).map((a) => a.id), ['recente', 'limite']);
});

test('purgeAlertsFile réécrit le fichier et ne compte que les suppressions', async () => {
  await fs.writeFile(file, JSON.stringify([at(2, 'a'), at(200, 'b'), at(365, 'c')]));
  assert.equal(await purgeAlertsFile(NOW), 2);
  assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf-8')).map((a) => a.id), ['a']);
  assert.equal(await purgeAlertsFile(NOW), 0);
});

test('purgeAlertsFile sans fichier ne plante pas', async () => {
  await fs.rm(file, { force: true });
  assert.equal(await purgeAlertsFile(NOW), 0);
});

test('un nouvel enregistrement purge aussi les demandes expirées', async () => {
  await fs.writeFile(file, JSON.stringify([at(200, 'vieille')]));
  const saved = await saveEmergencyAlert({ name: 'Test', phone: '0600000000', message: 'essai' });
  const ids = JSON.parse(await fs.readFile(file, 'utf-8')).map((a) => a.id);
  assert.deepEqual(ids, [saved.id]);
});

test('getEmergencyAlerts ne renvoie jamais une demande expirée', async () => {
  const old = { id: 'vieille', timestamp: new Date(Date.now() - 200 * DAY).toISOString() };
  const recent = { id: 'recente', timestamp: new Date().toISOString() };
  await fs.writeFile(file, JSON.stringify([recent, old]));
  assert.deepEqual((await getEmergencyAlerts()).map((a) => a.id), ['recente']);
});

test('enregistrements simultanés : aucune demande perdue', async () => {
  await fs.writeFile(file, '[]');
  const saved = await Promise.all(Array.from({ length: 10 }, (_, i) => saveEmergencyAlert({ name: `P${i}` })));
  const ids = new Set(JSON.parse(await fs.readFile(file, 'utf-8')).map((a) => a.id));
  assert.equal(ids.size, 10);
  for (const s of saved) assert.ok(ids.has(s.id));
});
