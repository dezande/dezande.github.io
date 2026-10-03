/*
 * Gestes sur la scène (doigt, ou souris pour répéter sur ordinateur) et touches du clavier.
 * Les décisions sont prises par logic/gestures.ts et logic/keys.ts (testés sous Node) ;
 * ce module relaie les événements du navigateur et applique les effets.
 */

import { $ } from '../../../kit/web/dom.ts';
import { appPoint } from '../../../kit/web/orientation.ts';
import { keepScreenAwake } from '../../../kit/web/wake-lock.ts';
import { GESTURE, GestureTracker } from '../logic/gestures.ts';
import { keyAction } from '../logic/keys.ts';
import { coteDuPoint, type Etat } from '../logic/piece.ts';
import { finDeRoutine, quitter } from '../../pont.ts';
import { closeMenu, holdReleased, isMenuOpen } from '../settings/panel.ts';
import { settings } from '../settings/store.ts';
import { armer, cacher, etatCourant, geste } from './carte.ts';

const app = $('#app');
const stage = $('#stage');
const ring = $('#hold-ring');

const gestures = new GestureTracker();
let holdTimer = 0;
let touchedSinceShown = false;
/** État de la carte avant le dernier tap : un double toucher ne compte que sur une carte déjà armée. */
let avantDernierTap: Etat = etatCourant();

/**
 * Un toucher ou une touche depuis l'ouverture de l'app ou son retour au premier plan.
 * Tant que c'est le cas, une nouvelle version n'est pas chargée automatiquement (app.ts).
 */
export const wasTouchedSinceShown = (): boolean => touchedSinceShown;
export function forgetTouches(): void {
	touchedSinceShown = false;
}

/**
 * Ce qu'un geste de la scène déclenche, à la hauteur `y` (repère de l'app) :
 *   un tap        arme la carte, sur pile en haut de l'écran et sur face en bas ;
 *   un double     remet la carte face cachée, si elle était déjà armée au premier toucher.
 */
function applyGesture(type: 'tap' | 'double', y: number): void {
	// La hauteur de l'app, et non de la fenêtre : l'app peut être pivotée (kit/web/orientation.ts).
	const cote = coteDuPoint(y, app.clientHeight);
	if (!cote) return;
	const avant = etatCourant();
	geste(type, cote, type === 'double' ? avantDernierTap : avant);
	// La carte revient face cachée : la routine est finie, retour au menu principal.
	if (avant.phase !== 'cachee' && etatCourant().phase === 'cachee') finDeRoutine();
	if (type === 'tap') avantDernierTap = avant;
}

/* ---------- Jauge de l'appui long ---------- */

/** La jauge n'apparaît qu'après un court instant : un tap normal ne la montre jamais. */
const RING_DELAY_MS = GESTURE.tapMaxMs;

function showRing(x: number, y: number): void {
	if (!settings.showHoldRing) return;
	ring.style.left = `${x}px`;
	ring.style.top = `${y}px`;
	ring.style.setProperty('--ring-delay', `${RING_DELAY_MS}ms`);
	ring.style.setProperty('--ring-duration', `${GESTURE.holdMs - RING_DELAY_MS}ms`);
	ring.hidden = false;
	// Relance l'animation CSS depuis le début.
	ring.classList.remove('run');
	void ring.offsetWidth;
	ring.classList.add('run');
}

function stopHold(): void {
	clearTimeout(holdTimer);
	holdTimer = 0;
	ring.hidden = true;
	ring.classList.remove('run');
}

/* ---------- Toucher ---------- */

// Coordonnées dans le repère de l'app, qui peut être pivotée (kit/web/orientation.ts).

stage.addEventListener('pointerdown', (event) => {
	if (event.pointerType === 'mouse' && event.button !== 0) return;
	void keepScreenAwake();
	touchedSinceShown = true;
	const { x, y } = appPoint(event.clientX, event.clientY);
	if (!gestures.press(event.pointerId, x, y, performance.now())) {
		stopHold();
		return;
	}
	const id = event.pointerId;
	// La souris qui sort de la scène ne perd pas son relâchement.
	try {
		stage.setPointerCapture(id);
	} catch {
		// Contact déjà terminé.
	}
	showRing(x, y);
	holdTimer = window.setTimeout(() => {
		stopHold();
		// Appui de 3 s : sortie de secours, retour au menu principal.
		if (gestures.holdCompleted(id)) quitter();
	}, GESTURE.holdMs);
});

stage.addEventListener('pointermove', (event) => {
	const { x, y } = appPoint(event.clientX, event.clientY);
	if (gestures.move(event.pointerId, x, y)) stopHold();
});

stage.addEventListener('pointerup', (event) => {
	stopHold();
	holdReleased();
	const { x, y } = appPoint(event.clientX, event.clientY);
	const fait = gestures.release(event.pointerId, x, y, performance.now());
	if (fait !== 'none') applyGesture(fait, y);
});

stage.addEventListener('pointercancel', (event) => {
	stopHold();
	holdReleased();
	gestures.cancel(event.pointerId);
});

// Pas de menu contextuel ni de loupe sur appui long.
stage.addEventListener('contextmenu', (event) => event.preventDefault());

/* ---------- Clavier et télécommande ---------- */

document.addEventListener('keydown', (event) => {
	if (event.metaKey || event.ctrlKey || event.altKey) return;
	const action = keyAction(event.key);
	if (!action) return;
	if (isMenuOpen()) {
		if (action === 'menu') {
			event.preventDefault();
			closeMenu();
		}
		return;
	}
	event.preventDefault();
	touchedSinceShown = true;
	void keepScreenAwake();
	if (action === 'menu') quitter();
	else if (action === 'cacher') {
		const enJeu = etatCourant().phase !== 'cachee';
		cacher();
		if (enJeu) finDeRoutine();
	}
	else armer(action);
});

// App en arrière-plan : aucun geste commencé ne doit se terminer plus tard, et le tap qui
// attendait son double est oublié.
document.addEventListener('visibilitychange', () => {
	stopHold();
	gestures.reset();
});
