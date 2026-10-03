// Forme d'une carte, titre court… et vérification du vrai contenu (content/cartes.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARTES } from '../../../src/tours/six-predictions/content/cartes.ts';
import { carteLabel, checkCartes } from '../../../src/tours/six-predictions/logic/cartes.ts';

const BONNE = { entete: { fr: 'Un', en: 'One' }, texte: { fr: 'Demain', en: 'Tomorrow' } };

test('checkCartes : une carte bien formée ne produit aucune faute', () => {
	assert.deepEqual(checkCartes([BONNE, { texte: 'Sept' }]), []);
});

test('checkCartes : texte manquant, traduction incomplète, champ inconnu', () => {
	assert.deepEqual(checkCartes([{}]), ['carte 1 : « texte » manquant ou incomplet (les deux langues sont obligatoires)']);
	assert.deepEqual(checkCartes([{ texte: { fr: 'Demain' } }]), ['carte 1 : « texte » manquant ou incomplet (les deux langues sont obligatoires)']);
	assert.deepEqual(checkCartes([{ texte: { fr: 'Demain', en: '  ' } }]), ['carte 1 : « texte » manquant ou incomplet (les deux langues sont obligatoires)']);
	assert.deepEqual(checkCartes([{ texte: 'Sept', couleur: 'rouge' }]), ['carte 1 : champ inconnu « couleur »']);
	assert.deepEqual(checkCartes([{ texte: 'Sept', entete: { fr: 'Un' } }]), ['carte 1 : « entete » incomplet']);
	assert.deepEqual(checkCartes(['Sept']), ["carte 1 : ce n'est pas une carte"]);
});

test('checkCartes : le numéro de la carte fautive est donné', () => {
	assert.deepEqual(checkCartes([BONNE, BONNE, {}]), ['carte 3 : « texte » manquant ou incomplet (les deux langues sont obligatoires)']);
});

test('carteLabel : le début de la prédiction, coupé au mot entier', () => {
	assert.equal(carteLabel(BONNE, 'fr'), 'Demain');
	assert.equal(carteLabel(BONNE, 'en'), 'Tomorrow');
	assert.equal(carteLabel({ texte: 'un deux trois quatre cinq six' }, 'fr', 14), 'un deux trois…');
	// Un seul mot trop long est coupé net, plutôt que de tout perdre.
	assert.equal(carteLabel({ texte: 'anticonstitutionnellement' }, 'fr', 10), 'anticonsti…');
	assert.equal(carteLabel(undefined, 'fr'), '');
});

/* ---------- Le vrai contenu de la routine ---------- */

test('content/cartes.ts : six cartes, toutes bien formées', () => {
	assert.deepEqual(checkCartes(CARTES), []);
	assert.equal(CARTES.length, 6, 'la routine s’appelle « Les six prédictions »');
});
