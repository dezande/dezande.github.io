// Le texte de l'interface du tour (src/tours/analyseur-q/content/interface.ts) : les deux langues partout.
import { isTexte, LANGS } from '../../../src/logic/i18n.ts';
import { INTERFACE, ui } from '../../../src/tours/analyseur-q/content/interface.ts';

test('textes de l\'interface (src/content/interface.ts) : les deux langues partout', () => {
	for (const [cle, value] of Object.entries(INTERFACE)) {
		expect(isTexte(value), `${cle} : texte incomplet`).toBeTruthy();
		for (const lang of LANGS) expect(ui(cle as keyof typeof INTERFACE, lang).trim(), `${cle} (${lang}) : vide`).toBeTruthy();
	}
});
