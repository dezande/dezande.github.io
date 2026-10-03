/*
 * Le soulignement tracé sous la prédiction, à la main.
 *
 * Celui qui a écrit la prédiction l'a soulignée, et pas à la règle : le trait part de travers,
 * remonte en fin de course, et il y en a parfois deux. C'est ce qui donne à la carte l'air d'avoir
 * été écrite à l'avance plutôt qu'affichée.
 *
 * Le trait est dessiné en SVG, à l'encre de la carte (`currentColor`) : il grandit avec la
 * prédiction, reste net à toutes les tailles et ne pèse rien dans le cache hors-ligne.
 */

/**
 * Les soulignements, dans un repère de 100 de large sur 12 de haut, étiré à la largeur du texte.
 * L'étirement épaissit les traits horizontalement : c'est exactement ce que fait un stylo qu'on
 * traîne. Un jeu par carte, repris en boucle si la routine en compte plus.
 */
export const SOULIGNEMENTS: readonly string[][] = [
	// Un trait franc, repassé une seconde fois un peu plus court.
	['M2 5C24 1.5 58 7.5 98 3', 'M11 10C34 7 62 11.5 89 8'],
	// Un seul trait, appuyé, qui remonte franchement en fin de course.
	['M2 8C26 2.5 60 9.5 98 1.5'],
	// Deux traits qui se croisent, comme une rature d'insistance.
	['M2 3C32 8 68 1.5 98 6.5', 'M4 10.5C36 5 70 11.5 96 5.5'],
	// Un trait ondulé, tracé vite.
	['M2 6C14 1.5 26 10.5 38 6S62 1.5 74 6 98 10 98 5'],
];
