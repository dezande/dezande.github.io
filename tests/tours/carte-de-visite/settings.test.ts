// Tests de la validation des réglages de la carte de visite (src/tours/carte-de-visite/logic/settings.ts).
// Lancer : npm test
import { DEFAULTS, NUMEROS, ZONES, sanitizeSettings } from '../../../src/tours/carte-de-visite/logic/settings.ts';

test('Arcane Système : 4 coins, 17, 19, 21, 23 dans le sens de la lecture', () => {
	expect(ZONES).toBe(4);
	expect(NUMEROS).toStrictEqual(['17', '19', '21', '23']);
	expect(Object.isFrozen(NUMEROS)).toBeTruthy();
});

test('rien d’enregistré, ou pas un objet : réglages par défaut', () => {
	for (const raw of [null, undefined, 42, 'réglages', true, []]) expect(sanitizeSettings(raw), JSON.stringify(raw)).toStrictEqual({ ...DEFAULTS });
});

test('réglages valides conservés, champs inconnus ignorés', () => {
	const valid = { delay: 2.5, fade: 0.8, brightness: 45, showHoldRing: false };
	expect(sanitizeSettings({ ...valid, routine: 'arcane-systeme', zones: 3 })).toStrictEqual(valid);
});

test('curseurs bornés et arrondis au pas', () => {
	const s = sanitizeSettings({ delay: 60, fade: 1.234, brightness: 12 });
	expect([s.delay, s.fade, s.brightness]).toStrictEqual([10, 1.2, 30]);
	expect(sanitizeSettings({ delay: '3' }).delay).toBe(DEFAULTS.delay);
});
