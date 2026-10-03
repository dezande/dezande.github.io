/*
 * Boule de cristal. Déroulé d'un tour :
 *   1. le magicien touche discrètement une des 3 bandes de l'écran (haut, milieu, bas) ;
 *   2. la prédiction de cette bande (6, 16 ou 26) est « armée » : la brume s'agite pendant le délai réglé ;
 *   3. le nombre apparaît dans la boule, l'écran reste verrouillé (plus aucun toucher n'arme) ;
 *   4. un double tap efface le nombre, la boule se réarme pour le tour suivant (on reste dans le tour).
 * Appui de 3 s n'importe où, Échap ou M : retour au menu principal. R : le nombre s'efface.
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène, les gestes et le clavier
 *   components/  Boule (l'autel et le nombre), Poussiere (particules dorées), ModeTest (le test des
 *                zones), Reglages (le panneau de l'écrou ⚙)
 *   hooks/       useBoule : phases de la boule, armé, affiché, effacé
 *   content/     les noms des zones
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/boule-de-cristal/)
 *     zone-logic.ts  zone touchée (bandes ou 4 coins)
 *     gestures.ts    décision de chaque geste : armer, effacer, appui long, annuler
 *     settings.ts    forme et validation des réglages, les 3 prédictions
 * Les styles sont dans src/styles/tours/boule-de-cristal/.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { JaugeAppui, useJaugeAppui } from '../../components/JaugeAppui.tsx';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { appPoint } from '../../kit/web/orientation.ts';
import { keepScreenAwake } from '../../kit/web/wake-lock.ts';
import { usePont } from '../pont.tsx';
import { Boule } from './components/Boule.tsx';
import { ModeTest, type Eclair } from './components/ModeTest.tsx';
import { Poussiere } from './components/Poussiere.tsx';
import { Reglages } from './components/Reglages.tsx';
import { isArmed, isLocked, useBoule } from './hooks/useBoule.ts';
import { DOUBLE_TAP, GestureTracker, HOLD, type PointerId } from './logic/gestures.ts';
import { sanitizeSettings, ZONES } from './logic/settings.ts';
import { zoneIndexForPoint } from './logic/zone-logic.ts';

/** Les réglages, gardés sur l'appareil, sous le nom de l'app d'origine (« Voyante »). */
const CLE_REGLAGES = 'voyante:settings:v1';
const valider = (brut: unknown) => sanitizeSettings(brut);

/** Rien avant ce délai : un tap, même un peu appuyé, ne fait pas apparaître la jauge. */
const JAUGE_DELAI_MS = DOUBLE_TAP.maxTapMs;

/** Touches du clavier, et des télécommandes de présentation. */
const TOUCHES: Record<string, 'effacer' | 'menu'> = { r: 'effacer', R: 'effacer', Escape: 'menu', m: 'menu', M: 'menu' };

