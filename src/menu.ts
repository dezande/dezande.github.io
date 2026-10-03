/*
 * Le menu principal, en pixel art façon console 8 bits : une tuile par tour (content/tours.ts),
 * avec son icône en pixels (content/pixels.ts). Toucher la tuile lance le tour ; l'écrou ⚙ à côté
 * ouvre ses réglages. Les deux s'affichent en plein écran (scene.ts), et le tour revient ici à la
 * fin de sa routine.
 *
 * Le bouton FR / EN choisit la langue du menu et de tous les tours (langue.ts) : le menu se
 * reconstruit aussitôt, et chaque tour l'ouvre dans cette langue.
 */

import { ECROU, ICONES } from './content/pixels.ts';
import { LANGUES, TEXTES } from './content/textes.ts';
import { TOURS } from './content/tours.ts';
import { BUILD } from './kit/web/build.ts';
import { $ } from './kit/web/dom.ts';
import { langue, onLangue, setLangue } from './langue.ts';
import { dessinPixel } from './pixel.ts';
import { ouvrir } from './scene.ts';
import { APP_VERSION } from './version.ts';

const liste = $('#tours');
const choixLangue = $('#langues');

/* ---------- Bouton FR / EN ---------- */

for (const choix of LANGUES) {
	const bouton = choixLangue.appendChild(document.createElement('button'));
	bouton.type = 'button';
	bouton.setAttribute('role', 'radio');
	bouton.dataset.langue = choix;
	bouton.textContent = choix.toUpperCase();
	bouton.addEventListener('click', () => setLangue(choix));
}

/* ---------- Les tuiles ---------- */

function construire(): void {
	const lang = langue();
	$('.invite').textContent = TEXTES.invite[lang];
	choixLangue.setAttribute('aria-label', TEXTES.langue[lang]);
	liste.setAttribute('aria-label', TEXTES.tours[lang]);
	for (const bouton of choixLangue.querySelectorAll<HTMLButtonElement>('button')) {
		bouton.setAttribute('aria-checked', String(bouton.dataset.langue === lang));
	}

	liste.replaceChildren();
	for (const tour of TOURS) {
		const nomDuTour = tour.nom[lang];
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
		nom.textContent = nomDuTour;
		const description = texte.appendChild(document.createElement('span'));
		description.className = 'tour-description';
		description.textContent = tour.description[lang];
		lancer.addEventListener('click', () => ouvrir(tour.dossier, nomDuTour, lang));

		const reglages = tuile.appendChild(document.createElement('button'));
		reglages.type = 'button';
		reglages.className = 'tour-reglages';
		const titreReglages = `${TEXTES.reglagesDe[lang]}${nomDuTour}`;
		reglages.setAttribute('aria-label', titreReglages);
		reglages.appendChild(dessinPixel(ECROU, 'ecrou'));
		reglages.addEventListener('click', () => ouvrir(tour.dossier, titreReglages, lang, true));
	}

	$('#version').textContent = `${TEXTES.version[lang]} ${APP_VERSION} — build ${BUILD.version} (${BUILD.commit})`;
}

construire();
onLangue(construire);
