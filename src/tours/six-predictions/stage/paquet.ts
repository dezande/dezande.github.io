/*
 * Le paquet affiché : construction des six cartes, retournement, sortie du cadre et remise en
 * place. Les décisions sont prises par logic/paquet.ts (testé sous Node) ; ce module ne fait que
 * les montrer.
 *
 * Chaque carte est faite de deux faces dans un pivot :
 *   .carte            place la carte dans la pile (décalage selon la profondeur) et la fait sortir
 *     .carte-pivot    la retourne (rotateY), en conservant la perspective
 *       .carte-face.dos     le dos, seul visible tant que la carte n'est pas retournée
 *       .carte-face.avant   la prédiction, écrite à la main
 *
 * Toutes les cartes sont construites une fois pour toutes : la pile est petite, et une carte déjà
 * en place se retourne sans le moindre calcul de mise en page au moment où le doigt la touche.
 */

import { ui } from '../content/interface.ts';
import { CARTES } from '../content/cartes.ts';
import { t } from '../logic/i18n.ts';
import { crans, nouveauSemis, type Cran } from '../logic/etalement.ts';
import { allerA, apresToucher, compteurLabel, DEPART, estVide, remettre, type Etat } from '../logic/paquet.ts';
import { dessinDeCarte, teinteDeCarte, type Couleur, type Motif } from '../logic/settings.ts';
import { langue, onLangChange } from '../settings/langue.ts';
import { settings } from '../settings/store.ts';
import { $ } from '../../../kit/web/dom.ts';
// Rotation calculée avant le premier ajustement du texte.
import '../../../kit/web/orientation.ts';
import { buildDos } from './dos.ts';
import { buildSoulignement } from './ecriture.ts';

const paquetEl = $('#paquet');
const annonceEl = $('#annonce');

export const carteCount = CARTES.length;

/*
 * Le paquet en cours. Rien n'en est enregistré : l'app s'ouvre toujours sur les six cartes, faces
 * en bas, prête à jouer — même si la routine précédente a été laissée en plan.
 */
let etat: Etat = DEPART;

/*
 * L'étalement du paquet : les écarts, tirés au sort, d'une carte à la suivante. Il est neuf à
 * chaque ouverture comme à chaque remise du paquet, si bien que deux représentations ne commencent
 * jamais sur le même étalement.
 */
let etalement: Cran[] = crans(nouveauSemis(), carteCount);

function nouvelEtalement(): void {
	etalement = crans(nouveauSemis(), carteCount);
	placer();
}

/* ---------- Construction ---------- */

function buildCarte(index: number): HTMLElement {
	const lang = langue();
	const carte = CARTES[index]!;
	const el = document.createElement('article');
	el.className = 'carte';
	el.dataset.index = String(index);
	el.setAttribute('aria-roledescription', 'carte');

	const pivot = el.appendChild(document.createElement('div'));
	pivot.className = 'carte-pivot';

	// Le dos : un dessin SVG (stage/dos.ts), rien à lire.
	const dos = pivot.appendChild(document.createElement('div'));
	dos.className = 'carte-face dos';
	dos.setAttribute('aria-label', ui('carte.dos', lang));
	dos.appendChild(buildDos(dessinDeCarte(settings.motif, index)));

	// L'avant : la prédiction, dans un corps dont le texte s'ajuste à la carte.
	const avant = pivot.appendChild(document.createElement('div'));
	avant.className = 'carte-face avant';
	const corps = avant.appendChild(document.createElement('div'));
	corps.className = 'carte-corps';
	const entete = t(carte.entete, lang);
	if (entete) {
		const p = corps.appendChild(document.createElement('p'));
		p.className = 'entete';
		p.textContent = entete;
	}
	/*
	 * Le bloc écrit : la prédiction et son soulignement, d'un seul tenant. Il se mesure et pivote
	 * ensemble (stage/paquet.ts : fit), si bien que le trait suit toujours le mot.
	 */
	const ecriture = corps.appendChild(document.createElement('div'));
	ecriture.className = 'ecriture';
	const prediction = ecriture.appendChild(document.createElement('p'));
	prediction.className = 'prediction';
	// Un retour à la ligne dans le texte casse la ligne, et lui seul : une ligne n'est jamais
	// coupée automatiquement (styles/_cartes.scss), pour que l'auteur décide de la mise en page.
	(t(carte.texte, lang) ?? '').split('\n').forEach((ligne, n) => {
		if (n > 0) prediction.append(document.createElement('br'));
		prediction.append(ligne);
	});
	ecriture.appendChild(buildSoulignement(index));
	return el;
}

