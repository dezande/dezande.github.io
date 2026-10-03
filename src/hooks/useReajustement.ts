/*
 * RÉAJUSTER QUAND LA PLACE CHANGE : `reajuster` est rappelée quand la fenêtre change de taille
 * (rotation du téléphone, barre d'adresse — une fois par image au plus) et quand une police finit de
 * charger. Pour le texte ajusté à sa place (src/logic/ajustement.ts) : une mesure faite avec la
 * police de secours donnerait un texte trop petit.
 *
 * `police` (ex. '600 38px Caveat') : la police est demandée tout de suite, à l'ouverture du tour,
 * plutôt qu'au premier texte écrit avec — et l'ajustement est refait quand elle arrive.
 *
 *   const fit = useCallback(() => { … plusGrandeEchelle(…) … }, []);
 *   useLayoutEffect(fit, [fit, texte]);          // le texte vient de changer
 *   useReajustement(fit, '600 38px Caveat');     // la place ou la police a changé
 */

import { useEffect, useRef } from 'preact/hooks';

export function useReajustement(reajuster: () => void, police?: string): void {
	// Toujours la dernière version, sans rebrancher les écouteurs à chaque rendu.
	const dernier = useRef(reajuster);
	dernier.current = reajuster;

	useEffect(() => {
		let image = 0;
		let actif = true;
		const maintenant = (): void => {
			if (actif) dernier.current();
		};
		const surRedimension = (): void => {
			cancelAnimationFrame(image);
			image = requestAnimationFrame(maintenant);
		};
		window.addEventListener('resize', surRedimension);
		document.fonts?.addEventListener('loadingdone', maintenant);
		if (police) void document.fonts?.load(police).then(maintenant, () => undefined);
		else void document.fonts?.ready.then(maintenant);
		return () => {
			actif = false;
			cancelAnimationFrame(image);
			window.removeEventListener('resize', surRedimension);
			document.fonts?.removeEventListener('loadingdone', maintenant);
		};
	}, [police]);
}
