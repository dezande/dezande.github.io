/*
 * Le bandeau d'installation, en bas du menu principal : ouverte dans le navigateur, l'app dit
 * qu'elle est une app (une PWA) et comment l'installer. Installée — sur l'écran d'accueil, en plein
 * écran —, le bandeau ne s'affiche pas.
 *
 * Sur iPhone, l'installation passe par le menu Partager de Safari. Ailleurs, le menu ⋮ du
 * navigateur ; et quand Chrome propose lui-même l'installation (beforeinstallprompt), un bouton
 * « Installer » l'ouvre directement.
 */

import { useEffect, useState } from 'preact/hooks';
import { BoutonTactile } from '../components/BoutonTactile.tsx';
import { TEXTES } from '../content/textes.ts';
import { useLangue } from '../langue/LangueContext.tsx';

/** L'invite d'installation de Chrome (pas encore dans les types du DOM). */
interface InviteInstallation extends Event {
	prompt(): Promise<void>;
}

const MODE_APP = '(display-mode: standalone), (display-mode: fullscreen)';
const estInstallee = (): boolean => matchMedia(MODE_APP).matches || (navigator as { standalone?: boolean }).standalone === true;
// iPadOS se présente comme un Mac : un Mac tactile est un iPad.
const estIos = (): boolean => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/*
 * L'invite arrive une fois, souvent avant que le menu ne s'affiche, et doit survivre à un aller et
 * retour dans un tour : elle est gardée ici, hors du composant.
 */
let inviteEnAttente: InviteInstallation | null = null;
const ecouteurs = new Set<() => void>();
const prevenir = (): void => ecouteurs.forEach((ecouteur) => ecouteur());

window.addEventListener('beforeinstallprompt', (event) => {
	// Pas de mini-barre de Chrome : c'est le bouton du bandeau qui ouvre l'invite.
	event.preventDefault();
	inviteEnAttente = event as InviteInstallation;
	prevenir();
});

window.addEventListener('appinstalled', () => {
	inviteEnAttente = null;
	prevenir();
});

export function Installation() {
	const { langue } = useLangue();
	const [invite, setInvite] = useState(inviteEnAttente);
	const [installee, setInstallee] = useState(estInstallee);

	useEffect(() => {
		const suivre = (): void => {
			setInvite(inviteEnAttente);
			setInstallee(estInstallee());
		};
		ecouteurs.add(suivre);
		const modeApp = matchMedia(MODE_APP);
		modeApp.addEventListener('change', suivre);
		return () => {
			ecouteurs.delete(suivre);
			modeApp.removeEventListener('change', suivre);
		};
	}, []);

	const installer = (): void => {
		// L'invite ne sert qu'une fois : Chrome en renverra une autre si l'installation est refusée.
		void invite?.prompt();
		inviteEnAttente = null;
		prevenir();
	};

	const comment = invite ? TEXTES.installationDirecte : estIos() ? TEXTES.installationIphone : TEXTES.installationAutres;
	return (
		<aside id="installation" hidden={installee}>
			<p className="installation-titre">{TEXTES.installationTitre[langue]}</p>
			<p className="installation-comment">{comment[langue]}</p>
			<BoutonTactile className="installation-bouton" hidden={!invite} onAction={installer}>{TEXTES.installer[langue]}</BoutonTactile>
		</aside>
	);
}
