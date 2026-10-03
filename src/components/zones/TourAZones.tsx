/*
 * UN TOUR À ZONES, prêt à l'emploi (la boule de cristal, la carte de visite) : la scène est coupée
 * en zones (src/logic/zones.ts : 2 ou 3 bandes, ou 4 coins), chacune avec sa valeur. Déroulé :
 *   1. le magicien touche discrètement une zone : sa valeur est armée, l'écran se verrouille ;
 *   2. après le délai réglé, elle apparaît (le décor du tour la montre à sa façon) ;
 *   3. un double tap la fait disparaître, et le tour se réarme pour une nouvelle routine, sur place ;
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal ; R : la valeur disparaît.
 *
 * Ce composant fait tout ce qui est commun : les gestes (src/logic/gestes-zones.ts), le clavier,
 * l'appui long et sa jauge, les phases (hooks/usePhasesZones.ts), les réglages enregistrés et leur
 * panneau (ReglagesZones), le test des zones (ModeTest), la luminosité (#dim), et le paysage si le
 * tour se joue téléphone tenu en largeur (hooks/usePaysage.ts). Le tour ne fournit que son décor et
 * ses mots :
 *
 *   export default function MonTour() {
 *     return (
 *       <TourAZones cleReglages="mon-tour:settings:v1" valider={sanitizeSettings} zones={4}
 *         noms={['Haut gauche', …]} valeurs={['17', …]} libelles={…} libellesPhases={…}
 *         decor={(etat, reglages, finInstant) => <MonDecor etat={etat} … />} />
 *     );
 *   }
 *
 * Le décor reçoit l'état des phases (sa phase, la valeur armée) et en fait ses classes CSS ; quand
 * `etat.instant` est vrai, il applique le repos sans transition puis appelle finInstant().
 * Les styles sont ceux du tour (styles/tours/<dossier>/), avec styles/components/_zones.scss.
 */

