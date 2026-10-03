// Les dessins en pixels du menu (src/content/pixels.ts) : bien formés, et l'écrou au cordeau.
import { ECROU, ICONES, MAIN, PALETTE, TAILLE, TAILLE_ECROU } from '../../src/content/pixels.ts';
import { TOURS } from '../../src/content/tours.ts';

const COULEURS = new Set([...Object.keys(PALETTE), '.']);

function verifie(nom: string, grille: readonly string[], largeur: number, hauteur = largeur): void {
	expect(grille.length, `${nom} : ${grille.length} lignes`).toBe(hauteur);
	grille.forEach((ligne, y) => {
		expect(ligne.length, `${nom}, ligne ${y + 1} : ${ligne.length} pixels`).toBe(largeur);
		for (const c of ligne) expect(COULEURS.has(c), `${nom}, ligne ${y + 1} : couleur « ${c} » hors palette`).toBeTruthy();
	});
}

test('chaque tour a son icône en pixels, de 32 × 32, dans la palette', () => {
	expect(Object.keys(ICONES).sort()).toStrictEqual(TOURS.map((t) => t.dossier).sort());
	for (const [nom, grille] of Object.entries(ICONES)) verifie(nom, grille, TAILLE);
});

test('l’écrou ⚙ et la main sont bien formés', () => {
	verifie('écrou', ECROU, TAILLE_ECROU);
	verifie('main', MAIN, 16, 12);
});

test('l’écrou ⚙ est symétrique dans tous les sens, son trou au centre exact', () => {
	expect(ECROU.every((ligne) => ligne === [...ligne].reverse().join('')), 'pas symétrique de gauche à droite').toBeTruthy();
	expect([...ECROU].reverse(), 'pas symétrique de haut en bas').toStrictEqual([...ECROU]);
	const transposee = ECROU.map((_, x) => ECROU.map((ligne) => ligne[x]).join(''));
	expect(transposee, 'pas symétrique en diagonale').toStrictEqual([...ECROU]);
	// Le trou : les pixels du milieu sont vides, et entourés de métal.
	const m = TAILLE_ECROU / 2;
	for (const y of [m - 2, m - 1, m, m + 1]) expect(ECROU[y]!.slice(m - 2, m + 2), `ligne ${y + 1} : trou mal placé`).toBe('....');
	for (const y of [m - 5, m + 4]) expect(!ECROU[y]!.slice(m - 2, m + 2).includes('.'), `ligne ${y + 1} : le trou déborde`).toBeTruthy();
});
