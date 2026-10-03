/*
 * AJUSTER UN TEXTE À SA PLACE : la plus grande échelle, entre `min` et `max`, à laquelle `tient`
 * répond oui. Recherche par dichotomie, en `etapes` essais : la précision vaut (max - min) / 2^etapes.
 * Si rien ne tient, `min` (en dessous, mieux vaut raccourcir le texte).
 *
 * Les tours mesurent eux-mêmes (le DOM, une police…) dans `tient`, qui pose l'échelle à essayer
 * (variable CSS --fit) puis compare la taille du texte à sa place :
 *
 *   const echelle = plusGrandeEchelle((s) => { el.style.setProperty('--fit', String(s)); return el.offsetWidth <= largeur; }, 0.25, 12);
 *   el.style.setProperty('--fit', String(echelle));
 *
 * Fonction pure, testée sous Node (tests/logic/ajustement.test.ts). Le réajustement à chaque
 * changement de taille ou de police est dans src/hooks/useReajustement.ts.
 */

export function plusGrandeEchelle(tient: (echelle: number) => boolean, min: number, max: number, etapes = 16): number {
	let lo = min;
	let hi = max;
	for (let etape = 0; etape < etapes; etape++) {
		const milieu = (lo + hi) / 2;
		if (tient(milieu)) lo = milieu;
		else hi = milieu;
	}
	return lo;
}
