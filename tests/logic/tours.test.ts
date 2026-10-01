// La liste des tours (src/content/tours.ts) : bien formée, et chaque tour a son icône.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { TOURS } from '../../src/content/tours.ts';

test('les quatre tours, chacun une seule fois', () => {
	assert.deepEqual(TOURS.map((tour) => tour.dossier), ['boule-de-cristal', 'pile-ou-face', 'six-predictions', 'analyseur-q']);
});

test('chaque tour a un dossier valide, un nom et une description', () => {
	for (const tour of TOURS) {
		assert.match(tour.dossier, /^[a-z0-9-]+$/, `dossier « ${tour.dossier} »`);
		assert.notEqual(tour.nom.trim(), '', `${tour.dossier} : nom vide`);
		assert.notEqual(tour.description.trim(), '', `${tour.dossier} : description vide`);
	}
});

test('chaque tour a son icône dans public/tours/', () => {
	for (const tour of TOURS) assert.ok(existsSync(`public/tours/${tour.dossier}.png`), `public/tours/${tour.dossier}.png manquant`);
});
