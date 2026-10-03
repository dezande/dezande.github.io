// Tests de la validation des réglages (src/logic/settings.ts).
// Les réglages relus sur un téléphone peuvent venir d'une ancienne version de l'app ou être abîmés :
// l'app doit toujours démarrer avec des réglages utilisables.
// Lancer : npm test
import { DEFAULTS, PREDICTIONS, ZONES, sanitizeSettings } from '../../../src/tours/boule-de-cristal/logic/settings.ts';

const defaults = { ...DEFAULTS };

/* ---------- Données absentes ou illisibles ---------- */

test('rien d’enregistré, ou pas un objet : réglages par défaut', () => {
	for (const raw of [null, undefined, 42, 'réglages', true, [], [1, 2]]) {
		expect(sanitizeSettings(raw), JSON.stringify(raw)).toStrictEqual(defaults);
	}
});

test('réglages valides conservés tels quels', () => {
	const valid = { delay: 2.5, fade: 0.8, brightness: 45, showHoldRing: false };
	expect(sanitizeSettings(valid)).toStrictEqual(valid);
});

test('ancienne version sans l’option d’affichage : la jauge est visible par défaut', () => {
	const old = sanitizeSettings({ delay: 1, fade: 2, brightness: 80 });
	expect(old.showHoldRing).toBe(true);
});

test('ancienne version avec nombre de zones et valeurs : ignorés, autres réglages conservés', () => {
	const old = sanitizeSettings({ zones: 4, values: ['1', '1', '1', '1'], delay: 1, fade: 2, brightness: 80, showHoldRing: false });
	expect(old).toStrictEqual({ delay: 1, fade: 2, brightness: 80, showHoldRing: false });
});

test('ancienne version avec une routine choisie (même Arcane Système) : ignorée, autres réglages conservés', () => {
	for (const routine of ['trois-boulettes', 'arcane-systeme']) {
		const old = sanitizeSettings({ routine, delay: 2, fade: 1, brightness: 70, showHoldRing: true });
		expect(old, routine).toStrictEqual({ delay: 2, fade: 1, brightness: 70, showHoldRing: true });
	}
});

test('options supprimées d’une ancienne version : ignorées', () => {
	const old = sanitizeSettings({ showVersion: false, showHoldTimer: false, showMenuZone: false });
	expect(Object.keys(old).filter((key) => key.startsWith('show'))).toStrictEqual(['showHoldRing']);
	expect(old.showHoldRing).toBe(true);
});

/* ---------- Les 3 boulettes ---------- */

test('une seule routine : 3 bandes, 6 en haut, 16 au milieu, 26 en bas', () => {
	expect(ZONES).toBe(3);
	expect(PREDICTIONS).toStrictEqual(['6', '16', '26']);
	expect(Object.isFrozen(PREDICTIONS)).toBeTruthy();
});

/* ---------- Curseurs ---------- */

test('délai : borné entre 0 et 10 s, arrondi à la demi-seconde', () => {
	const delay = (v: unknown): number => sanitizeSettings({ delay: v }).delay;
	expect([-3, 0, 2.2, 2.3, 7.75, 10, 60].map(delay)).toStrictEqual([0, 0, 2, 2.5, 8, 10, 10]);
});

test('fondu : borné entre 0,5 et 6 s, arrondi au dixième', () => {
	const fade = (v: unknown): number => sanitizeSettings({ fade: v }).fade;
	expect([0, 0.5, 1.234, 1.25, 6, 9].map(fade)).toStrictEqual([0.5, 0.5, 1.2, 1.3, 6, 6]);
});

test('luminosité : bornée entre 30 et 100 %, arrondie à l’entier', () => {
	const brightness = (v: unknown): number => sanitizeSettings({ brightness: v }).brightness;
	expect([0, 30, 55.4, 55.6, 100, 150].map(brightness)).toStrictEqual([30, 30, 55, 56, 100, 100]);
});

test('curseurs qui ne sont pas des nombres finis : valeur par défaut', () => {
	for (const v of ['3', null, NaN, Infinity, -Infinity, true, {}]) {
		const s = sanitizeSettings({ delay: v, fade: v, brightness: v });
		expect([s.delay, s.fade, s.brightness], String(v)).toStrictEqual([DEFAULTS.delay, DEFAULTS.fade, DEFAULTS.brightness]);
	}
});

/* ---------- Option d'affichage ---------- */

test('jauge de l’appui long : seulement de vrais booléens', () => {
	expect(sanitizeSettings({ showHoldRing: false }).showHoldRing).toBe(false);
	for (const v of ['false', 0, null, 'non']) expect(sanitizeSettings({ showHoldRing: v }).showHoldRing, String(v)).toBe(true);
});

/* ---------- Propriétés générales ---------- */

test('valider deux fois ne change rien', () => {
	for (const raw of [null, { routine: 'x', delay: 3.3, fade: 'x', brightness: 12 }, { delay: 11 }]) {
		const once = sanitizeSettings(raw);
		expect(sanitizeSettings(once)).toStrictEqual(once);
	}
});

test('les réglages renvoyés sont une copie : les modifier ne touche pas aux valeurs par défaut', () => {
	const s = sanitizeSettings(null);
	s.delay = 9;
	expect(DEFAULTS.delay).toBe(3);
	expect(sanitizeSettings(null)).toStrictEqual(defaults);
});

test('champs inconnus ignorés', () => {
	expect(Object.keys(sanitizeSettings({ extra: 1, zones: 2, values: ['1'] })).sort()).toStrictEqual(Object.keys(DEFAULTS).sort());
});
