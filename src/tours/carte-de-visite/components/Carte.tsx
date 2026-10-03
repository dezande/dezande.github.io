/*
 * La carte de visite du Théâtre Robert-Houdin, le théâtre de magie que Jean-Eugène Robert-Houdin
 * ouvrit à Paris en 1845, et que Georges Méliès reprit en 1888 ; il était au 8, boulevard des
 * Italiens, et fut démoli en 1924. Le recto imprimé ; au verso, seulement le numéro, en grand, écrit
 * à la plume. Classes d'état (styles/tours/carte-de-visite/_carte.scss) : .retournee (verso montré)
 * et .instant (retour au recto sans transition). Les phases sont tenues par
 * src/hooks/usePhasesZones.ts ; la valeur armée est le numéro écrit au verso.
 */

import { useReposSansTransition, type EtatZones } from '../../../hooks/usePhasesZones.ts';

interface Props {
	etat: EtatZones;
	/** Appelé une fois le recto rétabli sans transition (.instant retiré). */
	finInstant: () => void;
}

/** Un fleuron, dans chaque coin du filet. */
function Coin({ position }: { position: 'hg' | 'hd' | 'bg' | 'bd' }) {
	return <svg className={`coin ${position}`} viewBox="0 0 40 40" aria-hidden="true"><path d="M2 38V14C2 7 7 2 14 2h24M8 38V18c0-6 4-10 10-10h20M14 20c0-3 3-6 6-6 3 0 4 2 4 4s-2 3-3 3" /></svg>;
}

const COINS = (
	<>
		<Coin position="hg" />
		<Coin position="hd" />
		<Coin position="bg" />
		<Coin position="bd" />
	</>
);

/** Les feuilles d'un côté de la couronne. */
const FEUILLES = (
	<>
		<path d="M18 70c-7-3-10-9-9-15 6 2 10 7 9 15z" />
		<path d="M17 56c-6-4-8-10-6-16 6 3 8 9 6 16z" />
		<path d="M20 42c-5-5-6-11-3-16 5 4 6 10 3 16z" />
		<path d="M26 30c-3-6-3-12 1-16 4 5 3 11-1 16z" />
		<path d="M24 84c-8-1-12-6-13-12 7 0 12 5 13 12z" />
		<path d="M34 96c-8 1-13-3-16-9 7-1 13 3 16 9z" />
		<path d="M47 104c-7 3-13 0-17-5 7-2 13 0 17 5z" />
	</>
);

/** Le recto imprimé, dessiné une fois pour toutes. */
const RECTO = (
	<article className="face recto">
		{COINS}
		{/* Le chiffre du théâtre : R et H entrelacés dans une couronne de laurier. */}
		<svg className="chiffre" viewBox="0 0 120 120" aria-hidden="true">
			<g className="laurier">
				<path d="M60 108C30 104 14 82 16 52c1-14 7-26 16-34" />
				<path d="M60 108c30-4 46-26 44-56-1-14-7-26-16-34" />
				<g className="feuilles">{FEUILLES}</g>
				<g className="feuilles" transform="matrix(-1 0 0 1 120 0)">{FEUILLES}</g>
				<path className="ruban" d="M50 106c4 4 16 4 20 0M54 108l-6 8M66 108l6 8" />
			</g>
			<text className="lettre r" x="47" y="76">R</text>
			<text className="lettre h" x="73" y="76">H</text>
		</svg>
		<div className="titre">
			<p className="fondee">Fondé en 1845</p>
			<h1 className="nom">
				<span className="nom-petit">Théâtre</span>
				<span className="nom-grand">Robert-Houdin</span>
			</h1>
			<p className="adresse">8, Boulevard des Italiens · Paris</p>
		</div>
		<p className="confort">Soirées fantastiques</p>
	</article>
);

export function Carte({ etat, finInstant }: Props) {
	const carte = useReposSansTransition<HTMLDivElement>(etat.instant, finInstant);

	const classes = ['carte'];
	if (etat.phase === 'shown') classes.push('retournee');
	if (etat.instant) classes.push('instant');

	return (
		<div ref={carte} className={classes.join(' ')} id="carte">
			<div className="faces">
				{RECTO}
				<article className="face verso">
					{COINS}
					{/* Le numéro seul, en grand, à la plume. */}
					<span className="numero" id="number"><span id="number-text">{etat.valeur}</span></span>
				</article>
			</div>
		</div>
	);
}
