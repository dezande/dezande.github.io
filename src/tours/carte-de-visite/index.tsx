/*
 * Carte de visite : la routine Arcane Système, jouée téléphone tenu en largeur.
 *
 * Sur une vieille table de bois, la carte de visite du Théâtre Robert-Houdin, le théâtre de magie de
 * Jean-Eugène Robert-Houdin (1845), au 8, boulevard des Italiens, démoli en 1924. Déroulé d'un tour :
 *   1. le magicien touche discrètement un des 4 coins de l'écran ;
 *   2. le numéro de ce coin (17, 19, 21 ou 23) est « armé » : rien ne bouge pendant le délai réglé ;
 *   3. la carte se retourne : au dos, le numéro seul, en grand, écrit à la plume ; l'écran reste
 *      verrouillé ;
 *   4. un double tap remet la carte sur son recto, pour le tour suivant (on reste dans le tour).
 * Appui de 3 s n'importe où, Échap ou M : retour au menu principal. R : la carte revient sur son recto.
 *
 * Un tour à zones, issu de l'ancienne routine Arcane Système de la boule de cristal : les gestes, le
 * clavier, les réglages, le test des zones et le paysage sont ceux de
 * src/components/zones/TourAZones.tsx. Ce dossier n'a que ce qui est propre à la carte :
 *   index.tsx    ce fichier : les mots de la carte, et son décor
 *   components/  Carte (recto imprimé, verso à la plume), Table (la vieille table de bois)
 *   content/     les noms des coins
 *   logic/       settings.ts : les numéros, les réglages par défaut (testés sous Node,
 *                tests/tours/carte-de-visite/)
 * Les styles sont dans src/styles/tours/carte-de-visite/.
 */

import { TourAZones } from '../../components/zones/TourAZones.tsx';
import { Carte } from './components/Carte.tsx';
import { Table } from './components/Table.tsx';
import { ZONE_NAMES } from './content/zones.ts';
import { NUMEROS, sanitizeSettings, ZONES } from './logic/settings.ts';

const LIBELLES = {
	routine: 'Arcane Système',
	decoupage: '4 coins de l\'écran',
	delai: 'Délai avant le retournement',
	duree: 'Durée du retournement',
};

const PHASES = {
	idle: 'Prêt',
	pending: 'Armé · verrouillé',
	shown: 'Retournée · verrouillé',
	clearing: 'Retour au recto…',
};

export default function CarteDeVisite() {
	return (
		<TourAZones
			cleReglages="carte-de-visite:settings:v1"
			valider={sanitizeSettings}
			zones={ZONES}
			noms={ZONE_NAMES}
			valeurs={NUMEROS}
			libelles={LIBELLES}
			libellesPhases={PHASES}
			paysage
			// La vieille table, la carte posée au milieu, une lampe au-dessus.
			decor={(etat, _reglages, finInstant) => (
				<>
					<Table />
					<div className="lampe"></div>
					<Carte etat={etat} finInstant={finInstant} />
				</>
			)}
		/>
	);
}
