/*
 * Les réglages des six prédictions, ouverts par l'écrou ⚙ du menu principal : dos et couleur des
 * cartes (un pour toutes, ou « mix » : un différent par carte), jauge de l'appui long, réglages
 * par défaut.
 */

import { ChoixIllustre, Vignette } from '../../../components/cartes/ChoixIllustre.tsx';
import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import type { Lang } from '../../../logic/i18n.ts';
import { ui, type CleInterface } from '../content/interface.ts';
import { COULEURS, DESSINS, MOTIFS, TEINTES, dessinDeCarte, teinteDeCarte, type Dessin, type Settings, type Teinte } from '../logic/settings.ts';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
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

export function Reglages({ reglages, langue, enregistrer }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });
	// Un « mix » n'a pas de couleur ni de dessin à lui : les aperçus prennent alors le premier.
	const teinte = reglages.couleur === 'mix' ? TEINTES[0] : reglages.couleur;
	const dessin = reglages.motif === 'mix' ? DESSINS[0] : reglages.motif;

	return (
		<PanneauReglages
			aide={ui('menu.aides', langue)}
			jauge={{ libelle: ui('menu.jauge', langue), visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			defauts={{ libelle: ui('menu.defauts', langue), retablir: () => enregistrer(null) }}
		>
			{/* Les aperçus montrent la carte telle qu'elle sera : les dos dans la couleur en cours,
			    les couleurs sur le dos en cours. */}
			<div className="card">
				<div className="row-label">{ui('menu.motif', langue)}</div>
				<ChoixIllustre
					id="motif-choix"
					etiquette={ui('menu.motif', langue)}
					valeurs={MOTIFS}
					choisie={reglages.motif}
					nom={(valeur) => ui(`motif.${valeur}` as CleInterface, langue)}
					apercu={(motif) => (motif === 'mix'
						? <VignetteMix apercus={TROIS.map((i) => [dessinDeCarte('mix', i), teinte] as const)} />
						: <Vignette dessin={motif} teinte={teinte} />)}
					choisir={(motif) => changer({ motif })}
				/>
			</div>

			<div className="card">
				<div className="row-label">{ui('menu.couleur', langue)}</div>
				<ChoixIllustre
					id="couleur-choix"
					etiquette={ui('menu.couleur', langue)}
					couleurs
					valeurs={COULEURS}
					choisie={reglages.couleur}
					nom={(valeur) => ui(`couleur.${valeur}` as CleInterface, langue)}
					apercu={(couleur) => (couleur === 'mix'
						? <VignetteMix apercus={TROIS.map((i) => [dessin, teinteDeCarte('mix', i)] as const)} />
						: <Vignette dessin={dessin} teinte={couleur} />)}
					choisir={(couleur) => changer({ couleur })}
				/>
			</div>
		</PanneauReglages>
	);
}
