import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateCheckout, validateEmergencyAlert, safeCompare } from '../server/validation.js';

const checkout = (overrides = {}) => validateCheckout({
  amount: 30,
  name: 'Marie Curie',
  email: 'marie@example.fr',
  title: 'Don libre',
  ...overrides,
});

test('checkout : le montant en euros est toujours converti en centimes', () => {
  assert.equal(checkout({ amount: 30 }).value.amountInCents, 3000);
  assert.equal(checkout({ amount: 100 }).value.amountInCents, 10000);
  // Régression : 150 € était facturé 1,50 € (montant > 100 interprété comme des centimes)
  assert.equal(checkout({ amount: 150 }).value.amountInCents, 15000);
  assert.equal(checkout({ amount: 12.5 }).value.amountInCents, 1250);
  assert.equal(checkout({ amount: '20,50' }).value.amountInCents, 2050);
});

test('checkout : montants hors bornes ou invalides refusés', () => {
  for (const amount of [0, -5, 0.5, 10001, 'abc', NaN, Infinity, {}, []]) {
    assert.equal(checkout({ amount }).ok, false, `montant ${String(amount)}`);
  }
});

test('checkout : champs obligatoires et email', () => {
  assert.equal(checkout({ amount: undefined }).ok, false);
  assert.equal(checkout({ name: '' }).ok, false);
  assert.equal(checkout({ email: '' }).ok, false);
  assert.equal(checkout({ email: 'pas-un-email' }).ok, false);
  assert.equal(checkout({ email: 'a@b' }).ok, false);
});

test('checkout : découpage prénom / nom', () => {
  const { value } = checkout({ name: '  Jean   de la Fontaine ' });
  assert.equal(value.firstName, 'Jean');
  assert.equal(value.lastName, 'de la Fontaine');
  assert.equal(checkout({ name: 'Cher' }).value.lastName, 'UNISSON');
});

test('checkout : longueurs maximales et types inattendus', () => {
  assert.equal(checkout({ title: 'x'.repeat(251) }).ok, false);
  assert.equal(checkout({ name: { $ne: 1 } }).ok, false);
  assert.equal(checkout({ zipCode: '<script>' }).ok, false);
  assert.equal(checkout({ isDonation: 'yes' }).value.isDonation, false);
  assert.equal(checkout({ isDonation: true }).value.isDonation, true);
});

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
