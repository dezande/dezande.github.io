/*
 * Le paquet affiché : les six cartes, chacune à sa place d'après l'état du paquet — sortie du
 * cadre, sur le dessus (retournée ou non) ou dessous, à sa place dans l'étalement. Les transitions
 * CSS font le reste (styles/tours/six-predictions/_cartes.scss).
 */

import type { Langue } from '../../../content/textes.ts';
import { CARTES } from '../content/cartes.ts';
import type { Cran } from '../logic/etalement.ts';
import { estVide, type Etat } from '../logic/paquet.ts';
import { dessinDeCarte, teinteDeCarte, type Couleur, type Motif } from '../logic/settings.ts';
import { Carte } from './Carte.tsx';

interface Props {
	etat: Etat;
	/** Les places des cartes, de la première (dessus du paquet) à la dernière. */
	etalement: readonly Cran[];
	/**
	 * Sans animation : le paquet se retrouve directement dans sa nouvelle position (ouverture du
	 * tour, remise du paquet). Les remettre en jeu à l'envers — cartes qui reviennent en volant,
	 * prédictions qui se referment — n'aurait aucun sens.
	 */
	sansAnimation: boolean;
	langue: Langue;
	motif: Motif;
	couleur: Couleur;
}

export function Paquet({ etat, etalement, sansAnimation, langue, motif, couleur }: Props) {
	const classes = [estVide(etat, CARTES.length) && 'vide', sansAnimation && 'no-anim'].filter(Boolean).join(' ');
	return (
		<div id="paquet" className={classes || undefined}>
			{CARTES.map((_, i) => {
				// Négative : la carte est déjà sortie. 0 : c'est celle du dessus. Positive : elle attend dessous.
				const profondeur = i - etat.index;
				return (
					<Carte
						key={i}
						index={i}
						place={profondeur < 0 ? 'sortie' : profondeur === 0 ? 'dessus' : 'dessous'}
						// Une carte sortie garde sa face visible : elle s'envole prédiction en l'air,
						// jamais en se refermant au passage.
						retournee={profondeur < 0 || (profondeur === 0 && etat.retournee)}
						// Seule la carte retournée est à lire : le dos et les cartes sorties ne disent rien.
						lisible={profondeur === 0 && etat.retournee}
						cran={etalement[i]!}
						langue={langue}
						// Avec « mix », chaque carte a son dessin et sa couleur (logic/settings.ts).
						dessin={dessinDeCarte(motif, i)}
						teinte={teinteDeCarte(couleur, i)}
					/>
				);
			})}
		</div>
	);
}
