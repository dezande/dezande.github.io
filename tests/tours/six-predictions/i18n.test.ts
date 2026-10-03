// Les deux langues : textes traduits, langue du téléphone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTERFACE, ui } from '../../../src/tours/six-predictions/content/interface.ts';
import { deviceLang, isLang, isTexte, LANGS, t } from '../../../src/tours/six-predictions/logic/i18n.ts';

test('t : une chaîne vaut pour les deux langues, un objet donne la bonne', () => {
	assert.equal(t('AQ-52', 'fr'), 'AQ-52');
	assert.equal(t({ fr: 'Demain', en: 'Tomorrow' }, 'en'), 'Tomorrow');
	assert.equal(t(undefined, 'fr'), undefined);
});

test('isTexte : les deux langues sont obligatoires, et non vides', () => {
	assert.equal(isTexte('x'), true);
	assert.equal(isTexte({ fr: 'a', en: 'b' }), true);
	assert.equal(isTexte({ fr: 'a' }), false);
	assert.equal(isTexte({ fr: 'a', en: '' }), false);
	assert.equal(isTexte({ fr: 'a', en: 'b', de: 'c' }), false);
	for (const raw of [null, undefined, 42, []]) assert.equal(isTexte(raw), false);
});

test('isLang', () => {
	assert.equal(isLang('fr'), true);
	assert.equal(isLang('en'), true);
	for (const raw of ['de', '', null, 3]) assert.equal(isLang(raw), false);
});

test('deviceLang : anglais si le téléphone est en anglais, français sinon', () => {
	assert.equal(deviceLang(['en-GB', 'fr']), 'en');
	assert.equal(deviceLang(['fr-CA']), 'fr');
	assert.equal(deviceLang(['de-DE', 'en-US']), 'en');
	assert.equal(deviceLang(['de-DE']), 'fr');
	assert.equal(deviceLang(undefined), 'fr');
	assert.equal(deviceLang([null as unknown as string]), 'fr');
});

test('interface : chaque texte existe dans les deux langues', () => {
	for (const [cle, valeur] of Object.entries(INTERFACE)) {
		assert.equal(isTexte(valeur), true, `« ${cle} » est incomplet`);
		for (const lang of LANGS) assert.notEqual(ui(cle as keyof typeof INTERFACE, lang).trim(), '', `« ${cle} » est vide en ${lang}`);
	}
});
