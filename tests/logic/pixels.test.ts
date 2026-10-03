// Les dessins en pixels du menu (src/content/pixels.ts) : bien formés, et l'écrou au cordeau.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ECROU, ICONES, MAIN, PALETTE, TAILLE, TAILLE_ECROU } from '../../src/content/pixels.ts';
import { TOURS } from '../../src/content/tours.ts';

const COULEURS = new Set([...Object.keys(PALETTE), '.']);

function verifie(nom: string, grille: readonly string[], largeur: number, hauteur = largeur): void {
	assert.equal(grille.length, hauteur, `${nom} : ${grille.length} lignes`);
	grille.forEach((ligne, y) => {
		assert.equal(ligne.length, largeur, `${nom}, ligne ${y + 1} : ${ligne.length} pixels`);
		for (const c of ligne) assert.ok(COULEURS.has(c), `${nom}, ligne ${y + 1} : couleur « ${c} » hors palette`);
	});
}

test('chaque tour a son icône en pixels, de 32 × 32, dans la palette', () => {
	assert.deepEqual(Object.keys(ICONES).sort(), TOURS.map((t) => t.dossier).sort());
	for (const [nom, grille] of Object.entries(ICONES)) verifie(nom, grille, TAILLE);
});

test('l’écrou ⚙ et la main sont bien formés', () => {
	verifie('écrou', ECROU, TAILLE_ECROU);
	verifie('main', MAIN, 16, 12);
});

test('l’écrou ⚙ est symétrique dans tous les sens, son trou au centre exact', () => {
	assert.ok(ECROU.every((ligne) => ligne === [...ligne].reverse().join('')), 'pas symétrique de gauche à droite');
	assert.deepEqual([...ECROU].reverse(), [...ECROU], 'pas symétrique de haut en bas');
	const transposee = ECROU.map((_, x) => ECROU.map((ligne) => ligne[x]).join(''));
	assert.deepEqual(transposee, [...ECROU], 'pas symétrique en diagonale');
	// Le trou : les pixels du milieu sont vides, et entourés de métal.
	const m = TAILLE_ECROU / 2;
	for (const y of [m - 2, m - 1, m, m + 1]) assert.equal(ECROU[y]!.slice(m - 2, m + 2), '....', `ligne ${y + 1} : trou mal placé`);
	for (const y of [m - 5, m + 4]) assert.ok(!ECROU[y]!.slice(m - 2, m + 2).includes('.'), `ligne ${y + 1} : le trou déborde`);
});
