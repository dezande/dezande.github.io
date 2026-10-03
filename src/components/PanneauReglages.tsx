/*
 * Le panneau de réglages d'un tour, le même pour tous : une barre d'en-tête qui reste en haut quand
 * on fait défiler — « Réglages » (ou « Settings ») et, dessous, le nom du tour, avec la croix qui
 * ferme —, puis les réglages propres au tour (`children`) : ses réglages, ses aides à la répétition
 * (bloc .options), et « Rétablir les réglages par défaut » (#defaults-btn).
 *
 * Il s'ouvre par l'écrou ⚙ du menu principal ; la croix ramène au menu (pont : quitter()). Ses
 * boutons agissent au lever du doigt, appui bref ou long (hooks/useBoutonsTactiles.ts). Les styles
 * sont ceux de chaque tour, dans ses couleurs.
 */

import type { ReactNode } from 'react';
import { useBoutonsTactiles } from '../hooks/useBoutonsTactiles.ts';
import { usePont } from '../tours/pont.tsx';

interface Props {
	/** L'identifiant du panneau, pour les styles du tour (#menu, ou #settings pour la boule). */
	id?: string;
	/** La classe du nom du tour sous le titre, en plus de .nom-du-tour. */
	classeNom?: string;
	children: ReactNode;
}

export function PanneauReglages({ id = 'menu', classeNom = 'menu-version', children }: Props) {
	const { langue, nomDuTour, quitter } = usePont();
	const feuille = useBoutonsTactiles<HTMLDivElement>();
	const titre = langue === 'en' ? 'Settings' : 'Réglages';
	return (
		<section id={id} aria-label={titre}>
			<div className="sheet" ref={feuille}>
				<header className="menu-head">
					<div>
						<h1 className="titre-reglages">{titre}</h1>
						<p className={`${classeNom} nom-du-tour`} hidden={!nomDuTour}>{nomDuTour}</p>
					</div>
					<button type="button" id="close-btn" className="croix" aria-label={langue === 'en' ? 'Close' : 'Fermer'} onClick={quitter}>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
					</button>
				</header>
				{children}
			</div>
		</section>
	);
}
