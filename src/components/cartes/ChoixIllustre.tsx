/*
 * CHOISIR EN REGARDANT, dans les réglages des tours à cartes (pile ou face, les six prédictions) :
 * une rangée de boutons illustrés, chacun avec son aperçu — une petite carte face cachée
 * (<Vignette>), plutôt qu'un nom de style. Le nom reste en étiquette, pour les lecteurs d'écran qui
 * ne voient pas les vignettes.
 *
 *   <ChoixIllustre id="motif-choix" etiquette="Dos de la carte" valeurs={DESSINS} choisie={reglages.motif}
 *     nom={(dessin) => ui(`motif.${dessin}`, langue)}
 *     apercu={(dessin) => <Vignette dessin={dessin} teinte={reglages.couleur} />}
 *     choisir={(motif) => changer({ motif })} />
 *
 * Ids et classes : .vignettes (+ .couleurs pour une rangée de couleurs), boutons [role=radio]
 * [data-valeur], .vignette[data-couleur] ; styles : styles/components/_cartes.scss (vignettes).
 */

import type { ComponentChildren } from 'preact';
import { DosDeCarte } from './DosDeCarte.tsx';
import type { DessinDeDos } from './dos.ts';

/** Une petite carte, face cachée, dans le dessin et la couleur demandés. */
export function Vignette({ dessin, teinte }: { dessin: DessinDeDos; teinte: string }) {
	return (
		<span className="vignette" data-couleur={teinte}>
			<DosDeCarte dessin={dessin} />
		</span>
	);
}

interface Props<V extends string> {
	id: string;
	/** Le nom de la rangée, pour les lecteurs d'écran (« Dos de la carte »). */
	etiquette: string;
	/** Une rangée de couleurs (.couleurs), plutôt que de dessins. */
	couleurs?: boolean;
	valeurs: readonly V[];
	choisie: V;
	/** Le nom de chaque valeur, en étiquette du bouton. */
	nom: (valeur: V) => string;
	apercu: (valeur: V) => ComponentChildren;
	choisir: (valeur: V) => void;
}

export function ChoixIllustre<V extends string>({ id, etiquette, couleurs = false, valeurs, choisie, nom, apercu, choisir }: Props<V>) {
	return (
		<div className={couleurs ? 'vignettes couleurs' : 'vignettes'} id={id} role="radiogroup" aria-label={etiquette}>
			{valeurs.map((valeur) => (
				<button key={valeur} type="button" role="radio" data-valeur={valeur} aria-checked={valeur === choisie} aria-label={nom(valeur)} onClick={() => choisir(valeur)}>
					{apercu(valeur)}
				</button>
			))}
		</div>
	);
}
