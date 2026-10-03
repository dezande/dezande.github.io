/*
 * Dans les réglages d'un tour, les boutons agissent au lever du doigt, que l'appui soit bref ou
 * long — comme ceux du menu principal (src/toucher.ts).
 *
 * Sur Android, un doigt qui reste posé sur un bouton devient un « appui long » : le navigateur
 * n'envoie pas le clic que le bouton attend, et le bouton s'enfonce sans agir. Ici, un seul écouteur
 * sur tout le panneau suit le doigt par les événements tactiles : s'il s'est posé sur un bouton
 * (une case à cocher, un dos de carte, la croix…) et s'y relève sans avoir glissé, le bouton reçoit
 * son clic — un seul, le clic natif éventuel étant annulé. Le code de chaque tour, qui écoute les
 * clics, n'a donc rien à changer.
 *
 * Les curseurs (délai, fondu…) ne sont pas concernés : on les fait glisser, et cela fonctionne déjà.
 * Un doigt qui glisse — pour faire défiler les réglages — n'appuie sur rien.
 */

/** Ce qui se touche comme un bouton dans un panneau de réglages. */
const TOUCHABLE = 'button, label, a, [role="radio"], input[type="checkbox"], summary';

/** Distance au-delà de laquelle le doigt a glissé : ce n'est plus un appui. */
const GLISSEMENT_PX = 24;

export function boutonsTactiles(panneau: HTMLElement): void {
	let appui: { cible: HTMLElement; x: number; y: number } | null = null;

	panneau.addEventListener('touchstart', (event) => {
		const doigt = event.changedTouches[0];
		const element = event.target instanceof Element ? event.target : null;
		const cible = element?.closest<HTMLElement>(TOUCHABLE);
		// Un curseur se fait glisser : on le laisse au navigateur.
		appui = doigt && event.touches.length === 1 && cible && !element?.closest('input[type="range"]')
			? { cible, x: doigt.clientX, y: doigt.clientY }
			: null;
	}, { passive: true });

	panneau.addEventListener('touchmove', (event) => {
		const doigt = event.changedTouches[0];
		if (appui && doigt && Math.hypot(doigt.clientX - appui.x, doigt.clientY - appui.y) > GLISSEMENT_PX) appui = null;
	}, { passive: true });

	panneau.addEventListener('touchend', (event) => {
		const doigt = event.changedTouches[0];
		const fait = appui;
		appui = null;
		if (!fait || !doigt) return;
		const r = fait.cible.getBoundingClientRect();
		if (doigt.clientX < r.left || doigt.clientX > r.right || doigt.clientY < r.top || doigt.clientY > r.bottom) return;
		// Un seul clic : le nôtre. Le clic natif, quand le navigateur l'aurait envoyé, est annulé.
		if (event.cancelable) event.preventDefault();
		fait.cible.click();
	}, { passive: false });

	panneau.addEventListener('touchcancel', () => {
		appui = null;
	});

	// Pas de menu contextuel sur un appui long.
	panneau.addEventListener('contextmenu', (event) => event.preventDefault());
}
