/*
 * Le soulignement tracé à la main sous une prédiction (soulignement.ts), à l'encre de la carte.
 * L'épaisseur est posée en feuille de style, en `em` et sans mise à l'échelle
 * (styles/tours/<dossier>/_cartes.scss) : le trait garde exactement la grosseur des lettres, quel que
 * soit l'étirement du repère.
 */

import { SOULIGNEMENTS } from './soulignement.ts';

/** Le soulignement de la carte `index`, à poser juste sous la prédiction. */
export function Soulignement({ index }: { index: number }) {
	const chemins = SOULIGNEMENTS[index % SOULIGNEMENTS.length]!;
	return (
		// Étiré à la largeur du texte : les traits suivent le mot, quelle que soit sa longueur.
		<svg className="soulignement" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
			<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
				{chemins.map((d) => <path key={d} d={d} />)}
			</g>
		</svg>
	);
}
