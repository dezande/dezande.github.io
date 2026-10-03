/*
 * Le menu principal, en pixel art façon console 16 bits : une fenêtre par tour (content/tours.ts),
 * avec son icône en pixels (content/pixels.ts), et la main des jeux de rôle qui montre la tuile
 * touchée. Toucher la tuile lance le tour ; l'écrou ⚙ à côté ouvre ses réglages. Les boutons
 * agissent au lever du doigt, appui bref ou long (BoutonTactile).
 *
 * Le bouton FR / EN choisit la langue du menu et de tous les tours (langue/LangueContext.tsx).
 */

import { BoutonTactile } from '../components/BoutonTactile.tsx';
import { PixelArt } from '../components/PixelArt.tsx';
import { ECROU, ICONES, MAIN } from '../content/pixels.ts';
import { TEXTES } from '../content/textes.ts';
import { LANGS } from '../logic/i18n.ts';
import { TOURS } from '../content/tours.ts';
import { BUILD } from '../kit/web/build.ts';
import { useLangue } from '../langue/LangueContext.tsx';
import { adresseDuTour } from '../logic/adresses.ts';
import { naviguer } from '../routeur.ts';
import { Installation } from './Installation.tsx';
import { APP_VERSION } from '../version.ts';

/** Le build et le commit, inscrits au build par le kit ; en développement (npm run dev), rien d'inscrit. */
const DETAIL_DU_BUILD = BUILD.version.startsWith('__') ? 'développement' : `build ${BUILD.version} (${BUILD.commit})`;

export function Menu() {
	const { langue, setLangue } = useLangue();

	return (
		<main id="menu-principal">
			<h1>Mes tours</h1>

			{/* La langue du menu et de tous les tours. */}
			<div id="langues" role="radiogroup" aria-label={TEXTES.langue[langue]}>
				{LANGS.map((choix) => (
					<BoutonTactile key={choix} role="radio" data-langue={choix} aria-checked={choix === langue} onAction={() => setLangue(choix)}>
						{choix.toUpperCase()}
					</BoutonTactile>
				))}
			</div>

			{/* Clignote comme l'écran titre d'un jeu ; masqué pour les lecteurs d'écran. */}
			<p className="invite" aria-hidden="true">{TEXTES.invite[langue]}</p>

			<nav id="tours" aria-label={TEXTES.tours[langue]}>
				{TOURS.map((tour) => {
					const nom = tour.nom[langue];
					return (
						<div key={tour.dossier} className="tour" data-dossier={tour.dossier}>
							<BoutonTactile className="tour-lancer" onAction={() => naviguer(adresseDuTour(tour.dossier))}>
								{/* La main qui montre la tuile, le temps du toucher ; puis l'icône du tour. */}
								<PixelArt grille={MAIN} className="main" />
								<PixelArt grille={ICONES[tour.dossier]!} className="tour-icone" />
								<span className="tour-texte">
									<span className="tour-nom">{nom}</span>
									<span className="tour-description">{tour.description[langue]}</span>
								</span>
							</BoutonTactile>
							<BoutonTactile className="tour-reglages" aria-label={`${TEXTES.reglagesDe[langue]}${nom}`} onAction={() => naviguer(adresseDuTour(tour.dossier, true))}>
								<PixelArt grille={ECROU} className="ecrou" />
							</BoutonTactile>
						</div>
					);
				})}
			</nav>

			{/* Ouverte dans le navigateur, et non installée : dire que c'est une app. */}
			<Installation />

			<p id="version">{`${TEXTES.version[langue]} ${APP_VERSION} — ${DETAIL_DU_BUILD}`}</p>
		</main>
	);
}
