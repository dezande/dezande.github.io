/*
 * La carte affichée : son dos, la prédiction écrite à l'avant, et le retournement. L'état de la
 * carte est décidé par logic/piece.ts (testé sous Node) et tenu par le tour (index.tsx) ; ce
 * composant ne fait que le montrer.
 *
 * La carte est celle des six prédictions, seule au centre du tapis :
 *   .carte            la carte, posée au centre
 *     .carte-pivot    la retourne (rotateY), en conservant la perspective
 *       .carte-face.dos     le dos, seul visible tant que la carte n'est pas retournée
 *       .carte-face.avant   la prédiction, écrite à la main
 *
 * La prédiction est écrite au moment où la carte est armée, dos visible : le texte est déjà en
 * place et ajusté quand la carte se retourne, sans le moindre calcul sous les yeux du public.
 */

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { DosDeCarte } from '../../../components/cartes/DosDeCarte.tsx';
import { Soulignement } from '../../../components/cartes/Soulignement.tsx';
import type { Langue } from '../../../content/textes.ts';
import { ui } from '../content/interface.ts';
import { PREDICTIONS } from '../content/predictions.ts';
import { t } from '../logic/i18n.ts';
import type { Cote, Etat } from '../logic/piece.ts';
import type { Dessin, Teinte } from '../logic/settings.ts';
import { DessinPiece } from './DessinPiece.tsx';

/** Plus petite échelle du texte : en dessous, mieux vaut raccourcir la prédiction. */
const MIN_FIT = 0.25;
/** Plus grande échelle : une borne de recherche, jamais atteinte en pratique. */
const MAX_FIT = 12;
/**
 * Marge de sécurité de l'ajustement, en pixels : une carte « tout juste » déborderait au moindre
 * écart de police ou d'arrondi.
 */
const FIT_MARGIN_PX = 4;

interface Props {
	etat: Etat;
	/** Le côté dont la prédiction est écrite à l'avant (gardé quand la carte revient face cachée). */
	coteEcrit: Cote | null;
	langue: Langue;
	motif: Dessin;
	couleur: Teinte;
}

/** La prédiction d'un côté, ligne par ligne : seul un retour à la ligne du texte la casse. */
const lignes = (cote: Cote, langue: Langue): string[] => (t(PREDICTIONS[cote], langue) ?? '').split('\n');

export function Carte({ etat, coteEcrit, langue, motif, couleur }: Props) {
	const carteRef = useRef<HTMLElement>(null);
	const avantRef = useRef<HTMLDivElement>(null);
	const ecritureRef = useRef<HTMLDivElement>(null);

	/*
	 * Plus grande échelle (--fit, entre MIN_FIT et MAX_FIT) à laquelle le bloc écrit — la
	 * prédiction, son soulignement et la pièce — tient dans la carte. Recherche par dichotomie. Les
	 * prédictions tiennent sur deux lignes : elles restent d'aplomb, jamais en diagonale.
	 */
	const fit = useCallback(() => {
		const carte = carteRef.current;
		const avant = avantRef.current;
		const ecriture = ecritureRef.current;
		if (!carte || !avant || !ecriture?.firstChild) return;
		const style = getComputedStyle(avant);
		const width = avant.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - FIT_MARGIN_PX;
		const height = avant.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - FIT_MARGIN_PX;
		const tient = (scale: number): boolean => {
			carte.style.setProperty('--fit', String(scale));
			return ecriture.offsetWidth <= width && ecriture.offsetHeight <= height;
		};
		let lo = MIN_FIT;
		let hi = MAX_FIT;
		for (let step = 0; step < 16; step++) {
			const mid = (lo + hi) / 2;
			if (tient(mid)) lo = mid;
			else hi = mid;
		}
		carte.style.setProperty('--fit', String(lo));
	}, []);

	// La prédiction vient d'être écrite : ajustée avant d'être montrée.
	useLayoutEffect(fit, [fit, coteEcrit, langue]);

	useEffect(() => {
		let image = 0;
		const surRedimension = (): void => {
			cancelAnimationFrame(image);
			image = requestAnimationFrame(fit);
		};
		window.addEventListener('resize', surRedimension);
		/*
		 * La police manuscrite n'est demandée qu'à la première prédiction écrite : sans précaution,
		 * le premier tour serait mesuré avec la police de secours, et la prédiction sortirait trop
		 * petite. On la charge donc dès l'ouverture, et on réajuste quand elle arrive.
		 */
		void document.fonts?.load('600 38px Caveat').then(fit, () => undefined);
		document.fonts?.addEventListener('loadingdone', fit);
		return () => {
			cancelAnimationFrame(image);
			window.removeEventListener('resize', surRedimension);
			document.fonts?.removeEventListener('loadingdone', fit);
		};
	}, [fit]);

	const montree = etat.phase === 'montree';
	return (
		<article ref={carteRef} className={`carte${montree ? ' retournee' : ''}`} aria-roledescription="carte" data-couleur={couleur} data-cote={coteEcrit ?? undefined}>
			<div className="carte-pivot">
				{/* Le dos : un dessin SVG, rien à lire. */}
				<div className="carte-face dos" data-motif={motif} aria-label={ui('carte.dos', langue)}>
					<DosDeCarte dessin={motif} />
				</div>
				{/* L'avant : seule la carte retournée est à lire ; armée, elle ne dit encore rien. */}
				<div ref={avantRef} className="carte-face avant" aria-hidden={!montree}>
					<div className="carte-corps">
						{/* Le bloc écrit, d'un seul tenant : le trait suit le mot, la pièce grandit avec lui. */}
						<div ref={ecritureRef} className="ecriture">
							{coteEcrit && (
								<>
									<p className="prediction">
										{lignes(coteEcrit, langue).map((ligne, n) => (
											<Fragment key={n}>{n > 0 && <br />}{ligne}</Fragment>
										))}
									</p>
									{/* Soulignée deux fois, pile comme face ; dessous, la pièce, du côté annoncé. */}
									<Soulignement index={0} />
									<DessinPiece cote={coteEcrit} />
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</article>
	);
}

/** Ce qui est à l'écran, pour les lecteurs d'écran seulement. */
export function annonce(etat: Etat, langue: Langue): string {
	return etat.phase === 'montree' ? lignes(etat.cote, langue).join(' ') : ui('carte.dos', langue);
}
