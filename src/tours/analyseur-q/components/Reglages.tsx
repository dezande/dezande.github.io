/*
 * Les réglages de l'Analyseur Q, ouverts par l'écrou ⚙ du menu principal : transition entre les
 * slides, aides à la répétition (notes pour l'artiste, jauge de l'appui long), réglages par défaut.
 */

import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import { ui } from '../content/interface.ts';
import type { Lang } from '../logic/i18n.ts';
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
		<PanneauReglages>
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

			<div className="card options">
				<p className="hint">{ui('menu.aides', langue)}</p>
				<label className="toggle-row" htmlFor="show-notes">
					<span>{ui('menu.notes', langue)}</span> <input id="show-notes" type="checkbox" checked={reglages.showNotes} onChange={(event) => changer({ showNotes: event.target.checked })} />
				</label>
				<label className="toggle-row" htmlFor="show-hold-ring">
					<span>{ui('menu.jauge', langue)}</span> <input id="show-hold-ring" type="checkbox" checked={reglages.showHoldRing} onChange={(event) => changer({ showHoldRing: event.target.checked })} />
				</label>
			</div>

			<button type="button" id="defaults-btn" className="link" onClick={() => enregistrer(null)}>{ui('menu.defauts', langue)}</button>
		</PanneauReglages>
	);
}
