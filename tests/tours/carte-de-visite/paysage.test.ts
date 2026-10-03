// Le verrou paysage de la carte de visite (src/tours/carte-de-visite/logic/paysage.ts).
// Lancer : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landscapeRotation } from '../../../src/tours/carte-de-visite/logic/paysage.ts';
import { toAppPoint } from '../../../src/kit/web/orientation-logic.ts';

test('écran en portrait (app verrouillée, téléphone tenu en largeur) : la scène pivote d’un quart de tour', () => {
	assert.equal(landscapeRotation(390, 844), 90);
});

test('écran déjà en paysage, ou carré : rien ne pivote', () => {
	assert.equal(landscapeRotation(844, 390), 0);
	assert.equal(landscapeRotation(500, 500), 0);
});

test('pivotée, le haut de la scène est à droite de l’écran : le coin haut droite de l’écran est le coin haut gauche de la scène', () => {
	const ecran = { width: 390, height: 844, angle: 0, touch: true };
	const p = toAppPoint(380, 10, ecran, landscapeRotation(ecran.width, ecran.height));
	assert.deepEqual(p, { x: 10, y: 10 });
});
