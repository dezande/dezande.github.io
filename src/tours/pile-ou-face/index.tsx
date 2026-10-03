/*
 * Pile ou face : une carte à prédiction, face cachée. Le même système que la boule de cristal :
 *   toucher la moitié du haut   : la carte se retourne sur « 0,20 euro pile »
 *   toucher la moitié du bas    : la carte se retourne sur « 0,20 euro face »
 *   (après le délai réglé ; 0 s par défaut, au toucher)
 *   deux touchers rapprochés, ou R : la carte revient face cachée, prête pour une nouvelle routine
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène, l'état de la carte, les gestes et le clavier
 *   components/  Carte (le dos, la prédiction, le retournement), DessinPiece (la pièce de
 *                20 centimes dessinée à la main), Reglages (le panneau de l'écrou ⚙)
 *   content/     LE TEXTE : predictions.ts (pile et face) et interface.ts (les réglages)
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/pile-ou-face/)
 *     piece.ts       l'état de la carte, et pile ou face selon la moitié touchée
 *     gestures.ts    décision de chaque geste
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 *     i18n.ts        les deux langues
 * Les dos de cartes sont partagés avec les six prédictions (src/components/cartes/), les styles
 * sont dans src/styles/tours/pile-ou-face/.
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { JaugeAppui, useJaugeAppui } from '../../components/JaugeAppui.tsx';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { appPoint } from '../../kit/web/orientation.ts';
import { keepScreenAwake } from '../../kit/web/wake-lock.ts';
import { usePont } from '../pont.tsx';
import { annonce, Carte } from './components/Carte.tsx';
import { Reglages } from './components/Reglages.tsx';
import { GESTURE, GestureTracker } from './logic/gestures.ts';
import { keyAction } from './logic/keys.ts';
import { apresGeste, CACHEE, coteDuPoint, montrer, type Cote, type Etat } from './logic/piece.ts';
import { sanitizeSettings } from './logic/settings.ts';

/**
 * Les réglages, gardés sur l'appareil. L'état de la carte, lui, n'est enregistré nulle part :
 * chaque ouverture repart d'une carte face cachée — on ouvre un accessoire de scène pour jouer, pas
 * pour reprendre le tour précédent. (La langue enregistrée est ignorée : c'est celle du menu.)
 */
const CLE_REGLAGES = 'pile-ou-face:settings:v1';
const valider = (brut: unknown) => sanitizeSettings(brut);

/** La jauge n'apparaît qu'après un court instant : un tap normal ne la montre jamais. */
const JAUGE_DELAI_MS = GESTURE.tapMaxMs;

