// Pile ou face dans l'app (src/tours/pile-ou-face/) : la routine au clavier, et ses réglages.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../../src/App.tsx';

beforeEach(() => {
	// Téléphone en anglais pour jsdom : l'app est mise en français, sa langue de départ.
	localStorage.clear();
	localStorage.setItem('mes-tours:langue', '"fr"');
	window.location.hash = '';
});

/** Ouvre le tour à son adresse, et attend qu'il soit chargé. */
async function ouvrir(adresse: string): Promise<HTMLElement> {
	window.location.hash = adresse;
	render(<App />);
	// Le tour est chargé à sa première ouverture (src/tours/registre.ts).
	await waitFor(() => expect(document.querySelector('#table .carte')).not.toBeNull());
	return document.querySelector<HTMLElement>('#table .carte')!;
}

const touche = (key: string): void => {
	act(() => {
		fireEvent.keyDown(document, { key });
	});
};

test('↑ retourne la carte sur pile, R la remet face cachée : on reste dans le tour', async () => {
	const carte = await ouvrir('#/tours/pile-ou-face');
	expect(carte).not.toHaveClass('retournee');
	touche('ArrowUp');
	expect(carte).toHaveClass('retournee');
	expect(carte.dataset.cote).toBe('pile');
	expect(document.querySelector('#table .prediction')).toHaveTextContent('0,20 europile');
	touche('r');
	expect(carte).not.toHaveClass('retournee');
	expect(window.location.hash).toBe('#/tours/pile-ou-face');
});

test('une fois la carte retournée, une autre touche ne change plus la prédiction', async () => {
	const carte = await ouvrir('#/tours/pile-ou-face');
	touche('ArrowDown');
	touche('ArrowUp');
	expect(carte.dataset.cote).toBe('face');
});

test('Échap ramène au menu principal', async () => {
	await ouvrir('#/tours/pile-ou-face');
	touche('Escape');
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : un réglage changé est gardé, la croix ramène au menu', async () => {
	const carte = await ouvrir('#/tours/pile-ou-face?reglages');
	expect(document.querySelector('.titre-reglages')).toHaveTextContent('Réglages');
	expect(document.querySelector('.nom-du-tour')).toHaveTextContent('Pile ou face');
	fireEvent.click(document.querySelector('#couleur-choix button[data-valeur="rouge"]')!);
	expect(carte.dataset.couleur).toBe('rouge');
	expect(JSON.parse(localStorage.getItem('pile-ou-face:settings:v1')!)).toMatchObject({ couleur: 'rouge' });
	fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
	expect(await screen.findByText('Choisis un tour')).toBeInTheDocument();
});

test('écrou ⚙ : « Rétablir les réglages par défaut »', async () => {
	localStorage.setItem('pile-ou-face:settings:v1', JSON.stringify({ couleur: 'bleu', delai: 3 }));
	const carte = await ouvrir('#/tours/pile-ou-face?reglages');
	expect(carte.dataset.couleur).toBe('bleu');
	expect(document.querySelector('#delai-valeur')).toHaveTextContent('3 s');
	fireEvent.click(screen.getByText('Rétablir les réglages par défaut'));
	expect(carte.dataset.couleur).toBe('noir');
	expect(document.querySelector('#delai-valeur')).toHaveTextContent('0 s');
});
