// La liste des tours (src/content/tours.ts) : bien formée, et chaque tour branché dans l'app.
import { existsSync, readFileSync } from 'node:fs';
import { TEXTES } from '../../src/content/textes.ts';
import { LANGS } from '../../src/logic/i18n.ts';
import { REGISTRE } from '../../src/tours/registre.ts';
import { TOURS } from '../../src/content/tours.ts';

test('les cinq tours, chacun une seule fois', () => {
	expect(TOURS.map((tour) => tour.dossier)).toStrictEqual(['boule-de-cristal', 'carte-de-visite', 'pile-ou-face', 'six-predictions', 'analyseur-q']);
});

test('chaque tour a un dossier valide, un nom et une description dans les deux langues', () => {
	for (const tour of TOURS) {
		expect(tour.dossier, `dossier « ${tour.dossier} »`).toMatch(/^[a-z0-9-]+$/);
		for (const lang of LANGS) {
			expect(tour.nom[lang]?.trim() ?? '', `${tour.dossier} : nom vide en ${lang}`).not.toBe('');
			expect(tour.description[lang]?.trim() ?? '', `${tour.dossier} : description vide en ${lang}`).not.toBe('');
		}
	}
});

test('chaque tour a son code, ses styles et sa place dans le registre', () => {
	for (const tour of TOURS) {
		expect(existsSync(`src/tours/${tour.dossier}/index.tsx`), `src/tours/${tour.dossier}/index.tsx manquant`).toBeTruthy();
		expect(existsSync(`src/styles/tours/${tour.dossier}/_index.scss`), `src/styles/tours/${tour.dossier}/_index.scss manquant`).toBeTruthy();
		expect(readFileSync('src/styles/main.scss', 'utf8'), `${tour.dossier} : styles non importés par src/styles/main.scss`).toContain(`@use "tours/${tour.dossier}";`);
		expect(readFileSync('src/tours/registre.ts', 'utf8'), `${tour.dossier} absent de src/tours/registre.ts`).toContain(`import('./${tour.dossier}/index.tsx')`);
	}
});

test('chaque texte du menu existe dans les deux langues', () => {
	for (const [cle, texte] of Object.entries(TEXTES)) {
		for (const lang of LANGS) expect(texte[lang].trim(), `« ${cle} » vide en ${lang}`).not.toBe('');
	}
});

test('le registre et la liste des tours nomment exactement les mêmes tours', () => {
	// Un tour en préparation reste hors des deux : seul ce qui est au registre est compilé et publié,
	// et seul ce qui est dans la liste a une tuile et une adresse.
	expect(Object.keys(REGISTRE).sort()).toStrictEqual(TOURS.map((tour) => tour.dossier).sort());
});