/** Les cartes construites, de la première (dessus du paquet) à la dernière. */
let carteEls: HTMLElement[] = [];

/**
 * Pose chaque carte à sa place dans l'étalement. Cette place est celle de la carte, pas celle de
 * son rang dans la pile : quand la carte du dessus s'envole, les autres ne bougent pas d'un pouce.
 * Elle ne change donc qu'à la remise du paquet, qui en tire un nouvel étalement.
 */
function placer(): void {
	carteEls.forEach((el, i) => {
		const cran = etalement[i]!;
		el.style.setProperty('--dy', String(cran.dy));
		el.style.setProperty('--dx', String(cran.dx));
		el.style.setProperty('--rot', String(cran.rot));
		// L'ordre d'empilement suit le paquet, et lui seul : la première carte par-dessus toutes.
		el.style.setProperty('--rang', String(i));
	});
}

/** (Re)construit toutes les cartes dans la langue en cours, sans changer l'état du paquet. */
function buildAll(): void {
	carteEls = CARTES.map((_, index) => buildCarte(index));
	// La dernière carte du paquet est au fond : la première du tableau doit être la dernière
	// posée pour passer par-dessus, l'ordre d'empilement étant aussi réglé par z-index.
	paquetEl.replaceChildren(...carteEls);
	fitted.clear();
	placer();
	// Les cartes sont neuves : dessin et couleur des dos sont à reposer.
	motifPose = null;
	couleurPosee = null;
	applyDisplaySettings();
}

// Langue changée depuis le menu : tout le texte des cartes est à refaire.
onLangChange(buildAll);

/* ---------- Ajustement du texte ---------- */

/** Plus petite échelle du texte : en dessous, mieux vaut raccourcir la prédiction. */
const MIN_FIT = 0.25;
/**
 * Plus grande échelle du texte. La prédiction ne fait pas que rétrécir quand elle est longue :
 * elle grandit jusqu'à remplir la carte quand elle est courte — « NO! » doit frapper plein cadre,
 * pas flotter au milieu. Ce plafond n'est qu'une borne de recherche, jamais atteinte en pratique.
 */
const MAX_FIT = 12;
/**
 * Marge de sécurité de l'ajustement, en pixels : une carte « tout juste » déborderait au moindre
 * écart de police ou d'arrondi (les polices manuscrites diffèrent d'un appareil à l'autre).
 */
const FIT_MARGIN_PX = 4;

/**
 * Gain minimal pour qu'une prédiction soit écrite en diagonale plutôt qu'à l'horizontale. En
 * dessous, la carte penche pour rien : un mot court tient déjà pleine largeur, et l'incliner ne
 * ferait que le rendre plus difficile à lire.
 */
const GAIN_DIAGONALE = 1.12;

/**
 * Plus grande échelle (--fit, entre MIN_FIT et MAX_FIT) à laquelle le bloc écrit tient dans la
 * carte, et l'angle auquel il l'atteint. Recherche par dichotomie : la plage est large (une
 * prédiction d'un mot grandit beaucoup, une longue rétrécit), d'où le nombre de passes.
 *
 * Deux sens sont essayés : à plat, et le long de la diagonale de la carte. **Les mots les plus
 * longs gagnent à être écrits en biais** — la diagonale d'une carte est bien plus longue que sa
 * largeur — et remplissent alors la carte d'un coin à l'autre. Un mot court reste à plat.
 *
 * Le bloc est mesuré sans sa rotation (`offsetWidth`, que les transformations ne changent pas),
 * et son encombrement une fois penché est calculé : la mesure ne dépend donc ni de l'inclinaison
 * de la carte dans le paquet, ni de sa réduction au fond de la pile.
 */
