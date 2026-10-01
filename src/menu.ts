/*
 * Le menu principal : une tuile par tour (content/tours.ts). Toucher une tuile ouvre le tour, dans
 * la même app ; le bouton « Mes tours » du menu de chaque tour ramène ici.
 */

import { TOURS } from './content/tours.ts';
import { BUILD } from './kit/web/build.ts';
import { $ } from './kit/web/dom.ts';
import { APP_VERSION } from './version.ts';

const liste = $('#tours');

for (const tour of TOURS) {
	const lien = liste.appendChild(document.createElement('a'));
	lien.className = 'tour';
	// Adresse relative à la racine du site : le tour s'ouvre dans la même app installée.
	lien.href = `${tour.dossier}/`;
	lien.dataset.dossier = tour.dossier;

	const icone = lien.appendChild(document.createElement('img'));
	icone.src = `tours/${tour.dossier}.png`;
	icone.alt = '';
	icone.width = 64;
	icone.height = 64;

	const texte = lien.appendChild(document.createElement('span'));
	texte.className = 'tour-texte';
	const nom = texte.appendChild(document.createElement('span'));
	nom.className = 'tour-nom';
	nom.textContent = tour.nom;
	const description = texte.appendChild(document.createElement('span'));
	description.className = 'tour-description';
	description.textContent = tour.description;
}

$('#version').textContent = `Version ${APP_VERSION} — build ${BUILD.version} (${BUILD.commit})`;
