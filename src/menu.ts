/*
 * Le menu principal, en pixel art façon console 8 bits : une tuile par tour (content/tours.ts),
 * avec son icône en pixels (content/pixels.ts). Toucher la tuile lance le tour ; l'écrou ⚙ à côté
 * ouvre ses réglages. Les deux s'affichent en plein écran (scene.ts), et le tour revient ici à la
 * fin de sa routine.
 */

import { ECROU, ICONES } from './content/pixels.ts';
import { TOURS } from './content/tours.ts';
import { BUILD } from './kit/web/build.ts';
import { $ } from './kit/web/dom.ts';
import { dessinPixel } from './pixel.ts';
import { ouvrir } from './scene.ts';
import { APP_VERSION } from './version.ts';

const liste = $('#tours');

for (const tour of TOURS) {
	const tuile = liste.appendChild(document.createElement('div'));
	tuile.className = 'tour';
	tuile.dataset.dossier = tour.dossier;

	const lancer = tuile.appendChild(document.createElement('button'));
	lancer.type = 'button';
	lancer.className = 'tour-lancer';
	// L'icône du tour, en pixel art (content/pixels.ts).
	lancer.appendChild(dessinPixel(ICONES[tour.dossier]!, 'tour-icone'));
	const texte = lancer.appendChild(document.createElement('span'));
	texte.className = 'tour-texte';
	const nom = texte.appendChild(document.createElement('span'));
	nom.className = 'tour-nom';
	nom.textContent = tour.nom;
	const description = texte.appendChild(document.createElement('span'));
	description.className = 'tour-description';
	description.textContent = tour.description;
	lancer.addEventListener('click', () => ouvrir(tour.dossier, tour.nom));

	const reglages = tuile.appendChild(document.createElement('button'));
	reglages.type = 'button';
	reglages.className = 'tour-reglages';
	reglages.setAttribute('aria-label', `Réglages : ${tour.nom}`);
	reglages.appendChild(dessinPixel(ECROU, 'ecrou'));
	reglages.addEventListener('click', () => ouvrir(tour.dossier, `Réglages : ${tour.nom}`, true));
}

$('#version').textContent = `Version ${APP_VERSION} — build ${BUILD.version} (${BUILD.commit})`;
