// Les adresses de l'app (src/App.tsx, src/pages/PageTour.tsx) : strictes. Seules les adresses
// exactes des tours publiés ouvrent quelque chose ; toute autre ramène au menu.
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../../src/App.tsx';
import { TOURS } from '../../src/content/tours.ts';

beforeEach(() => {
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
});

/** Ouvre l'app à `adresse` (après le « # ») et attend qu'elle se pose. */
async function ouvrir(adresse: string): Promise<void> {
	window.location.hash = adresse;
	render(<App />);
	await waitFor(() => expect(document.querySelector('#menu-principal, .scene')).not.toBeNull());
}

test.each(TOURS.map((tour) => tour.dossier))('« %s » s’ouvre à son adresse exacte', async (dossier) => {
	await ouvrir(`#/tours/${dossier}`);
	expect(document.querySelector(`.scene-${dossier}`), `${dossier} ne s’ouvre pas`).not.toBeNull();
	expect(window.location.hash).toBe(`#/tours/${dossier}`);
});

test('?reglages ouvre les réglages seuls', async () => {
	await ouvrir('#/tours/pile-ou-face?reglages');
	await waitFor(() => expect(document.querySelector('#close-btn')).not.toBeNull());
});

test.each([
	['un nom inventé', '#/tours/tour-secret'],
	['un nom hérité de tout objet JavaScript', '#/tours/constructor'],
	['un autre nom hérité', '#/tours/__proto__'],
	['une remontée de dossier', '#/tours/../tours/pile-ou-face'],
	['une remontée encodée', '#/tours/%2e%2e%2fpile-ou-face'],
	['une majuscule', '#/tours/Pile-ou-face'],
	['un « / » final', '#/tours/pile-ou-face/'],
	['un dossier de plus', '#/tours/pile-ou-face/autre'],
	['un paramètre inconnu', '#/tours/pile-ou-face?debug'],
	['un paramètre de plus', '#/tours/pile-ou-face?reglages&debug'],
	['une valeur au paramètre', '#/tours/pile-ou-face?reglages=1'],
	['une page inconnue', '#/admin'],
])('%s ramène au menu : %s', async (_cas, adresse) => {
	await ouvrir(adresse);
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
	expect(document.querySelector('.scene'), 'un tour s’est ouvert').toBeNull();
	expect(window.location.hash, 'l’adresse refusée reste affichée').toBe('#/');
});