function fit(el: HTMLElement): void {
	const avant = el.querySelector<HTMLElement>('.avant')!;
	const ecriture = el.querySelector<HTMLElement>('.ecriture')!;
	const style = getComputedStyle(avant);
	const width = avant.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - FIT_MARGIN_PX;
	const height = avant.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - FIT_MARGIN_PX;
	// La diagonale de la place disponible, du coin bas-gauche au coin haut-droit.
	const diagonale = -Math.atan(height / width) * (180 / Math.PI);

	/** Le bloc écrit tient-il, à cette échelle et à cet angle ? */
	const tient = (scale: number, angle: number): boolean => {
		el.style.setProperty('--fit', String(scale));
		const [w, h] = [ecriture.offsetWidth, ecriture.offsetHeight];
		const rad = (angle * Math.PI) / 180;
		const [c, s] = [Math.abs(Math.cos(rad)), Math.abs(Math.sin(rad))];
		return w * c + h * s <= width && w * s + h * c <= height;
	};

	/** Plus grande échelle qui tienne à cet angle. */
	const cherche = (angle: number): number => {
		let lo = MIN_FIT;
		let hi = MAX_FIT;
		for (let step = 0; step < 16; step++) {
			const mid = (lo + hi) / 2;
			if (tient(mid, angle)) lo = mid;
			else hi = mid;
		}
		return lo;
	};

	const plat = cherche(0);
	// Une prédiction sur plusieurs lignes reste d'aplomb : un pavé de texte en biais ne se lit plus.
	const enBiais = el.querySelector('.prediction br') === null ? cherche(diagonale) : 0;
	const biais = enBiais >= plat * GAIN_DIAGONALE;
	el.style.setProperty('--fit', String(biais ? enBiais : plat));
	el.style.setProperty('--angle', biais ? `${diagonale.toFixed(2)}deg` : '0deg');
}

/** Cartes ajustées à la taille d'écran actuelle. */
const fitted = new Set<HTMLElement>();

function ensureFit(el: HTMLElement): void {
	if (fitted.has(el)) return;
	fit(el);
	fitted.add(el);
}

/** Taille d'écran ou polices changées : tout est à réajuster. */
function refit(): void {
	fitted.clear();
	for (const el of carteEls) ensureFit(el);
}

let resizeFrame = 0;
window.addEventListener('resize', () => {
	cancelAnimationFrame(resizeFrame);
	resizeFrame = requestAnimationFrame(refit);
});
void document.fonts?.ready.then(refit);

/* ---------- Affichage ---------- */

/**
 * Place chaque carte d'après l'état du paquet : sortie du cadre, sur le dessus (retournée ou non)
 * ou dessous, à sa profondeur. Les transitions CSS font le reste (styles/_cartes.scss).
 */
function render(): void {
	const vide = estVide(etat, carteCount);
	for (let i = 0; i < carteCount; i++) {
		const el = carteEls[i]!;
		// Négative : la carte est déjà sortie. 0 : c'est celle du dessus. Positive : elle attend dessous.
		const profondeur = i - etat.index;
		el.classList.toggle('sortie', profondeur < 0);
		el.classList.toggle('dessus', profondeur === 0);
		el.classList.toggle('dessous', profondeur > 0);
		// Une carte sortie garde sa face visible : elle s'envole prédiction en l'air, jamais
		// en se refermant au passage.
		el.classList.toggle('retournee', profondeur < 0 || (profondeur === 0 && etat.retournee));
		// Seule la carte retournée est à lire : le dos et les cartes sorties ne disent rien.
		el.setAttribute('aria-hidden', String(profondeur !== 0 || !etat.retournee));
		ensureFit(el);
	}
	paquetEl.classList.toggle('vide', vide);
	const lang = langue();
	annonceEl.textContent = vide ? ui('carte.vide', lang)
		: etat.retournee ? (t(CARTES[etat.index]?.texte, lang) ?? '')
		: `${ui('carte.dos', lang)} ${compteurLabel(etat, carteCount)}`;
}

