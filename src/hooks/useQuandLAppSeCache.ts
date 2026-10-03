/*
 * L'app passe en arrière-plan (appel, notification, écran éteint) ou revient au premier plan :
 * `action` est appelée. Les tours s'en servent pour qu'aucun geste commencé ne se termine plus tard
 * (appui long, tap qui attendait son double, doigt resté posé).
 *
 *   useQuandLAppSeCache(() => gestes.reset());
 */

import { useEffect, useRef } from 'preact/hooks';

export function useQuandLAppSeCache(action: () => void): void {
	// Toujours la dernière action, sans rebrancher l'écouteur à chaque rendu.
	const derniere = useRef(action);
	derniere.current = action;

	useEffect(() => {
		const surVisibilite = (): void => derniere.current();
		document.addEventListener('visibilitychange', surVisibilite);
		return () => document.removeEventListener('visibilitychange', surVisibilite);
	}, []);
}
