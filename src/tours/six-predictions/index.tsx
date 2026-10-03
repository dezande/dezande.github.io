/*
 * Les six prédictions : six cartes étalées, faces en bas.
 *   toucher la carte du dessus  : elle se retourne et montre sa prédiction
 *   la toucher à nouveau        : elle sort du cadre, la suivante est dessous
 *   deux touchers sur la table vide, R ou Début : le paquet revient, faces en bas, et l'on reste
 *                                 dans le tour, prêt pour une nouvelle routine
 *   appui de 3 s n'importe où, Échap ou M : retour au menu principal
 *
 * Organisation du dossier :
 *   index.tsx    ce fichier : la scène, l'état du paquet, les gestes et le clavier
 *   components/  Paquet (les six cartes à leur place), Carte (le dos, la prédiction, le
 *                retournement, l'ajustement du texte), Reglages (le panneau de l'écrou ⚙)
 *   content/     LE TEXTE : cartes.ts (les six prédictions, en français et en anglais) et
 *                interface.ts (les réglages)
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/six-predictions/)
 *     cartes.ts      forme d'une carte, vérification du contenu
 *     paquet.ts      l'état du paquet et ce que chaque toucher en fait
 *     etalement.ts   de combien chaque carte du dessous dépasse de sa voisine, tiré au sort
 *     gestures.ts    décision de chaque geste
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 *     i18n.ts        les deux langues
 * Les dos de cartes et le soulignement sont partagés avec Pile ou face (src/components/cartes/),
 * les styles sont dans src/styles/tours/six-predictions/.
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { JaugeAppui, useJaugeAppui } from '../../components/JaugeAppui.tsx';
import type { Langue } from '../../content/textes.ts';
import { useReglagesEnregistres } from '../../hooks/useReglagesEnregistres.ts';
import { appPoint } from '../../kit/web/orientation.ts';
import { keepScreenAwake } from '../../kit/web/wake-lock.ts';
import { usePont } from '../pont.tsx';
import { Paquet } from './components/Paquet.tsx';
import { Reglages } from './components/Reglages.tsx';
import { CARTES } from './content/cartes.ts';
import { ui } from './content/interface.ts';
import { crans, nouveauSemis, type Cran } from './logic/etalement.ts';
import { GESTURE, GestureTracker } from './logic/gestures.ts';
import { t } from './logic/i18n.ts';
import { keyAction } from './logic/keys.ts';
import { apresToucher, compteurLabel, DEPART, estVide, remettre, type Etat } from './logic/paquet.ts';
import { sanitizeSettings } from './logic/settings.ts';

/**
 * Les réglages, gardés sur l'appareil. Le paquet, lui, n'est enregistré nulle part : chaque
 * ouverture repart des six cartes faces en bas, dans un nouvel étalement — on ouvre un accessoire
 * de scène pour jouer, pas pour reprendre la routine précédente. (La langue enregistrée est
 * ignorée : c'est celle du menu.)
 */
const CLE_REGLAGES = 'six-predictions:settings:v1';
const valider = (brut: unknown) => sanitizeSettings(brut);

const NOMBRE = CARTES.length;

/** La jauge n'apparaît qu'après un court instant : un tap normal ne la montre jamais. */
const JAUGE_DELAI_MS = GESTURE.tapMaxMs;

/**
 * Délai pendant lequel un nouveau toucher est ignoré, le temps qu'une carte finisse de se
 * retourner ou de sortir. Sans lui, deux touchers un peu vifs feraient sortir une prédiction
 * avant que le public l'ait vue. Il ne s'applique pas au paquet vide, où le double toucher
 * doit rester possible.
 */
const ACTION_GUARD_MS = 260;

/*
 * L'étalement du paquet : les écarts, tirés au sort, d'une carte à la suivante. Il est neuf à
 * chaque ouverture comme à chaque remise du paquet, si bien que deux représentations ne commencent
 * jamais sur le même étalement.
 */
const nouvelEtalement = (): Cran[] => crans(nouveauSemis(), NOMBRE);

/** Ce qui est à l'écran, pour les lecteurs d'écran seulement. */
function annonce(etat: Etat, langue: Langue): string {
	if (estVide(etat, NOMBRE)) return ui('carte.vide', langue);
	if (etat.retournee) return t(CARTES[etat.index]?.texte, langue) ?? '';
	return `${ui('carte.dos', langue)} ${compteurLabel(etat, NOMBRE)}`;
}

