/*
 * LA SCÈNE D'UN TOUR À DOUBLE TOUCHER (pile ou face, les six prédictions) : tap, double toucher,
 * et appui de 3 s qui ramène au menu, suivis au doigt (ou à la souris pour répéter sur ordinateur).
 * Les décisions sont prises par src/logic/double-toucher.ts (testé sous Node) ; ce hook relaie les
 * événements « pointer » de la scène, gère la jauge de l'appui long et oublie tout geste commencé
 * quand l'app passe en arrière-plan.
 *
 *   const { scene, jauge } = useGestesDoubleToucher(reglages.showHoldRing, (geste, point) => …);
 *   <main id="stage" {...scene}>…</main>
 *   <JaugeAppui jauge={jauge} />
 *
 * `surGeste` reçoit « tap » ou « double » (un double suit toujours un tap, annoncé tout de suite),
 * et le point du doigt levé dans le repère de #app (qui peut être pivotée : kit/web/orientation.ts).
 */

import { useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { appPoint } from '../kit/web/orientation.ts';
import { keepScreenAwake } from '../kit/web/wake-lock.ts';
import { GESTURE, GestureTracker } from '../logic/double-toucher.ts';
import { usePont } from '../tours/pont.tsx';
import { useAppuiLong } from './useAppuiLong.ts';
import { useQuandLAppSeCache } from './useQuandLAppSeCache.ts';

export type GesteDoubleToucher = 'tap' | 'double';

export function useGestesDoubleToucher(jaugeVisible: boolean, surGeste: (geste: GesteDoubleToucher, point: { x: number; y: number }) => void) {
	const { quitter } = usePont();
	const [gestes] = useState(() => new GestureTracker());
	// La jauge n'apparaît qu'après la durée d'un tap : un toucher de la routine ne la montre jamais.
	const appui = useAppuiLong({ dureeMs: GESTURE.holdMs, delaiJaugeMs: GESTURE.tapMaxMs, jaugeVisible });
	const dernier = useRef(surGeste);
	dernier.current = surGeste;

	// App en arrière-plan : le tap qui attendait son double est oublié.
	useQuandLAppSeCache(() => gestes.reset());

	const scene = {
		onPointerDown: (event: PointerEvent<HTMLElement>): void => {
			if (event.pointerType === 'mouse' && event.button !== 0) return;
			void keepScreenAwake();
			const { x, y } = appPoint(event.clientX, event.clientY);
			if (!gestes.press(event.pointerId, x, y, performance.now())) {
				appui.arreter();
				return;
			}
			const id = event.pointerId;
			// La souris qui sort de la scène ne perd pas son relâchement.
			try {
				event.currentTarget.setPointerCapture(id);
			} catch {
				// Contact déjà terminé.
			}
			// Appui de 3 s : sortie de secours, retour au menu principal.
			appui.commencer(x, y, () => {
				if (gestes.holdCompleted(id)) quitter();
			});
		},
		onPointerMove: (event: PointerEvent<HTMLElement>): void => {
			const { x, y } = appPoint(event.clientX, event.clientY);
			if (gestes.move(event.pointerId, x, y)) appui.arreter();
		},
		onPointerUp: (event: PointerEvent<HTMLElement>): void => {
			appui.arreter();
			const point = appPoint(event.clientX, event.clientY);
			const geste = gestes.release(event.pointerId, point.x, point.y, performance.now());
			if (geste !== 'none') dernier.current(geste, point);
		},
		onPointerCancel: (event: PointerEvent<HTMLElement>): void => {
			appui.arreter();
			gestes.cancel(event.pointerId);
		},
		// Pas de menu contextuel ni de loupe sur appui long.
		onContextMenu: (event: MouseEvent<HTMLElement>): void => event.preventDefault(),
	};

	return { scene, jauge: appui.jauge };
}
