/*
 * Une slide : étiquette, titre, image, grand nombre, texte, bouton et faux chargement, chacun
 * seulement si la slide en a un (content/slides.ts), et le texte ajusté à l'écran.
 */

import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { plusGrandeEchelle } from '../../../logic/ajustement.ts';
import { t, type Lang } from '../../../logic/i18n.ts';
import { counterLabel } from '../logic/deck.ts';
import { paragraphs, type Slide as DonneesSlide } from '../logic/slides.ts';
import { adresseDeLImage } from '../images.ts';
import type { VueSlide } from '../hooks/useDiaporama.ts';
import { Chargement } from './Chargement.tsx';
import { Ligne } from './Ligne.tsx';

/* ---------- Ajustement du texte ---------- */

/** Plus petite échelle du texte : en dessous, mieux vaut raccourcir la slide. */
const MIN_FIT = 0.25;
/**
 * Marge de sécurité de l'ajustement, en pixels : une slide « tout juste » déborderait au moindre
 * écart de police ou d'arrondi (les polices système diffèrent d'un appareil à l'autre).
 */
const FIT_MARGIN_PX = 4;

/**
 * Plus grande échelle (--fit, entre MIN_FIT et 1) à laquelle le contenu tient dans la slide,
 * sans débordement en hauteur ni mot coupé en largeur (src/logic/ajustement.ts). Il faut mesurer
 * la slide à chaque essai, d'où le travail direct sur ses éléments.
 */
function ajuster(section: HTMLElement): void {
	const body = section.firstElementChild as HTMLElement;
	const style = getComputedStyle(section);
	const height = section.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
	const fits = (scale: number): boolean => {
		section.style.setProperty('--fit', String(scale));
		return body.scrollHeight <= height - FIT_MARGIN_PX && body.scrollWidth <= body.clientWidth;
	};
	if (fits(1)) return;
	section.style.setProperty('--fit', String(plusGrandeEchelle(fits, MIN_FIT, 1, 8)));
}

/* ---------- La slide ---------- */

interface Props {
	slide: DonneesSlide;
	/** Sa place dans le diaporama (0 = la première). */
	index: number;
	nombre: number;
	langue: Lang;
	/** Avant, sur ou après la slide courante : les transitions CSS font le reste. */
	place: 'before' | 'current' | 'after';
	/** Hors de la fenêtre d'affichage (components/Deck.tsx) : pas rendue du tout. */
	loin: boolean;
	vue: VueSlide;
	/** Change à chaque changement de taille d'écran ou de polices : tout est à réajuster. */
	taille: number;
	/** Numéro du chargement en cours sur cette slide, null s'il n'y en a pas. */
	lancement: number | null;
	enPause: boolean;
	onBouton: (index: number) => void;
	onChargementFini: (index: number) => void;
}

export function Slide({ slide, index, nombre, langue, place, loin, vue, taille, lancement, enPause, onBouton, onChargementFini }: Props) {
	const section = useRef<HTMLElement>(null);
	/** Une image chargée change la place du texte : la slide est à réajuster. */
	const [imagesChargees, setImagesChargees] = useState(0);

	/*
	 * Une slide est ajustée la première fois qu'elle est rendue, puis seulement quand ce qui compte
	 * change : taille d'écran ou polices, langue, bouton remplacé par le cadran, image chargée.
	 * Avant l'affichage, pour que le texte n'apparaisse jamais à la mauvaise taille.
	 */
	const ajustee = useRef('');
	const cleAjustement = `${taille}|${langue}|${vue.bouton}|${vue.chargement}|${imagesChargees}`;
	useLayoutEffect(() => {
		if (loin || !section.current || ajustee.current === cleAjustement) return;
		ajuster(section.current);
		ajustee.current = cleAjustement;
	}, [loin, cleAjustement]);

	const etiquette = t(slide.etiquette, langue);
	const titre = t(slide.titre, langue);
	const image = t(slide.image, langue);
	const grand = t(slide.grand, langue);
	const texte = t(slide.texte, langue);
	const bouton = t(slide.bouton, langue);

	return (
		<section
			ref={section}
			className={`slide ${place}${loin ? ' far' : ''}`}
			data-index={index}
			aria-roledescription="slide"
			aria-label={counterLabel(index, nombre)}
			aria-hidden={place !== 'current'}
		>
			<div className="slide-body">
				{etiquette && <p className="etiquette"><Ligne texte={etiquette} /></p>}
				{titre && <h1 className="titre"><Ligne texte={titre} /></h1>}
				{image && <img className="image" src={adresseDeLImage(image)} alt="" decoding="async" onLoad={() => setImagesChargees((n) => n + 1)} />}
				{grand && <p className="grand"><Ligne texte={grand} /></p>}
				{texte && (
					<div className="texte">
						{paragraphs(texte).map((lignes, p) => (
							<p key={p}>
								{lignes.map((ligne, n) => (
									<Fragment key={n}>
										{n > 0 && <br />}
										<Ligne texte={ligne} />
									</Fragment>
								))}
							</p>
						))}
					</div>
				)}
				{bouton && <button type="button" className="bouton" hidden={!vue.bouton} onClick={() => onBouton(index)}>{bouton}</button>}
				{slide.chargement !== undefined && (
					<Chargement
						secondes={slide.chargement}
						etapes={(slide.etapes ?? []).map((etape) => t(etape, langue) ?? '')}
						messageFin={t(slide.termine, langue)}
						// Avec un bouton, le cadran n'apparaît qu'à l'appui.
						visible={vue.chargement}
						termine={vue.termine}
						lancement={lancement}
						enPause={enPause}
						onFini={() => onChargementFini(index)}
					/>
				)}
			</div>
		</section>
	);
}
