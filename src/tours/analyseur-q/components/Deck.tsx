/*
 * Le diaporama affiché : toutes les slides, posées les unes sur les autres, la courante visible.
 *
 * Fenêtre d'affichage : seules la slide courante et ses deux voisines sont rendues (les voisines,
 * invisibles, servent aux transitions). Les autres sont en display: none (.far). Avec une routine de
 * dizaines de slides, le démarrage, les rotations d'écran et chaque changement de slide ne
 * coûtent ainsi que le prix de trois slides.
 */

import { useEffect, useState } from 'react';
import { SLIDES } from '../content/slides.ts';
import type { Lang } from '../logic/i18n.ts';
import type { Transition } from '../logic/settings.ts';
import type { Lancement, VueSlide } from '../hooks/useDiaporama.ts';
import { Slide } from './Slide.tsx';

/** Écart maximal avec la slide courante pour qu'une slide soit rendue. */
const WINDOW = 1;

interface Props {
	index: number;
	vues: readonly VueSlide[];
	lancement: Lancement | null;
	langue: Lang;
	transition: Transition;
	/** Le temps des chargements est suspendu (réglages ouverts, écran noir). */
	enPause: boolean;
	onBouton: (index: number) => void;
	onChargementFini: (index: number) => void;
}

export function Deck({ index, vues, lancement, langue, transition, enPause, onBouton, onChargementFini }: Props) {
	/*
	 * Taille d'écran ou polices changées : tout est à réajuster, les slides rendues tout de suite
	 * (components/Slide.tsx). Une fois par image au plus pendant une rotation.
	 */
	const [taille, setTaille] = useState(0);
	useEffect(() => {
		let image = 0;
		let actif = true;
		const reajuster = (): void => {
			if (actif) setTaille((n) => n + 1);
		};
		const surRedimensionnement = (): void => {
			cancelAnimationFrame(image);
			image = requestAnimationFrame(reajuster);
		};
		window.addEventListener('resize', surRedimensionnement);
		void document.fonts?.ready.then(reajuster);
		return () => {
			actif = false;
			window.removeEventListener('resize', surRedimensionnement);
			cancelAnimationFrame(image);
		};
	}, []);

	// Sans transition à l'ouverture : la première slide apparaît directement.
	const [sansAnimation, setSansAnimation] = useState(true);
	useEffect(() => {
		let image = requestAnimationFrame(() => {
			image = requestAnimationFrame(() => setSansAnimation(false));
		});
		return () => cancelAnimationFrame(image);
	}, []);

	return (
		<div id="deck" data-transition={transition} className={sansAnimation ? 'no-anim' : undefined}>
			{SLIDES.map((slide, i) => (
				<Slide
					key={i}
					slide={slide}
					index={i}
					nombre={SLIDES.length}
					langue={langue}
					place={i < index ? 'before' : i > index ? 'after' : 'current'}
					loin={Math.abs(i - index) > WINDOW}
					vue={vues[i]}
					taille={taille}
					lancement={lancement?.index === i ? lancement.n : null}
					enPause={enPause}
					onBouton={onBouton}
					onChargementFini={onChargementFini}
				/>
			))}
		</div>
	);
}
