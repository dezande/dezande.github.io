/*
 * La carte affichée : construction, prédiction écrite au dos, retournement et retour face cachée.
 * Les décisions sont prises par logic/piece.ts (testé sous Node) ; ce module ne fait que les montrer.
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

import { ui } from '../content/interface.ts';
import { PREDICTIONS } from '../content/predictions.ts';
import { t } from '../logic/i18n.ts';
import { apresGeste, CACHEE, enJeu, montrer, type Cote, type Etat } from '../logic/piece.ts';
import { langue, onLangChange } from '../settings/langue.ts';
import { settings } from '../settings/store.ts';
import { $ } from '../../../kit/web/dom.ts';
// Rotation calculée avant le premier ajustement du texte.
import '../../../kit/web/orientation.ts';
import { buildPiece } from './dessin-piece.ts';
import { buildDos } from './dos.ts';
import { buildSoulignement } from './ecriture.ts';

const tableEl = $('#table');
const annonceEl = $('#annonce');

/** L'état de la carte. Rien n'en est enregistré : l'app s'ouvre toujours sur la carte face cachée. */
let etat: Etat = CACHEE;
/** Minuterie du délai entre le toucher et le retournement. */
let delaiTimer = 0;

/* ---------- Construction ---------- */

const carteEl = document.createElement('article');
carteEl.className = 'carte';
carteEl.setAttribute('aria-roledescription', 'carte');

const pivot = carteEl.appendChild(document.createElement('div'));
pivot.className = 'carte-pivot';

// Le dos : un dessin SVG (stage/dos.ts), rien à lire.
const dosEl = pivot.appendChild(document.createElement('div'));
dosEl.className = 'carte-face dos';

// L'avant : la prédiction, dans un corps dont le texte s'ajuste à la carte.
const avantEl = pivot.appendChild(document.createElement('div'));
avantEl.className = 'carte-face avant';
const corps = avantEl.appendChild(document.createElement('div'));
corps.className = 'carte-corps';
/*
 * Le bloc écrit : la prédiction, son soulignement et la pièce dessinée, d'un seul tenant. Il se
 * mesure ensemble (fit), si bien que le trait suit toujours le mot et que la pièce grandit avec lui.
 */
const ecriture = corps.appendChild(document.createElement('div'));
ecriture.className = 'ecriture';

tableEl.replaceChildren(carteEl);

/** Le côté dont la prédiction est écrite au dos de la carte en ce moment. */
let coteEcrit: Cote | null = null;

/**
 * Écrit la prédiction du côté `cote` au dos de la carte, puis l'ajuste. Un retour à la ligne dans
 * le texte casse la ligne, et lui seul : une ligne n'est jamais coupée automatiquement.
 */
function ecrire(cote: Cote): void {
	coteEcrit = cote;
	const prediction = document.createElement('p');
	prediction.className = 'prediction';
	(t(PREDICTIONS[cote], langue()) ?? '').split('\n').forEach((ligne, n) => {
		if (n > 0) prediction.append(document.createElement('br'));
		prediction.append(ligne);
	});
	// Soulignée deux fois, pile comme face : un trait franc, repassé un peu plus court. Dessous,
	// la pièce de 20 centimes, du côté annoncé (stage/dessin-piece.ts).
	ecriture.replaceChildren(prediction, buildSoulignement(0), buildPiece(cote));
	carteEl.dataset.cote = cote;
	fit();
}

/* ---------- Ajustement du texte ---------- */

/** Plus petite échelle du texte : en dessous, mieux vaut raccourcir la prédiction. */
const MIN_FIT = 0.25;
/** Plus grande échelle : une borne de recherche, jamais atteinte en pratique. */
const MAX_FIT = 12;
/**
 * Marge de sécurité de l'ajustement, en pixels : une carte « tout juste » déborderait au moindre
 * écart de police ou d'arrondi.
 */
const FIT_MARGIN_PX = 4;

/**
 * Plus grande échelle (--fit, entre MIN_FIT et MAX_FIT) à laquelle le bloc écrit tient dans la
 * carte. Recherche par dichotomie. Les prédictions tiennent sur deux lignes : elles restent
 * d'aplomb, jamais en diagonale.
 */
