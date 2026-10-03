// Tests dans Chrome pour Android, sur un émulateur (ou un téléphone) branché à adb.
//
// Les tests dans Chrome de bureau (tests/e2e) simulent un téléphone ; ceux-ci passent par le vrai
// Chrome d'Android, là où sont apparus les bugs du toucher (appui long sans clic, événements
// « pointer » perdus au retour d'un tour, marge de la caméra). Le toucher, l'appui long et la touche
// retour sont de vrais gestes Android (`adb shell input`) ; seuls les doubles touchers passent par
// le protocole de Chrome : `input` met trop de temps à démarrer pour deux touchers rapprochés.
//
// Lancement : `npm run build`, puis `npm run test:android`, avec un appareil visible dans `adb devices`.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { Page, type Point } from '../../src/kit/node/chrome.ts';
import { startStaticServer, type StaticServer } from '../../src/kit/node/static-server.ts';
import { TOURS } from '../../src/content/tours.ts';

const TIMEOUT = { timeout: 120_000 };
const CHROME = 'com.android.chrome';
const PORT_DEVTOOLS = 9333;
/**
 * Juste après un changement de page, Chrome écarte les touchers tant que la nouvelle page n'est pas
 * vraiment affichée : un doigt réel ne touche jamais aussi vite. Une page n'est donc touchée qu'une
 * fois peinte (premier affichage mesuré par Chrome) depuis une demi-seconde. Sur l'émulateur lent de
 * la CI, sans carte graphique, ce premier affichage peut venir bien après le chargement.
 */
const POSEE = `(() => { const p = performance.getEntriesByName('first-contentful-paint')[0]; return Boolean(p) && performance.now() - p.startTime > 500; })()`;
const AU_MENU = `${POSEE} && !location.pathname.includes('/tours/') && document.readyState === 'complete' && document.querySelectorAll('#tours .tour').length === ${TOURS.length}`;

let server: StaticServer;
let page: Page;
/** Où tombe le pixel CSS (0, 0) de la page sur l'écran, et combien de pixels d'écran fait un pixel CSS. */
let ecran = { x: 0, y: 0, echelle: 1 };

function adb(...args: string[]): string {
	return execFileSync('adb', args, { encoding: 'utf8', timeout: 30_000 }).trim();
}

/** Expression évaluée dans la page du tour ouvert ; null tant qu'on n'y est pas. */
const dansLeTour = (expression: string): string =>
	`(() => { if (!location.pathname.includes('/tours/') || document.readyState !== 'complete') return null; return (${expression}); })()`;

/** Attend qu'une expression devienne vraie, même pendant qu'une page en remplace une autre. */
async function attendre(expression: string, quoi: string, timeoutMs = 8000): Promise<void> {
	const limite = Date.now() + timeoutMs;
	while (Date.now() < limite) {
		try {
			if (await page.evaluate<boolean>(`Boolean(${expression})`)) return;
		} catch {
			// Page en cours de remplacement.
		}
		await sleep(100);
	}
	throw new Error(`Attente dépassée (${timeoutMs} ms) : ${quoi}`);
}

/** Le point de l'écran, en pixels de l'appareil, sous le pixel CSS `p`. */
const surEcran = (p: Point): [string, string] => [String(Math.round(ecran.x + p.x * ecran.echelle)), String(Math.round(ecran.y + p.y * ecran.echelle))];

