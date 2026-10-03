/*
 * Les réglages des six prédictions, ouverts par l'écrou ⚙ du menu principal : dos et couleur des
 * cartes (un pour toutes, ou « mix » : un différent par carte), jauge de l'appui long, réglages
 * par défaut.
 */

import type { ReactNode } from 'react';
import { DosDeCarte } from '../../../components/cartes/DosDeCarte.tsx';
import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Langue } from '../../../content/textes.ts';
import { ui, type CleInterface } from '../content/interface.ts';
import { COULEURS, DESSINS, MOTIFS, TEINTES, dessinDeCarte, teinteDeCarte, type Dessin, type Settings, type Teinte } from '../logic/settings.ts';

interface Props {
	reglages: Settings;
	langue: Langue;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
}

/**
 * Une petite carte, face cachée, dans le dessin et la couleur demandés : c'est ce qu'on regarde
 * pour choisir, plutôt qu'un nom de style.
 */
function Vignette({ dessin, teinte }: { dessin: Dessin; teinte: Teinte }) {
	return (
		<span className="vignette" data-couleur={teinte}>
			<DosDeCarte dessin={dessin} />
		</span>
	);
}

/** Les trois premières cartes du paquet, pour l'aperçu du « mélange ». */
const TROIS = [0, 1, 2] as const;

/**
 * Le bouton « mélange » : trois petites cartes en éventail, chacune dans un autre style — l'image
 * même de ce que fait le réglage.
 */
function VignetteMix({ apercus }: { apercus: readonly (readonly [Dessin, Teinte])[] }) {
	return (
		<span className="vignette-mix">
			{apercus.map(([dessin, teinte], i) => <Vignette key={i} dessin={dessin} teinte={teinte} />)}
		</span>
	);
}

/**
 * Une rangée de boutons illustrés. Chaque bouton porte son aperçu, et le nom de la valeur en
 * étiquette pour les lecteurs d'écran, qui ne voient pas les vignettes.
 */
function Choix<V extends string>({ id, valeurs, choisie, cle, langue, apercu, choisir }: {
	id: string;
	valeurs: readonly V[];
	choisie: V;
	cle: 'motif' | 'couleur';
	langue: Langue;
	apercu: (valeur: V) => ReactNode;
	choisir: (valeur: V) => void;
}) {
	return (
		<div className={`vignettes${cle === 'couleur' ? ' couleurs' : ''}`} id={id} role="radiogroup" aria-label={ui(`menu.${cle}`, langue)}>
			{valeurs.map((valeur) => (
				<button key={valeur} type="button" role="radio" data-valeur={valeur} aria-checked={valeur === choisie} aria-label={ui(`${cle}.${valeur}` as CleInterface, langue)} onClick={() => choisir(valeur)}>
					{apercu(valeur)}
				</button>
			))}
		</div>
	);
}

export function Reglages({ reglages, langue, enregistrer }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });
	// Un « mix » n'a pas de couleur ni de dessin à lui : les aperçus prennent alors le premier.
	const teinte = reglages.couleur === 'mix' ? TEINTES[0] : reglages.couleur;
	const dessin = reglages.motif === 'mix' ? DESSINS[0] : reglages.motif;

	return (
		<PanneauReglages>
			{/* Les aperçus montrent la carte telle qu'elle sera : les dos dans la couleur en cours,
			    les couleurs sur le dos en cours. */}
			<div className="card">
				<div className="row-label">{ui('menu.motif', langue)}</div>
				<Choix
					id="motif-choix"
					valeurs={MOTIFS}
					choisie={reglages.motif}
					cle="motif"
					langue={langue}
					apercu={(motif) => (motif === 'mix'
						? <VignetteMix apercus={TROIS.map((i) => [dessinDeCarte('mix', i), teinte] as const)} />
						: <Vignette dessin={motif} teinte={teinte} />)}
					choisir={(motif) => changer({ motif })}
				/>
			</div>

			<div className="card">
				<div className="row-label">{ui('menu.couleur', langue)}</div>
				<Choix
					id="couleur-choix"
					valeurs={COULEURS}
					choisie={reglages.couleur}
					cle="couleur"
					langue={langue}
					apercu={(couleur) => (couleur === 'mix'
						? <VignetteMix apercus={TROIS.map((i) => [dessin, teinteDeCarte('mix', i)] as const)} />
						: <Vignette dessin={dessin} teinte={couleur} />)}
					choisir={(couleur) => changer({ couleur })}
				/>
			</div>

			<div className="card options">
				<p className="hint">{ui('menu.aides', langue)}</p>
				<label className="toggle-row" htmlFor="show-hold-ring">
					<span>{ui('menu.jauge', langue)}</span> <input id="show-hold-ring" type="checkbox" checked={reglages.showHoldRing} onChange={(event) => changer({ showHoldRing: event.target.checked })} />
				</label>
			</div>

			<button type="button" id="defaults-btn" className="link" onClick={() => enregistrer(null)}>{ui('menu.defauts', langue)}</button>
		</PanneauReglages>
	);
}
