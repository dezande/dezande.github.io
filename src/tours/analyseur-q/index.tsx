/*
 * Analyseur Q (analyseur d'ondes quantiques des cartes à jouer) : accessoire de la routine Rain Man.
 * Un diaporama plein écran, 100 % hors-ligne, pour accompagner la routine.
 *   tap à droite, glisser vers la gauche, → ou télécommande : slide suivante
 *   tap sur le tiers gauche, glisser vers la droite, ←        : slide précédente
 *   appui de 3 s n'importe où, Échap ou M                     : retour au menu principal
 *   B ou « . » (bouton écran noir des télécommandes)          : écran noir
 * « Suivante » sur la dernière slide ne fait rien : on reste dans le tour.
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène, les gestes et le clavier
 *   hooks/       useDiaporama : la slide affichée, bouton et chargement de chaque slide, écran noir
 *   components/  Deck (les slides), Slide (une slide et l'ajustement du texte), Chargement (le
 *                cadran), Ligne (les mises en valeur), Cadre (le décor), Reglages (l'écrou ⚙)
 *   images.ts    les images des slides (src/assets/images/analyseur-q/)
 *   content/     LE TEXTE : slides.ts (les slides, en français et en anglais) et interface.ts
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/analyseur-q/)
 *     slides.ts      forme d'une slide, mise en valeur, vérification du contenu
 *     deck.ts        position dans le diaporama
 *     gestures.ts    décision de chaque geste
 *     keys.ts        touches du clavier
 *     loading.ts     courbe du faux chargement
 *     settings.ts    forme et validation des réglages
 *     i18n.ts        les deux langues
 * Les styles sont dans src/styles/tours/analyseur-q/.
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { JaugeAppui, useJaugeAppui } from '../../components/JaugeAppui.tsx';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { appPoint } from '../../kit/web/orientation.ts';
import { keepScreenAwake } from '../../kit/web/wake-lock.ts';
import { usePont } from '../pont.tsx';
import { Cadre } from './components/Cadre.tsx';
import { Deck } from './components/Deck.tsx';
import { Reglages } from './components/Reglages.tsx';
import { SLIDES } from './content/slides.ts';
import { useDiaporama } from './hooks/useDiaporama.ts';
import { t } from './logic/i18n.ts';
import { GESTURE, GestureTracker } from './logic/gestures.ts';
import { keyAction } from './logic/keys.ts';
import { sanitizeSettings } from './logic/settings.ts';

/**
 * Les réglages, gardés sur l'appareil, et relus sous l'ancien nom du projet (rain-man) si le
 * nouveau n'existe pas encore. La langue enregistrée avec eux est ignorée : c'est celle du menu.
 */
const CLE_REGLAGES = 'analyseur-q:settings:v1';
const ANCIENNE_CLE_REGLAGES = 'rain-man:settings:v1';
const valider = (brut: unknown) => sanitizeSettings(brut);

/** La jauge n'apparaît qu'après un court instant : un tap normal ne la montre jamais. */
const JAUGE_DELAI_MS = GESTURE.tapMaxMs;