/* ---------- Actions ---------- */

/**
 * Délai pendant lequel un nouveau toucher est ignoré, le temps qu'une carte finisse de se
 * retourner ou de sortir. Sans lui, deux touchers un peu vifs feraient sortir une prédiction
 * avant que le public l'ait vue. Il ne s'applique pas au paquet vide, où le double toucher
 * doit rester possible.
 */
const ACTION_GUARD_MS = 260;
let prochainToucherA = 0;

function setEtat(next: Etat): void {
	if (next.index === etat.index && next.retournee === etat.retournee) return;
	etat = next;
	render();
}

/**
 * Fait le changement sans animation : le paquet se retrouve directement dans sa nouvelle position.
 * Remettre le paquet ou sauter à une carte ne sont pas des gestes de la routine — les faire jouer
 * à l'envers (cartes qui reviennent en volant, prédictions qui se referment) n'aurait aucun sens.
 */
function sansAnimation(changer: () => void): void {
	paquetEl.classList.add('no-anim');
	changer();
	// Les transitions reprennent une fois la nouvelle position peinte.
	requestAnimationFrame(() => requestAnimationFrame(() => paquetEl.classList.remove('no-anim')));
}

/** Un toucher sur la scène : la carte du dessus se retourne, puis sort du cadre. */
export function toucher(): void {
	if (estVide(etat, carteCount)) return;
	const now = performance.now();
	if (now < prochainToucherA) return;
	prochainToucherA = now + ACTION_GUARD_MS;
	setEtat(apresToucher(etat, carteCount));
}

/**
 * Le paquet revient au complet, faces en bas (double toucher sur l'écran vide, menu, touche R),
 * et retombe dans un nouvel étalement : deux représentations ne commencent jamais sur le même
 * paquet. Le rendu est refait même si le paquet était déjà neuf, pour que le nouvel étalement se
 * voie tout de suite.
 */
export function remettrePaquet(): void {
	prochainToucherA = 0;
	sansAnimation(() => {
		nouvelEtalement();
		etat = remettre();
		render();
	});
}

/** Va à la carte `index`, dos visible : « aller à la carte » du menu. L'étalement ne change pas. */
export function allerACarte(index: number): void {
	prochainToucherA = 0;
	sansAnimation(() => setEtat(allerA(index, carteCount)));
}

export const etatCourant = (): Etat => etat;

/* ---------- Réglages d'affichage ---------- */

/** Motif dessiné sur les dos actuellement en place, pour ne les refaire qu'au vrai changement. */
let motifPose: Motif | null = null;
/** Couleur posée sur les dos, de même. */
let couleurPosee: Couleur | null = null;

/**
 * Applique les réglages en cours : dessin et couleur du dos des cartes. Avec « mix », chaque carte
 * a le sien (logic/settings.ts) — c'est pourquoi le dessin se refait carte par carte.
 */
export function applyDisplaySettings(): void {
	if (couleurPosee !== settings.couleur) {
		couleurPosee = settings.couleur;
		carteEls.forEach((el, i) => {
			el.dataset.couleur = teinteDeCarte(settings.couleur, i);
		});
	}
	if (motifPose !== settings.motif) {
		motifPose = settings.motif;
		carteEls.forEach((el, i) => {
			el.querySelector('.dos')!.replaceChildren(buildDos(dessinDeCarte(settings.motif, i)));
		});
	}
	render();
}

// Sans transition au démarrage : le paquet repris apparaît directement à sa place.
paquetEl.classList.add('no-anim');
buildAll();
requestAnimationFrame(() => requestAnimationFrame(() => paquetEl.classList.remove('no-anim')));
