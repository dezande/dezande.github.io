/*
 * Boule de cristal : la routine des 3 boulettes. Déroulé d'un tour :
 *   1. le magicien touche discrètement une des 3 bandes de l'écran (haut, milieu, bas) ;
 *   2. la prédiction de cette bande (6, 16 ou 26) est « armée » : la brume s'agite pendant le délai réglé ;
 *   3. le nombre apparaît dans la boule, l'écran reste verrouillé (plus aucun toucher n'arme) ;
 *   4. un double tap efface le nombre, la boule se réarme pour le tour suivant (on reste dans le tour).
 * Appui de 3 s n'importe où, Échap ou M : retour au menu principal. R : le nombre s'efface.
 *
 * Un tour à zones : les gestes, le clavier, les réglages et le test des zones sont ceux de
 * src/components/zones/TourAZones.tsx. Ce dossier n'a que ce qui est propre à la boule :
 *   index.tsx    ce fichier : les mots de la boule, et son décor
 *   components/  Boule (l'autel, la boule et le nombre), Poussiere (particules dorées)
 *   content/     les noms des bandes
 *   logic/       settings.ts : les 3 prédictions, les réglages par défaut (testés sous Node,
 *                tests/tours/boule-de-cristal/)
 * Les styles sont dans src/styles/tours/boule-de-cristal/.
 */

import { TourAZones } from '../../components/zones/TourAZones.tsx';
import { Boule } from './components/Boule.tsx';
import { Poussiere } from './components/Poussiere.tsx';
import { ZONE_NAMES } from './content/zones.ts';
import { PREDICTIONS, sanitizeSettings, ZONES } from './logic/settings.ts';

const LIBELLES = {
	routine: '3 boulettes',
	decoupage: '3 bandes horizontales',
	delai: 'Délai d\'apparition',
	duree: 'Durée du fondu',
};

const PHASES = {
	idle: 'Prêt',
	pending: 'Armé · verrouillé',
	shown: 'Affiché · verrouillé',
	clearing: 'Réarmement…',
};

export default function BouleDeCristal() {
	return (
		<TourAZones
			// Les réglages, gardés sur l'appareil, sous le nom de l'app d'origine (« Voyante »).
			cleReglages="voyante:settings:v1"
			valider={sanitizeSettings}
			zones={ZONES}
			noms={ZONE_NAMES}
			valeurs={PREDICTIONS}
			libelles={LIBELLES}
			libellesPhases={PHASES}
			decor={(etat, reglages, finInstant) => (
				<>
					<div className="velvet"></div>
					<Boule etat={etat} reglages={reglages} finInstant={finInstant} />
					<Poussiere nombre={18} />
					<div className="vignette"></div>
				</>
			)}
		/>
	);
}
