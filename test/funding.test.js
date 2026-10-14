import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { getFundingStatus, resetFundingCache } = await import('../server/funding.js');
const { hasHelloAssoCredentials } = await import('../server/helloasso.js');

const realFetch = globalThis.fetch;
const ENV_KEYS = ['HELLOASSO_CLIENT_ID', 'HELLOASSO_CLIENT_SECRET', 'HELLOASSO_ENV',
  'FUNDING_GOAL_EUR', 'FUNDING_OFFLINE_EUR', 'FUNDING_START_DATE'];
let savedEnv;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  resetFundingCache();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
});

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('les valeurs d\'exemple du .env ne comptent pas comme des clés HelloAsso', () => {
  process.env.HELLOASSO_CLIENT_ID = 'VOTRE_CLIENT_ID_HELLOASSO';
  process.env.HELLOASSO_CLIENT_SECRET = 'VOTRE_CLIENT_SECRET_HELLOASSO';
  assert.equal(hasHelloAssoCredentials(), false);
  process.env.HELLOASSO_CLIENT_ID = 'abc';
  process.env.HELLOASSO_CLIENT_SECRET = 'def';
  assert.equal(hasHelloAssoCredentials(), true);
});

test('la jauge additionne les paiements HelloAsso autorisés (toutes pages) et les dons hors ligne', async () => {
  process.env.HELLOASSO_CLIENT_ID = 'id-test-funding';
  process.env.HELLOASSO_CLIENT_SECRET = 'secret-test';
  process.env.HELLOASSO_ENV = 'sandbox';
  process.env.FUNDING_GOAL_EUR = '16000';
  process.env.FUNDING_OFFLINE_EUR = '1000';
  process.env.FUNDING_START_DATE = '2026-10-01';

  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith('/oauth2/token')) return json({ access_token: 'tok', expires_in: 1800 });
    const page = new URL(url).searchParams.get('pageIndex');
    if (page === '1') {
      return json({ data: [{ amount: 5000, state: 'Authorized' }, { amount: 9900, state: 'Refunded' }], pagination: { totalPages: 2 } });
    }
    return json({ data: [{ amount: 300000, state: 'Authorized' }], pagination: { totalPages: 2 } });
  };

  const status = await getFundingStatus();
  assert.equal(status.raised, 1000 + 50 + 3000);
  assert.equal(status.percent, 25);
  assert.equal(status.online, true);
  const paymentsCall = calls.find((u) => u.includes('/payments'));
  assert.match(paymentsCall, /from=2026-10-01/);
  assert.match(paymentsCall, /states=Authorized/);
});

test('HelloAsso indisponible : la jauge reste servie avec les montants hors ligne', async () => {
  process.env.HELLOASSO_CLIENT_ID = 'id-test-panne';
  process.env.HELLOASSO_CLIENT_SECRET = 'secret-test';
  process.env.FUNDING_OFFLINE_EUR = '500';
  globalThis.fetch = async () => json({ error: 'boom' }, 500);

  const status = await getFundingStatus();
  assert.equal(status.raised, 500);
  assert.equal(status.online, false);
});
