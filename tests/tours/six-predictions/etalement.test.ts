// L'étalement du paquet : inégal, mais toujours de la même hauteur et dans le bon ordre.
import { crans, nouveauSemis } from '../../../src/tours/six-predictions/logic/etalement.ts';

const NOMBRE = 6;

test('la carte du dessus est toujours posée bien droite', () => {
	for (const semis of [0, 1, 12345, 0xffffffff]) {
		expect(crans(semis, NOMBRE)[0], `semis ${semis}`).toStrictEqual({ dy: 0, dx: 0, rot: 0 });
	}
});

test('les cartes descendent sans jamais remonter', () => {
	for (let semis = 0; semis < 200; semis++) {
		const liste = crans(semis, NOMBRE);
		for (let rang = 1; rang < NOMBRE; rang++) {
			expect(liste[rang]!.dy > liste[rang - 1]!.dy, `semis ${semis}, rang ${rang} : ${liste.map((c) => c.dy.toFixed(2)).join(', ')}`).toBeTruthy();
		}
	}
});

test('la pile occupe toujours la même hauteur, quel que soit le hasard', () => {
	for (let semis = 0; semis < 200; semis++) {
		const liste = crans(semis, NOMBRE);
		expect(Math.abs(liste[NOMBRE - 1]!.dy - (NOMBRE - 1)) < 1e-9, `semis ${semis} : ${liste[NOMBRE - 1]!.dy}`).toBeTruthy();
	}
});

test('l’étalement est inégal : les écarts ne se valent pas', () => {
	const liste = crans(42, NOMBRE);
	const ecarts = liste.slice(1).map((cran, i) => cran.dy - liste[i]!.dy);
	const plusPetit = Math.min(...ecarts);
	const plusGrand = Math.max(...ecarts);
	expect(plusGrand - plusPetit > .1, `écarts trop semblables : ${ecarts.map((e) => e.toFixed(2)).join(', ')}`).toBeTruthy();
});

test('décalages et inclinaisons restent discrets', () => {
	for (let semis = 0; semis < 200; semis++) {
		for (const cran of crans(semis, NOMBRE)) {
			expect(Math.abs(cran.dx) <= 8, `dx ${cran.dx}`).toBeTruthy();
			// La pente d'ensemble (-0,4° par cran) plus l'écart tiré au sort.
			expect(Math.abs(cran.rot) <= .4 * (NOMBRE - 1) + 1.8, `rot ${cran.rot}`).toBeTruthy();
		}
	}
});

test('le même semis redonne le même étalement, un autre semis en donne un autre', () => {
	expect(crans(7, NOMBRE)).toStrictEqual(crans(7, NOMBRE));
	expect(crans(7, NOMBRE)).not.toStrictEqual(crans(8, NOMBRE));
});

test('un paquet vide ou d’une seule carte ne pose pas de problème', () => {
	expect(crans(3, 0)).toStrictEqual([]);
	expect(crans(3, 1)).toStrictEqual([{ dy: 0, dx: 0, rot: 0 }]);
});

test('nouveauSemis tire un entier utilisable, et change', () => {
	const semis = new Set<number>();
	for (let i = 0; i < 50; i++) {
		const valeur = nouveauSemis();
		expect(Number.isInteger(valeur) && valeur >= 0 && valeur < 0x100000000, String(valeur)).toBeTruthy();
		semis.add(valeur);
	}
	expect(semis.size > 40, 'des semis bien différents d’un tirage à l’autre').toBeTruthy();
});
