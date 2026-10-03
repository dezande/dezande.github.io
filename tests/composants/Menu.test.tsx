// Le menu principal (src/pages/Menu.tsx) : une tuile par tour, son écrou ⚙, la langue FR / EN.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../src/App.tsx';
import { TOURS } from '../../src/content/tours.ts';
import { APP_VERSION } from '../../src/version.ts';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

/** Un doigt posé puis levé sur l'élément, sans clic derrière (Android, appui long). */
function toucher(element: HTMLElement): void {
	const doigt = { clientX: 0, clientY: 0, identifier: 1, target: element };
	fireEvent.touchStart(element, { touches: [doigt], changedTouches: [doigt] });
	fireEvent.touchEnd(element, { touches: [], changedTouches: [doigt] });
}

test('une tuile par tour, avec son nom, sa description et son écrou ⚙', () => {
	render(<App />);
	const tuiles = document.querySelectorAll<HTMLElement>('#tours .tour');
	expect([...tuiles].map((tuile) => tuile.dataset.dossier)).toStrictEqual(TOURS.map((tour) => tour.dossier));
	for (const [i, tour] of TOURS.entries()) {
		expect(within(tuiles[i]!).getByText(tour.nom.fr)).toBeInTheDocument();
		expect(within(tuiles[i]!).getByText(tour.description.fr)).toBeInTheDocument();
		expect(within(tuiles[i]!).getByRole('button', { name: `Réglages : ${tour.nom.fr}` })).toBeInTheDocument();
	}
	expect(document.querySelector('#version')).toHaveTextContent(`Version ${APP_VERSION}`);
});

test('FR / EN : le menu change de langue, et s’en souvient', () => {
	const { unmount } = render(<App />);
	expect(screen.getByRole('radio', { name: 'FR' })).toHaveAttribute('aria-checked', 'true');
	fireEvent.click(screen.getByRole('radio', { name: 'EN' }));
	expect(screen.getByText('Pick a trick')).toBeInTheDocument();
	expect(screen.getByText(TOURS[0]!.nom.en)).toBeInTheDocument();
	expect(document.documentElement.lang).toBe('en');
	unmount();

	render(<App />);
	expect(screen.getByRole('radio', { name: 'EN' })).toHaveAttribute('aria-checked', 'true');
});

test('un appui long sur une tuile agit au lever du doigt, sans attendre de clic', async () => {
	render(<App />);
	const tuile = document.querySelector<HTMLElement>('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer')!;
	await act(async () => toucher(tuile));
	expect(window.location.hash).toBe('#/tours/pile-ou-face');
});

test('l’écrou ⚙ ouvre seulement les réglages du tour', async () => {
	render(<App />);
	await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Réglages : Pile ou face' })));
	expect(window.location.hash).toBe('#/tours/pile-ou-face?reglages');
});

test('un doigt qui ne s’est pas posé sur le bouton ne déclenche rien, même suivi d’un clic', () => {
	render(<App />);
	const tuile = document.querySelector<HTMLElement>('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer')!;
	// Le clic qu'envoie le navigateur après le doigt de l'appui de 3 s, relevé sur le menu.
	fireEvent.click(tuile, { detail: 1 });
	expect(window.location.hash).toBe('');
});
