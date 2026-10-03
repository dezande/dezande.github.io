/*
 * L'APPUI LONG, sortie de secours de tous les tours : un doigt maintenu `dureeMs` n'importe où sur
 * la scène, et le tour revient au menu. Pendant l'appui, la jauge (components/JaugeAppui.tsx) se
 * remplit sous le doigt — après `delaiJaugeMs`, pour qu'un tap de la routine ne la montre jamais, et
 * seulement si `jaugeVisible` (l'aide « jauge de l'appui long » des réglages).
 *
 * Le hook ne sait pas ce qu'est un geste : le tour décide, avec son traqueur de gestes, si l'appui
 * arrivé à terme compte (doigt qui n'a pas bougé, pas de second doigt…).
 *
 *   const appui = useAppuiLong({ dureeMs: 3000, delaiJaugeMs: 800, jaugeVisible: reglages.showHoldRing });
 *   appui.commencer(x, y, () => { if (gestes.holdCompleted(id)) quitter(); });   // doigt posé
 *   appui.arreter();                                                              // levé, glissé…
 *   <JaugeAppui jauge={appui.jauge} />
 *
 * L'appui s'arrête aussi quand l'app passe en arrière-plan, et quand le tour se ferme.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useJaugeAppui } from '../components/JaugeAppui.tsx';
import { useQuandLAppSeCache } from './useQuandLAppSeCache.ts';

interface Options {
	/** Durée de l'appui, en millisecondes. */
	dureeMs: number;
	/** Rien n'est montré avant ce délai : un tap, même un peu appuyé, ne fait pas apparaître la jauge. */
	delaiJaugeMs: number;
	/** L'aide « jauge de l'appui long » est cochée dans les réglages du tour. */
	jaugeVisible: boolean;
}

export function useAppuiLong({ dureeMs, delaiJaugeMs, jaugeVisible }: Options) {
	const { jauge, montrerJauge, cacherJauge } = useJaugeAppui();
	const minuterie = useRef(0);
	// Lu au moment du toucher : la case a pu changer depuis le dernier rendu.
	const visible = useRef(jaugeVisible);
	visible.current = jaugeVisible;

	/** Le doigt s'est levé, a glissé, ou un second doigt s'est posé : l'appui ne mènera à rien. */
	const arreter = useCallback((): void => {
		clearTimeout(minuterie.current);
		minuterie.current = 0;
		cacherJauge();
	}, [cacherJauge]);

	/** Un doigt se pose en (x, y), repère de #app : `auTerme` sera appelé s'il tient `dureeMs`. */
	const commencer = useCallback((x: number, y: number, auTerme: () => void): void => {
		arreter();
		if (visible.current) montrerJauge(x, y, delaiJaugeMs, dureeMs - delaiJaugeMs);
		minuterie.current = window.setTimeout(() => {
			arreter();
			auTerme();
		}, dureeMs);
	}, [arreter, montrerJauge, delaiJaugeMs, dureeMs]);

	useQuandLAppSeCache(arreter);
	useEffect(() => () => clearTimeout(minuterie.current), []);

	return { jauge, commencer, arreter };
}
