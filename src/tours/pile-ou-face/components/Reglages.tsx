/*
 * Les réglages de Pile ou face, ouverts par l'écrou ⚙ du menu principal : délai avant le
 * retournement, dos et couleur de la carte, jauge de l'appui long, réglages par défaut.
 */

import type { ReactNode } from 'react';
import { DosDeCarte } from '../../../components/cartes/DosDeCarte.tsx';
import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Langue } from '../../../content/textes.ts';
import { ui, type CleInterface } from '../content/interface.ts';
import { DELAI_MAX, DESSINS, TEINTES, type Dessin, type Settings, type Teinte } from '../logic/settings.ts';

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
	// « 0 s » veut dire que la carte se retourne au toucher ; virgule décimale en français.
	const delai = `${String(reglages.delai).replace('.', langue === 'fr' ? ',' : '.')} s`;

	return (
		<PanneauReglages>
			<div className="card">
				<label className="row-label slider-label" htmlFor="delai">
					<span>{ui('menu.delai', langue)}</span> <output id="delai-valeur" htmlFor="delai">{delai}</output>
				</label>
				<input id="delai" type="range" min="0" max={DELAI_MAX} step="0.5" value={reglages.delai} onChange={(event) => changer({ delai: Number(event.target.value) })} />
				<p className="hint slider-hint">{ui('menu.delaiAide', langue)}</p>
			</div>

			{/* Les aperçus montrent la carte telle qu'elle sera : les dos dans la couleur en cours,
			    les couleurs sur le dos en cours. */}
			<div className="card">
				<div className="row-label">{ui('menu.motif', langue)}</div>
				<Choix id="motif-choix" valeurs={DESSINS} choisie={reglages.motif} cle="motif" langue={langue} apercu={(dessin) => <Vignette dessin={dessin} teinte={reglages.couleur} />} choisir={(motif) => changer({ motif })} />
			</div>

			<div className="card">
				<div className="row-label">{ui('menu.couleur', langue)}</div>
				<Choix id="couleur-choix" valeurs={TEINTES} choisie={reglages.couleur} cle="couleur" langue={langue} apercu={(teinte) => <Vignette dessin={reglages.motif} teinte={teinte} />} choisir={(couleur) => changer({ couleur })} />
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
