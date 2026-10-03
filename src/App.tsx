/*
 * L'app : le menu principal, ou le tour demandé par l'adresse (src/logic/adresses.ts), suivie par
 * le routeur maison (src/routeur.ts). Seuls les tours de la liste (content/tours.ts) inscrits au
 * registre (tours/registre.ts) ont une adresse ; toute autre adresse ramène au menu, et la barre
 * d'adresse affiche alors celle du menu.
 */

import { useEffect } from 'preact/hooks';
import { TOURS } from './content/tours.ts';
import { LangueProvider } from './langue/LangueContext.tsx';
import { resoudre } from './logic/adresses.ts';
import { Menu } from './pages/Menu.tsx';
import { PageTour } from './pages/PageTour.tsx';
import { naviguer, useAdresse } from './routeur.ts';
import { entreeDuRegistre } from './tours/registre.ts';

/** Les tours publiés : dans la liste, et au registre. */
const PUBLIES = TOURS.map((tour) => tour.dossier).filter((dossier) => entreeDuRegistre(dossier));

export function App() {
	const adresse = useAdresse();
	const page = resoudre(adresse.hash, PUBLIES);

	// Adresse refusée : le menu, à sa place dans l'historique.
	useEffect(() => {
		if (page.page === 'refusee') naviguer('/', { remplacer: true });
	}, [page.page, adresse]);

	return (
		<LangueProvider>
			{page.page === 'tour'
				// Une clé par ouverture : rouvrir un tour repart toujours d'une nouvelle routine.
				? <PageTour key={adresse.cle} dossier={page.dossier} enReglages={page.reglages} depuisLApp={adresse.depuisLApp} />
				: <Menu />}
		</LangueProvider>
	);
}