const centreDe = (selecteur: string): Promise<Point> =>
	page.evaluate<Point>(`(() => { const r = document.querySelector('${selecteur}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);

/** Un vrai toucher bref d'Android. */
function toucher(p: Point): void {
	adb('shell', 'input', 'tap', ...surEcran(p));
}

/** Un vrai appui long d'Android : le doigt reste posé `ms` ms. */
function appuyer(p: Point, ms: number): void {
	const [x, y] = surEcran(p);
	adb('shell', 'input', 'swipe', x, y, x, y, String(ms));
}

/** Un écran tactile de l'appareil, où écrire des touchers plus rapides que `input`. */
interface EcranTactile {
	chemin: string;
	nom: string;
	echelleX: number;
	echelleY: number;
}

/** L'écran tactile relié à l'écran affiché, trouvé au premier repérage (undefined : on passe par `input`). */
let tactile: EcranTactile | undefined;
/** Les écrans tactiles accessibles en écriture (il faut le root), à essayer au premier repérage. */
let candidatsTactiles: EcranTactile[] = [];

function listerLesEcransTactiles(): void {
	const taille = adb('shell', 'wm', 'size').match(/(\d+)x(\d+)\s*$/);
	if (!taille) return;
	candidatsTactiles = adb('shell', 'getevent', '-lp').split('add device ').slice(1).flatMap((bloc) => {
		const chemin = bloc.match(/^\d+:\s*(\S+)/)?.[1];
		const nom = bloc.match(/name:\s*"([^"]*)"/)?.[1] ?? '';
		const maxX = bloc.match(/ABS_MT_POSITION_X\s*:.*max (\d+)/)?.[1];
		const maxY = bloc.match(/ABS_MT_POSITION_Y\s*:.*max (\d+)/)?.[1];
		if (!chemin || !maxX || !maxY || adb('shell', `test -w ${chemin} && echo oui || echo non`) !== 'oui') return [];
		return [{ chemin, nom, echelleX: Number(maxX) / (Number(taille[1]) - 1), echelleY: Number(maxY) / (Number(taille[2]) - 1) }];
	});
}

/** Des événements du noyau (struct input_event : 16 octets d'horodatage, type, code, valeur). */
function evenements(liste: [number, number, number][]): Buffer {
	const octets = Buffer.alloc(24 * liste.length);
	liste.forEach(([type, code, valeur], i) => {
		octets.writeUInt16LE(type, 24 * i + 16);
		octets.writeUInt16LE(code, 24 * i + 18);
		octets.writeInt32LE(valeur, 24 * i + 20);
	});
	return octets;
}

/**
 * `fois` touchers au point (x, y) de l'écran, écrits directement sur l'écran tactile `cible`. Les
 * tours n'acceptent que 450 ms entre les deux touchers d'un double : trop peu pour `input`, ou pour un
 * `sendevent` par événement sur l'émulateur lent de la CI. Les événements sont donc préparés dans
 * des fichiers, envoyés sur l'appareil, puis recopiés sur l'écran tactile en une seule commande, au
 * rythme d'un vrai doigt.
 */
function ecrireDesTouchers(cible: EcranTactile, x: number, y: number, fois: number): void {
	const { chemin, echelleX, echelleY } = cible;
	const pose = (id: number) => evenements([[3, 47, 0], [3, 57, id], [3, 53, Math.round(x * echelleX)], [3, 54, Math.round(y * echelleY)], [1, 330, 1], [0, 0, 0]]);
	const dossier = mkdtempSync(join(tmpdir(), 'mes-tours-android-'));
	try {
		writeFileSync(join(dossier, 'pose1'), pose(1));
		writeFileSync(join(dossier, 'pose2'), pose(2));
		writeFileSync(join(dossier, 'leve'), evenements([[3, 57, -1], [1, 330, 0], [0, 0, 0]]));
		for (const f of ['pose1', 'pose2', 'leve']) adb('push', join(dossier, f), `/data/local/tmp/${f}`);
	} finally {
		rmSync(dossier, { recursive: true, force: true });
	}
	const ecrire = (f: string) => `cat /data/local/tmp/${f} > ${chemin}`;
	const touchers = Array.from({ length: fois }, (_, i) => [ecrire(`pose${i + 1}`), 'sleep 0.08', ecrire('leve')].join(' && '));
	adb('shell', touchers.join(' && sleep 0.12 && '));
}

/** Un vrai double toucher, au rythme d'un vrai doigt. */
async function doubleToucher(p: Point): Promise<void> {
	const [x, y] = surEcran(p).map(Number);
	if (!tactile) {
		// Les deux `input` dans une seule commande : pas d'aller-retour avec l'appareil entre les deux.
		adb('shell', `input tap ${x} ${y} && input tap ${x} ${y}`);
		return;
	}
	// Ce que la page reçoit, dit dans le journal si ce n'est pas un double toucher.
	await page.evaluate(`(() => { window.__doigts = []; for (const t of ['touchstart', 'touchend']) addEventListener(t, (e) => __doigts.push(Math.round(performance.now()) + ' ' + t + ' ' + Math.round(e.changedTouches[0].clientX) + ',' + Math.round(e.changedTouches[0].clientY)), true); })()`);
	ecrireDesTouchers(tactile, x, y, 2);
	await sleep(500);
	const recus = await page.evaluate<string[]>(`window.__doigts ?? []`).catch(() => []);
	if (recus.filter((r) => r.includes('touchstart')).length !== 2) console.log(`Double toucher en ${x},${y} sur ${tactile.nom} : la page a reçu ${JSON.stringify(recus)}`);
}

/** En cas d'échec : une capture de l'écran (android-ecran.png) et ce qu'il affiche, dans le journal. */
function decrireLEcran(): void {
	try {
		writeFileSync('android-ecran.png', execFileSync('adb', ['exec-out', 'screencap', '-p'], { timeout: 30_000 }));
		adb('shell', 'uiautomator', 'dump', '/data/local/tmp/ecran.xml');
		const xml = adb('shell', 'cat', '/data/local/tmp/ecran.xml');
		const textes = [...xml.matchAll(/(?:text|content-desc)="([^"]+)"/g)].map((m) => m[1]);
		console.log(`À l'écran : ${textes.join(' | ')}`);
		console.log(adb('shell', 'dumpsys', 'window').match(/mCurrentFocus=.*/)?.[0]);
		console.log(`Adresse de la page : ${adb('shell', 'dumpsys', 'activity', 'top').match(/url=\S+/)?.[0] ?? '?'}`);
	} catch (erreur) {
		console.log(`Écran illisible : ${erreur}`);
	}
}

