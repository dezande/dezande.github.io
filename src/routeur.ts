/*
 * LE ROUTEUR MAISON : il suit l'adresse après le « # » (ce qu'elle ouvre : src/logic/adresses.ts),
 * et navigue dans l'historique du navigateur. Une trentaine de lignes à la place d'une
 * bibliothèque : l'app n'a que le menu et une adresse exacte par tour.
 *
 *   const adresse = useAdresse();          // { hash, cle, depuisLApp }, à jour à chaque changement
 *   naviguer('/tours/pile-ou-face');        // ouvre un tour (une entrée de plus dans l'historique)
 *   naviguer('/', { remplacer: true });     // le menu, à la place de l'adresse en cours
 *   history.back();                         // retour à la page précédente
 *
 * Chaque page ouverte par l'app est marquée dans l'historique (history.state) : un tour ouvert
 * depuis le menu sait ainsi qu'il peut revenir au menu par l'historique, ce qui ne fait pas grandir
 * l'historique d'un tour à l'autre. Le geste retour d'Android, ou une adresse tapée à la main,
 * passent par les événements popstate et hashchange.
 */

import { useEffect, useState } from 'preact/hooks';

/** Ce que l'app sait de l'adresse en cours. */
export interface Adresse {
	/** location.hash, avec son « # ». */
	readonly hash: string;
	/** Change à chaque nouvelle page : rouvrir un tour repart d'une nouvelle routine. */
	readonly cle: number;
	/** La page a été ouverte par l'app (naviguer()) : la précédente est dans l'app. */
	readonly depuisLApp: boolean;
}

/** La marque de l'app dans history.state : le numéro de la page ouverte. */
interface Marque {
	mesTours: number;
}

/** Numéros des pages ouvertes : croissants, et uniques même d'une ouverture de l'app à l'autre. */
let numero = Date.now();
let cle = 0;
let actuelle: Adresse = lire();
/** L'état d'historique de l'adresse en cours : une même adresse peut revenir avec un autre état. */
let etatVu: unknown = history.state;

function lire(): Adresse {
	const marque = (history.state as Partial<Marque> | null)?.mesTours;
	return { hash: location.hash, cle: ++cle, depuisLApp: typeof marque === 'number' };
}

const ecouteurs = new Set<() => void>();

/** L'adresse a peut-être changé : popstate et hashchange arrivent souvent tous les deux. */
function suivre(): void {
	if (location.hash === actuelle.hash && history.state === etatVu) return;
	etatVu = history.state;
	actuelle = lire();
	for (const ecouteur of ecouteurs) ecouteur();
}

window.addEventListener('popstate', suivre);
window.addEventListener('hashchange', suivre);

/** Ouvre `chemin` (« /tours/pile-ou-face ») ; `remplacer` : à la place de la page en cours. */
export function naviguer(chemin: string, { remplacer = false } = {}): void {
	const marque: Marque = { mesTours: ++numero };
	if (remplacer) history.replaceState(marque, '', `#${chemin}`);
	else history.pushState(marque, '', `#${chemin}`);
	suivre();
}

/** L'adresse en cours, mise à jour à chaque changement. */
export function useAdresse(): Adresse {
	// Relue au premier affichage : l'adresse a pu changer depuis le chargement du module.
	const [adresse, setAdresse] = useState(() => {
		suivre();
		return actuelle;
	});
	useEffect(() => {
		const mettreAJour = (): void => setAdresse(actuelle);
		ecouteurs.add(mettreAJour);
		// Un changement a pu arriver entre le rendu et l'effet.
		suivre();
		mettreAJour();
		return () => {
			ecouteurs.delete(mettreAJour);
		};
	}, []);
	return adresse;
}
