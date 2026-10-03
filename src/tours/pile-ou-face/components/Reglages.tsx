/*
 * Les réglages de Pile ou face, ouverts par l'écrou ⚙ du menu principal : délai avant le
 * retournement, dos et couleur de la carte, jauge de l'appui long, réglages par défaut.
 */

import { ChoixIllustre, Vignette } from '../../../components/cartes/ChoixIllustre.tsx';
import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { ui, type CleInterface } from '../content/interface.ts';
import { DELAI_MAX, DESSINS, TEINTES, type Settings } from '../logic/settings.ts';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
}

export function Reglages({ reglages, langue, enregistrer }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });
	// « 0 s » veut dire que la carte se retourne au toucher ; virgule décimale en français.
	const delai = `${String(reglages.delai).replace('.', langue === 'fr' ? ',' : '.')} s`;

	return (
		<PanneauReglages
			aide={ui('menu.aides', langue)}
			jauge={{ libelle: ui('menu.jauge', langue), visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			defauts={{ libelle: ui('menu.defauts', langue), retablir: () => enregistrer(null) }}
		>
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
				<ChoixIllustre id="motif-choix" etiquette={ui('menu.motif', langue)} valeurs={DESSINS} choisie={reglages.motif} nom={(valeur) => ui(`motif.${valeur}` as CleInterface, langue)} apercu={(dessin) => <Vignette dessin={dessin} teinte={reglages.couleur} />} choisir={(motif) => changer({ motif })} />
			</div>

			<div className="card">
				<div className="row-label">{ui('menu.couleur', langue)}</div>
				<ChoixIllustre id="couleur-choix" etiquette={ui('menu.couleur', langue)} couleurs valeurs={TEINTES} choisie={reglages.couleur} nom={(valeur) => ui(`couleur.${valeur}` as CleInterface, langue)} apercu={(teinte) => <Vignette dessin={reglages.motif} teinte={teinte} />} choisir={(couleur) => changer({ couleur })} />
			</div>
		</PanneauReglages>
	);
}