/**
 * Repère la page sur l'écran : un vrai toucher en un point connu de l'écran, dont la page lit la
 * position en pixels CSS. Le toucher est arrêté avant d'atteindre l'app.
 */
async function calibrer(): Promise<void> {
	await page.evaluate(`(() => {
		window.__repere = null;
		const bloquer = (e) => { e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); };
		const types = ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mouseup', 'click'];
		const lire = (e) => { if (!window.__repere) window.__repere = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
		window.addEventListener('touchstart', lire, { capture: true, passive: false });
		for (const t of types) window.addEventListener(t, bloquer, { capture: true, passive: false });
		window.__finRepere = () => { window.removeEventListener('touchstart', lire, true); for (const t of types) window.removeEventListener(t, bloquer, true); };
	})()`);
	const taille = adb('shell', 'wm', 'size').match(/(\d+)x(\d+)\s*$/);
	assert.ok(taille, 'taille de l’écran illisible');
	const [px, py] = [Math.round(Number(taille[1]) / 2), Math.round(Number(taille[2]) * 0.6)];
	adb('shell', 'input', 'tap', String(px), String(py));
	try {
		await attendre('window.__repere', 'le toucher de repérage', 5000);
	} catch (erreur) {
		decrireLEcran();
		throw erreur;
	}
	// Au premier repérage, l'écran tactile relié à l'écran affiché : l'émulateur en a un par écran
	// possible, et lequel est le bon change d'une machine à l'autre. Chacun reçoit un toucher, que
	// la page arrête comme celui du repérage ; on garde celui qu'elle a reçu.
	if (!tactile && candidatsTactiles.length) {
		const repere = await page.evaluate<Point>('window.__repere');
		for (const candidat of candidatsTactiles) {
			await sleep(400);
			await page.evaluate('window.__repere = null');
			ecrireDesTouchers(candidat, px, py, 1);
			await sleep(600);
			const recu = await page.evaluate<Point | null>('window.__repere');
			if (recu && Math.abs(recu.x - repere.x) < 2 && Math.abs(recu.y - repere.y) < 2) {
				tactile = candidat;
				break;
			}
		}
		candidatsTactiles = [];
		console.log(`Écran tactile : ${tactile ? `${tactile.nom} (${tactile.chemin})` : 'aucun, doubles touchers par « input »'}`);
		await page.evaluate(`window.__repere = ${JSON.stringify(repere)}`);
	}
	// Le clic qui suit le toucher est arrêté lui aussi avant de rendre la main à l'app.
	await sleep(500);
	const { repere, echelle } = await page.evaluate<{ repere: Point; echelle: number }>(`(() => { window.__finRepere(); return { repere: window.__repere, echelle: devicePixelRatio }; })()`);
	ecran = { x: px - repere.x * echelle, y: py - repere.y * echelle, echelle };
}