export default function AnalyseurQ() {
	const { langue, enReglages, quitter } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, valider, ANCIENNE_CLE_REGLAGES);
	const { jauge, montrerJauge, cacherJauge } = useJaugeAppui();
	const reglagesRef = useRef(reglages);
	reglagesRef.current = reglages;

	/** Nombre de doigts (ou boutons de souris) posés sur l'écran : le bouton d'une slide attend qu'ils soient levés. */
	const doigtsPoses = useRef(0);
	const doigtPose = useCallback(() => doigtsPoses.current > 0, []);
	const diaporama = useDiaporama(langue, doigtPose);
	const { index, noir, move, basculerNoir } = diaporama;

	/* ---------- Gestes sur la scène ---------- */

	const [gestures] = useState(() => new GestureTracker());
	const holdTimer = useRef(0);

	const stopHold = useCallback(() => {
		clearTimeout(holdTimer.current);
		holdTimer.current = 0;
		cacherJauge();
	}, [cacherJauge]);

	// Coordonnées dans le repère de l'app, qui peut être pivotée (kit/web/orientation.ts).
	const surAppui = (event: PointerEvent<HTMLElement>): void => {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		void keepScreenAwake();
		doigtsPoses.current += 1;
		// Toucher sur le bouton d'une slide : le navigateur en fait un clic (components/Slide.tsx),
		// ce n'est pas un geste du diaporama.
		if (event.target instanceof Element && event.target.closest('.bouton')) return;
		const { x, y } = appPoint(event.clientX, event.clientY);
		if (!gestures.press(event.pointerId, x, y, performance.now())) {
			stopHold();
			return;
		}
		const id = event.pointerId;
		// La souris qui sort de la scène ne perd pas son relâchement.
		try {
			event.currentTarget.setPointerCapture(id);
		} catch {
			// Contact déjà terminé.
		}
		if (reglagesRef.current.showHoldRing) montrerJauge(x, y, JAUGE_DELAI_MS, GESTURE.holdMs - JAUGE_DELAI_MS);
		holdTimer.current = window.setTimeout(() => {
			stopHold();
			// Appui de 3 s : sortie de secours, retour au menu principal.
			if (gestures.holdCompleted(id)) quitter();
		}, GESTURE.holdMs);
	};

	const surDeplacement = (event: PointerEvent<HTMLElement>): void => {
		const { x, y } = appPoint(event.clientX, event.clientY);
		if (gestures.move(event.pointerId, x, y)) stopHold();
	};

	const surRelachement = (event: PointerEvent<HTMLElement>): void => {
		doigtsPoses.current = Math.max(0, doigtsPoses.current - 1);
		stopHold();
		const { x, y } = appPoint(event.clientX, event.clientY);
		const tap = gestures.release(event.pointerId, x, y, performance.now(), event.currentTarget.clientWidth);
		if (tap !== 'none') move(tap);
	};

	const surAnnulation = (event: PointerEvent<HTMLElement>): void => {
		doigtsPoses.current = Math.max(0, doigtsPoses.current - 1);
		stopHold();
		gestures.cancel(event.pointerId);
	};

	/* ---------- Clavier et télécommande ---------- */

	// Les touches lisent toujours le dernier diaporama, sans réinstaller l'écouteur à chaque slide.
	const toucheRef = useRef({ move, basculerNoir });
	toucheRef.current = { move, basculerNoir };

	useEffect(() => {
		const surTouche = (event: KeyboardEvent): void => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const action = keyAction(event.key);
			if (!action) return;
			// Réglages ouverts : Échap ou M les ferment, le reste ne touche pas aux slides.
			if (enReglages && action !== 'menu') return;
			event.preventDefault();
			void keepScreenAwake();
			if (action === 'menu') quitter();
			else if (action === 'black') toucheRef.current.basculerNoir();
			else toucheRef.current.move(action);
		};
		document.addEventListener('keydown', surTouche);
		return () => document.removeEventListener('keydown', surTouche);
	}, [enReglages, quitter]);

	// App en arrière-plan : aucun geste commencé ne doit se terminer plus tard.
	useEffect(() => {
		const surVisibilite = (): void => {
			doigtsPoses.current = 0;
			stopHold();
			gestures.reset();
		};
		document.addEventListener('visibilitychange', surVisibilite);
		return () => {
			document.removeEventListener('visibilitychange', surVisibilite);
			clearTimeout(holdTimer.current);
		};
	}, [gestures, stopHold]);

	/* ---------- Affichage ---------- */

	const note = t(SLIDES[index]?.note, langue) ?? '';

	return (
		<>
			{/* La scène reçoit tous les touchers. */}
			<main
				id="stage"
				aria-live="polite"
				onPointerDown={surAppui}
				onPointerMove={surDeplacement}
				onPointerUp={surRelachement}
				onPointerCancel={surAnnulation}
				// Pas de menu contextuel ni de loupe sur appui long.
				onContextMenu={(event) => event.preventDefault()}
			>
				<Deck
					index={index}
					vues={diaporama.vues}
					lancement={diaporama.lancement}
					langue={langue}
					transition={reglages.transition}
					// Le temps des chargements ne s'écoule que quand la slide est vraiment visible.
					enPause={enReglages || noir}
					onBouton={diaporama.appuyerSur}
					onChargementFini={diaporama.chargementFini}
				/>
			</main>

			{/* Cadre d'instrument : décor, laisse passer les touchers. */}
			<Cadre langue={langue} />
			{/* Note pour l'artiste, en bas de l'écran (masquable dans les réglages). */}
			<div id="note" hidden={!reglages.showNotes || !note}>{note}</div>
			<JaugeAppui jauge={jauge} />
			<div id="black" hidden={!noir} />

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{enReglages && <Reglages reglages={reglages} langue={langue} enregistrer={enregistrer} />}
		</>
	);
}
