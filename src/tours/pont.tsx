/*
 * Le pont entre un tour et l'app : ce que le tour sait de son ouverture, et comment il rend la main
 * au menu principal. Fourni par pages/PageTour.tsx, lu par le tour avec usePont().
 *
 *   dossier     le dossier du tour (content/tours.ts) ;
 *   nomDuTour   son nom, dans la langue du menu, tel que la tuile l'affiche (en-tête des réglages) ;
 *   langue      la langue choisie par le bouton FR / EN du menu, pour tous les tours ;
 *   enReglages  le tour a été ouvert par l'écrou ⚙ : il ne montre que ses réglages, que l'on
 *               ferme pour revenir au menu ;
 *   quitter()   retour au menu : l'appui de 3 s pendant le tour (ou Échap, M), ou la fermeture
 *               de ses réglages.
 *
 * La fin d'une routine ne fait pas quitter le tour : son geste de remise à zéro (double toucher)
 * le remet en place pour une nouvelle routine.
 */

import { createContext, useContext } from 'react';
import type { Lang } from '../logic/i18n.ts';

export interface Pont {
	dossier: string;
	nomDuTour: string;
	langue: Lang;
	enReglages: boolean;
	quitter: () => void;
}

export const PontContext = createContext<Pont | null>(null);

export function usePont(): Pont {
	const pont = useContext(PontContext);
	if (!pont) throw new Error('usePont() hors d’un tour (pages/PageTour.tsx)');
	return pont;
}
