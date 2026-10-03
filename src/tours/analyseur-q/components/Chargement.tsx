/*
 * Le faux chargement d'une slide (champ `chargement`) : un cadran qui se remplit, le pourcentage
 * au centre, et les étapes annoncées l'une après l'autre dessous (champ `etapes`), puis le message
 * de fin (champ `termine`). La courbe de progression est dans logic/loading.ts.
 *
 * Le temps ne s'écoule que quand la slide est vraiment visible : il s'arrête réglages ouverts,
 * écran noir, ou app en arrière-plan, pour ne jamais changer de slide dans le dos de l'artiste.
 *
 * L'anneau et le camembert changent à chaque image : ils sont réglés directement sur leurs
 * éléments (refs), sans repasser par Preact. Le pourcentage et l'étape, qui changent rarement,
 * sont un état comme un autre.
 */

import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { LOADING, loadingProgress, percentLabel, stepIndex } from '../logic/loading.ts';
import { Ligne } from './Ligne.tsx';

interface Props {
	/** Durée du chargement, en secondes. */
	secondes: number;
	/** Les étapes à annoncer sous le cadran, dans l'ordre, dans la langue en cours (vide s'il n'y en a pas). */
	etapes: readonly string[];
	/** Le message affiché à 100 %, s'il y en a un. */
	messageFin: string | undefined;
	/** Le cadran est affiché (pas encore, s'il attend l'appui sur le bouton de la slide). */
	visible: boolean;
	/** Le chargement est arrivé au bout et la slide garde son message. */
	termine: boolean;
	/** Numéro du lancement en cours sur cette slide, null si elle n'en a pas : un nouveau numéro repart de 0. */
	lancement: number | null;
	/** Réglages ouverts ou écran noir : le temps est suspendu. */
	enPause: boolean;
	/** Appelé à 100 %, après une courte pause pour qu'on voie le cadran plein. */
	onFini: () => void;
}

/**
 * Écart maximal compté entre deux images. Assez large pour qu'un téléphone qui rame garde la bonne durée,
 * assez court pour qu'un gel (retour d'arrière-plan, appel) ne fasse pas sauter la barre.
 */
const MAX_FRAME_MS = 500;

export function Chargement({ secondes, etapes, messageFin, visible, termine, lancement, enPause, onFini }: Props) {
	const cadran = useRef<HTMLDivElement>(null);
	const arc = useRef<SVGCircleElement>(null);
	const [pourcent, setPourcent] = useState(() => percentLabel(0));
	/** L'étape affichée (-1 avant le premier lancement), et le lancement qui l'a affichée. */
	const [etape, setEtape] = useState({ index: -1, n: 0 });

	// Lus à chaque image : toujours la dernière valeur, sans relancer le chargement.
	const enPauseRef = useRef(enPause);
	enPauseRef.current = enPause;
	const onFiniRef = useRef(onFini);
	onFiniRef.current = onFini;
	const nombreEtapes = etapes.length;

	// Avant l'affichage : le cadran repart de 0 sans montrer un instant l'ancien remplissage.
	useLayoutEffect(() => {
		if (lancement === null) return;
		const dureeMs = secondes * 1000;
		let ecoule = 0;
		let avant = performance.now();
		let image = 0;
		let finTimer = 0;
		const estEnPause = (): boolean => enPauseRef.current || document.visibilityState !== 'visible';

		const dessiner = (): void => {
			const progression = loadingProgress(ecoule / dureeMs);
			// L'anneau se règle en pour-cent (pathLength = 100), le camembert par --part.
			arc.current?.style.setProperty('stroke-dasharray', `${progression * 100} 100`);
			cadran.current?.style.setProperty('--part', `${progression * 100}%`);
			// Preact ne réaffiche que si le texte change : une centaine de fois en tout.
			setPourcent(percentLabel(progression));
			const index = stepIndex(progression, nombreEtapes);
			setEtape((actuelle) => (actuelle.index === index && actuelle.n === lancement ? actuelle : { index, n: lancement }));
		};

		const tick = (maintenant: number): void => {
			if (!estEnPause()) ecoule += Math.min(MAX_FRAME_MS, Math.max(0, maintenant - avant));
			avant = maintenant;
			dessiner();
			if (ecoule < dureeMs) {
				image = requestAnimationFrame(tick);
				return;
			}
			finTimer = window.setTimeout(function finir() {
				// Réglages ouverts ou écran noir à la dernière seconde : on attend qu'ils soient fermés.
				if (estEnPause()) finTimer = window.setTimeout(finir, 200);
				else onFiniRef.current();
			}, LOADING.holdFullMs);
		};

		dessiner();
		image = requestAnimationFrame(tick);
		// Slide quittée ou nouveau lancement : le cadran s'arrête là où il en est.
		return () => {
			cancelAnimationFrame(image);
			clearTimeout(finTimer);
		};
	}, [lancement, secondes, nombreEtapes]);

	// Avant le premier lancement, la place est réservée (ajustement du texte) avec l'étape la plus longue.
	const texteEtape = etape.index >= 0 ? etapes[etape.index] : etapes.reduce((a, b) => (b.length > a.length ? b : a), '');

	return (
		<div className="chargement" hidden={!visible}>
			<div className="chargement-cadran" ref={cadran}>
				<svg viewBox="0 0 100 100" aria-hidden="true">
					{/* Longueur ramenée à 100 : l'arc se règle en pour-cent, quel que soit le rayon. */}
					<circle className="chargement-piste" cx="50" cy="50" r="44" pathLength="100" />
					<circle className="chargement-arc" ref={arc} cx="50" cy="50" r="44" pathLength="100" />
				</svg>
				<div className="chargement-pourcent">{pourcent}</div>
			</div>
			{nombreEtapes > 0 && (
				// Une nouvelle étape est un nouvel élément : son fondu d'apparition repart du début.
				<p key={`${etape.n}-${etape.index}`} className={etape.index >= 0 ? 'chargement-etape apparait' : 'chargement-etape'} hidden={termine}>
					{texteEtape}
				</p>
			)}
			{messageFin && (
				<p className="chargement-termine" hidden={!termine}>
					<Ligne texte={messageFin} />
				</p>
			)}
		</div>
	);
}
