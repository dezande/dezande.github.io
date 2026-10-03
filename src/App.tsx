/*
 * Les pages de l'app, dans l'adresse après le « # » : le service worker ne connaît ainsi qu'une
 * page (index.html), qui s'ouvre hors-ligne quel que soit le tour demandé.
 *
 *   #/                          le menu principal
 *   #/tours/<dossier>           un tour, prêt pour une nouvelle routine
 *   #/tours/<dossier>?reglages  seulement ses réglages (écrou ⚙ du menu)
 *
 * Des adresses strictes : une route exacte par tour de la liste (content/tours.ts) inscrit au
 * registre (tours/registre.ts), sensible à la casse. Toute autre adresse — un nom inventé, un tour
 * hors du registre, une majuscule, un « / » final, un paramètre inconnu — ramène au menu (la page
 * du tour vérifie le reste : pages/PageTour.tsx).
 */

import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { TOURS } from './content/tours.ts';
import { LangueProvider } from './langue/LangueContext.tsx';
import { Menu } from './pages/Menu.tsx';
import { PageTour } from './pages/PageTour.tsx';
import { adresseDuTour, entreeDuRegistre } from './tours/registre.ts';

export function App() {
	return (
		<LangueProvider>
			<HashRouter>
				<Routes>
					<Route path="/" element={<Menu />} />
					{TOURS.filter((tour) => entreeDuRegistre(tour.dossier)).map((tour) => (
						<Route key={tour.dossier} path={adresseDuTour(tour.dossier)} caseSensitive element={<PageTour dossier={tour.dossier} />} />
					))}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</HashRouter>
		</LangueProvider>
	);
}
