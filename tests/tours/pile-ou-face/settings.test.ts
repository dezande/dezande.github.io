// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, DELAI_MAX, DESSINS, sanitizeSettings, TEINTES } from '../../../src/tours/pile-ou-face/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { langue: 'en', motif: 'nouveau', couleur: 'rouge', delai: 3.5, showHoldRing: false } as const;
	assert.deepEqual(sanitizeSettings(valides), valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	assert.deepEqual(
		sanitizeSettings({ langue: 'de', motif: 'baroque', couleur: 'rouge', delai: 2, showHoldRing: false }),
		{ langue: DEFAULTS.langue, motif: DEFAULTS.motif, couleur: 'rouge', delai: 2, showHoldRing: false },
	);
	assert.deepEqual(
		sanitizeSettings({ langue: 'fr', motif: 'deco', couleur: 'vert', delai: '3', showHoldRing: 'oui' }),
		{ langue: 'fr', motif: 'deco', couleur: DEFAULTS.couleur, delai: DEFAULTS.delai, showHoldRing: DEFAULTS.showHoldRing },
	);
});

test('des données absentes ou abîmées donnent les réglages par défaut', () => {
	for (const raw of [null, undefined, 'x', 42, []]) assert.deepEqual(sanitizeSettings(raw), DEFAULTS);
});

test('par défaut, la carte se retourne au toucher', () => {
	assert.equal(DEFAULTS.delai, 0);
});

test('le délai est borné et arrondi à la demi-seconde du curseur', () => {
	assert.equal(sanitizeSettings({ delai: -2 }).delai, 0);
	assert.equal(sanitizeSettings({ delai: 99 }).delai, DELAI_MAX);
	assert.equal(sanitizeSettings({ delai: 2.3 }).delai, 2.5);
	assert.equal(sanitizeSettings({ delai: Number.NaN }).delai, DEFAULTS.delai);
});

test('la langue du téléphone sert de défaut tant qu’aucune n’est enregistrée', () => {
	assert.equal(sanitizeSettings(null, 'en').langue, 'en');
	assert.equal(sanitizeSettings({ langue: 'fr' }, 'en').langue, 'fr');
});

test('tous les dos et toutes les couleurs des six prédictions sont acceptés, sans « mélange »', () => {
	for (const motif of DESSINS) assert.equal(sanitizeSettings({ motif }).motif, motif);
	for (const couleur of TEINTES) assert.equal(sanitizeSettings({ couleur }).couleur, couleur);
	assert.equal(sanitizeSettings({ motif: 'mix', couleur: 'mix' }).motif, DEFAULTS.motif);
	assert.equal(sanitizeSettings({ motif: 'mix', couleur: 'mix' }).couleur, DEFAULTS.couleur);
});
