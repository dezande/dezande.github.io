/*
 * Les réglages de l'Analyseur Q, ouverts par l'écrou ⚙ du menu principal : transition entre les
 * slides, aides à la répétition (notes pour l'artiste, jauge de l'appui long), réglages par défaut.
 */

import { Interrupteur, PanneauReglages } from '../../../components/PanneauReglages.tsx';
import { ui } from '../content/interface.ts';
import type { Lang } from '../../../logic/i18n.ts';
import { TRANSITIONS, type Settings } from '../logic/settings.ts';

interface Props {
	reglages: Settings;
	langue: Lang;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
}

export function Reglages({ reglages, langue, enregistrer }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });

	return (
		<PanneauReglages
			aide={ui('menu.aides', langue)}
			jauge={{ libelle: ui('menu.jauge', langue), visible: reglages.showHoldRing, changer: (showHoldRing) => changer({ showHoldRing }) }}
			autresAides={<Interrupteur id="show-notes" libelle={ui('menu.notes', langue)} coche={reglages.showNotes} changer={(showNotes) => changer({ showNotes })} />}
			defauts={{ libelle: ui('menu.defauts', langue), retablir: () => enregistrer(null) }}
		>
			<div className="card">
				<div className="row-label">{ui('menu.transition', langue)}</div>
				{/* Le nom de chaque transition dans la langue en cours ; la valeur enregistrée ne change pas. */}
				<div className="seg" id="transition-seg" role="radiogroup" aria-label={ui('menu.transition', langue)}>
					{TRANSITIONS.map((transition) => (
						<button key={transition} type="button" role="radio" data-transition={transition} aria-checked={transition === reglages.transition} onClick={() => changer({ transition })}>
							{ui(`transition.${transition}`, langue)}
						</button>
					))}
				</div>
			</div>
		</PanneauReglages>
	);
}
