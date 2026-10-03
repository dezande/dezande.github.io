// L'état du paquet : ce que chaque toucher en fait, et la reprise d'un état abîmé.
import { allerA, apresToucher, clampIndex, compteurLabel, DEPART, estVide, remettre, restantes } from '../../../src/tours/six-predictions/logic/paquet.ts';

const COUNT = 6;

test('la routine entière : chaque carte se retourne, puis sort', () => {
	let etat = DEPART;
	for (let i = 0; i < COUNT; i++) {
		expect(etat, `carte ${i + 1} sur le dessus, dos visible`).toStrictEqual({ index: i, retournee: false });
		etat = apresToucher(etat, COUNT);
		expect(etat, `carte ${i + 1} retournée`).toStrictEqual({ index: i, retournee: true });
		etat = apresToucher(etat, COUNT);
	}
	expect(estVide(etat, COUNT), 'les six cartes sont sorties').toBe(true);
	expect(etat.index).toBe(COUNT);
});

test('sur l’écran vide, un toucher ne fait rien', () => {
	const vide = { index: COUNT, retournee: false };
	expect(apresToucher(vide, COUNT), 'le même état, sans copie').toBe(vide);
});

test('remettre : le paquet revient au complet, faces en bas', () => {
	expect(remettre()).toStrictEqual(DEPART);
	expect(estVide(remettre(), COUNT)).toBe(false);
});

test('estVide et restantes', () => {
	expect(estVide({ index: 0, retournee: false }, COUNT)).toBe(false);
	expect(estVide({ index: COUNT - 1, retournee: true }, COUNT)).toBe(false);
	expect(estVide({ index: COUNT, retournee: false }, COUNT)).toBe(true);
	expect(restantes({ index: 0, retournee: false }, COUNT)).toBe(6);
	expect(restantes({ index: 4, retournee: true }, COUNT)).toBe(2);
	expect(restantes({ index: COUNT, retournee: false }, COUNT)).toBe(0);
	// Un paquet sans carte est vide, et ne devient jamais négatif.
	expect(estVide(DEPART, 0)).toBe(true);
	expect(restantes({ index: 9, retournee: false }, COUNT)).toBe(0);
});

test('allerA : la carte demandée revient sur le dessus, dos visible', () => {
	expect(allerA(3, COUNT)).toStrictEqual({ index: 3, retournee: false });
	expect(allerA(-2, COUNT)).toStrictEqual({ index: 0, retournee: false });
	// L'écran vide (index === count) est une destination valide : c'est la fin de la routine.
	expect(allerA(99, COUNT)).toStrictEqual({ index: COUNT, retournee: false });
});

test('clampIndex : toute valeur relue donne un index valide', () => {
	expect(clampIndex(2, COUNT)).toBe(2);
	expect(clampIndex(9, COUNT)).toBe(COUNT);
	expect(clampIndex(-3, COUNT)).toBe(0);
	expect(clampIndex(2.7, COUNT)).toBe(2);
	for (const raw of [null, undefined, '3', NaN, Infinity, {}]) expect(clampIndex(raw, COUNT)).toBe(0);
	expect(clampIndex(3, 0)).toBe(0);
});

test('compteurLabel', () => {
	expect(compteurLabel({ index: 0, retournee: false }, COUNT)).toBe('1 / 6');
	expect(compteurLabel({ index: 5, retournee: true }, COUNT)).toBe('6 / 6');
	// Paquet vide : le compteur s'arrête à la dernière carte plutôt que d'annoncer « 7 / 6 ».
	expect(compteurLabel({ index: COUNT, retournee: false }, COUNT)).toBe('6 / 6');
});
