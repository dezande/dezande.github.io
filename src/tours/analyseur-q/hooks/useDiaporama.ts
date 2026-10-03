/*
 * Le diaporama : la slide affichée, ce que montre chaque slide (bouton, cadran de chargement,
 * message de fin), le chargement en cours et l'écran noir. Les gestes et les touches
 * (index.tsx) ne font que demander un déplacement ; tout se décide ici.
 *
 * Chaque ouverture du tour repart de la première slide : on ouvre un accessoire de scène pour
 * jouer, pas pour reprendre le tour précédent.
 */

import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { SLIDES } from '../content/slides.ts';
import { applyMove, clampIndex, type Move } from '../logic/deck.ts';
import { t, type Lang } from '../../../logic/i18n.ts';
import type { Slide } from '../logic/slides.ts';

export const NOMBRE_DE_SLIDES = SLIDES.length;

/**
 * Ce que montre une slide. Gardé pour chaque slide, même hors de l'écran : celle que l'on quitte
 * reste telle quelle pendant la transition, et tout repart du début quand on y revient.
 */
export interface VueSlide {
	/** Son bouton attend un appui. */
	bouton: boolean;
	/** Son cadran de chargement est affiché. */
	chargement: boolean;
	/** Le chargement est arrivé au bout : le message `termine` remplace les étapes. */
	termine: boolean;
}

/** Une slide construite : bouton affiché s'il y en a un, le cadran attend alors l'appui. */
const vueDeDepart = (slide: Slide): VueSlide => ({ bouton: Boolean(slide.bouton), chargement: !slide.bouton, termine: false });

/** Le chargement qui tourne : sur quelle slide, et le numéro du lancement (un nouveau repart de 0). */
export interface Lancement {
	index: number;
	n: number;
}

/**
 * Délai avant qu'un bouton devienne actif, en arrivant sur sa slide. Le tap qui amène sur la slide
 * est souvent suivi d'un autre : sans ce délai, la slide serait traversée sans être vue.
 * Le bouton apparaît en fondu pendant ce délai (styles/tours/analyseur-q/_deck.scss).
 */
const BUTTON_DELAY_MS = 700;

/** Slide où mène la slide `i` après son bouton ou son chargement : `boutonVers`, sinon la suivante. */
const destination = (i: number): number => (SLIDES[i]?.boutonVers ?? i + 2) - 1;

/**
 * `doigtPose` : un doigt est-il posé sur l'écran ? Un doigt encore posé vient du geste qui a amené
 * sur la slide : le bouton ne s'active pas.
 */
export function useDiaporama(langue: Lang, doigtPose: () => boolean) {
	const [index, setIndex] = useState(0);
	const [noir, setNoirAffiche] = useState(false);
	const [vues, setVues] = useState<VueSlide[]>(() => SLIDES.map(vueDeDepart));
	const [lancement, setLancement] = useState<Lancement | null>(null);

	// Lus par les gestes, les touches et la fin des chargements : toujours la dernière valeur.
	const indexRef = useRef(0);
	const noirRef = useRef(false);
	const langueRef = useRef(langue);
	langueRef.current = langue;
	const doigtPoseRef = useRef(doigtPose);
	doigtPoseRef.current = doigtPose;
	/** La slide courante a un bouton pas encore appuyé. */
	const attenteBouton = useRef(false);
	/** Instant à partir duquel ce bouton peut être actionné. */
	const boutonPretA = useRef(0);
	const lancements = useRef(0);

	const changerVue = useCallback((i: number, changement: Partial<VueSlide>): void => {
		setVues((avant) => avant.map((vue, n) => (n === i ? { ...vue, ...changement } : vue)));
	}, []);

	/* ---------- Écran noir ---------- */

	const setNoir = useCallback((on: boolean): void => {
		noirRef.current = on;
		setNoirAffiche(on);
	}, []);

	/* ---------- Navigation ---------- */

	/** Affiche la slide `cible` (bornée). L'écran noir, s'il est actif, est levé. */
	const goTo = useCallback((cible: number): void => {
		setNoir(false);
		const suivante = clampIndex(cible, NOMBRE_DE_SLIDES);
		if (suivante === indexRef.current) return;
		indexRef.current = suivante;
		setIndex(suivante);
	}, [setNoir]);

	/**
	 * Lance le chargement de la slide `i`, ou passe directement à sa destination si elle n'en a pas.
	 * À 100 % (chargementFini) : message `termine` affiché (la slide reste), sinon destination.
	 */
	const lancer = useCallback((i: number): void => {
		if (SLIDES[i]?.chargement === undefined) {
			goTo(destination(i));
			return;
		}
		changerVue(i, { termine: false });
		lancements.current += 1;
		setLancement({ index: i, n: lancements.current });
	}, [goTo, changerVue]);

	/** Le chargement de la slide `i` est arrivé à 100 % (components/Chargement.tsx). */
	const chargementFini = useCallback((i: number): void => {
		if (indexRef.current !== i) return;
		// La slide reste affichée avec son message : les étapes ont fini leur travail.
		if (t(SLIDES[i]?.termine, langueRef.current)) changerVue(i, { termine: true });
		else goTo(destination(i));
	}, [changerVue, goTo]);

	/*
	 * Bouton et chargement de la slide courante. En arrivant sur une slide, tout repart du début :
	 * bouton affiché s'il y en a un (le chargement attend l'appui), sinon chargement lancé tout de suite.
	 */
	useEffect(() => {
		setLancement(null);
		const slide = SLIDES[index];
		attenteBouton.current = Boolean(slide?.bouton);
		if (attenteBouton.current) {
			boutonPretA.current = performance.now() + BUTTON_DELAY_MS;
			changerVue(index, { bouton: true, chargement: false });
		} else if (slide?.chargement !== undefined) {
			lancer(index);
		}
	}, [index, changerVue, lancer]);

	/**
	 * Le bouton de la slide courante attend un appui, son délai d'activation est passé et aucun doigt
	 * n'est posé sur l'écran.
	 */
	const boutonPret = (): boolean => attenteBouton.current && performance.now() >= boutonPretA.current && !doigtPoseRef.current();

	/** Appui sur le bouton de la slide courante (doigt, ou « slide suivante » tant qu'il attend). */
	const appuyer = (): void => {
		if (!boutonPret()) return;
		attenteBouton.current = false;
		setNoir(false);
		const i = indexRef.current;
		changerVue(i, { bouton: false, chargement: true });
		lancer(i);
	};

	/** Le doigt a appuyé sur le bouton de la slide `i` : compte seulement sur la slide courante. */
	const appuyerSur = (i: number): void => {
		if (i === indexRef.current) appuyer();
	};

	/** Déplacement demandé par un geste ou une touche. Sur écran noir, il ne fait que rallumer. */
	const move = (m: Move): void => {
		if (noirRef.current) setNoir(false);
		// Bouton qui attend et mène en avant : « suivante » appuie dessus, pour ne jamais sauter l'analyse
		// par erreur. Un bouton qui ramène en arrière (Recommencer) n'est actionné que par un vrai appui.
		// Pendant le délai d'activation, « suivante » ne fait rien : la slide reste affichée.
		else if (m === 'next' && attenteBouton.current && destination(indexRef.current) > indexRef.current) {
			if (boutonPret()) appuyer();
		}
		else goTo(applyMove(indexRef.current, m, NOMBRE_DE_SLIDES));
	};

	const basculerNoir = (): void => setNoir(!noirRef.current);

	return { index, vues, lancement, noir, move, appuyerSur, basculerNoir, chargementFini };
}
