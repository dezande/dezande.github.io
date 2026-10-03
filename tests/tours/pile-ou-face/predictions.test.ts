// Le contenu de src/content/predictions.ts : deux prédictions, chacune sur deux lignes.
import { PREDICTIONS } from '../../../src/tours/pile-ou-face/content/predictions.ts';
import { isTexte, LANGS, t } from '../../../src/logic/i18n.ts';
import { COTES } from '../../../src/tours/pile-ou-face/logic/piece.ts';

test('une prédiction pour pile, une pour face, et rien d’autre', () => {
	expect(Object.keys(PREDICTIONS).sort()).toStrictEqual([...COTES].sort());
});

test('chaque prédiction tient sur deux lignes, sans ligne vide, dans les deux langues', () => {
	for (const cote of COTES) {
		expect(isTexte(PREDICTIONS[cote]), `${cote} : texte incomplet`).toBe(true);
		for (const lang of LANGS) {
			const lignes = t(PREDICTIONS[cote], lang)!.split('\n');
			expect(lignes.length, `${cote} en ${lang} : ${lignes.length} lignes`).toBe(2);
			for (const ligne of lignes) expect(ligne.trim(), `${cote} en ${lang} : ligne vide`).not.toBe('');
		}
	}
});

test('les deux prédictions disent bien pile et face, dans chaque langue', () => {
	expect(t(PREDICTIONS.pile, 'fr')).toBe('0,20 euro\npile');
	expect(t(PREDICTIONS.face, 'fr')).toBe('0,20 euro\nface');
	expect(t(PREDICTIONS.pile, 'en')).toBe('0.20 euro\ntails');
	expect(t(PREDICTIONS.face, 'en')).toBe('0.20 euro\nheads');
});
