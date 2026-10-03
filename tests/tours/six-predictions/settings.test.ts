// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COULEURS, DEFAULTS, DESSINS, MOTIFS, TEINTES, dessinDeCarte, sanitizeSettings, teinteDeCarte } from '../../../src/tours/six-predictions/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { langue: 'en', motif: 'nouveau', couleur: 'rouge', showHoldRing: false } as const;
	assert.deepEqual(sanitizeSettings(valides), valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	assert.deepEqual(
		sanitizeSettings({ langue: 'de', motif: 'nouveau', couleur: 'rouge', showHoldRing: false }),
		{ langue: DEFAULTS.langue, motif: 'nouveau', couleur: 'rouge', showHoldRing: false },
	);
	assert.deepEqual(
		sanitizeSettings({ motif: 'baroque', couleur: 'rouge', showHoldRing: false }, 'en'),
		{ langue: 'en', motif: DEFAULTS.motif, couleur: 'rouge', showHoldRing: false },
	);
	assert.deepEqual(
		sanitizeSettings({ langue: 'fr', motif: 'deco', couleur: 'vert', showHoldRing: 'oui' }),
		{ langue: 'fr', motif: 'deco', couleur: DEFAULTS.couleur, showHoldRing: DEFAULTS.showHoldRing },
	);
});

test('des données absentes ou abîmées donnent les réglages par défaut', () => {
	for (const raw of [null, undefined, 'x', 42, []]) assert.deepEqual(sanitizeSettings(raw), DEFAULTS);
});

test('les réglages d’une version précédente sont repris, les dos disparus revenant au défaut', () => {
	// La version 0.1.0 avait un seul réglage « dos » (bleu, rouge, encre), remplacé par le motif
	// et la couleur : la langue et les autres choix, eux, doivent survivre à la mise à jour.
	assert.deepEqual(
		sanitizeSettings({ langue: 'en', dos: 'encre', showHoldRing: false }),
		{ langue: 'en', motif: DEFAULTS.motif, couleur: DEFAULTS.couleur, showHoldRing: false },
	);
});

test('la langue du téléphone sert de défaut tant qu’aucune n’est enregistrée', () => {
	assert.equal(sanitizeSettings(null, 'en').langue, 'en');
	assert.equal(sanitizeSettings({ langue: 'fr' }, 'en').langue, 'fr');
});

test('tous les dos proposés sont acceptés, « mélange » compris', () => {
	for (const motif of MOTIFS) assert.equal(sanitizeSettings({ motif }).motif, motif);
	for (const couleur of COULEURS) assert.equal(sanitizeSettings({ couleur }).couleur, couleur);
	assert.ok(MOTIFS.includes('mix') && COULEURS.includes('mix'));
});

test('un dos choisi vaut pour toutes les cartes', () => {
	for (const dessin of DESSINS) {
		for (let i = 0; i < 6; i++) assert.equal(dessinDeCarte(dessin, i), dessin);
	}
	for (const teinte of TEINTES) {
		for (let i = 0; i < 6; i++) assert.equal(teinteDeCarte(teinte, i), teinte);
	}
});

test('« mélange » : les dessins et les couleurs se suivent d’une carte à l’autre', () => {
	const dessins = [0, 1, 2, 3, 4, 5].map((i) => dessinDeCarte('mix', i));
	assert.deepEqual(dessins, [...DESSINS], 'le paquet de six montre les six dessins, dans l’ordre');
	const teintes = [0, 1, 2, 3, 4, 5].map((i) => teinteDeCarte('mix', i));
	assert.deepEqual(teintes, [...TEINTES, TEINTES[0], TEINTES[1]], 'quatre couleurs pour six cartes : elles recommencent');
});

test('« mélange » : un index inattendu donne quand même un dos valide', () => {
	for (const index of [-1, -7, 99, 1000]) {
		assert.ok(DESSINS.includes(dessinDeCarte('mix', index)), `dessin pour ${index}`);
		assert.ok(TEINTES.includes(teinteDeCarte('mix', index)), `couleur pour ${index}`);
	}
});
