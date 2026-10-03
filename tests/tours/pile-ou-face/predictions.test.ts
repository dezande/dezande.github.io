// Le contenu de src/content/predictions.ts : deux prédictions, chacune sur deux lignes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PREDICTIONS } from '../../../src/tours/pile-ou-face/content/predictions.ts';
import { isTexte, LANGS, t } from '../../../src/tours/pile-ou-face/logic/i18n.ts';
import { COTES } from '../../../src/tours/pile-ou-face/logic/piece.ts';

test('une prédiction pour pile, une pour face, et rien d’autre', () => {
	assert.deepEqual(Object.keys(PREDICTIONS).sort(), [...COTES].sort());
});

test('chaque prédiction tient sur deux lignes, sans ligne vide, dans les deux langues', () => {
	for (const cote of COTES) {
		assert.equal(isTexte(PREDICTIONS[cote]), true, `${cote} : texte incomplet`);
		for (const lang of LANGS) {
			const lignes = t(PREDICTIONS[cote], lang)!.split('\n');
			assert.equal(lignes.length, 2, `${cote} en ${lang} : ${lignes.length} lignes`);
			for (const ligne of lignes) assert.notEqual(ligne.trim(), '', `${cote} en ${lang} : ligne vide`);
		}
	}
});

test('les deux prédictions disent bien pile et face, dans chaque langue', () => {
	assert.equal(t(PREDICTIONS.pile, 'fr'), '0,20 euro\npile');
	assert.equal(t(PREDICTIONS.face, 'fr'), '0,20 euro\nface');
	assert.equal(t(PREDICTIONS.pile, 'en'), '0.20 euro\ntails');
	assert.equal(t(PREDICTIONS.face, 'en'), '0.20 euro\nheads');
});
