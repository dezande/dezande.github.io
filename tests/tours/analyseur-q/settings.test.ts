import { DEFAULTS, sanitizeSettings } from '../../../src/tours/analyseur-q/logic/settings.ts';

test('données absentes ou abîmées : réglages par défaut', () => {
	for (const raw of [null, undefined, 'texte', 42, []]) expect(sanitizeSettings(raw)).toStrictEqual(DEFAULTS);
});

test('réglages valides conservés', () => {
	const settings = { langue: 'en', transition: 'glisse', showNotes: false, showHoldRing: false };
	expect(sanitizeSettings(settings)).toStrictEqual(settings);
});

test('champ invalide : sa valeur par défaut, les autres conservés ; champs inconnus retirés', () => {
	expect(sanitizeSettings({ transition: 'zoom', showNotes: false, ancien: 1 })).toStrictEqual({ ...DEFAULTS, showNotes: false });
});

test('langue : celle enregistrée, sinon celle du téléphone passée en second argument', () => {
	expect(sanitizeSettings(null, 'en'), 'rien d\'enregistré').toStrictEqual({ ...DEFAULTS, langue: 'en' });
	expect(sanitizeSettings({ langue: 'de' }, 'en').langue, 'langue inconnue').toBe('en');
	expect(sanitizeSettings({ langue: 'fr' }, 'en').langue, 'le choix enregistré l\'emporte').toBe('fr');
	expect(sanitizeSettings({ langue: 'en' }, 'fr').langue).toBe('en');
});
