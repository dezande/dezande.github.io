// Les deux langues des tours (src/logic/i18n.ts) : textes traduits, langue du téléphone.
import { deviceLang, isLang, isTexte, t } from '../../src/logic/i18n.ts';

test('t : une chaîne vaut pour les deux langues, un objet donne la bonne', () => {
	expect(t('AQ-52', 'fr')).toBe('AQ-52');
	expect(t({ fr: 'Demain', en: 'Tomorrow' }, 'en')).toBe('Tomorrow');
	expect(t(undefined, 'fr')).toBe(undefined);
});

test('isTexte : les deux langues sont obligatoires, et non vides', () => {
	expect(isTexte('x')).toBe(true);
	expect(isTexte({ fr: 'a', en: 'b' })).toBe(true);
	expect(isTexte({ fr: 'a' })).toBe(false);
	expect(isTexte({ fr: 'a', en: '' })).toBe(false);
	expect(isTexte({ fr: 'a', en: 'b', de: 'c' })).toBe(false);
	for (const raw of [null, undefined, 42, []]) expect(isTexte(raw)).toBe(false);
});

test('isLang', () => {
	expect(isLang('fr')).toBe(true);
	expect(isLang('en')).toBe(true);
	for (const raw of ['de', '', null, 3]) expect(isLang(raw)).toBe(false);
});

test('deviceLang : anglais si le téléphone est en anglais, français sinon', () => {
	expect(deviceLang(['en-GB', 'fr'])).toBe('en');
	expect(deviceLang(['fr-CA'])).toBe('fr');
	expect(deviceLang(['de-DE', 'en-US'])).toBe('en');
	expect(deviceLang(['de-DE'])).toBe('fr');
	expect(deviceLang(undefined)).toBe('fr');
	expect(deviceLang([null as unknown as string])).toBe('fr');
	expect(deviceLang([null as never, 'en']), 'liste abîmée').toBe('en');
});