export default function SixPredictions() {
	const { langue, enReglages, quitter } = usePont();
	const [reglages, enregistrer] = useReglagesEnregistres(CLE_REGLAGES, valider);
	const { jauge, montrerJauge, cacherJauge } = useJaugeAppui();

	/* ---------- L'état du paquet ---------- */

	const [etat, setEtat] = useState<Etat>(DEPART);
	const [etalement, setEtalement] = useState<Cran[]>(nouvelEtalement);
	// Lus par les gestes et le clavier, qui doivent toujours voir la dernière valeur.
	const etatRef = useRef(etat);
	const reglagesRef = useRef(reglages);
	reglagesRef.current = reglages;
	const prochainToucherA = useRef(0);

	/*
	 * Sans transition à l'ouverture comme à chaque remise du paquet : il se retrouve directement à
	 * sa place. Les transitions reprennent une fois la nouvelle position peinte (deux images plus
	 * tard) ; `remises` relance cette attente à chaque remise.
	 */
	const [sansAnimation, setSansAnimation] = useState(true);
	const [remises, setRemises] = useState(0);
	useEffect(() => {
		let image = requestAnimationFrame(() => {
			image = requestAnimationFrame(() => setSansAnimation(false));
		});
		return () => cancelAnimationFrame(image);
	}, [remises]);

	const changer = useCallback((suivant: Etat): void => {
		etatRef.current = suivant;
		setEtat(suivant);
	}, []);

	/** Un toucher sur la scène : la carte du dessus se retourne, puis sort du cadre. */
	const toucher = useCallback((): void => {
		if (estVide(etatRef.current, NOMBRE)) return;
		const now = performance.now();
		if (now < prochainToucherA.current) return;
		prochainToucherA.current = now + ACTION_GUARD_MS;
		changer(apresToucher(etatRef.current, NOMBRE));
	}, [changer]);

	/**
	 * Le paquet revient au complet, faces en bas (double toucher sur la table vide, touche R), et
	 * retombe dans un nouvel étalement : deux représentations ne commencent jamais sur le même
	 * paquet. On reste dans le tour, prêt pour une nouvelle routine.
	 */
	const remettrePaquet = useCallback((): void => {
		prochainToucherA.current = 0;
		setSansAnimation(true);
		setRemises((n) => n + 1);
		setEtalement(nouvelEtalement());
		changer(remettre());
	}, [changer]);

	/* ---------- Gestes sur la scène ---------- */

	const [gestures] = useState(() => new GestureTracker());
	const holdTimer = useRef(0);

	const stopHold = useCallback(() => {
		clearTimeout(holdTimer.current);
		holdTimer.current = 0;
		cacherJauge();
	}, [cacherJauge]);

	/**
	 * Ce qu'un geste de la scène déclenche :
	 *   un tap        touche la carte du dessus (retournement, puis sortie du cadre) ;
	 *   un double     remet le paquet si la table est vide, et se comporte comme un tap sinon —
	 *                 deux touchers vifs en pleine routine ne doivent rien avoir d'exceptionnel.
	 */
	const appliquer = (geste: 'tap' | 'double'): void => {
		if (geste === 'double' && estVide(etatRef.current, NOMBRE)) remettrePaquet();
		else toucher();
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
		const geste = gestures.release(event.pointerId, x, y, performance.now());
		if (geste !== 'none') appliquer(geste);
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
			// Réglages ouverts : Échap ou M les ferment, le reste ne touche pas au paquet.
			if (enReglages && action !== 'menu') return;
			event.preventDefault();
			void keepScreenAwake();
			if (action === 'menu') quitter();
			else if (action === 'remettre') remettrePaquet();
			else toucher();
		};
		document.addEventListener('keydown', surTouche);
		return () => document.removeEventListener('keydown', surTouche);
	}, [enReglages, quitter, remettrePaquet, toucher]);

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
				<Paquet etat={etat} etalement={etalement} sansAnimation={sansAnimation} langue={langue} motif={reglages.motif} couleur={reglages.couleur} />
			</main>

			{/* Ce qui est à l'écran, pour les lecteurs d'écran seulement. */}
			<p id="annonce" className="sr-only" aria-live="polite">{annonce(etat, langue)}</p>
			<JaugeAppui jauge={jauge} />

			{/* Ouvert par l'écrou ⚙ : les réglages, que l'on ferme pour revenir au menu. */}
			{enReglages && <Reglages reglages={reglages} langue={langue} enregistrer={enregistrer} />}
		</>
	);
}
