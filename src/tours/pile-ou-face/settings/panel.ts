/*
 * Menu, ouvert par un appui de 3 s (ou Échap / M au clavier) :
 * remettre la carte face cachée, délai, langue, dos de la carte, état de l'écran et version.
 */

import { ui, type CleInterface } from '../content/interface.ts';
import { BUILD } from '../../../kit/web/build.ts';
import { $ } from '../../../kit/web/dom.ts';
import { requestPersistentStorage, type StorageState } from '../../../kit/web/storage.ts';
import { appCacheNames } from '../../../kit/web/updates.ts';
import { onWakeChange, type WakeState } from '../../../kit/web/wake-lock.ts';
import { LANGS } from '../logic/i18n.ts';
import { DESSINS, TEINTES, type Dessin, type Settings, type Teinte } from '../logic/settings.ts';
import { buildDos } from '../stage/dos.ts';
import { enReglages, quitter } from '../../pont.ts';
import { applyDisplaySettings, cacher } from '../stage/carte.ts';
import { APP_VERSION } from '../version.ts';
import { langue, onLangChange, setLangue } from './langue.ts';
import { settings, storeSettings } from './store.ts';

const menu = $('#menu');

export const isMenuOpen = (): boolean => !menu.hidden;

/* ---------- Choix en segments (langue) ---------- */

/**
 * Boutons d'un réglage à plusieurs valeurs. `libelle` donne le texte d'une valeur dans la langue
 * en cours ; la valeur enregistrée, elle, ne change jamais avec la langue (logic/settings.ts).
 */
function buildSegment(selector: string, valeurs: readonly string[], libelle: (valeur: string) => string, onPick: (valeur: string) => void): void {
	const seg = $(selector);
	seg.replaceChildren();
	for (const valeur of valeurs) {
		const button = seg.appendChild(document.createElement('button'));
		button.type = 'button';
		button.setAttribute('role', 'radio');
		button.dataset.valeur = valeur;
		button.textContent = libelle(valeur);
		button.addEventListener('click', () => onPick(valeur));
	}
}

// Les langues se nomment elles-mêmes : « FR » et « EN », quelle que soit la langue affichée.
const buildLangues = (): void =>
	buildSegment('#langue-seg', LANGS, (valeur) => valeur.toUpperCase(), (valeur) => setLangue(valeur as (typeof LANGS)[number]));
buildLangues();

/* ---------- Choix du dos : on regarde la carte, on ne lit pas les noms ---------- */

/**
 * Une petite carte, face cachée, dans le dessin et la couleur demandés : c'est ce qu'on regarde
 * pour choisir, plutôt qu'un nom de style. Le nom reste en étiquette pour les lecteurs d'écran.
 */
function vignette(dessin: Dessin, teinte: Teinte): HTMLElement {
	const dos = document.createElement('span');
	dos.className = 'vignette';
	dos.dataset.couleur = teinte;
	dos.appendChild(buildDos(dessin));
	return dos;
}

/**
 * Une rangée de boutons illustrés. Chaque bouton porte son aperçu et le nom de la valeur en
 * étiquette. Les aperçus du dos sont dessinés dans la couleur en cours, et ceux de la couleur
 * dans le dos en cours : le menu montre donc toujours la carte telle qu'elle sera.
 */
function buildChoix(selector: string, valeurs: readonly string[], cle: string, apercu: (valeur: string) => HTMLElement, onPick: (valeur: string) => void): void {
	const lang = langue();
	const boite = $(selector);
	boite.replaceChildren();
	for (const valeur of valeurs) {
		const button = boite.appendChild(document.createElement('button'));
		button.type = 'button';
		button.setAttribute('role', 'radio');
		button.dataset.valeur = valeur;
		button.setAttribute('aria-label', ui(`${cle}.${valeur}` as CleInterface, lang));
		button.appendChild(apercu(valeur));
		button.addEventListener('click', () => onPick(valeur));
	}
}

function buildDosChoix(): void {
	buildChoix('#motif-choix', DESSINS, 'motif', (valeur) => vignette(valeur as Dessin, settings.couleur), (valeur) => update({ motif: valeur as Dessin }));
	buildChoix('#couleur-choix', TEINTES, 'couleur', (valeur) => vignette(settings.motif, valeur as Teinte), (valeur) => update({ couleur: valeur as Teinte }));
}
buildDosChoix();

/* ---------- Affichage du menu ---------- */

/** Recopie les réglages et l'état en cours dans le menu. */
function refresh(): void {
	$<HTMLInputElement>('#show-hold-ring').checked = settings.showHoldRing;
	$<HTMLInputElement>('#delai').value = String(settings.delai);
	showDelai();
	for (const button of $('#langue-seg').querySelectorAll<HTMLButtonElement>('button')) {
		button.setAttribute('aria-checked', String(button.dataset.valeur === settings.langue));
	}
	for (const button of $('#motif-choix').querySelectorAll<HTMLButtonElement>('button')) {
		button.setAttribute('aria-checked', String(button.dataset.valeur === settings.motif));
	}
	for (const button of $('#couleur-choix').querySelectorAll<HTMLButtonElement>('button')) {
		button.setAttribute('aria-checked', String(button.dataset.valeur === settings.couleur));
	}
	const lang = langue();
	$('#menu-version').textContent = `${ui('menu.version', lang)} ${APP_VERSION}`;
	// En bas du menu, le détail exact de ce qui est installé : numéro de build et commit.
	$('#about-version').textContent = `${APP_VERSION} — build ${BUILD.version} (${BUILD.commit})`;
	void showCache();
	void requestPersistentStorage().then((state) => {
		$('#about-storage').textContent = ui(STORAGE_TEXTS[state], langue());
	});
	const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as { standalone?: boolean }).standalone === true;
	$('#about-display').textContent = ui(standalone ? 'etat.installee' : 'etat.navigateur', lang);
}

