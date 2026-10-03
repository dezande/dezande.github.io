/*
 * Le menu principal : une tuile par tour (content/tours.ts). Toucher la tuile lance le tour ;
 * l'écrou ⚙ à côté ouvre ses réglages. Les deux s'affichent en plein écran (scene.ts), et le tour
 * revient ici à la fin de sa routine.
 */

import { TOURS } from './content/tours.ts';
import { BUILD } from './kit/web/build.ts';
import { $ } from './kit/web/dom.ts';
import { ouvrir } from './scene.ts';
import { APP_VERSION } from './version.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** L'écrou des réglages : une roue dentée tracée en SVG, de la couleur du texte. */
function ecrou(): SVGSVGElement {
	const svg = document.createElementNS(SVG_NS, 'svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('aria-hidden', 'true');
	const roue = svg.appendChild(document.createElementNS(SVG_NS, 'path'));
	roue.setAttribute('fill', 'none');
	roue.setAttribute('stroke', 'currentColor');
	roue.setAttribute('stroke-width', '1.8');
	roue.setAttribute('stroke-linejoin', 'round');
	roue.setAttribute('d', 'M10.3 2.6h3.4l.5 2.6 1.6.9 2.5-.9 1.7 2.9-2 1.7v1.9l2 1.7-1.7 2.9-2.5-.9-1.6.9-.5 2.6h-3.4l-.5-2.6-1.6-.9-2.5.9-1.7-2.9 2-1.7v-1.9l-2-1.7 1.7-2.9 2.5.9 1.6-.9z');
	const centre = svg.appendChild(document.createElementNS(SVG_NS, 'circle'));
	centre.setAttribute('cx', '12');
	centre.setAttribute('cy', '12');
	centre.setAttribute('r', '3');
	centre.setAttribute('fill', 'none');
	centre.setAttribute('stroke', 'currentColor');
	centre.setAttribute('stroke-width', '1.8');
	return svg;
}

const liste = $('#tours');

for (const tour of TOURS) {
	const tuile = liste.appendChild(document.createElement('div'));
	tuile.className = 'tour';
	tuile.dataset.dossier = tour.dossier;

	const lancer = tuile.appendChild(document.createElement('button'));
	lancer.type = 'button';
	lancer.className = 'tour-lancer';
	const icone = lancer.appendChild(document.createElement('img'));
	icone.src = `tours/${tour.dossier}.png`;
	icone.alt = '';
	icone.width = 64;
	icone.height = 64;
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
	reglages.appendChild(ecrou());
	reglages.addEventListener('click', () => ouvrir(tour.dossier, `Réglages : ${tour.nom}`, true));
}

$('#version').textContent = `Version ${APP_VERSION} — build ${BUILD.version} (${BUILD.commit})`;
