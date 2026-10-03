/*
 * Décision de chaque geste sur la scène, sans DOM : testée sous Node (tests/logic/gestures.test.ts).
 *
 *   tap n'importe où          → la carte du dessus se retourne, puis sort du cadre
 *   deux taps rapprochés      → double toucher (le paquet revient quand l'écran est vide)
 *   appui de 3 s n'importe où → menu
 *
 * Réglé pour un vrai doigt, pas pour un robot : un tap peut durer et trembler de quelques dizaines
 * de pixels. Un appui relâché entre le tap et les 3 s ne fait rien, ce qui permet d'abandonner un
 * appui long sans retourner de carte.
 *
 * Le double toucher n'attend pas : le premier tap est annoncé tout de suite, et le second l'est
 * comme « double ». Rien n'est donc retardé — ce qui compte en scène, où le retournement doit
 * suivre le doigt.
 */

export const GESTURE = {
	/** Mouvement toléré pendant un tap ou un appui long, en pixels. */
	slopPx: 40,
	/** Au-delà de cette durée, un appui relâché n'est plus un tap (et ne fait rien). */
	tapMaxMs: 800,
	/** Durée de l'appui qui ouvre le menu. */
	holdMs: 3000,
	/** Délai maximal entre deux taps pour qu'ils comptent comme un double toucher. */
	doubleMaxMs: 450,
	/** Écart maximal entre les deux taps d'un double toucher, en pixels. */
	doubleSlopPx: 120,
} as const;

/** Ce qu'un doigt relevé vient de produire. Un « double » suit toujours un « tap ». */
export type Geste = 'tap' | 'double' | 'none';

interface Contact {
	id: number;
	x: number;
	y: number;
	at: number;
	/** Le doigt s'est trop déplacé : plus un tap ni un appui long. */
	moved: boolean;
	/** Un second doigt s'est posé : le geste est abandonné. */
	cancelled: boolean;
	/** L'appui long a ouvert le menu : le relâcher ne fait rien. */
	held: boolean;
}

/** Suit un seul doigt à la fois ; un second doigt annule le geste en cours. */
export class GestureTracker {
	#contact: Contact | null = null;
	/** Dernier tap produit, pour reconnaître le double toucher. */
	#lastTap: { x: number; y: number; at: number } | null = null;

	/** Doigt posé. Renvoie true si ce contact peut devenir un appui long (lancer la minuterie). */
	press(id: number, x: number, y: number, now: number): boolean {
		if (this.#contact) {
			this.#contact.cancelled = true;
			return false;
		}
		this.#contact = { id, x, y, at: now, moved: false, cancelled: false, held: false };
		return true;
	}

	/** Doigt déplacé. Renvoie true si le mouvement vient d'annuler l'appui long. */
	move(id: number, x: number, y: number): boolean {
		const c = this.#contact;
		if (!c || c.id !== id || c.moved) return false;
		if (Math.hypot(x - c.x, y - c.y) > GESTURE.slopPx) {
			c.moved = true;
			return true;
		}
		return false;
	}

	/** La minuterie de l'appui long est arrivée à terme : true si le menu doit s'ouvrir. */
	holdCompleted(id: number): boolean {
		const c = this.#contact;
		if (!c || c.id !== id || c.moved || c.cancelled || c.held) return false;
		c.held = true;
		return true;
	}

	/** Doigt levé à la position (x, y). */
	release(id: number, x: number, y: number, now: number): Geste {
		const c = this.#contact;
		if (!c || c.id !== id) return 'none';
		this.#contact = null;
		if (c.cancelled || c.held) return 'none';

		if (c.moved || Math.hypot(x - c.x, y - c.y) > GESTURE.slopPx) return 'none';
		if (now - c.at > GESTURE.tapMaxMs) return 'none';

		const previous = this.#lastTap;
		this.#lastTap = { x, y, at: now };
		const double = previous !== null
			&& now - previous.at <= GESTURE.doubleMaxMs
			&& Math.hypot(x - previous.x, y - previous.y) <= GESTURE.doubleSlopPx;
		// Un double toucher se termine là : un troisième tap repart d'un simple tap.
		if (double) this.#lastTap = null;
		return double ? 'double' : 'tap';
	}

	/** Contact interrompu par le système (appel, notification…) : rien ne se déclenche. */
	cancel(id: number): void {
		if (this.#contact?.id === id) this.#contact = null;
	}

	/** Oublie tout (menu ouvert, app en arrière-plan) : y compris le tap qui attendait son double. */
	reset(): void {
		this.#contact = null;
		this.#lastTap = null;
	}
}