export default function BouleDeCristal() {
	const { enReglages, quitter } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, valider);
	const reglagesRef = useRef(reglages);
	reglagesRef.current = reglages;
	const { jauge, montrerJauge, cacherJauge } = useJaugeAppui();
	const { etat, phaseRef, arm, fadeOut, hardReset, finInstant } = useBoule(reglagesRef);

	/* ---------- Test des zones ---------- */

	const [modeTest, setModeTest] = useState(false);
	const [eclair, setEclair] = useState<Eclair | null>(null);
	const modeTestRef = useRef(modeTest);
	modeTestRef.current = modeTest;

	/** Passe des réglages au mode « Test des zones » (ou en revient) : la boule repart au repos. */
	const testerLesZones = (oui: boolean): void => {
		cacherJauge();
		hardReset();
		setEclair(null);
		setModeTest(oui);
	};

	/* ---------- Gestes sur la scène ---------- */

	const scene = useRef<HTMLElement>(null);
	const [gestures] = useState(() => new GestureTracker());
	/** Minuterie de l'appui long du contact en cours ; 0 si aucune. */
	const holdTimer = useRef(0);
	/** Les doigts posés sur la scène : deux doigts annulent tout geste. */
	const poses = useRef(new Set<PointerId>());

	const cancelHold = useCallback((): void => {
		clearTimeout(holdTimer.current);
		holdTimer.current = 0;
	}, []);

	/** Identifiant du contact : chaque doigt, ou « mouse » pour répéter sur ordinateur. */
	const idDe = (event: PointerEvent<HTMLElement>): PointerId => (event.pointerType === 'mouse' ? 'mouse' : event.pointerId);

	const surAppui = (event: PointerEvent<HTMLElement>): void => {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		void keepScreenAwake();
		cancelHold();
		const id = idDe(event);
		poses.current.add(id);

		const phase = phaseRef.current;
		const action = gestures.press(id, event.clientX, event.clientY, poses.current.size, performance.now(), { armed: isArmed(phase), locked: isLocked(phase) });
		if (action === 'cancel') {
			cacherJauge();
			return;
		}
		// La souris qui sort de la scène ne perd pas son relâchement.
		try {
			event.currentTarget.setPointerCapture(event.pointerId);
		} catch {
			// Contact déjà terminé.
		}

		// Coordonnées dans le repère de la scène, qui peut être pivotée (kit/web/orientation.ts),
		// comme attendu par logic/zone-logic.ts : « haut » reste le haut du téléphone.
		const point = appPoint(event.clientX, event.clientY);

		// Tout doigt posé peut devenir l'appui long : sortie de secours, retour au menu principal.
		holdTimer.current = window.setTimeout(() => {
			if (gestures.holdCompleted(id)) quitter();
		}, HOLD.settingsMs);
		if (reglagesRef.current.showHoldRing) montrerJauge(point.x, point.y, JAUGE_DELAI_MS, HOLD.settingsMs - JAUGE_DELAI_MS);
		else cacherJauge();

		if (action === 'reset') {
			// Le nombre s'estompe et la boule se réarme, pour un nouveau tour. On ne quitte la boule que
			// par l'appui de 3 s.
			fadeOut();
		} else if (action === 'arm') {
			const stage = event.currentTarget;
			const index = zoneIndexForPoint(point.x, point.y, stage.clientWidth, stage.clientHeight, ZONES);
			if (index >= 0) {
				arm(index);
				// Le test des zones fait clignoter la zone touchée.
				if (modeTestRef.current) setEclair((avant) => ({ index, n: (avant?.n ?? 0) + 1 }));
			}
		}
	};

	/** Doigt déplacé : au-delà de la tolérance, l'appui long est abandonné. */
	const surDeplacement = (event: PointerEvent<HTMLElement>): void => {
		if (gestures.move(idDe(event), event.clientX, event.clientY) === null) return;
		cancelHold();
		cacherJauge();
	};

	/** Doigt levé, ou contact interrompu par le système (`interrompu`) : il ne compte pas comme tap. */
	const relacher = (event: PointerEvent<HTMLElement>, interrompu: boolean): void => {
		const id = idDe(event);
		poses.current.delete(id);
		if (!gestures.release(id, performance.now(), interrompu)) return;
		cancelHold();
		cacherJauge();
	};

	/* ---------- Clavier et télécommande ---------- */

	useEffect(() => {
		const surTouche = (event: KeyboardEvent): void => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const action = Object.hasOwn(TOUCHES, event.key) ? TOUCHES[event.key] : null;
			if (!action) return;
			// Réglages ouverts : Échap ou M les ferment, R ne touche pas à la boule.
			if (enReglages && !modeTestRef.current && action !== 'menu') return;
			event.preventDefault();
			void keepScreenAwake();
			if (action === 'menu') quitter();
			else if (isArmed(phaseRef.current)) fadeOut();
		};
		document.addEventListener('keydown', surTouche);
		return () => document.removeEventListener('keydown', surTouche);
	}, [enReglages, quitter, fadeOut, phaseRef]);

	// App en arrière-plan : aucun geste commencé ne doit se terminer plus tard.
	useEffect(() => {
		const surVisibilite = (): void => {
			cancelHold();
			cacherJauge();
			for (const id of poses.current) gestures.release(id, performance.now(), true);
			poses.current.clear();
		};
		document.addEventListener('visibilitychange', surVisibilite);
		return () => {
			document.removeEventListener('visibilitychange', surVisibilite);
			cancelHold();
		};
	}, [gestures, cancelHold, cacherJauge]);

	useEffect(() => {
		void keepScreenAwake();
	}, []);

	/* ---------- Affichage ---------- */

	return (
		<>
			{/* La scène reçoit tous les touchers. Le fondu du nombre suit les réglages (--fade). */}
			<main
				id="stage"
				ref={scene}
				style={{ '--fade': `${reglages.fade}s` } as CSSProperties}
				onPointerDown={surAppui}
				onPointerMove={surDeplacement}
				onPointerUp={(event) => relacher(event, false)}
				onPointerCancel={(event) => relacher(event, true)}
				// Pas de menu contextuel ni de loupe sur appui long.
				onContextMenu={(event) => event.preventDefault()}
			>
				<div className="velvet"></div>
				<Boule etat={etat} finInstant={finInstant} />
				<Poussiere nombre={18} />
				<div className="vignette"></div>
			</main>

			<JaugeAppui jauge={jauge} />
			{/* Voile de luminosité. */}
			<div id="dim" style={{ '--dim': String((100 - reglages.brightness) / 100) } as CSSProperties}></div>

			{modeTest && <ModeTest phase={etat.phase} scene={scene} eclair={eclair} surReglages={() => testerLesZones(false)} surQuitter={quitter} />}

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{enReglages && !modeTest && <Reglages reglages={reglages} enregistrer={enregistrer} surTest={() => testerLesZones(true)} />}
		</>
	);
}
