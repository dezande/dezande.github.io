/*
 * LE CLAVIER ET LES TÉLÉCOMMANDES DE PRÉSENTATION (qui envoient les mêmes touches), pour tous les
 * tours. Chaque tour traduit les touches en actions avec sa fonction pure `keyAction` (logic/keys.ts,
 * testée sous Node) ; l'action « menu » (Échap, M) est commune : elle ramène au menu principal.
 *
 * Réglages ouverts (écrou ⚙), seule l'action « menu » compte : les autres ne touchent pas au tour
 * caché dessous. Ctrl, Alt et Cmd laissent passer les raccourcis du navigateur. Chaque touche
 * reconnue réveille aussi le maintien de l'écran allumé.
 *
 *   useClavier(keyAction, (action) => (action === 'remettre' ? remettre() : toucher()));
 *
 * `reglagesOuverts` : par défaut, les réglages sont ouverts quand le tour l'a été par l'écrou ⚙ ;
 * un tour qui les cache (le test des zones) le précise.
 */

import { useEffect, useRef } from 'preact/hooks';
import { keepScreenAwake } from '../kit/web/wake-lock.ts';
import { usePont } from '../tours/pont.tsx';

export function useClavier<A extends string>(keyAction: (key: string) => A | 'menu' | null, surAction: (action: A) => void, reglagesOuverts?: boolean): void {
	const pont = usePont();
	const enReglages = reglagesOuverts ?? pont.enReglages;
	const { quitter } = pont;
	// Toujours la dernière version, sans rebrancher l'écouteur à chaque rendu.
	const dernier = useRef({ keyAction, surAction, enReglages, quitter });
	dernier.current = { keyAction, surAction, enReglages, quitter };

	useEffect(() => {
		const surTouche = (event: KeyboardEvent): void => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const { keyAction: traduire, surAction: agir, enReglages: reglagesOuverts, quitter: partir } = dernier.current;
			const action = traduire(event.key);
			if (!action) return;
			if (reglagesOuverts && action !== 'menu') return;
			event.preventDefault();
			void keepScreenAwake();
			if (action === 'menu') partir();
			else agir(action);
		};
		document.addEventListener('keydown', surTouche);
		return () => document.removeEventListener('keydown', surTouche);
	}, []);
}
