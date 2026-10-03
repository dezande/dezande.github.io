/*
 * La page d'un tour : il s'ouvre à la place du menu, en plein écran, prêt pour une nouvelle
 * routine (#/tours/<dossier>), ou seulement ses réglages (#/tours/<dossier>?reglages). L'adresse a
 * déjà été vérifiée (src/logic/adresses.ts) : seul un tour publié arrive ici.
 *
 * Le tour reçoit par le pont (tours/pont.tsx) la langue du menu, son nom, et de quoi revenir au
 * menu. Il y revient par l'historique : le menu réapparaît, et l'historique ne grandit pas d'un tour
 * à l'autre. Le geste retour d'Android y ramène aussi.
 *
 * Ses styles sont tous rangés sous .scene-<dossier> (styles/tours/<dossier>/), et la page porte
 * html[data-tour] pour le fond derrière #app et la couleur de la barre du téléphone.
 */

import type { ComponentType } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { TOURS } from '../content/tours.ts';
import { useLangue } from '../langue/LangueContext.tsx';
import { naviguer } from '../routeur.ts';
import { PontContext, type Pont } from '../tours/pont.tsx';
import { entreeDuRegistre } from '../tours/registre.ts';

/** La couleur de la barre du téléphone sur le menu (index.html). */
const COULEUR_DU_MENU = '#0b0b2b';

function couleurTheme(couleur: string): void {
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', couleur);
}

/** Les tours déjà chargés : rouverts, ils s'affichent tout de suite. */
const charges = new Map<string, ComponentType>();

interface Props {
	/** Un tour publié (src/App.tsx ne donne que ceux-là). */
	dossier: string;
	/** Ouvert par l'écrou ⚙ : seulement ses réglages. */
	enReglages: boolean;
	/** Ouvert par le menu de l'app : le retour au menu passe par l'historique. */
	depuisLApp: boolean;
}

export function PageTour({ dossier, enReglages, depuisLApp }: Props) {
	const { langue } = useLangue();
	const tour = TOURS.find((t) => t.dossier === dossier)!;
	const entree = entreeDuRegistre(dossier)!;

	// Le tour est chargé à sa première ouverture ; ensuite, il est déjà là.
	const [Composant, setComposant] = useState<ComponentType | null>(() => charges.get(dossier) ?? null);
	useEffect(() => {
		if (Composant) return undefined;
		let actif = true;
		void entree.charger().then(({ default: charge }) => {
			charges.set(dossier, charge);
			// Une fonction se passe à setState sous forme de… fonction qui la renvoie.
			if (actif) setComposant(() => charge);
		});
		return () => {
			actif = false;
		};
	}, [Composant, dossier, entree]);

	/*
	 * Retour au menu. Ouvert depuis le menu, le tour y revient par l'historique ; ouvert autrement
	 * (adresse tapée à la main), il remplace sa page par le menu. Une seule fois : l'appui de 3 s et
	 * une touche au même moment ne doivent pas remonter l'historique de deux pages.
	 */
	const parti = useRef(false);
	const quitter = useCallback(() => {
		if (parti.current) return;
		parti.current = true;
		if (depuisLApp) history.back();
		else naviguer('/', { remplacer: true });
	}, [depuisLApp]);

	useEffect(() => {
		document.documentElement.dataset.tour = dossier;
		couleurTheme(entree.couleurTheme);
		return () => {
			delete document.documentElement.dataset.tour;
			couleurTheme(COULEUR_DU_MENU);
		};
	}, [dossier, entree]);

	const pont = useMemo<Pont>(
		() => ({ dossier, nomDuTour: tour.nom[langue], langue, enReglages, quitter }),
		[dossier, tour, langue, enReglages, quitter],
	);

	return (
		<PontContext.Provider value={pont}>
			<div className={`scene scene-${dossier}`}>{Composant && <Composant />}</div>
		</PontContext.Provider>
	);
}
