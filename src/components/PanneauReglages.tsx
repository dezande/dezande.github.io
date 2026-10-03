/*
 * LE PANNEAU DE RÉGLAGES D'UN TOUR, le même pour tous, dans cet ordre :
 *
 *   1. une barre d'en-tête qui reste en haut quand on fait défiler : « Réglages » (ou « Settings »)
 *      et, dessous, le nom du tour, avec la croix qui ferme ;
 *   2. les réglages propres au tour (`children`), chacun dans un bloc .card ;
 *   3. les aides à la répétition (bloc .card.options) : le texte `aide`, la jauge de l'appui long,
 *      puis les aides propres au tour (`autresAides` : d'autres <Interrupteur>, un bouton…) ;
 *   4. « Rétablir les réglages par défaut » (#defaults-btn).
 *
 * Il s'ouvre par l'écrou ⚙ du menu principal ; la croix ramène au menu (pont : quitter()). Ses
 * boutons agissent au lever du doigt, appui bref ou long (hooks/useBoutonsTactiles.ts). Les styles
 * sont ceux de chaque tour, dans ses couleurs (styles/components/_panneau-reglages.scss).
 *
 *   <PanneauReglages
 *     aide="Aides visuelles : à masquer avant de jouer si le public voit l'écran."
 *     jauge={{ libelle: "Jauge de l'appui long", visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
 *     defauts={{ libelle: 'Rétablir les réglages par défaut', retablir: () => enregistrer(null) }}
 *   >
 *     <div className="card">…un réglage du tour…</div>
 *   </PanneauReglages>
 */

import type { ComponentChildren } from 'preact';
import { useBoutonsTactiles } from '../hooks/useBoutonsTactiles.ts';
import { usePont } from '../tours/pont.tsx';

interface Props {
	/** L'identifiant du panneau, pour les styles du tour (#menu, ou #settings pour les tours à zones). */
	id?: string;
	/** La classe du nom du tour sous le titre, en plus de .nom-du-tour. */
	classeNom?: string;
	/** Le texte en tête des aides à la répétition. */
	aide: string;
	/** La case de la jauge de l'appui long (#show-hold-ring), présente dans tous les tours. */
	jauge: { libelle: string; visible: boolean; changer: (visible: boolean) => void };
	/** Les aides à la répétition propres au tour, après la jauge. */
	autresAides?: ComponentChildren;
	/** « Rétablir les réglages par défaut ». */
	defauts: { libelle: string; retablir: () => void };
	/** Les réglages propres au tour, chacun dans un bloc .card. */
	children: ComponentChildren;
}

export function PanneauReglages({ id = 'menu', classeNom = 'menu-version', aide, jauge, autresAides, defauts, children }: Props) {
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

				<div className="card options">
					<p className="hint">{aide}</p>
					<Interrupteur id="show-hold-ring" libelle={jauge.libelle} coche={jauge.visible} changer={jauge.changer} />
					{autresAides}
				</div>

				<button type="button" id="defaults-btn" className="link" onClick={defauts.retablir}>{defauts.libelle}</button>
			</div>
		</section>
	);
}

/** Une case à cocher sur une ligne de réglages (.toggle-row) : son libellé, puis la case. */
export function Interrupteur({ id, libelle, coche, changer }: { id: string; libelle: string; coche: boolean; changer: (coche: boolean) => void }) {
	return (
		<label className="toggle-row" htmlFor={id}>
			<span>{libelle}</span> <input id={id} type="checkbox" checked={coche} onChange={(event) => changer(event.currentTarget.checked)} />
		</label>
	);
}
