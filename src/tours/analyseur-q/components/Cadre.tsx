/*
 * Cadre d'instrument : coins de viseur, graduations et repères, sur toutes les slides. Pur décor,
 * posé dans la marge des slides : il laisse passer les touchers.
 */

import { ui } from '../content/interface.ts';
import type { Lang } from '../../../logic/i18n.ts';

export function Cadre({ langue }: { langue: Lang }) {
	return (
		<div id="frame" aria-hidden="true">
			<span className="coin haut-gauche" />
			<span className="coin haut-droite" />
			<span className="coin bas-gauche" />
			<span className="coin bas-droite" />
			<span className="graduations gauche" />
			<span className="graduations droite" />
			<span className="repere haut">Analyseur Q · AQ-52</span>
			<span className="repere bas"><i /><span>{ui('cadre.mesure', langue)}</span></span>
		</div>
	);
}