/** État du stockage persistant (kit/web/storage.ts) → texte du menu. */
const STORAGE_TEXTS: Record<StorageState, CleInterface> = {
	'persistant': 'etat.persistant',
	'non garanti': 'etat.nonGaranti',
	'inconnu': 'etat.inconnu',
};

/**
 * Nom du cache hors-ligne (pile-ou-face-<empreinte>). L'empreinte change à chaque nouvelle
 * version : c'est ce qui fait retélécharger l'app aux téléphones où elle est installée.
 */
async function showCache(): Promise<void> {
	const names = await appCacheNames('pile-ou-face');
	$('#about-cache').textContent = names.length === 0 ? ui('etat.cacheInactif', langue()) : names.join(', ');
}

/*
 * État du maintien de l'écran allumé (kit/web/wake-lock.ts donne l'état, le texte est traduit ici
 * plutôt que repris du kit, qui ne parle que français).
 */
let lastWake: WakeState = { lock: false, video: false };

function showWake(state: WakeState): void {
	const lang = langue();
	lastWake = state;
	const active = state.lock || state.video;
	$('#wake-dot').className = `dot ${state.lock ? 'lock' : state.video ? 'video' : 'off'}`;
	$('#wake-text').textContent = ui(active ? 'ecran.actif' : 'ecran.inactif', lang);
	const detail: CleInterface = state.lock && state.video ? 'ecran.lockVideo' : state.lock ? 'ecran.lock' : state.video ? 'ecran.video' : 'ecran.rien';
	$('#wake-detail').textContent = ui(detail, lang);
}

onWakeChange(showWake);

/**
 * Clics ignorés dans le menu jusqu'à cet instant (performance.now()). Le doigt de l'appui long
 * se relève sur le menu qui vient d'apparaître : sans ça, il « cliquerait » sur le bouton
 * placé dessous (remettre la carte, cocher une option) et refermerait le menu.
 */
let ignoreClicksUntil = 0;
/** Délai après le relâchement de l'appui long, pour le clic que le navigateur envoie ensuite. */
const CLICK_GUARD_MS = 400;

menu.addEventListener('click', (event) => {
	if (performance.now() >= ignoreClicksUntil) return;
	event.preventDefault();
	event.stopPropagation();
}, true);

/** Ouvre le menu. `byHold` : ouvert par l'appui long, doigt encore posé (voir holdReleased). */
export function openMenu(byHold = false): void {
	if (byHold) ignoreClicksUntil = Infinity;
	refresh();
	menu.hidden = false;
}

/** Le doigt de l'appui long s'est relevé : les clics seront de nouveau acceptés dans un instant. */
export function holdReleased(): void {
	if (ignoreClicksUntil === Infinity) ignoreClicksUntil = performance.now() + CLICK_GUARD_MS;
}

export function closeMenu(): void {
	menu.hidden = true;
	// Ouverts par l'écrou ⚙ du menu principal, les réglages fermés ramènent au menu.
	if (enReglages) quitter();
}

/* ---------- Réglages ---------- */

/** Enregistre les réglages (null : réglages par défaut), les applique et met le menu à jour. */
function save(next: Settings | null): void {
	storeSettings(next);
	applyDisplaySettings();
	// Les aperçus du menu montrent la carte telle qu'elle est : ils suivent les deux réglages.
	buildDosChoix();
	refresh();
}

const update = (change: Partial<Settings>): void => save({ ...settings, ...change });

/** Le délai, écrit à côté du curseur : « 0 s » veut dire que la carte se retourne au toucher. */
function showDelai(): void {
	$('#delai-valeur').textContent = `${String(settings.delai).replace('.', langue() === 'fr' ? ',' : '.')} s`;
}

$<HTMLInputElement>('#delai').addEventListener('input', (event) => {
	update({ delai: Number((event.target as HTMLInputElement).value) });
});

$<HTMLInputElement>('#show-hold-ring').addEventListener('change', (event) => {
	update({ showHoldRing: (event.target as HTMLInputElement).checked });
});

// Langue changée depuis le menu : le menu porte du texte construit ici.
onLangChange(() => {
	buildLangues();
	buildDosChoix();
	showWake(lastWake);
	if (isMenuOpen()) refresh();
});

$('#reset-btn').addEventListener('click', () => {
	cacher();
	closeMenu();
});
$('#close-btn').addEventListener('click', closeMenu);
$('#defaults-btn').addEventListener('click', () => save(null));