function fit(): void {
	if (!ecriture.firstChild) return;
	const style = getComputedStyle(avantEl);
	const width = avantEl.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - FIT_MARGIN_PX;
	const height = avantEl.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - FIT_MARGIN_PX;
	const tient = (scale: number): boolean => {
		carteEl.style.setProperty('--fit', String(scale));
		return ecriture.offsetWidth <= width && ecriture.offsetHeight <= height;
	};
	let lo = MIN_FIT;
	let hi = MAX_FIT;
	for (let step = 0; step < 16; step++) {
		const mid = (lo + hi) / 2;
		if (tient(mid)) lo = mid;
		else hi = mid;
	}
	carteEl.style.setProperty('--fit', String(lo));
}

let resizeFrame = 0;
window.addEventListener('resize', () => {
	cancelAnimationFrame(resizeFrame);
	resizeFrame = requestAnimationFrame(fit);
});
/*
 * La police manuscrite n'est demandée qu'à la première prédiction écrite : sans précaution, le
 * premier tour serait mesuré avec la police de secours, et la prédiction sortirait trop petite.
 * On la charge donc dès l'ouverture, et on réajuste quand elle arrive.
 */
void document.fonts?.load('600 38px Caveat').then(fit, () => undefined);
document.fonts?.addEventListener('loadingdone', fit);

/* ---------- Affichage ---------- */

function render(): void {
	carteEl.classList.toggle('retournee', etat.phase === 'montree');
	const lang = langue();
	dosEl.setAttribute('aria-label', ui('carte.dos', lang));
	// Seule la carte retournée est à lire : armée, elle ne dit encore rien.
	avantEl.setAttribute('aria-hidden', String(etat.phase !== 'montree'));
	annonceEl.textContent = etat.phase === 'montree' ? (t(PREDICTIONS[etat.cote], lang) ?? '').replaceAll('\n', ' ') : ui('carte.dos', lang);
}

function setEtat(next: Etat): void {
	if (next === etat) return;
	const avant = etat;
	etat = next;
	if (etat.phase === 'armee' && avant.phase === 'cachee') {
		ecrire(etat.cote);
		clearTimeout(delaiTimer);
		const ms = settings.delai * 1000;
		if (ms === 0) etat = montrer(etat);
		else delaiTimer = window.setTimeout(() => setEtat(montrer(etat)), ms);
	}
	if (etat.phase === 'cachee') clearTimeout(delaiTimer);
	render();
}

/* ---------- Actions ---------- */

/**
 * Un geste sur la scène, du côté `cote`. `avantPremierTap` est l'état de la carte avant le premier
 * toucher d'un double toucher (stage/input.ts).
 */
export function geste(type: 'tap' | 'double', cote: Cote, avantPremierTap: Etat): void {
	setEtat(apresGeste(etat, type, cote, avantPremierTap));
}

/** Arme la carte sur `cote`, si elle est face cachée (clavier). */
export function armer(cote: Cote): void {
	setEtat(apresGeste(etat, 'tap', cote, etat));
}

/**
 * La carte revient face cachée (double toucher, menu, touche R). Elle se referme en tournant :
 * c'est le geste du magicien qui reprend sa carte.
 */
export function cacher(): void {
	setEtat(CACHEE);
}

export const etatCourant = (): Etat => etat;
export const tourEnCours = (): boolean => enJeu(etat);

/* ---------- Réglages d'affichage ---------- */

/** Applique les réglages en cours : dessin et couleur du dos. */
export function applyDisplaySettings(): void {
	carteEl.dataset.couleur = settings.couleur;
	if (dosEl.dataset.motif !== settings.motif) {
		dosEl.dataset.motif = settings.motif;
		dosEl.replaceChildren(buildDos(settings.motif));
	}
	render();
}

// Langue changée depuis le menu : la prédiction écrite est à réécrire.
onLangChange(() => {
	if (coteEcrit) ecrire(coteEcrit);
	render();
});

// Sans transition au démarrage : la carte apparaît directement à sa place.
tableEl.classList.add('no-anim');
applyDisplaySettings();
requestAnimationFrame(() => requestAnimationFrame(() => tableEl.classList.remove('no-anim')));
