/*
 * Une carte du paquet : son dos, la prédiction écrite à l'avant, le retournement et la sortie du
 * cadre. L'état du paquet est décidé par logic/paquet.ts (testé sous Node) et tenu par le tour
 * (index.tsx) ; ce composant ne fait que montrer la carte à sa place.
 *
 * Chaque carte est faite de deux faces dans un pivot :
 *   .carte            place la carte dans la pile (décalage selon l'étalement) et la fait sortir
 *     .carte-pivot    la retourne (rotateY), en conservant la perspective
 *       .carte-face.dos     le dos, seul visible tant que la carte n'est pas retournée
 *       .carte-face.avant   la prédiction, écrite à la main
 *
 * Les six cartes sont toutes en place dès l'ouverture, prédiction écrite et ajustée : une carte
 * se retourne sans le moindre calcul de mise en page au moment où le doigt la touche.
 */

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { DosDeCarte } from '../../../components/cartes/DosDeCarte.tsx';
import { Soulignement } from '../../../components/cartes/Soulignement.tsx';
import type { Langue } from '../../../content/textes.ts';
import { CARTES } from '../content/cartes.ts';
import { ui } from '../content/interface.ts';
import type { Cran } from '../logic/etalement.ts';
import { t } from '../logic/i18n.ts';
import type { Dessin, Teinte } from '../logic/settings.ts';

/** Plus petite échelle du texte : en dessous, mieux vaut raccourcir la prédiction. */
const MIN_FIT = 0.25;
/**
 * Plus grande échelle du texte. La prédiction ne fait pas que rétrécir quand elle est longue :
 * elle grandit jusqu'à remplir la carte quand elle est courte — « NO! » doit frapper plein cadre,
 * pas flotter au milieu. Ce plafond n'est qu'une borne de recherche, jamais atteinte en pratique.
 */
const MAX_FIT = 12;
/**
 * Marge de sécurité de l'ajustement, en pixels : une carte « tout juste » déborderait au moindre
 * écart de police ou d'arrondi (les polices manuscrites diffèrent d'un appareil à l'autre).
 */
const FIT_MARGIN_PX = 4;

/**
 * Gain minimal pour qu'une prédiction soit écrite en diagonale plutôt qu'à l'horizontale. En
 * dessous, la carte penche pour rien : un mot court tient déjà pleine largeur, et l'incliner ne
 * ferait que le rendre plus difficile à lire.
 */
const GAIN_DIAGONALE = 1.12;

/** Où en est la carte dans le paquet. */
export type Place = 'sortie' | 'dessus' | 'dessous';

interface Props {
	/** Rang de la carte dans le paquet : 0 pour celle du dessus. */
	index: number;
	place: Place;
	/** Prédiction visible : la carte du dessus retournée, ou une carte en train de sortir. */
	retournee: boolean;
	/** Seule la carte retournée sur le dessus est à lire. */
	lisible: boolean;
	/** Sa place dans l'étalement, tirée au sort à chaque remise du paquet. */
	cran: Cran;
	langue: Langue;
	dessin: Dessin;
	teinte: Teinte;
}

