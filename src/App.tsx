/*
 * Les pages de l'app, dans l'adresse après le « # » : le service worker ne connaît ainsi qu'une
 * page (index.html), qui s'ouvre hors-ligne quel que soit le tour demandé.
 *
 *   #/                          le menu principal
 *   #/tours/<dossier>           un tour, prêt pour une nouvelle routine
 *   #/tours/<dossier>?reglages  seulement ses réglages (écrou ⚙ du menu)
 */

import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { LangueProvider } from './langue/LangueContext.tsx';
import { Menu } from './pages/Menu.tsx';
import { PageTour } from './pages/PageTour.tsx';

export function App() {
	return (
		<LangueProvider>
			<HashRouter>
				<Routes>
					<Route path="/" element={<Menu />} />
					<Route path="/tours/:dossier" element={<PageTour />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</HashRouter>
		</LangueProvider>
	);
}
