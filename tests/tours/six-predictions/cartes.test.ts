// Forme d'une carte, titre court… et vérification du vrai contenu (content/cartes.ts).
import { CARTES } from '../../../src/tours/six-predictions/content/cartes.ts';
import { carteLabel, checkCartes } from '../../../src/tours/six-predictions/logic/cartes.ts';

const BONNE = { entete: { fr: 'Un', en: 'One' }, texte: { fr: 'Demain', en: 'Tomorrow' } };

test('checkCartes : une carte bien formée ne produit aucune faute', () => {
	expect(checkCartes([BONNE, { texte: 'Sept' }])).toStrictEqual([]);
});

test('checkCartes : texte manquant, traduction incomplète, champ inconnu', () => {
	expect(checkCartes([{}])).toStrictEqual(['carte 1 : « texte » manquant ou incomplet (les deux langues sont obligatoires)']);
	expect(checkCartes([{ texte: { fr: 'Demain' } }])).toStrictEqual(['carte 1 : « texte » manquant ou incomplet (les deux langues sont obligatoires)']);
	expect(checkCartes([{ texte: { fr: 'Demain', en: '  ' } }])).toStrictEqual(['carte 1 : « texte » manquant ou incomplet (les deux langues sont obligatoires)']);
	expect(checkCartes([{ texte: 'Sept', couleur: 'rouge' }])).toStrictEqual(['carte 1 : champ inconnu « couleur »']);
	expect(checkCartes([{ texte: 'Sept', entete: { fr: 'Un' } }])).toStrictEqual(['carte 1 : « entete » incomplet']);
	expect(checkCartes(['Sept'])).toStrictEqual(["carte 1 : ce n'est pas une carte"]);
});

test('checkCartes : le numéro de la carte fautive est donné', () => {
	expect(checkCartes([BONNE, BONNE, {}])).toStrictEqual(['carte 3 : « texte » manquant ou incomplet (les deux langues sont obligatoires)']);
});

test('carteLabel : le début de la prédiction, coupé au mot entier', () => {
	expect(carteLabel(BONNE, 'fr')).toBe('Demain');
	expect(carteLabel(BONNE, 'en')).toBe('Tomorrow');
	expect(carteLabel({ texte: 'un deux trois quatre cinq six' }, 'fr', 14)).toBe('un deux trois…');
	// Un seul mot trop long est coupé net, plutôt que de tout perdre.
	expect(carteLabel({ texte: 'anticonstitutionnellement' }, 'fr', 10)).toBe('anticonsti…');
	expect(carteLabel(undefined, 'fr')).toBe('');
});

/* ---------- Le vrai contenu de la routine ---------- */

test('content/cartes.ts : six cartes, toutes bien formées', () => {
	expect(checkCartes(CARTES)).toStrictEqual([]);
	expect(CARTES.length, 'la routine s’appelle « Les six prédictions »').toBe(6);
});
