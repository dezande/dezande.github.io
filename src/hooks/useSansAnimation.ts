/*
 * SANS TRANSITION À L'OUVERTURE : le décor d'un tour (carte, paquet, diaporama) apparaît
 * directement à sa place, sans glisser depuis sa position CSS de départ. Les transitions reprennent
 * une fois la première image peinte — deux images plus tard.
 *
 * `relance` : changer cette valeur recommence l'attente (le paquet remis en place, par exemple).
 *
 *   const sansAnimation = useSansAnimation();
 *   <div id="table" className={sansAnimation ? 'no-anim' : undefined}>
 */

import { useEffect, useState } from 'react';

export function useSansAnimation(relance: unknown = null): boolean {
	const [sansAnimation, setSansAnimation] = useState(true);
	useEffect(() => {
		setSansAnimation(true);
		let image = requestAnimationFrame(() => {
			image = requestAnimationFrame(() => setSansAnimation(false));
		});
		return () => cancelAnimationFrame(image);
	}, [relance]);
	return sansAnimation;
}
