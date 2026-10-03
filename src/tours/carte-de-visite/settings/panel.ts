/*
 * Panneau de réglages : formulaire, ouverture et fermeture.
 * Il s'ouvre par l'écrou ⚙ du menu principal (app.ts).
 */

import { enReglages, quitter } from '../../pont.ts';
import { keepScreenAwake } from '../../../kit/web/wake-lock.ts';
import { hideHoldRing } from '../rehearsal/hold-ring.ts';
import { setTestMode } from '../rehearsal/test-mode.ts';
import { hardReset } from '../stage/carte.ts';
import { $ } from '../system/dom.ts';
import { enPaysage } from '../system/paysage.ts';
import { NUMEROS, settings, storeSettings, ZONE_NAMES } from './store.ts';

const settingsEl = $('#settings');
const sheet = $('.sheet', settingsEl);

/** Nombre à la française, une décimale au plus (« 1,5 »). */
const fmt = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/* ---------- Champs ---------- */

// Rappel des numéros, coin par coin (lecture seule) : ils ne changent pas.
$('#routine-values').append(...NUMEROS.map((value, i) => {
	const row = document.createElement('div');
	row.className = 'value-row';
	const name = document.createElement('span');
	name.textContent = ZONE_NAMES[i] ?? '';
	const b = document.createElement('b');
	b.textContent = value;
	row.append(name, b);
	return row;
}));

/** Curseurs : réglage piloté et texte affiché à côté. */
const SLIDERS = [
	{ key: 'delay', input: $<HTMLInputElement>('#delay'), output: $<HTMLOutputElement>('#delay-out'), label: (v: number) => (v === 0 ? 'immédiat' : `${fmt(v)} s`) },
	{ key: 'fade', input: $<HTMLInputElement>('#fade'), output: $<HTMLOutputElement>('#fade-out'), label: (v: number) => `${fmt(v)} s` },
	{ key: 'brightness', input: $<HTMLInputElement>('#brightness'), output: $<HTMLOutputElement>('#brightness-out'), label: (v: number) => `${v} %` },
] as const;

/** Cases à cocher des aides à la répétition. */
const TOGGLES = [
	{ key: 'showHoldRing', input: $<HTMLInputElement>('#show-hold-ring') },
] as const;

/* ---------- Affichage ---------- */

const root = document.documentElement;

/** Répercute les réglages sur la scène : retournement, luminosité et aide à la répétition. */
export function applySettings(): void {
	root.style.setProperty('--fade', `${settings.fade}s`);
	root.style.setProperty('--dim', String((100 - settings.brightness) / 100));
	if (!settings.showHoldRing) hideHoldRing();
}

/** Remplit le panneau avec les réglages en cours. */
function renderForm(): void {
	for (const { key, input, output, label } of SLIDERS) {
		input.value = String(settings[key]);
		output.textContent = label(settings[key]);
	}
	for (const { key, input } of TOGGLES) input.checked = settings[key];
}

/** Valide, enregistre et applique les réglages après chaque modification. `null` : réglages par défaut. */
function commit(next: unknown = settings): void {
	storeSettings(next);
	applySettings();
	renderForm();
}

/* ---------- Modifications ---------- */

for (const { key, input } of SLIDERS) {
	input.addEventListener('input', () => {
		settings[key] = Number(input.value);
		commit();
	});
}

for (const { key, input } of TOGGLES) {
	input.addEventListener('change', () => {
		settings[key] = input.checked;
		commit();
	});
}

$('#defaults-btn').addEventListener('click', () => commit(null));

/* ---------- Ouverture et fermeture ---------- */

/** Ferme le clavier virtuel s'il est ouvert. */
function blurActiveElement(): void {
	if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

/** Ouvre les réglages : efface la carte et quitte le mode test. */
export function openSettings(): void {
	hideHoldRing();
	hardReset();
	setTestMode(false);
	renderForm();
	enPaysage(false);
	settingsEl.hidden = false;
	sheet.scrollTop = 0;
}

/** Ferme les réglages (ou quitte le mode test) et revient à la scène, prête pour un tour. */
function closeSettings(): void {
	blurActiveElement();
	settingsEl.hidden = true;
	setTestMode(false);
	// Ouverts par l'écrou ⚙, les réglages ramènent au menu : la scène ne pivote pas pour rien.
	if (!enReglages) enPaysage(true);
	hardReset();
	storeSettings();
	void keepScreenAwake();
	// Ouverts par l'écrou ⚙ du menu principal, les réglages fermés ramènent au menu.
	if (enReglages) quitter();
}

/** Passe des réglages au mode « Test des zones ». */
function startTest(): void {
	blurActiveElement();
	settingsEl.hidden = true;
	enPaysage(true);
	hardReset();
	setTestMode(true);
}

$('#close-btn').addEventListener('click', closeSettings);
$('#test-btn').addEventListener('click', startTest);
// Boutons de la barre du mode test.
$('#test-back').addEventListener('click', openSettings);
$('#test-quit').addEventListener('click', closeSettings);
