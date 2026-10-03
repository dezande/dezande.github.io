// Les deux langues : textes traduits, forme des traductions, langue de départ.
import { deviceLang, isTexte, LANGS, t } from '../../../src/tours/analyseur-q/logic/i18n.ts';
import { INTERFACE, ui } from '../../../src/tours/analyseur-q/content/interface.ts';

test('t : texte commun aux deux langues, ou traduit', () => {
	expect(t('AQ-52', 'fr')).toBe('AQ-52');
	expect(t('AQ-52', 'en')).toBe('AQ-52');
	expect(t({ fr: 'Résultat', en: 'Result' }, 'fr')).toBe('Résultat');
	expect(t({ fr: 'Résultat', en: 'Result' }, 'en')).toBe('Result');
	expect(t(undefined, 'fr')).toBe(undefined);
});

test('isTexte : une chaîne, ou les deux langues remplies', () => {
	expect(isTexte('')).toBeTruthy();
	expect(isTexte({ fr: 'a', en: 'b' })).toBeTruthy();
	expect(!isTexte({ fr: 'a' }), 'traduction manquante').toBeTruthy();
	expect(!isTexte({ fr: 'a', en: '  ' }), 'traduction vide').toBeTruthy();
	expect(!isTexte({ fr: 'a', en: 'b', de: 'c' }), 'langue inconnue').toBeTruthy();
	expect(!isTexte({ fr: 'a', en: 2 }), 'traduction qui n\'est pas du texte').toBeTruthy();
	for (const value of [null, undefined, 42, ['a', 'b']]) expect(!isTexte(value), String(value)).toBeTruthy();
});

test('deviceLang : anglais si le téléphone est en anglais, français sinon', () => {
	expect(deviceLang(['en-US', 'fr-FR'])).toBe('en');
	expect(deviceLang(['fr-CA'])).toBe('fr');
	expect(deviceLang(['EN'])).toBe('en');
	expect(deviceLang(['es-ES', 'en']), 'la première langue connue l\'emporte').toBe('en');
	expect(deviceLang(['es-ES']), 'langue inconnue : français').toBe('fr');
	expect(deviceLang([])).toBe('fr');
	expect(deviceLang(undefined)).toBe('fr');
	expect(deviceLang([null as never, 'en']), 'liste abîmée').toBe('en');
});

test('textes de l\'interface (src/content/interface.ts) : les deux langues partout', () => {
	for (const [cle, value] of Object.entries(INTERFACE)) {
		expect(isTexte(value), `${cle} : texte incomplet`).toBeTruthy();
		for (const lang of LANGS) expect(ui(cle as keyof typeof INTERFACE, lang).trim(), `${cle} (${lang}) : vide`).toBeTruthy();
	}
});
