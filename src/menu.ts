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
	// Huit dents régulières autour du centre (12, 12) du repère, le même que celui du trou :
	// calculées, et non tracées à la main, pour que le trou tombe exactement au milieu.
	roue.setAttribute('d', 'M19.42 10.34L21.92 10.70L21.92 13.30L19.42 13.66L18.42 16.07L19.93 18.09L18.09 19.93L16.07 18.42L13.66 19.42L13.30 21.92L10.70 21.92L10.34 19.42L7.93 18.42L5.91 19.93L4.07 18.09L5.58 16.07L4.58 13.66L2.08 13.30L2.08 10.70L4.58 10.34L5.58 7.93L4.07 5.91L5.91 4.07L7.93 5.58L10.34 4.58L10.70 2.08L13.30 2.08L13.66 4.58L16.07 5.58L18.09 4.07L19.93 5.91L18.42 7.93Z');
	const centre = svg.appendChild(document.createElementNS(SVG_NS, 'circle'));
	centre.setAttribute('cx', '12');
	centre.setAttribute('cy', '12');
	centre.setAttribute('r', '3.2');
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