import { useCallback, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { JaugeAppui } from '../JaugeAppui.tsx';
import { useAppuiLong } from '../../hooks/useAppuiLong.ts';
import { useClavier } from '../../hooks/useClavier.ts';
import { usePaysage } from '../../hooks/usePaysage.ts';
import { isArmed, isLocked, usePhasesZones, type EtatZones, type Phase } from '../../hooks/usePhasesZones.ts';
import { useQuandLAppSeCache } from '../../hooks/useQuandLAppSeCache.ts';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { keepScreenAwake } from '../../kit/web/wake-lock.ts';
import { DOUBLE_TAP, GestureTracker, HOLD, type PointerId } from '../../logic/gestes-zones.ts';
import type { ReglagesZones as Reglages } from '../../logic/reglages-zones.ts';
import { zoneIndexForPoint } from '../../logic/zones.ts';
import { usePont } from '../../tours/pont.tsx';
import { ModeTest, type Eclair } from './ModeTest.tsx';
import { ReglagesZones, type LibellesReglagesZones } from './ReglagesZones.tsx';

/** Touches du clavier, et des télécommandes de présentation. */
const TOUCHES: Readonly<Record<string, 'effacer' | 'menu'>> = { r: 'effacer', R: 'effacer', Escape: 'menu', m: 'menu', M: 'menu' };
const actionDeLaTouche = (key: string): 'effacer' | 'menu' | null => (Object.hasOwn(TOUCHES, key) ? TOUCHES[key]! : null);

interface Props {
	/** La clé des réglages sur l'appareil, et leur validation (le logic/settings.ts du tour). */
	cleReglages: string;
	valider: (brut: unknown) => Reglages;
	/** Le nombre de zones, et pour chacune son nom et sa valeur. */
	zones: number;
	noms: readonly string[];
	valeurs: readonly string[];
	/** Les mots du tour dans ses réglages, et ce que dit le test des zones à chaque phase. */
	libelles: LibellesReglagesZones;
	libellesPhases: Readonly<Record<Phase, string>>;
	/** Le tour se joue téléphone tenu en largeur : la scène et le test des zones pivotent. */
	paysage?: boolean;
	/** Le décor, dans la scène : il montre l'état des phases. */
	decor: (etat: EtatZones, reglages: Reglages, finInstant: () => void) => ReactNode;
}

export function TourAZones({ cleReglages, valider, zones, noms, valeurs, libelles, libellesPhases, paysage = false, decor }: Props) {
	const { enReglages, quitter } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(cleReglages, valider);
	const reglagesRef = useRef(reglages);
	reglagesRef.current = reglages;
	const { etat, phaseRef, armer, effacer, remettre, finInstant } = usePhasesZones(reglagesRef, valeurs);
	// La jauge n'apparaît qu'après la durée d'un tap : un toucher de la routine ne la montre jamais.
	const appui = useAppuiLong({ dureeMs: HOLD.settingsMs, delaiJaugeMs: DOUBLE_TAP.maxTapMs, jaugeVisible: reglages.showHoldRing });

	/* ---------- Test des zones ---------- */

	const [modeTest, setModeTest] = useState(false);
	const [eclair, setEclair] = useState<Eclair | null>(null);
	const modeTestRef = useRef(modeTest);
	modeTestRef.current = modeTest;

	/** Passe des réglages au mode « Test des zones » (ou en revient) : le tour repart au repos. */
	const testerLesZones = (oui: boolean): void => {
		appui.arreter();
		remettre();
		setEclair(null);
		setModeTest(oui);
	};

	/* ---------- Gestes sur la scène ---------- */

	const scene = useRef<HTMLElement>(null);
	// En paysage : la scène et le test des zones ; les réglages, ouverts depuis le menu, en portrait.
	const { appPoint } = usePaysage(paysage && (!enReglages || modeTest), scene);
	const [gestes] = useState(() => new GestureTracker());
	/** Les doigts posés sur la scène : deux doigts annulent tout geste. */
	const poses = useRef(new Set<PointerId>());

	/** Identifiant du contact : chaque doigt, ou « mouse » pour répéter sur ordinateur. */
	const idDe = (event: PointerEvent<HTMLElement>): PointerId => (event.pointerType === 'mouse' ? 'mouse' : event.pointerId);

	const surAppui = (event: PointerEvent<HTMLElement>): void => {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		void keepScreenAwake();
		const id = idDe(event);
		poses.current.add(id);

		const phase = phaseRef.current;
		const action = gestes.press(id, event.clientX, event.clientY, poses.current.size, performance.now(), { armed: isArmed(phase), locked: isLocked(phase) });
		if (action === 'cancel') {
			appui.arreter();
			return;
		}
		// La souris qui sort de la scène ne perd pas son relâchement.
		try {
			event.currentTarget.setPointerCapture(event.pointerId);
		} catch {
			// Contact déjà terminé.
		}

		// Coordonnées dans le repère de la scène, qui peut être pivotée (portrait du kit, ou paysage),
		// comme attendu par src/logic/zones.ts : « haut » reste le haut de la scène.
		const point = appPoint(event.clientX, event.clientY);
		// Tout doigt posé peut devenir l'appui long : sortie de secours, retour au menu principal.
		appui.commencer(point.x, point.y, () => {
			if (gestes.holdCompleted(id)) quitter();
		});

		if (action === 'reset') {
			// La valeur disparaît et le tour se réarme, pour une nouvelle routine, sur place.
			effacer();
		} else if (action === 'arm') {
			const surface = event.currentTarget;
			const zone = zoneIndexForPoint(point.x, point.y, surface.clientWidth, surface.clientHeight, zones);
			if (zone >= 0) {
				armer(zone);
				// Le test des zones fait clignoter la zone touchée.
				if (modeTestRef.current) setEclair((avant) => ({ index: zone, n: (avant?.n ?? 0) + 1 }));
			}
		}
	};

	/** Doigt déplacé : au-delà de la tolérance, l'appui long est abandonné. */
	const surDeplacement = (event: PointerEvent<HTMLElement>): void => {
		if (gestes.move(idDe(event), event.clientX, event.clientY) !== null) appui.arreter();
	};

	/** Doigt levé, ou contact interrompu par le système (`interrompu`) : il ne compte pas comme tap. */
	const relacher = (event: PointerEvent<HTMLElement>, interrompu: boolean): void => {
		const id = idDe(event);
		poses.current.delete(id);
		if (gestes.release(id, performance.now(), interrompu)) appui.arreter();
	};

	// App en arrière-plan : aucun doigt resté posé ne doit compter plus tard.
	useQuandLAppSeCache(useCallback(() => {
		for (const id of poses.current) gestes.release(id, performance.now(), true);
		poses.current.clear();
	}, [gestes]));

	// R : la valeur disparaît (si elle est armée ou montrée) ; Échap ou M : retour au menu.
	useClavier(actionDeLaTouche, () => {
		if (isArmed(phaseRef.current)) effacer();
	}, enReglages && !modeTest);

	/* ---------- Affichage ---------- */

	return (
		<>
			{/* La scène reçoit tous les touchers. La durée des transitions suit les réglages (--fade). */}
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
				{decor(etat, reglages, finInstant)}
			</main>

			<JaugeAppui jauge={appui.jauge} />
			{/* Voile de luminosité. */}
			<div id="dim" style={{ '--dim': String((100 - reglages.brightness) / 100) } as CSSProperties}></div>

			{modeTest && (
				<ModeTest zones={zones} noms={noms} valeurs={valeurs} libellesPhases={libellesPhases} phase={etat.phase} scene={scene} eclair={eclair} surReglages={() => testerLesZones(false)} surQuitter={quitter} />
			)}

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{enReglages && !modeTest && (
				<ReglagesZones libelles={libelles} noms={noms} valeurs={valeurs} reglages={reglages} enregistrer={enregistrer} surTest={() => testerLesZones(true)} />
			)}
		</>
	);
}
