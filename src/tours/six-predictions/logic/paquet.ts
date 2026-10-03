/*
 * L'état du paquet, et ce que chaque toucher en fait. Fonctions pures, sans DOM :
 * testées sous Node (tests/logic/paquet.test.ts).
 *
 * Le paquet se joue toujours dans le même sens, une carte après l'autre :
 *
 *   carte du dessus, dos visible  ──toucher──▶  retournée, prédiction lue
 *   retournée                     ──toucher──▶  elle sort du cadre, la suivante est dessous
 *   dernière carte sortie                        écran vide (fin de la routine)
 *   écran vide                    ──double──▶   le paquet revient, faces en bas
 *
 * Un toucher sur l'écran vide ne fait rien : il faut deux touchers rapprochés pour remettre le
 * paquet, afin qu'un doigt posé par mégarde à la fin de la routine ne fasse pas réapparaître
 * les prédictions devant le public.
 *
 * Rien de tout cela n'est enregistré : chaque ouverture de l'app repart d'un paquet neuf.
 */

export interface Etat {
	/** Carte du dessus, de 0 à `count`. À `count`, toutes sont sorties : l'écran est vide. */
	readonly index: number;
	/** La carte du dessus est retournée, sa prédiction est lue. */
	readonly retournee: boolean;
}

/** Paquet neuf : première carte sur le dessus, dos visible. */
export const DEPART: Etat = Object.freeze({ index: 0, retournee: false });

/** Toutes les cartes sont sorties du cadre. */
export const estVide = (etat: Etat, count: number): boolean => etat.index >= count;

/** Nombre de cartes encore dans le cadre, celle du dessus comprise. */
export const restantes = (etat: Etat, count: number): number => Math.max(0, count - etat.index);

/**
 * État après un toucher : la carte du dessus se retourne, puis sort du cadre.
 * Sur un écran vide, rien ne bouge (voir `remettre`).
 */
export function apresToucher(etat: Etat, count: number): Etat {
	if (estVide(etat, count)) return etat;
	if (!etat.retournee) return { index: etat.index, retournee: true };
	return { index: etat.index + 1, retournee: false };
}

/** Le paquet revient au complet, faces en bas : double toucher sur l'écran vide, ou menu. */
export const remettre = (): Etat => DEPART;

/** Va à la carte `index`, dos visible : « aller à la carte » du menu. */
export const allerA = (index: number, count: number): Etat => ({ index: clampIndex(index, count), retournee: false });

/** Index de carte valide pour `count` cartes, à partir de n'importe quelle valeur. */
export function clampIndex(raw: unknown, count: number): number {
	if (count <= 0) return 0;
	const index = typeof raw === 'number' && Number.isFinite(raw) ? Math.trunc(raw) : 0;
	return Math.min(count, Math.max(0, index));
}

/** Texte du compteur du menu, ex. « 3 / 6 », et « 6 / 6 » quand tout est sorti. */
export const compteurLabel = (etat: Etat, count: number): string => `${Math.min(etat.index + 1, count)} / ${count}`;
