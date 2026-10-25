import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateEmergencyAlert, safeCompare } from '../server/validation.js';

const alert = (overrides = {}) => validateEmergencyAlert({
  name: 'M. Dupont',
  phone: '06 12 34 56 78',
  emergencyType: 'Jeune isolé en détresse',
  location: 'Gennevilliers',
  message: 'Besoin d\'une mise à l\'abri ce soir.',
  ...overrides,
});

test('urgence : signalement valide accepté et normalisé', () => {
  const res = alert({ name: '  M. Dupont\u0007 ' });
  assert.equal(res.ok, true);
  assert.equal(res.value.name, 'M. Dupont');
  assert.equal(alert({ phone: '+33 6 12 34 56 78' }).ok, true);
  assert.equal(alert({ name: undefined, location: undefined }).ok, true);
});

test('urgence : champs obligatoires, téléphone et longueurs', () => {
  assert.equal(alert({ phone: '' }).ok, false);
  assert.equal(alert({ message: '   ' }).ok, false);
  assert.equal(alert({ emergencyType: '' }).ok, false);
  assert.equal(alert({ phone: 'appelez-moi' }).ok, false);
  assert.equal(alert({ phone: '12' }).ok, false);
  assert.equal(alert({ message: 'x'.repeat(3001) }).ok, false);
  assert.equal(alert({ name: ['a', 'b'] }).ok, false);
});

test('safeCompare', () => {
  assert.equal(safeCompare('abc', 'abc'), true);
  assert.equal(safeCompare('abc', 'abd'), false);
  assert.equal(safeCompare(undefined, 'abc'), false);
  assert.equal(safeCompare('', 'abc'), false);
});
