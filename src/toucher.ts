/*
 * Les boutons du menu principal réagissent au doigt qui se lève, que l'appui soit bref ou long.
 *
 * Deux comportements d'Android, observés sur le téléphone (Nothing Phone, Chrome) :
 *
 *   - un doigt qui reste posé sur un bouton devient un « appui long » : le navigateur n'envoie
 *     alors pas le clic que le bouton attend ;
 *   - de retour d'un tour (son cadre retiré), le menu ne reçoit plus, pendant un moment, les
 *     événements « pointer » (pointerdown, pointerup) : seulement les événements tactiles
 *     (touchstart, touchend) et le clic.
 *
 * Le bouton s'enfonçait donc sans que rien ne se passe. Ici, le geste du doigt est suivi par les
 * événements tactiles, qui arrivent toujours : le bouton agit quand le doigt se relève, pourvu qu'il
 * se soit posé sur ce bouton et n'en ait pas glissé. La souris passe par les événements « pointer »,
 * le clavier et la télécommande par le clic. Le clic sert aussi de secours, mais seulement pour un
 * appui commencé sur le bouton : un doigt qui ne s'est pas posé sur le menu — celui de l'appui de
 * 3 s qui vient de quitter un tour, et se relève sur le menu — ne déclenche rien.
 */

/** Distance au-delà de laquelle le doigt a glissé : ce n'est plus un appui sur le bouton. */
const GLISSEMENT_PX = 24;

export function surToucher(bouton: HTMLElement, action: () => void): void {
	/** L'appui en cours sur ce bouton : où il a commencé. */
	let appui: { x: number; y: number } | null = null;
	/** Un appui a commencé sur ce bouton (doigt ou souris) : son clic peut servir de secours. */
	let commenceIci = false;
	/** L'action de cet appui est déjà faite : le clic qui suit ne doit pas la refaire. */
	let faite = false;

	const debut = (x: number, y: number): void => {
		appui = { x, y };
		commenceIci = true;
		faite = false;
	};
	const deplace = (x: number, y: number): void => {
		if (appui && Math.hypot(x - appui.x, y - appui.y) > GLISSEMENT_PX) {
			appui = null;
			commenceIci = false;
		}
	};
	const fin = (x: number, y: number): boolean => {
		if (!appui) return false;
		appui = null;
		// Le doigt doit se lever sur le bouton, pas à côté.
		const r = bouton.getBoundingClientRect();
		if (x < r.left || x > r.right || y < r.top || y > r.bottom) {
			commenceIci = false;
			return false;
		}
		faite = true;
		action();
		return true;
	};

	/* ---------- Le doigt : événements tactiles ---------- */

	bouton.addEventListener('touchstart', (event) => {
		const doigt = event.changedTouches[0];
		if (doigt && event.touches.length === 1) debut(doigt.clientX, doigt.clientY);
		else appui = null;
	}, { passive: true });
	bouton.addEventListener('touchmove', (event) => {
		const doigt = event.changedTouches[0];
		if (doigt) deplace(doigt.clientX, doigt.clientY);
	}, { passive: true });
	bouton.addEventListener('touchend', (event) => {
		const doigt = event.changedTouches[0];
		// Action faite : pas de clic ni d'événements de souris simulés derrière.
		if (doigt && fin(doigt.clientX, doigt.clientY) && event.cancelable) event.preventDefault();
	}, { passive: false });
	bouton.addEventListener('touchcancel', () => {
		appui = null;
	});

	/* ---------- La souris (et le stylet) : événements « pointer » ---------- */

	bouton.addEventListener('pointerdown', (event) => {
		if (event.pointerType === 'touch' || event.button !== 0) return;
		debut(event.clientX, event.clientY);
	});
	bouton.addEventListener('pointermove', (event) => {
		if (event.pointerType !== 'touch') deplace(event.clientX, event.clientY);
	});
	bouton.addEventListener('pointerup', (event) => {
		if (event.pointerType !== 'touch') fin(event.clientX, event.clientY);
	});

	/* ---------- Le clic : clavier, télécommande, et secours ---------- */

	bouton.addEventListener('click', (event) => {
		if (faite) {
			faite = false;
			commenceIci = false;
			return;
		}
		// Clavier (pas de position) : toujours. Doigt ou souris : seulement pour un appui commencé ici.
		if (event.detail === 0 || commenceIci) {
			commenceIci = false;
			action();
		}
	});

	// Pas de menu contextuel sur un appui long.
	bouton.addEventListener('contextmenu', (event) => event.preventDefault());
}
