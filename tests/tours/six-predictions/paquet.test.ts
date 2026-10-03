// L'état du paquet : ce que chaque toucher en fait, et la reprise d'un état abîmé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allerA, apresToucher, clampIndex, compteurLabel, DEPART, estVide, remettre, restantes } from '../../../src/tours/six-predictions/logic/paquet.ts';

const COUNT = 6;

test('la routine entière : chaque carte se retourne, puis sort', () => {
	let etat = DEPART;
	for (let i = 0; i < COUNT; i++) {
		assert.deepEqual(etat, { index: i, retournee: false }, `carte ${i + 1} sur le dessus, dos visible`);
		etat = apresToucher(etat, COUNT);
		assert.deepEqual(etat, { index: i, retournee: true }, `carte ${i + 1} retournée`);
		etat = apresToucher(etat, COUNT);
	}
	assert.equal(estVide(etat, COUNT), true, 'les six cartes sont sorties');
	assert.equal(etat.index, COUNT);
});

test('sur l’écran vide, un toucher ne fait rien', () => {
	const vide = { index: COUNT, retournee: false };
	assert.equal(apresToucher(vide, COUNT), vide, 'le même état, sans copie');
});

test('remettre : le paquet revient au complet, faces en bas', () => {
	assert.deepEqual(remettre(), DEPART);
	assert.equal(estVide(remettre(), COUNT), false);
});

test('estVide et restantes', () => {
	assert.equal(estVide({ index: 0, retournee: false }, COUNT), false);
	assert.equal(estVide({ index: COUNT - 1, retournee: true }, COUNT), false);
	assert.equal(estVide({ index: COUNT, retournee: false }, COUNT), true);
	assert.equal(restantes({ index: 0, retournee: false }, COUNT), 6);
	assert.equal(restantes({ index: 4, retournee: true }, COUNT), 2);
	assert.equal(restantes({ index: COUNT, retournee: false }, COUNT), 0);
	// Un paquet sans carte est vide, et ne devient jamais négatif.
	assert.equal(estVide(DEPART, 0), true);
	assert.equal(restantes({ index: 9, retournee: false }, COUNT), 0);
});

test('allerA : la carte demandée revient sur le dessus, dos visible', () => {
	assert.deepEqual(allerA(3, COUNT), { index: 3, retournee: false });
	assert.deepEqual(allerA(-2, COUNT), { index: 0, retournee: false });
	// L'écran vide (index === count) est une destination valide : c'est la fin de la routine.
	assert.deepEqual(allerA(99, COUNT), { index: COUNT, retournee: false });
});

test('clampIndex : toute valeur relue donne un index valide', () => {
	assert.equal(clampIndex(2, COUNT), 2);
	assert.equal(clampIndex(9, COUNT), COUNT);
	assert.equal(clampIndex(-3, COUNT), 0);
	assert.equal(clampIndex(2.7, COUNT), 2);
	for (const raw of [null, undefined, '3', NaN, Infinity, {}]) assert.equal(clampIndex(raw, COUNT), 0);
	assert.equal(clampIndex(3, 0), 0);
});

test('compteurLabel', () => {
	assert.equal(compteurLabel({ index: 0, retournee: false }, COUNT), '1 / 6');
	assert.equal(compteurLabel({ index: 5, retournee: true }, COUNT), '6 / 6');
	// Paquet vide : le compteur s'arrête à la dernière carte plutôt que d'annoncer « 7 / 6 ».
	assert.equal(compteurLabel({ index: COUNT, retournee: false }, COUNT), '6 / 6');
});
