/*
 * Les boutons du menu principal réagissent au doigt qui se lève, que l'appui soit bref ou long.
 *
 * Sur Android, un doigt qui reste posé sur un bouton devient un « appui long » : le navigateur
 * n'envoie alors pas le clic que le bouton attend. Le bouton s'enfonçait sans que rien ne se passe —
 * or en scène, on appuie souvent plus posément que sur un téléphone de tous les jours. Ici, un
 * bouton agit quand le doigt se relève, pourvu qu'il se soit posé sur ce bouton et n'ait pas glissé
 * hors de lui.
 *
 * Conséquence voulue : un doigt qui ne s'est pas posé sur le menu — celui de l'appui de 3 s qui
 * vient de quitter un tour, et se relève sur le menu — ne déclenche rien.
 *
 * Le clavier et la télécommande (Entrée, Espace sur un bouton) passent toujours par le clic.
 */

/** Distance au-delà de laquelle le doigt a glissé : ce n'est plus un appui sur le bouton. */
const GLISSEMENT_PX = 24;

interface Appui {
	id: number;
	x: number;
	y: number;
}

export function surToucher(bouton: HTMLElement, action: () => void): void {
	let appui: Appui | null = null;
	/** Le clic que le navigateur envoie après un appui bref, déjà traité au lever du doigt. */
	let clicTraite = false;

	bouton.addEventListener('pointerdown', (event) => {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		appui = { id: event.pointerId, x: event.clientX, y: event.clientY };
		clicTraite = false;
	});
	bouton.addEventListener('pointermove', (event) => {
		if (appui?.id === event.pointerId && Math.hypot(event.clientX - appui.x, event.clientY - appui.y) > GLISSEMENT_PX) appui = null;
	});
	bouton.addEventListener('pointercancel', () => {
		appui = null;
	});
	bouton.addEventListener('pointerup', (event) => {
		if (appui?.id !== event.pointerId) return;
		appui = null;
		// Le doigt doit se lever sur le bouton, pas à côté.
		const r = bouton.getBoundingClientRect();
		if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) return;
		clicTraite = true;
		action();
	});
	bouton.addEventListener('click', (event) => {
		// Après un appui du doigt, l'action est déjà faite ; un clic sans appui vient du clavier.
		if (clicTraite || event.detail > 0) {
			clicTraite = false;
			return;
		}
		action();
	});
	// Pas de menu contextuel sur un appui long.
	bouton.addEventListener('contextmenu', (event) => event.preventDefault());
}
