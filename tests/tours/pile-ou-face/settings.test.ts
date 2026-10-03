// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { DEFAULTS, DELAI_MAX, DESSINS, sanitizeSettings, TEINTES } from '../../../src/tours/pile-ou-face/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { langue: 'en', motif: 'nouveau', couleur: 'rouge', delai: 3.5, showHoldRing: false } as const;
	expect(sanitizeSettings(valides)).toStrictEqual(valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	expect(sanitizeSettings({ langue: 'de', motif: 'baroque', couleur: 'rouge', delai: 2, showHoldRing: false })).toStrictEqual({ langue: DEFAULTS.langue, motif: DEFAULTS.motif, couleur: 'rouge', delai: 2, showHoldRing: false });
	expect(sanitizeSettings({ langue: 'fr', motif: 'deco', couleur: 'vert', delai: '3', showHoldRing: 'oui' })).toStrictEqual({ langue: 'fr', motif: 'deco', couleur: DEFAULTS.couleur, delai: DEFAULTS.delai, showHoldRing: DEFAULTS.showHoldRing });
});

test('des données absentes ou abîmées donnent les réglages par défaut', () => {
	for (const raw of [null, undefined, 'x', 42, []]) expect(sanitizeSettings(raw)).toStrictEqual(DEFAULTS);
});

test('par défaut, la carte se retourne au toucher', () => {
	expect(DEFAULTS.delai).toBe(0);
});

test('le délai est borné et arrondi à la demi-seconde du curseur', () => {
	expect(sanitizeSettings({ delai: -2 }).delai).toBe(0);
	expect(sanitizeSettings({ delai: 99 }).delai).toBe(DELAI_MAX);
	expect(sanitizeSettings({ delai: 2.3 }).delai).toBe(2.5);
	expect(sanitizeSettings({ delai: Number.NaN }).delai).toBe(DEFAULTS.delai);
});

test('la langue du téléphone sert de défaut tant qu’aucune n’est enregistrée', () => {
	expect(sanitizeSettings(null, 'en').langue).toBe('en');
	expect(sanitizeSettings({ langue: 'fr' }, 'en').langue).toBe('fr');
});

test('tous les dos et toutes les couleurs des six prédictions sont acceptés, sans « mélange »', () => {
	for (const motif of DESSINS) expect(sanitizeSettings({ motif }).motif).toBe(motif);
	for (const couleur of TEINTES) expect(sanitizeSettings({ couleur }).couleur).toBe(couleur);
	expect(sanitizeSettings({ motif: 'mix', couleur: 'mix' }).motif).toBe(DEFAULTS.motif);
	expect(sanitizeSettings({ motif: 'mix', couleur: 'mix' }).couleur).toBe(DEFAULTS.couleur);
});