/** Recharge le menu principal, langue et réglages remis à zéro. */
async function auMenu(): Promise<void> {
	await page.goto(server.url);
	await page.evaluate(`localStorage.clear(); sessionStorage.clear()`);
	await page.reload();
	await attendre(AU_MENU, 'menu construit', 20_000);
	await sleep(500);
	await calibrer();
}

/** Touche la tuile du tour (ou son écrou ⚙) et attend sa page. */
async function ouvrir(dossier: string, pret: string, reglages = false): Promise<void> {
	const cible = await centreDe(`#tours .tour[data-dossier="${dossier}"] ${reglages ? '.tour-reglages' : '.tour-lancer'}`);
	toucher(cible);
	try {
		await attendre(dansLeTour(`${POSEE} && ${pret}`), `${dossier} prêt`, 20_000);
	} catch (erreur) {
		console.log(`Page : ${await page.evaluate<string>('location.href').catch(() => '?')}`);
		decrireLEcran();
		throw erreur;
	}
	assert.ok(await page.evaluate<boolean>(`location.pathname.includes('/tours/${dossier}/')`), `${dossier} : ce n’est pas sa page qui s’est ouverte`);
	await sleep(300);
}

/** Le milieu de l'écran de la page, en pixels CSS. */
const milieu = (): Promise<Point> => page.evaluate<Point>(`({ x: innerWidth / 2, y: innerHeight / 2 })`);
const haut = (): Promise<Point> => page.evaluate<Point>(`({ x: innerWidth / 2, y: innerHeight * .2 })`);

