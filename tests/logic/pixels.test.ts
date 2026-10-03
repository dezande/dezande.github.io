// Les dessins en pixels du menu (src/content/pixels.ts) : bien formés, et l'écrou au cordeau.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ECROU, ICONES, PALETTE, TAILLE } from '../../src/content/pixels.ts';
import { TOURS } from '../../src/content/tours.ts';

const COULEURS = new Set([...Object.keys(PALETTE), '.']);

function verifie(nom: string, grille: readonly string[]): void {
	assert.equal(grille.length, TAILLE, `${nom} : ${grille.length} lignes`);
	grille.forEach((ligne, y) => {
		assert.equal(ligne.length, TAILLE, `${nom}, ligne ${y + 1} : ${ligne.length} pixels`);
		for (const c of ligne) assert.ok(COULEURS.has(c), `${nom}, ligne ${y + 1} : couleur « ${c} » hors palette`);
	});
}

test('chaque tour a son icône en pixels, de 16 × 16, dans la palette', () => {
	assert.deepEqual(Object.keys(ICONES).sort(), TOURS.map((t) => t.dossier).sort());
	for (const [nom, grille] of Object.entries(ICONES)) verifie(nom, grille);
});

test('l’écrou ⚙ est bien formé', () => verifie('écrou', ECROU));

test('l’écrou ⚙ est symétrique dans tous les sens, son trou au centre exact', () => {
	assert.ok(ECROU.every((ligne) => ligne === [...ligne].reverse().join('')), 'pas symétrique de gauche à droite');
	assert.deepEqual([...ECROU].reverse(), [...ECROU], 'pas symétrique de haut en bas');
	const transposee = ECROU.map((_, x) => ECROU.map((ligne) => ligne[x]).join(''));
	assert.deepEqual(transposee, [...ECROU], 'pas symétrique en diagonale');
	// Le trou : les 4 × 4 pixels du milieu, vides, et entourés de métal.
	for (let y = 6; y < 10; y++) assert.equal(ECROU[y]!.slice(6, 10), '....', `ligne ${y + 1} : trou mal placé`);
	for (const y of [5, 10]) assert.equal(ECROU[y]!.slice(6, 10), 'xxxx', `ligne ${y + 1} : le trou déborde`);
});
