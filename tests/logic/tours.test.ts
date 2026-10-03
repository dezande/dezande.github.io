// La liste des tours (src/content/tours.ts) : bien formée, et chaque tour a sa copie dans l'app.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { LANGUES, TEXTES } from '../../src/content/textes.ts';
import { TOURS } from '../../src/content/tours.ts';

test('les quatre tours, chacun une seule fois', () => {
	assert.deepEqual(TOURS.map((tour) => tour.dossier), ['boule-de-cristal', 'pile-ou-face', 'six-predictions', 'analyseur-q']);
});

test('chaque tour a un dossier valide, un nom et une description dans les deux langues', () => {
	for (const tour of TOURS) {
		assert.match(tour.dossier, /^[a-z0-9-]+$/, `dossier « ${tour.dossier} »`);
		for (const lang of LANGUES) {
			assert.notEqual(tour.nom[lang]?.trim() ?? '', '', `${tour.dossier} : nom vide en ${lang}`);
			assert.notEqual(tour.description[lang]?.trim() ?? '', '', `${tour.dossier} : description vide en ${lang}`);
		}
	}
});

test('chaque tour a sa copie dans l’app : sa page et son code', () => {
	for (const tour of TOURS) {
		assert.ok(existsSync(`public/tours/${tour.dossier}/index.html`), `public/tours/${tour.dossier}/index.html manquant`);
		assert.ok(existsSync(`src/tours/${tour.dossier}/app.ts`), `src/tours/${tour.dossier}/app.ts manquant`);
	}
});

test('chaque texte du menu existe dans les deux langues', () => {
	for (const [cle, texte] of Object.entries(TEXTES)) {
		for (const lang of LANGUES) assert.notEqual(texte[lang].trim(), '', `« ${cle} » vide en ${lang}`);
	}
});