before(async () => {
	if (!existsSync('dist/index.html')) throw new Error('dist/ absent : lancez « npm run build » avant les tests Android.');
	assert.match(adb('devices'), /\tdevice$/m, 'aucun appareil Android dans « adb devices »');
	// Root (émulateur google_apis) : `sendevent` écrit directement sur l'écran tactile. adb redémarre
	// alors côté appareil, d'où l'attente ; sur un téléphone ordinaire, les doubles touchers passent par `input`.
	try {
		adb('root');
		adb('wait-for-device');
		await sleep(1000);
	} catch {
		// Pas de root : tant pis.
	}
	server = await startStaticServer('dist', 0);
	// L'appareil joint le serveur par « localhost » : une adresse sûre, où le service worker s'installe.
	const port = new URL(server.url).port;
	adb('reverse', `tcp:${port}`, `tcp:${port}`);
	// Chrome sans ses écrans de premier lancement.
	adb('shell', `echo "_ --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line`);
	adb('shell', 'am', 'set-debug-app', '--persistent', CHROME);
	// Sans quoi Android 13 et plus pose sa demande d'autorisation devant la page au premier lancement.
	try {
		adb('shell', 'pm', 'grant', CHROME, 'android.permission.POST_NOTIFICATIONS');
	} catch {
		// Android plus ancien : pas d'autorisation à demander.
	}
	adb('shell', 'am', 'force-stop', CHROME);
	const lancer = () => adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', server.url, CHROME);
	lancer();
	adb('forward', `tcp:${PORT_DEVTOOLS}`, 'localabstract:chrome_devtools_remote');
	// L'onglet de l'app, vu par le protocole de débogage de Chrome. Juste après le démarrage de
	// l'émulateur, Chrome peut mettre longtemps à s'ouvrir : on le relance toutes les 20 s.
	let cible: { url: string; webSocketDebuggerUrl: string } | undefined;
	let vus: string[] = [];
	const debut = Date.now();
	let relance = debut + 20_000;
	while (!cible && Date.now() < debut + 120_000) {
		try {
			const onglets = (await (await fetch(`http://127.0.0.1:${PORT_DEVTOOLS}/json/list`)).json()) as { type: string; url: string; webSocketDebuggerUrl: string }[];
			vus = onglets.map((o) => `${o.type} ${o.url}`);
			cible = onglets.find((o) => o.type === 'page' && o.url.startsWith(server.url));
		} catch {
			// Chrome démarre.
		}
		if (cible) break;
		if (Date.now() > relance) {
			relance = Date.now() + 20_000;
			try {
				adb('forward', `tcp:${PORT_DEVTOOLS}`, 'localabstract:chrome_devtools_remote');
				lancer();
			} catch {
				// Réessayé au tour suivant.
			}
		}
		await sleep(1000);
	}
	if (!cible) {
		console.log(`Onglets vus : ${vus.join(' ; ') || 'aucun'}`);
		decrireLEcran();
	}
	assert.ok(cible, 'l’onglet de l’app n’apparaît pas dans Chrome');
	listerLesEcransTactiles();
	page = await Page.connect(cible.webSocketDebuggerUrl, async () => {});
	await page.send('Runtime.enable');
	await page.send('Page.enable');
	// Pas de fiche « Installer » de Chrome au bas de l'écran : elle prendrait le toucher suivant.
	await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `addEventListener('beforeinstallprompt', (e) => e.preventDefault())` });
	console.log(`Chrome ${adb('shell', 'dumpsys', 'package', CHROME).match(/versionName=(\S+)/)?.[1]}, Android ${adb('shell', 'getprop', 'ro.build.version.release')}`);
});

after(async () => {
	await page?.close();
	await server?.close();
});

/* ================= Le menu ================= */

