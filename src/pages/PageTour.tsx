/*
 * La page d'un tour : il s'ouvre à la place du menu, en plein écran, prêt pour une nouvelle
 * routine (#/tours/<dossier>), ou seulement ses réglages (#/tours/<dossier>?reglages).
 *
 * Le tour reçoit par le pont (tours/pont.tsx) la langue du menu, son nom, et de quoi revenir au
 * menu. Il y revient par l'historique : le menu réapparaît, et l'historique ne grandit pas d'un tour
 * à l'autre. Le geste retour d'Android y ramène aussi.
 *
 * Ses styles sont tous rangés sous .scene-<dossier> (styles/tours/<dossier>/), et la page porte
 * html[data-tour] pour le fond derrière #app et la couleur de la barre du téléphone.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { TOURS } from '../content/tours.ts';
import { useLangue } from '../langue/LangueContext.tsx';
import { PontContext, type Pont } from '../tours/pont.tsx';
import { adresseDuTour, entreeDuRegistre, type EntreeDuRegistre } from '../tours/registre.ts';

/** La couleur de la barre du téléphone sur le menu (index.html). */
const COULEUR_DU_MENU = '#0b0b2b';

function couleurTheme(couleur: string): void {
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', couleur);
}

/** Les seuls paramètres d'adresse acceptés : aucun, ou l'ouverture des réglages seuls (écrou ⚙). */
const PARAMETRES_ACCEPTES = ['', '?reglages'];

export function PageTour({ dossier }: { dossier: string }) {
	const { key, pathname, search } = useLocation();
	const tour = TOURS.find((t) => t.dossier === dossier);
	const entree = entreeDuRegistre(dossier);
	// L'adresse exacte, et rien d'autre : pas de « / » final, pas de paramètre inconnu.
	const exacte = pathname === adresseDuTour(dossier) && PARAMETRES_ACCEPTES.includes(search);
	if (!tour || !entree || !exacte) return <Navigate to="/" replace />;
	// Une clé par ouverture : rouvrir un tour repart toujours d'une nouvelle routine.
	return <Tour key={key} dossier={dossier} nomDuTour={tour.nom} entree={entree} />;
}

function Tour({ dossier, nomDuTour, entree }: { dossier: string; nomDuTour: Record<string, string>; entree: EntreeDuRegistre }) {
	const { langue } = useLangue();
	const navigate = useNavigate();
	const location = useLocation();
	const enReglages = location.search === '?reglages';

	/*
	 * Retour au menu. Ouvert depuis le menu, le tour y revient par l'historique ; ouvert autrement
	 * (adresse tapée à la main), il remplace sa page par le menu. Une seule fois : l'appui de 3 s et
	 * une touche au même moment ne doivent pas remonter l'historique de deux pages.
	 */
	const parti = useRef(false);
	const quitter = useCallback(() => {
		if (parti.current) return;
		parti.current = true;
		if (location.key !== 'default') navigate(-1);
		else navigate('/', { replace: true });
	}, [location.key, navigate]);

	useEffect(() => {
		document.documentElement.dataset.tour = dossier;
		couleurTheme(entree.couleurTheme);
		return () => {
			delete document.documentElement.dataset.tour;
			couleurTheme(COULEUR_DU_MENU);
		};
	}, [dossier, entree]);

	const pont = useMemo<Pont>(
		() => ({ dossier, nomDuTour: nomDuTour[langue] ?? '', langue, enReglages, quitter }),
		[dossier, nomDuTour, langue, enReglages, quitter],
	);
	const { Composant } = entree;

	return (
		<PontContext.Provider value={pont}>
			<div className={`scene scene-${dossier}`}>
				<Suspense fallback={null}>
					<Composant />
				</Suspense>
			</div>
		</PontContext.Provider>
	);
}
