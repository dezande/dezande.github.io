/*
 * Le bandeau d'installation, en bas du menu principal : ouverte dans le navigateur, l'app dit
 * qu'elle est une app (une PWA) et comment l'installer. Installée — sur l'écran d'accueil, en plein
 * écran —, le bandeau ne s'affiche pas.
 *
 * Sur iPhone, l'installation passe par le menu Partager de Safari. Ailleurs, le menu ⋮ du
 * navigateur ; et quand Chrome propose lui-même l'installation (beforeinstallprompt), un bouton
 * « Installer » l'ouvre directement.
 */

import { TEXTES } from './content/textes.ts';
import { $ } from './kit/web/dom.ts';
import { langue, onLangue } from './langue.ts';
import { surToucher } from './toucher.ts';

/** L'invite d'installation de Chrome (pas encore dans les types du DOM). */
interface InviteInstallation extends Event {
	prompt(): Promise<void>;
}

const bandeau = $('#installation');
const bouton = $<HTMLButtonElement>('.installation-bouton', bandeau);

const modeApp = matchMedia('(display-mode: standalone), (display-mode: fullscreen)');
const estInstallee = (): boolean => modeApp.matches || (navigator as { standalone?: boolean }).standalone === true;
// iPadOS se présente comme un Mac : un Mac tactile est un iPad.
const estIos = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let invite: InviteInstallation | null = null;

function afficher(): void {
	const lang = langue();
	bandeau.hidden = estInstallee();
	$('.installation-titre', bandeau).textContent = TEXTES.installationTitre[lang];
	$('.installation-comment', bandeau).textContent = (invite ? TEXTES.installationDirecte : estIos ? TEXTES.installationIphone : TEXTES.installationAutres)[lang];
	bouton.textContent = TEXTES.installer[lang];
	bouton.hidden = !invite;
}

window.addEventListener('beforeinstallprompt', (event) => {
	// Pas de mini-barre de Chrome : c'est le bouton du bandeau qui ouvre l'invite.
	event.preventDefault();
	invite = event as InviteInstallation;
	afficher();
});

window.addEventListener('appinstalled', () => {
	invite = null;
	afficher();
});

surToucher(bouton, () => {
	// L'invite ne sert qu'une fois : Chrome en renverra une autre si l'installation est refusée.
	void invite?.prompt();
	invite = null;
	afficher();
});

modeApp.addEventListener('change', afficher);
onLangue(afficher);
afficher();