test('Android : un toucher sur une tuile ouvre le tour, l’appui de 3 s ramène au menu', TIMEOUT, async () => {
	await auMenu();
	await ouvrir('pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
	appuyer(await milieu(), 3400);
	await attendre(AU_MENU, 'retour au menu après l’appui de 3 s', 20_000);
});

test('Android : de retour au menu, les tuiles répondent tout de suite, au toucher bref comme à l’appui long', TIMEOUT, async () => {
	await auMenu();
	await ouvrir('pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
	appuyer(await milieu(), 3400);
	await attendre(AU_MENU, 'retour au menu', 20_000);
	await sleep(300);
	// Un appui long sur une tuile : Android n'envoie pas de clic, la tuile doit agir quand même.
	appuyer(await centreDe('#tours .tour[data-dossier="six-predictions"] .tour-lancer'), 1000);
	await attendre(dansLeTour(`document.querySelectorAll('#paquet .carte').length === 6`), 'six prédictions ouvert par un appui long', 10_000);
	await sleep(600);
	appuyer(await milieu(), 3400);
	await attendre(AU_MENU, 'retour au menu', 20_000);
	await sleep(300);
	// Puis un toucher bref.
	await ouvrir('analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
});

test('Android : la touche retour ramène au menu, qui répond ensuite', TIMEOUT, async () => {
	await auMenu();
	await ouvrir('boule-de-cristal', `Boolean(document.querySelector('#number'))`);
	adb('shell', 'input', 'keyevent', 'KEYCODE_BACK');
	await attendre(AU_MENU, 'retour au menu par la touche retour', 20_000);
	await sleep(300);
	await ouvrir('pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
});

test('Android : l’écrou ⚙ ouvre les réglages du tour, la croix ramène au menu', TIMEOUT, async () => {
	await auMenu();
	await ouvrir('six-predictions', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
	// Un réglage se touche comme un bouton : la couleur bleue.
	const couleur = '#couleur-choix button[data-valeur="bleu"]';
	if (await page.evaluate<boolean>(`Boolean(document.querySelector('${couleur}'))`)) {
		toucher(await centreDe(couleur));
		await attendre(`document.querySelector('${couleur}').getAttribute('aria-pressed') === 'true' || document.querySelector('${couleur}').classList.contains('actif')`, 'réglage touché', 3000).catch(() => {});
	}
	toucher(await centreDe('#close-btn'));
	await attendre(AU_MENU, 'retour au menu par la croix', 20_000);
});

/* ================= Les routines : la fin reste dans le tour ================= */

test('Android : Pile ou face, la carte se retourne, le double toucher la remet face cachée sans quitter le tour', TIMEOUT, async () => {
	await auMenu();
	await ouvrir('pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
	toucher(await haut());
	await attendre(dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'carte retournée', 5000);
	assert.equal(await page.evaluate(dansLeTour(`document.querySelector('#table .carte').dataset.cote`)), 'pile');
	await sleep(800);
	await doubleToucher(await milieu());
	await attendre(dansLeTour(`!document.querySelector('#table .carte').classList.contains('retournee')`), 'carte face cachée', 5000);
	await sleep(800);
	assert.ok(await page.evaluate<boolean>(`location.pathname.includes('/tours/pile-ou-face/')`), 'le double toucher a quitté le tour');
});

test('Android : Boule de cristal, le double toucher efface le nombre sans quitter le tour', TIMEOUT, async () => {
	await auMenu();
	await ouvrir('boule-de-cristal', `Boolean(document.querySelector('#number'))`);
	toucher(await haut());
	await attendre(dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nombre affiché', 8000);
	await sleep(500);
	await doubleToucher(await milieu());
	await attendre(dansLeTour(`!document.querySelector('#number').classList.contains('shown')`), 'nombre effacé', 5000);
	await sleep(2500);
	assert.ok(await page.evaluate<boolean>(`location.pathname.includes('/tours/boule-de-cristal/')`), 'le double toucher a quitté le tour');
	// La boule est réarmée : un nouveau toucher donne un nouveau nombre.
	toucher(await haut());
	await attendre(dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nouveau nombre', 8000);
});

/* ================= L'écran ================= */

test('Android : les marges de l’écran restent les mêmes une fois le tour posé', TIMEOUT, async () => {
	// Sur le téléphone, le tour prenait d'abord en compte la bande du haut, puis l'oubliait et
	// passait sous la caméra frontale.
	const marge = `(() => { const s = document.createElement('div'); s.style.paddingTop = 'var(--safe-t)'; s.style.paddingBottom = 'var(--safe-b)'; document.querySelector('#app').appendChild(s); const c = getComputedStyle(s); const r = [c.paddingTop, c.paddingBottom]; s.remove(); return r; })()`;
	await auMenu();
	const auMenuMarges = await page.evaluate<string[]>(marge);
	for (const [dossier, pret] of [
		['boule-de-cristal', `Boolean(document.querySelector('#number'))`],
		['pile-ou-face', `Boolean(document.querySelector('#table .carte'))`],
		['six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`],
		['analyseur-q', `Boolean(document.querySelector('.slide.current'))`],
	] as const) {
		await ouvrir(dossier, pret);
		const aLOuverture = await page.evaluate<string[]>(dansLeTour(marge));
		await sleep(2000);
		assert.deepEqual(await page.evaluate<string[]>(dansLeTour(marge)), aLOuverture, `${dossier} : les marges ont changé une fois le tour posé`);
		assert.deepEqual(aLOuverture, auMenuMarges, `${dossier} : pas les mêmes marges que le menu`);
		adb('shell', 'input', 'keyevent', 'KEYCODE_BACK');
		await attendre(AU_MENU, 'retour au menu', 20_000);
		await sleep(300);
	}
});