export function Carte({ index, place, retournee, lisible, cran, langue, dessin, teinte }: Props) {
	const carteRef = useRef<HTMLElement>(null);
	const avantRef = useRef<HTMLDivElement>(null);
	const ecritureRef = useRef<HTMLDivElement>(null);
	const carte = CARTES[index]!;
	const entete = t(carte.entete, langue);
	// Un retour à la ligne dans le texte casse la ligne, et lui seul : une ligne n'est jamais
	// coupée automatiquement (styles/tours/six-predictions/_cartes.scss), pour que l'auteur décide
	// de la mise en page.
	const lignes = (t(carte.texte, langue) ?? '').split('\n');

	/*
	 * Plus grande échelle (--fit, entre MIN_FIT et MAX_FIT) à laquelle le bloc écrit tient dans la
	 * carte, et l'angle auquel il l'atteint. Recherche par dichotomie : la plage est large (une
	 * prédiction d'un mot grandit beaucoup, une longue rétrécit), d'où le nombre de passes.
	 *
	 * Deux sens sont essayés : à plat, et le long de la diagonale de la carte. **Les mots les plus
	 * longs gagnent à être écrits en biais** — la diagonale d'une carte est bien plus longue que sa
	 * largeur — et remplissent alors la carte d'un coin à l'autre. Un mot court reste à plat.
	 *
	 * Le bloc est mesuré sans sa rotation (`offsetWidth`, que les transformations ne changent pas),
	 * et son encombrement une fois penché est calculé : la mesure ne dépend donc ni de l'inclinaison
	 * de la carte dans le paquet, ni de sa réduction au fond de la pile. --fit et --angle sont posés
	 * directement sur la carte : React ne les connaît pas, et ne les efface donc jamais.
	 */
	const fit = useCallback(() => {
		const el = carteRef.current;
		const avant = avantRef.current;
		const ecriture = ecritureRef.current;
		if (!el || !avant || !ecriture) return;
		const style = getComputedStyle(avant);
		const width = avant.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - FIT_MARGIN_PX;
		const height = avant.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - FIT_MARGIN_PX;
		// La diagonale de la place disponible, du coin bas-gauche au coin haut-droit.
		const diagonale = -Math.atan(height / width) * (180 / Math.PI);

		/** Le bloc écrit tient-il, à cette échelle et à cet angle ? */
		const tient = (scale: number, angle: number): boolean => {
			el.style.setProperty('--fit', String(scale));
			const [w, h] = [ecriture.offsetWidth, ecriture.offsetHeight];
			const rad = (angle * Math.PI) / 180;
			const [c, s] = [Math.abs(Math.cos(rad)), Math.abs(Math.sin(rad))];
			return w * c + h * s <= width && w * s + h * c <= height;
		};

		/** Plus grande échelle qui tienne à cet angle. */
		const cherche = (angle: number): number => {
			let lo = MIN_FIT;
			let hi = MAX_FIT;
			for (let step = 0; step < 16; step++) {
				const mid = (lo + hi) / 2;
				if (tient(mid, angle)) lo = mid;
				else hi = mid;
			}
			return lo;
		};

		const plat = cherche(0);
		// Une prédiction sur plusieurs lignes reste d'aplomb : un pavé de texte en biais ne se lit plus.
		const enBiais = ecriture.querySelector('.prediction br') === null ? cherche(diagonale) : 0;
		const biais = enBiais >= plat * GAIN_DIAGONALE;
		el.style.setProperty('--fit', String(biais ? enBiais : plat));
		el.style.setProperty('--angle', biais ? `${diagonale.toFixed(2)}deg` : '0deg');
	}, []);

	// La prédiction est écrite : ajustée avant d'être peinte.
	useLayoutEffect(fit, [fit, langue]);

	// Taille d'écran ou polices changées : tout est à réajuster.
	useEffect(() => {
		let image = 0;
		const surRedimension = (): void => {
			cancelAnimationFrame(image);
			image = requestAnimationFrame(fit);
		};
		window.addEventListener('resize', surRedimension);
		/*
		 * La police manuscrite peut arriver après l'ouverture du tour : sans précaution, les cartes
		 * seraient mesurées avec la police de secours, et la prédiction sortirait trop petite. On
		 * la demande donc tout de suite, et on réajuste quand elle arrive.
		 */
		void document.fonts?.load('600 38px Caveat').then(fit, () => undefined);
		document.fonts?.addEventListener('loadingdone', fit);
		return () => {
			cancelAnimationFrame(image);
			window.removeEventListener('resize', surRedimension);
			document.fonts?.removeEventListener('loadingdone', fit);
		};
	}, [fit]);

	/*
	 * Où la carte est posée, et à quel rang du paquet (styles/tours/six-predictions/_cartes.scss).
	 * Cette place est celle de la carte, pas celle de son rang dans la pile : quand la carte du
	 * dessus s'envole, les autres ne bougent pas d'un pouce. L'ordre d'empilement suit le paquet,
	 * et lui seul : la première carte par-dessus toutes.
	 */
	const position = {
		'--dy': String(cran.dy),
		'--dx': String(cran.dx),
		'--rot': String(cran.rot),
		'--rang': String(index),
	} as CSSProperties;

	return (
		<article
			ref={carteRef}
			className={`carte ${place}${retournee ? ' retournee' : ''}`}
			data-index={index}
			data-couleur={teinte}
			aria-roledescription="carte"
			aria-hidden={!lisible}
			style={position}
		>
			<div className="carte-pivot">
				{/* Le dos : un dessin SVG, rien à lire. */}
				<div className="carte-face dos" aria-label={ui('carte.dos', langue)}>
					<DosDeCarte dessin={dessin} />
				</div>
				{/* L'avant : la prédiction, dans un corps dont le texte s'ajuste à la carte. */}
				<div ref={avantRef} className="carte-face avant">
					<div className="carte-corps">
						{entete && <p className="entete">{entete}</p>}
						{/* Le bloc écrit, d'un seul tenant : il se mesure et pivote avec son
						    soulignement, si bien que le trait suit toujours le mot. */}
						<div ref={ecritureRef} className="ecriture">
							<p className="prediction">
								{lignes.map((ligne, n) => (
									<Fragment key={n}>{n > 0 && <br />}{ligne}</Fragment>
								))}
							</p>
							<Soulignement index={index} />
						</div>
					</div>
				</div>
			</div>
		</article>
	);
}