export default function PileOuFace() {
	const { langue, enReglages, quitter } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, valider);
	const { jauge, montrerJauge, cacherJauge } = useJaugeAppui();

	/* ---------- L'état de la carte ---------- */

	const [etat, setEtat] = useState<Etat>(CACHEE);
	/** Le côté dont la prédiction est écrite à l'avant de la carte. */
	const [coteEcrit, setCoteEcrit] = useState<Cote | null>(null);
	// Lus par les gestes et les minuteries, qui doivent toujours voir la dernière valeur.
	const etatRef = useRef(etat);
	const reglagesRef = useRef(reglages);
	reglagesRef.current = reglages;
	/** Minuterie du délai entre le toucher et le retournement. */
	const delaiTimer = useRef(0);

	const changer = useCallback(function changer(suivant: Etat): void {
		const avant = etatRef.current;
		if (suivant === avant) return;
		let nouveau = suivant;
		if (nouveau.phase === 'armee' && avant.phase === 'cachee') {
			// La prédiction est écrite tout de suite, dos visible : prête quand la carte se retourne.
			setCoteEcrit(nouveau.cote);
			clearTimeout(delaiTimer.current);
			const ms = reglagesRef.current.delai * 1000;
			if (ms === 0) nouveau = montrer(nouveau);
			else delaiTimer.current = window.setTimeout(() => changer(montrer(etatRef.current)), ms);
		}
		if (nouveau.phase === 'cachee') clearTimeout(delaiTimer.current);
		etatRef.current = nouveau;
		setEtat(nouveau);
	}, []);

	useEffect(() => () => clearTimeout(delaiTimer.current), []);

	/* ---------- Gestes sur la scène ---------- */

	const [gestures] = useState(() => new GestureTracker());
	const holdTimer = useRef(0);
	/** État de la carte avant le dernier tap : un double toucher ne compte que sur une carte déjà armée. */
	const avantDernierTap = useRef<Etat>(CACHEE);

	const stopHold = useCallback(() => {
		clearTimeout(holdTimer.current);
		holdTimer.current = 0;
		cacherJauge();
	}, [cacherJauge]);

	/**
	 * Ce qu'un geste de la scène déclenche, à la hauteur `y` (repère de l'app) :
	 *   un tap        arme la carte, sur pile en haut de l'écran et sur face en bas ;
	 *   un double     remet la carte face cachée, si elle était déjà armée au premier toucher.
	 */
	const appliquer = (type: 'tap' | 'double', y: number): void => {
		// La hauteur de l'app, et non de la fenêtre : l'app peut être pivotée (kit/web/orientation.ts).
		const cote = coteDuPoint(y, document.getElementById('app')?.clientHeight ?? window.innerHeight);
		if (!cote) return;
		const avant = etatRef.current;
		changer(apresGeste(avant, type, cote, type === 'double' ? avantDernierTap.current : avant));
		if (type === 'tap') avantDernierTap.current = avant;
	};

	// Coordonnées dans le repère de l'app, qui peut être pivotée (kit/web/orientation.ts).
	const surAppui = (event: PointerEvent<HTMLElement>): void => {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		void keepScreenAwake();
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
		stopHold();
		const { x, y } = appPoint(event.clientX, event.clientY);
		const fait = gestures.release(event.pointerId, x, y, performance.now());
		if (fait !== 'none') appliquer(fait, y);
	};

	const surAnnulation = (event: PointerEvent<HTMLElement>): void => {
		stopHold();
		gestures.cancel(event.pointerId);
	};

	/* ---------- Clavier et télécommande ---------- */

	useEffect(() => {
		const surTouche = (event: KeyboardEvent): void => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const action = keyAction(event.key);
			if (!action) return;
			// Réglages ouverts : Échap ou M les ferment, le reste ne touche pas à la carte.
			if (enReglages && action !== 'menu') return;
			event.preventDefault();
			void keepScreenAwake();
			if (action === 'menu') quitter();
			else if (action === 'cacher') changer(CACHEE);
			else changer(apresGeste(etatRef.current, 'tap', action, etatRef.current));
		};
		document.addEventListener('keydown', surTouche);
		return () => document.removeEventListener('keydown', surTouche);
	}, [enReglages, quitter, changer]);

	// App en arrière-plan : aucun geste commencé ne doit se terminer plus tard, et le tap qui
	// attendait son double est oublié.
	useEffect(() => {
		const surVisibilite = (): void => {
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

	// Sans transition à l'ouverture : la carte apparaît directement à sa place.
	const [sansAnimation, setSansAnimation] = useState(true);
	useEffect(() => {
		let image = requestAnimationFrame(() => {
			image = requestAnimationFrame(() => setSansAnimation(false));
		});
		return () => cancelAnimationFrame(image);
	}, []);

	return (
		<>
			{/* La scène reçoit tous les touchers. */}
			<main
				id="stage"
				onPointerDown={surAppui}
				onPointerMove={surDeplacement}
				onPointerUp={surRelachement}
				onPointerCancel={surAnnulation}
				// Pas de menu contextuel ni de loupe sur appui long.
				onContextMenu={(event) => event.preventDefault()}
			>
				<div id="table" className={sansAnimation ? 'no-anim' : undefined}>
					<Carte etat={etat} coteEcrit={coteEcrit} langue={langue} motif={reglages.motif} couleur={reglages.couleur} />
				</div>
			</main>

			{/* Ce qui est à l'écran, pour les lecteurs d'écran seulement. */}
			<p id="annonce" className="sr-only" aria-live="polite">{annonce(etat, langue)}</p>
			<JaugeAppui jauge={jauge} />

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{enReglages && <Reglages reglages={reglages} langue={langue} enregistrer={enregistrer} />}
		</>
	);
}
