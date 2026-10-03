// Le texte de l'interface du tour (src/tours/six-predictions/content/interface.ts) : les deux langues partout.
import { isTexte, LANGS } from '../../../src/logic/i18n.ts';
import { INTERFACE, ui } from '../../../src/tours/six-predictions/content/interface.ts';

test('interface : chaque texte existe dans les deux langues', () => {
	for (const [cle, valeur] of Object.entries(INTERFACE)) {
		expect(isTexte(valeur), `« ${cle} » est incomplet`).toBe(true);
		for (const lang of LANGS) expect(ui(cle as keyof typeof INTERFACE, lang).trim(), `« ${cle} » est vide en ${lang}`).not.toBe('');
	}
});
