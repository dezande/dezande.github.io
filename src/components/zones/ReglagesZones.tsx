/*
 * LES RÉGLAGES D'UN TOUR À ZONES (boule de cristal, carte de visite), ouverts par l'écrou ⚙ du
 * menu principal : le rappel de la routine (le nom et la valeur de chaque zone, en lecture seule),
 * les trois curseurs (délai avant l'apparition, durée de la transition, luminosité), puis les aides
 * à la répétition (jauge de l'appui long, test des zones) et les réglages par défaut. Les bornes des
 * curseurs sont celles de la validation (src/logic/reglages-zones.ts).
 *
 * Seuls les mots changent d'un tour à l'autre (`libelles`) ; ces tours ont une interface en
 * français seulement. Rendu par components/zones/TourAZones.tsx.
 */

import { PanneauReglages } from '../PanneauReglages.tsx';
import { BORNES, type ReglagesZones as Reglages } from '../../logic/reglages-zones.ts';

/** Les mots propres au tour, dans ses réglages. */
export interface LibellesReglagesZones {
	/** Le nom de la routine (« 3 boulettes ») et son découpage (« 3 bandes horizontales »). */
	routine: string;
	decoupage: string;
	/** Les titres des deux premiers curseurs (« Délai d'apparition », « Durée du fondu »). */
	delai: string;
	duree: string;
}

interface Props {
	libelles: LibellesReglagesZones;
	/** Le nom de chaque zone et sa valeur, dans l'ordre des zones. */
	noms: readonly string[];
	valeurs: readonly string[];
	reglages: Reglages;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Reglages | null) => void;
	/** Passe des réglages au mode « Test des zones ». */
	surTest: () => void;
}

/** Nombre à la française, une décimale au plus (« 1,5 »). */
const fmt = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

export function ReglagesZones({ libelles, noms, valeurs, reglages, enregistrer, surTest }: Props) {
	const changer = (changement: Partial<Reglages>): void => enregistrer({ ...reglages, ...changement });

	/** Les curseurs : le réglage piloté, son titre, et le texte affiché à côté. */
	const curseurs = [
		{ cle: 'delay', titre: libelles.delai, texte: (v: number) => (v === 0 ? 'immédiat' : `${fmt(v)} s`) },
		{ cle: 'fade', titre: libelles.duree, texte: (v: number) => `${fmt(v)} s` },
		{ cle: 'brightness', titre: 'Luminosité', texte: (v: number) => `${v} %` },
	] as const;

	return (
		<PanneauReglages
			id="settings"
			classeNom="sub"
			aide="Aide à la répétition : à masquer avant de jouer si le public voit l'écran."
			jauge={{ libelle: 'Afficher la jauge de l\'appui long', visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			// Le test des zones est une aide à la répétition : il rejoint les autres.
			autresAides={<button type="button" id="test-btn" className="test-zones" onClick={surTest}>Test des zones</button>}
			defauts={{ libelle: 'Rétablir les réglages par défaut', retablir: () => enregistrer(null) }}
		>
			<div className="card">
				<div className="row-label">{libelles.routine} <small>{libelles.decoupage}</small></div>
				{/* Rappel des valeurs, zone par zone (lecture seule) : elles ne changent pas. */}
				<div className="values" id="routine-values">
					{valeurs.map((valeur, i) => (
						<div key={i} className="value-row"><span>{noms[i] ?? ''}</span><b>{valeur}</b></div>
					))}
				</div>
			</div>

			{curseurs.map(({ cle, titre, texte }) => (
				<div key={cle} className="card">
					<label className="row-label" htmlFor={cle}>{titre} <output id={`${cle}-out`}>{texte(reglages[cle])}</output></label>
					<input id={cle} type="range" min={BORNES[cle].min} max={BORNES[cle].max} step={BORNES[cle].pas} value={reglages[cle]} onInput={(event) => changer({ [cle]: Number(event.currentTarget.value) })} />
				</div>
			))}
		</PanneauReglages>
	);
}
