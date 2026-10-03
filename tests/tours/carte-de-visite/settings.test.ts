// Tests de la validation des réglages de la carte de visite (src/tours/carte-de-visite/logic/settings.ts).
// Lancer : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, NUMEROS, ZONES, sanitizeSettings } from '../../../src/tours/carte-de-visite/logic/settings.ts';

test('Arcane Système : 4 coins, 17, 19, 21, 23 dans le sens de la lecture', () => {
	assert.equal(ZONES, 4);
	assert.deepEqual(NUMEROS, ['17', '19', '21', '23']);
	assert.ok(Object.isFrozen(NUMEROS));
});

test('rien d’enregistré, ou pas un objet : réglages par défaut', () => {
	for (const raw of [null, undefined, 42, 'réglages', true, []]) assert.deepEqual(sanitizeSettings(raw), { ...DEFAULTS }, JSON.stringify(raw));
});

test('réglages valides conservés, champs inconnus ignorés', () => {
	const valid = { delay: 2.5, fade: 0.8, brightness: 45, showHoldRing: false };
	assert.deepEqual(sanitizeSettings({ ...valid, routine: 'arcane-systeme', zones: 3 }), valid);
});

test('curseurs bornés et arrondis au pas', () => {
	const s = sanitizeSettings({ delay: 60, fade: 1.234, brightness: 12 });
	assert.deepEqual([s.delay, s.fade, s.brightness], [10, 1.2, 30]);
	assert.equal(sanitizeSettings({ delay: '3' }).delay, DEFAULTS.delay);
});
