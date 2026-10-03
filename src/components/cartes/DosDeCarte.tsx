/*
 * Le dos d'une carte dans le dessin demandé (dos.ts). Le tracé prend la couleur du texte
 * (`currentColor`), posée par le réglage de couleur (styles/tours/<dossier>/_cartes.scss).
 */

import { MOTIFS, type DessinDeDos, type Trait } from './dos.ts';

/** Miroir (gauche-droite) et retournement (haut-bas) autour du centre de la carte, 100 × 140. */
function transformation(trait: Trait): string | undefined {
	if (trait.miroir && trait.retourne) return 'translate(100 140) scale(-1 -1)';
	if (trait.miroir) return 'translate(100 0) scale(-1 1)';
	if (trait.retourne) return 'translate(0 140) scale(1 -1)';
	return undefined;
}

export function DosDeCarte({ dessin }: { dessin: DessinDeDos }) {
	return (
		<svg className="dos-motif" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
			{/* Les épaisseurs sont données dans le repère du dessin : elles grandissent avec la carte. */}
			<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
				{MOTIFS[dessin].map((trait, i) => (
					<path
						key={i}
						d={trait.d}
						// Sans épaisseur, la forme est un aplat : le tracé et le remplissage prennent la même couleur.
						fill={trait.w === undefined ? 'currentColor' : undefined}
						stroke-width={trait.w}
						opacity={trait.o}
						transform={transformation(trait)}
					/>
				))}
			</g>
		</svg>
	);
}
