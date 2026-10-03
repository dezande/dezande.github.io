// Tests de bout en bout : l'app compilée (dist/) dans un vrai Chrome sans interface, sur un écran
// de téléphone, avec de vrais événements tactiles. Lancer : npm run build && npm run test:e2e
//
// Chaque tour est joué en entier, depuis sa tuile jusqu'au retour au menu principal. Le détail de
// chaque tour (gestes fins, réglages, rotation…) est testé dans son dépôt d'origine ; ici, on teste
// ce que l'app ajoute : le menu, l'écrou ⚙, la fin de routine, la sortie de secours, le retour
// d'Android et le hors-ligne de l'ensemble.
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { Browser, SCREEN, type Page, type Point } from '../../src/kit/node/chrome.ts';
import { startStaticServer, type StaticServer } from '../../src/kit/node/static-server.ts';
import { TOURS } from '../../src/content/tours.ts';
import { APP_VERSION } from '../../src/version.ts';

/** Chaque test joue une routine entière dans Chrome : jusqu'à 90 s. */
const TIMEOUT = 90_000;
const PRET = `document.querySelectorAll('#tours .tour').length === ${TOURS.length}`;
/** Le menu principal est à l'écran : aucun tour ouvert (#/tours/…). */
const AU_MENU = `!location.hash.startsWith('#/tours/') && document.querySelectorAll('#tours .tour').length === ${TOURS.length}`;
const HAUT: Point = { x: SCREEN.width / 2, y: SCREEN.height * .2 };
const CENTRE: Point = { x: SCREEN.width / 2, y: SCREEN.height / 2 };

let server: StaticServer;
let browser: Browser;

beforeAll(async () => {
	if (!existsSync('dist/index.html')) throw new Error('dist/ absent : lancez « npm run build » avant les tests dans Chrome.');
	server = await startStaticServer('dist', 0);
	browser = await Browser.launch();
});

afterAll(async () => {
	await browser?.close();
	await server?.close();
});

/** Ouvre l'app à `url`, attend le menu, lance `run` et vérifie qu'aucune erreur JavaScript n'a eu lieu. */
async function withApp(run: (page: Page) => Promise<void>, url = server.url): Promise<void> {
	const page = await browser.newPage();
	try {
		// Téléphone en français : c'est la langue de départ de l'app (src/langue.ts).
		const agent = await page.evaluate<string>('navigator.userAgent');
		await page.send('Emulation.setUserAgentOverride', { userAgent: agent, acceptLanguage: 'fr-FR,fr' });
		await page.goto(url);
		await page.evaluate(`localStorage.clear(); sessionStorage.clear()`);
		await page.reload();
		await page.waitFor(PRET, 'menu construit');
		await run(page);
		expect(page.errors, 'erreurs JavaScript dans la page').toStrictEqual([]);
	} finally {
		await page.close();
	}
}

/** Expression évaluée dans la page du tour ouvert ; null tant qu'on n'y est pas. */
const dansLeTour = (expression: string): string =>
	`(() => { if (!location.hash.startsWith('#/tours/') || document.readyState !== 'complete') return null; return (${expression}); })()`;

/**
 * Attend qu'une expression devienne vraie, même pendant qu'une page en remplace une autre : la page
 * est alors un instant introuvable, ce qui n'est pas une erreur.
 */
async function attendre(page: Page, expression: string, quoi: string, timeoutMs = 5000): Promise<void> {
	const limite = Date.now() + timeoutMs;
	while (Date.now() < limite) {
		try {
			if (await page.evaluate<boolean>(`Boolean(${expression})`)) return;
		} catch {
			// Page en cours de remplacement.
		}
		await sleep(50);
	}
	throw new Error(`Attente dépassée (${timeoutMs} ms) : ${quoi}`);
}

/** Touche la tuile du tour (ou son écrou ⚙), puis attend que la page du tour soit prête. */
async function ouvrir(page: Page, dossier: string, pret: string, reglages = false): Promise<void> {
	const bouton = `#tours .tour[data-dossier="${dossier}"] ${reglages ? '.tour-reglages' : '.tour-lancer'}`;
	const centre = await page.evaluate<Point>(`(() => { const r = document.querySelector('${bouton}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
	await page.tap(centre);
	await attendre(page, dansLeTour(pret), `${dossier} prêt`, 10_000);
	expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/${dossier}')`), `${dossier} : ce n’est pas sa page qui s’est ouverte`).toBeTruthy();
	// Le temps que l'écran du tour se pose (premières transitions, police).
	await sleep(400);
}

async function attendreLeMenu(page: Page, timeoutMs = 5000): Promise<void> {
	await attendre(page, AU_MENU, 'retour au menu principal', timeoutMs);
}

async function appuiLong(page: Page, point: Point = CENTRE): Promise<void> {
	await page.touchStart(point);
	await sleep(3400);
	await page.touchEnd();
}

async function pressKey(page: Page, key: string): Promise<void> {
	await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key });
	await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key });
}

/* ================= Le menu principal ================= */

test('le menu 16 bits montre les cinq tours, chacun avec son icône et son écrou ⚙', async () => {
	await withApp(async (page) => {
		const tuiles = await page.evaluate<{ nom: string; icone: boolean; ecrou: string | null }[]>(`[...document.querySelectorAll('#tours .tour')].map((t) => ({
			nom: t.querySelector('.tour-nom').textContent,
			icone: t.querySelectorAll('svg.tour-icone rect').length > 10,
			ecrou: t.querySelector('.tour-reglages svg.ecrou rect') ? t.querySelector('.tour-reglages').getAttribute('aria-label') : null,
		}))`);
		expect(tuiles.map((t) => t.nom)).toStrictEqual(TOURS.map((t) => t.nom.fr));
		expect(tuiles.every((t) => t.icone), 'une icône ne s’affiche pas').toBeTruthy();
		expect(tuiles.map((t) => t.ecrou)).toStrictEqual(TOURS.map((t) => `Réglages : ${t.nom.fr}`));
		expect(await page.evaluate<string>(`document.querySelector('#version').textContent`)).toMatch(new RegExp(APP_VERSION.replace(/\./g, '\\.')));
		// La police pixel, embarquée avec l'app, est bien chargée.
		await attendre(page, `document.fonts.check('16px "Pixelify Sans"')`, 'police pixel absente', 3000);
		// L'app a son propre identifiant, dans son dossier du site : pas celui de la racine.
		expect(await page.evaluate(`fetch('manifest.json').then((r) => r.json()).then((m) => [m.id, m.start_url, m.scope])`)).toStrictEqual(['/mes-tours/', './', './']);
		const bas = await page.evaluate<number>(`Math.round(document.querySelector('#tours').getBoundingClientRect().bottom)`);
		expect(bas <= SCREEN.height, `les tuiles descendent jusqu’à ${bas} px pour un écran de ${SCREEN.height}`).toBeTruthy();
	});
}, TIMEOUT);

test('ouverte dans le navigateur, le menu dit que c’est une app ; installée, il ne le dit plus', async () => {
	await withApp(async (page) => {
		const bandeau = `(() => { const b = document.querySelector('#installation'); const r = b.getBoundingClientRect(); return { visible: !b.hidden && r.height > 0, titre: b.querySelector('.installation-titre').textContent, haut: r.top, basDesTuiles: document.querySelector('#tours').getBoundingClientRect().bottom }; })()`;
		const ouvert = await page.evaluate<{ visible: boolean; titre: string; haut: number; basDesTuiles: number }>(bandeau);
		expect(ouvert.visible, 'bandeau absent dans le navigateur').toBe(true);
		expect(ouvert.titre).toBe('Mes tours est une app');
		expect(ouvert.haut >= ouvert.basDesTuiles, 'le bandeau recouvre les tuiles').toBeTruthy();

		// En anglais aussi.
		await page.evaluate(`document.querySelector('#langues [data-langue="en"]').click()`);
		expect((await page.evaluate<{ titre: string }>(bandeau)).titre).toBe('Mes tours is an app');

		// Installée, comme sur l'écran d'accueil d'un iPhone (Chrome ne sait pas simuler le
		// « display-mode: standalone » d'Android).
		await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(navigator, 'standalone', { value: true })` });
		await page.reload();
		await page.waitFor(PRET, 'menu construit');
		expect(await page.evaluate<boolean>(`document.querySelector('#installation').hidden`), 'bandeau affiché dans l’app installée').toBe(true);
	});
}, TIMEOUT);

/* ================= Chaque routine, jusqu'au retour au menu ================= */

test('Pile ou face : le double toucher de fin remet la carte face cachée, on reste dans le tour ; l’appui de 3 s ramène au menu', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'carte retournée', 3000);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#table .carte').dataset.cote`))).toBe('pile');
		await sleep(600);
		await page.doubleTap(CENTRE);
		await attendre(page, dansLeTour(`!document.querySelector('#table .carte').classList.contains('retournee')`), 'carte face cachée', 3000);
		await sleep(800);
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/pile-ou-face')`), 'le double toucher a quitté le tour').toBeTruthy();
		// Une nouvelle routine, sur place.
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'nouvelle routine', 3000);
		await sleep(600);
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Les six prédictions : le double toucher sur la table vide remet le paquet, on reste dans le tour', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		for (let i = 0; i < 12; i++) {
			await page.tap(CENTRE);
			await sleep(750);
		}
		await attendre(page, dansLeTour(`document.querySelector('#paquet').classList.contains('vide')`), 'paquet vide', 3000);
		await page.doubleTap(CENTRE);
		await attendre(page, dansLeTour(`!document.querySelector('#paquet').classList.contains('vide') && document.querySelectorAll('#paquet .carte.sortie').length === 0`), 'paquet remis', 3000);
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/six-predictions')`), 'le double toucher a quitté le tour').toBeTruthy();
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Boule de cristal : le double toucher efface le nombre, la boule se réarme sur place', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#number'))`);
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nombre affiché', 8000);
		await sleep(500);
		await page.doubleTap(CENTRE);
		await attendre(page, dansLeTour(`!document.querySelector('#number').classList.contains('shown')`), 'nombre effacé', 3000);
		// Le fondu fini, on est toujours dans la boule, prête pour un nouveau tour.
		await sleep(2500);
		expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/boule-de-cristal')`), 'le double toucher a quitté la boule').toBeTruthy();
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nouveau nombre', 8000);
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Boule de cristal : plus de choix de routine, les 3 bandes donnent 6, 16 et 26', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#settings')) && !document.querySelector('#settings').hidden`, true);
		expect(await page.evaluate(dansLeTour(`document.querySelectorAll('#settings [data-routine], #routines').length`)), 'un choix de routine reste dans les réglages').toBe(0);
		expect(await page.evaluate(dansLeTour(`[...document.querySelectorAll('#routine-values b')].map((b) => b.textContent)`))).toStrictEqual(['6', '16', '26']);
		await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
		await attendreLeMenu(page);
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#number'))`);
		await page.tap({ x: SCREEN.width * .85, y: SCREEN.height * .85 });
		await attendre(page, dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nombre affiché', 8000);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#number-text').textContent`))).toBe('26');
	});
}, TIMEOUT);

test('Carte de visite : un coin la retourne sur son numéro, le double toucher la remet sur son recto, sur place', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'carte-de-visite', `Boolean(document.querySelector('#carte .verso #number')) && document.querySelectorAll('#table rect').length === 3`);
		// Le tour se joue téléphone tenu en largeur : sur l'écran en portrait, la scène est pivotée d'un
		// quart de tour, son haut à droite de l'écran. Le coin haut gauche de la scène est donc en haut à
		// droite de l'écran.
		expect(await page.evaluate(dansLeTour(`document.querySelector('#app').dataset.rotation`)), 'la carte n’est pas en paysage').toBe('90');
		const scene = await page.evaluate<{ w: number; h: number }>(dansLeTour(`({ w: document.querySelector('#stage').clientWidth, h: document.querySelector('#stage').clientHeight })`));
		expect(scene.w > scene.h, `scène de ${scene.w} × ${scene.h} : pas en paysage`).toBeTruthy();
		const coins: [Point, string][] = [
			[{ x: SCREEN.width * .85, y: SCREEN.height * .15 }, '17'],
			[{ x: SCREEN.width * .85, y: SCREEN.height * .85 }, '19'],
			[{ x: SCREEN.width * .15, y: SCREEN.height * .15 }, '21'],
			[{ x: SCREEN.width * .15, y: SCREEN.height * .85 }, '23'],
		];
		for (const [coin, numero] of coins) {
			await page.tap(coin);
			await attendre(page, dansLeTour(`document.querySelector('#carte').classList.contains('retournee')`), `carte retournée sur ${numero}`, 8000);
			expect(await page.evaluate(dansLeTour(`document.querySelector('#number-text').textContent`))).toBe(numero);
			await sleep(500);
			await page.doubleTap(CENTRE);
			await attendre(page, dansLeTour(`!document.querySelector('#carte').classList.contains('retournee')`), 'carte sur son recto', 3000);
			// Le retournement fini, on est toujours sur la carte, prête pour un nouveau tour.
			await sleep(2500);
			expect(await page.evaluate<boolean>(`location.hash.startsWith('#/tours/carte-de-visite')`), 'le double toucher a quitté la carte').toBeTruthy();
		}
		await appuiLong(page);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('Analyseur Q : « suivante » sur la dernière slide ne quitte pas le tour', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		await pressKey(page, 'End');
		const derniere = `String(document.querySelectorAll('.slide').length - 1)`;
		await attendre(page, dansLeTour(`document.querySelector('.slide.current')?.dataset.index === ${derniere}`), 'dernière slide', 3000);
		await sleep(600);
		await pressKey(page, 'ArrowRight');
		await sleep(800);
		expect(await page.evaluate(dansLeTour(`document.querySelector('.slide.current')?.dataset.index === ${derniere}`)), 'on n’est plus sur la dernière slide').toBe(true);
		// Échap (ou M) d'une télécommande quitte le tour, comme l'appui de 3 s.
		await pressKey(page, 'Escape');
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('rouvrir un tour commence une nouvelle routine', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		await pressKey(page, 'End');
		await sleep(600);
		await pressKey(page, 'Escape');
		await attendreLeMenu(page);
		await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		expect(await page.evaluate(dansLeTour(`document.querySelector('.slide.current').dataset.index`)), 'l’analyseur reprend à la première slide').toBe('0');
	});
}, TIMEOUT);

/* ================= Sortir d'un tour ================= */

test('appui de 3 s pendant un tour : sortie de secours, retour au menu', async () => {
	// Le doigt se relève au centre, sur la tuile des six prédictions : il ne doit pas la relancer
	// (src/scene.ts, la garde après la fermeture d'un tour).
	await withApp(async (page) => {
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		await page.tap(CENTRE);
		await sleep(750);
		await appuiLong(page);
		await attendreLeMenu(page);
		await sleep(800);
		expect(await page.evaluate<boolean>(AU_MENU), 'le doigt relevé a relancé un tour').toBe(true);
	});
}, TIMEOUT);

test('de retour au menu, une tuile répond au premier toucher, tout de suite', async () => {
	// Le bogue : de retour au menu, les tuiles ne répondaient pas tout de suite. On touche une autre
	// tuile dès le retour, sans attendre, après chaque façon de revenir.
	await withApp(async (page) => {
		const tuile = async (dossier: string) => page.evaluate<Point>(`(() => { const r = document.querySelector('#tours .tour[data-dossier="${dossier}"] .tour-lancer').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
		const autreTuileOuvre = async (comment: string) => {
			await attendreLeMenu(page);
			await page.tap(await tuile('six-predictions'));
			await attendre(page, `location.hash.startsWith('#/tours/six-predictions')`, `tuile ouverte au premier toucher après ${comment}`, 2000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		};

		// La croix des réglages.
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
		const croix = await page.evaluate<Point>(dansLeTour(`(() => { const r = document.querySelector('#close-btn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`));
		await page.tap(croix);
		await autreTuileOuvre('la croix');

		// L'appui de 3 s, au cours d'une routine.
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap(HAUT);
		await sleep(900);
		await appuiLong(page);
		await autreTuileOuvre('l’appui de 3 s');
	});
}, TIMEOUT);

test('un appui long sur une tuile ou un écrou ⚙ agit aussi, au lever du doigt', async () => {
	// Sur Android, un doigt qui reste posé ne produit pas de clic : le bouton s'enfonçait sans agir.
	// Chrome sur ordinateur, lui, envoie le clic quand même : on le supprime pour faire comme Android
	// (les clics du clavier, sans doigt, passent toujours).
	await withApp(async (page) => {
		await page.evaluate(`document.addEventListener('click', (e) => { if (e.detail > 0) e.stopImmediatePropagation(); }, true)`);
		const centre = async (selecteur: string) => page.evaluate<Point>(`(() => { const r = document.querySelector('${selecteur}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
		for (const selecteur of ['#tours .tour[data-dossier="six-predictions"] .tour-lancer', '#tours .tour[data-dossier="pile-ou-face"] .tour-reglages']) {
			await page.touchStart(await centre(selecteur));
			await sleep(1500);
			await page.touchEnd();
			await attendre(page, `location.hash.startsWith('#/tours/')`, `appui long sur ${selecteur}`, 2000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		}
		// Le choix de la langue aussi.
		await page.touchStart(await centre('#langues button[data-langue="en"]'));
		await sleep(1500);
		await page.touchEnd();
		await page.waitFor(`document.documentElement.lang === 'en'`, 'appui long sur EN', 2000);
	});
}, TIMEOUT);

test('sans événements « pointer », comme sur Android au retour d’un tour, les tuiles répondent', async () => {
	// Observé sur le téléphone : de retour d'un tour, le menu ne reçoit plus de pointerdown ni de
	// pointerup pour le doigt, seulement les événements tactiles — et pas de clic après un appui long.
	await withApp(async (page) => {
		await page.evaluate(`for (const t of ['pointerdown', 'pointerup', 'pointermove']) window.addEventListener(t, (e) => { if (e.pointerType === 'touch') e.stopImmediatePropagation(); }, true);
			document.addEventListener('click', (e) => { if (e.detail > 0 && performance.now() - (window.__debut ?? 0) > 400) e.stopImmediatePropagation(); }, true);
			window.addEventListener('touchstart', () => { window.__debut = performance.now(); }, true);`);
		const centre = async (selecteur: string) => page.evaluate<Point>(`(() => { const r = document.querySelector('${selecteur}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
		// Un toucher bref.
		await page.tap(await centre('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer'));
		await attendre(page, `location.hash.startsWith('#/tours/')`, 'toucher bref sans pointer', 2000);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
		// Un appui long.
		await page.touchStart(await centre('#tours .tour[data-dossier="six-predictions"] .tour-lancer'));
		await sleep(1500);
		await page.touchEnd();
		await attendre(page, `location.hash.startsWith('#/tours/')`, 'appui long sans pointer ni clic', 2000);
	});
}, TIMEOUT);

test('un doigt qui glisse hors du bouton ne déclenche rien', async () => {
	await withApp(async (page) => {
		const r = await page.evaluate<{ x: number; y: number; bas: number }>(`(() => { const r = document.querySelector('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, bas: r.bottom }; })()`);
		await page.touchStart({ x: r.x, y: r.y });
		await sleep(300);
		await page.touchMove({ x: r.x, y: r.bas + 60 });
		await sleep(200);
		await page.touchEnd();
		await sleep(600);
		expect(await page.evaluate<boolean>(AU_MENU), 'le doigt glissé hors de la tuile a ouvert le tour').toBe(true);
	});
}, TIMEOUT);

test('l’historique ne grandit pas d’un tour à l’autre', async () => {
	await withApp(async (page) => {
		const depart = await page.evaluate<number>(`history.length`);
		for (let i = 0; i < 3; i++) {
			await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
			// Une touche lève la garde, comme un toucher.
			await pressKey(page, 'Shift');
		}
		expect(await page.evaluate<number>(`history.length`) <= depart + 1, 'trois tours ouverts et refermés ont allongé l’historique').toBeTruthy();
		// Le geste retour referme encore un tour ouvert ensuite.
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte'))`);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('geste retour d’Android pendant un tour : retour au menu', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte'))`);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
	});
}, TIMEOUT);

/* ================= L'écrou ⚙ ================= */

/** Touche le bouton de langue du menu principal. */
async function choisirLangue(page: Page, lang: 'fr' | 'en'): Promise<void> {
	const centre = await page.evaluate<Point>(`(() => { const r = document.querySelector('#langues button[data-langue="${lang}"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
	await page.tap(centre);
	await page.waitFor(`document.documentElement.lang === '${lang}'`, `menu en ${lang}`);
}

test('écrou ⚙ : les réglages du tour s’ouvrent seuls, « Fermer » ramène au menu', async () => {
	await withApp(async (page) => {
		for (const [dossier, panneau] of [
			['boule-de-cristal', '#settings'],
			['carte-de-visite', '#settings'],
			['pile-ou-face', '#menu'],
			['six-predictions', '#menu'],
			['analyseur-q', '#menu'],
		] as const) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('${panneau}')) && !document.querySelector('${panneau}').hidden`, true);
			// Rien du déroulé du tour dans ses réglages : ni « aller à », ni « remettre ».
			expect(await page.evaluate(dansLeTour(`[...document.querySelectorAll('${panneau} button')].some((b) => !b.closest('[hidden]') && b.id === 'reset-btn')`)), `${dossier} : bouton de remise visible`).toBe(false);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
		}
	});
}, TIMEOUT);

test('écrou ⚙ : un réglage changé vaut pour la routine suivante', async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#couleur-choix button'))`, true);
		await page.evaluate(dansLeTour(`document.querySelector('#couleur-choix button[data-valeur="rouge"]').click()`));
		await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
		await attendreLeMenu(page);
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte'))`);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#table .carte').dataset.couleur`))).toBe('rouge');
	});
}, TIMEOUT);

test('écrou ⚙ : une croix en haut à droite ferme les réglages, plus de bouton « Fermer »', async () => {
	await withApp(async (page) => {
		for (const [dossier, panneau] of [
			['boule-de-cristal', '#settings'],
			['carte-de-visite', '#settings'],
			['pile-ou-face', '#menu'],
			['six-predictions', '#menu'],
			['analyseur-q', '#menu'],
		] as const) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('${panneau}')) && !document.querySelector('${panneau}').hidden`, true);
			const croix = await page.evaluate<{ x: number; y: number; haut: number; droite: number; texte: string; etiquette: string | null } | null>(dansLeTour(`(() => {
				const b = document.querySelector('#close-btn');
				const r = b.getBoundingClientRect();
				return { x: r.x + r.width / 2, y: r.y + r.height / 2, haut: r.top, droite: window.innerWidth - r.right, texte: b.textContent.trim(), etiquette: b.getAttribute('aria-label') };
			})()`));
			if (!croix) throw new Error(`${dossier} : pas de croix`);
			expect(croix.haut < 80 && croix.droite < 40, `${dossier} : la croix n’est pas en haut à droite (haut ${croix.haut}, droite ${croix.droite})`).toBeTruthy();
			expect(croix.texte, `${dossier} : la croix porte du texte`).toBe('');
			expect(croix.etiquette, `${dossier} : la croix n’est pas annoncée « Fermer »`).toBe('Fermer');
			// Aucun autre bouton visible ne s'appelle « Fermer ».
			expect(await page.evaluate(dansLeTour(`[...document.querySelectorAll('${panneau} button')].filter((b) => !b.closest('[hidden]') && b.textContent.trim() === 'Fermer').length`)), `${dossier} : un bouton « Fermer » reste`).toBe(0);
			// La croix reste dans son coin quand les réglages défilent.
			await page.evaluate(dansLeTour(`document.querySelector('${panneau} .sheet').scrollTop = 400`));
			expect(Math.round(await page.evaluate<number>(dansLeTour(`document.querySelector('#close-btn').getBoundingClientRect().top`))), `${dossier} : la croix défile avec les réglages`).toBe(Math.round(croix.haut));
			// Un vrai toucher sur la croix ramène au menu.
			await page.tap({ x: croix.x, y: croix.y });
			await attendreLeMenu(page);
		}
	});
}, TIMEOUT);

test('écrou ⚙ : tous les réglages ont la même structure, le nom du tour en tête, sans version', async () => {
	await withApp(async (page) => {
		const structures: string[][] = [];
		for (const [dossier, panneau] of [
			['boule-de-cristal', '#settings'],
			['carte-de-visite', '#settings'],
			['pile-ou-face', '#menu'],
			['six-predictions', '#menu'],
			['analyseur-q', '#menu'],
		] as const) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('${panneau}')) && !document.querySelector('${panneau}').hidden`, true);
			const lu = await page.evaluate<{ titre: string; nom: string; blocs: string[]; version: boolean }>(dansLeTour(`({
				titre: document.querySelector('.titre-reglages').textContent,
				nom: document.querySelector('.nom-du-tour').textContent,
				// Les blocs visibles de la feuille, dans l'ordre : leur rôle, d'après leur classe.
				blocs: [...document.querySelector('${panneau} .sheet').children]
					.filter((e) => !e.hidden && getComputedStyle(e).display !== 'none')
					.map((e) => e.classList.contains('menu-head') ? 'en-tête' : e.classList.contains('options') ? 'aides' : e.classList.contains('status') ? 'écran' : e.classList.contains('help') ? 'gestes' : e.id === 'defaults-btn' ? 'défauts' : e.classList.contains('about') ? 'version' : 'réglage'),
				version: [...document.querySelectorAll('${panneau} *')].some((e) => !e.closest('[hidden]') && e.getClientRects().length > 0 && (e.id === 'menu-version' || e.classList.contains('about'))),
			})`));
			expect(lu.titre, `${dossier} : titre`).toBe('Réglages');
			expect(lu.nom, `${dossier} : nom du tour sous le titre`).toBe(TOURS.find((t) => t.dossier === dossier)!.nom.fr);
			expect(lu.version, `${dossier} : une version est encore affichée`).toBe(false);
			structures.push(lu.blocs.filter((b, i, liste) => b !== 'réglage' || liste[i - 1] !== 'réglage'));
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
		}
		// Le même ordre partout : l'en-tête, les réglages propres au tour, puis les blocs communs.
		// Ni l'état de l'écran allumé (il reste allumé sans qu'on ait à le voir), ni l'aide des gestes.
		for (const structure of structures) expect(structure).toStrictEqual(['en-tête', 'réglage', 'aides', 'défauts']);
	});
}, TIMEOUT);

test('écrou ⚙ : dans les réglages, un appui long agit aussi, une seule fois', async () => {
	// Comme sur Android : pas de clic du doigt après un appui long (on supprime ceux de Chrome).
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#couleur-choix button'))`, true);
		await page.evaluate(dansLeTour(`document.addEventListener('click', (e) => { if (e.detail > 0) e.stopImmediatePropagation(); }, true)`));
		const centre = async (selecteur: string) => page.evaluate<Point>(dansLeTour(`(() => { const e = document.querySelector('${selecteur}'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`));
		const appuiLongSur = async (selecteur: string) => {
			await page.touchStart(await centre(selecteur));
			await sleep(1200);
			await page.touchEnd();
			await sleep(300);
		};
		// Un dos de couleur : choisi.
		await appuiLongSur('#couleur-choix button[data-valeur="bleu"]');
		expect(await page.evaluate(dansLeTour(`JSON.parse(localStorage.getItem('pile-ou-face:settings:v1')).couleur`))).toBe('bleu');
		// Une case à cocher : basculée une seule fois.
		const avant = await page.evaluate<boolean>(dansLeTour(`document.querySelector('#show-hold-ring').checked`));
		await appuiLongSur('label[for="show-hold-ring"]');
		expect(await page.evaluate<boolean>(dansLeTour(`document.querySelector('#show-hold-ring').checked`)), 'la case n’a pas basculé, ou deux fois').toBe(!avant);
		// Un toucher bref aussi, une seule fois.
		const centreCase = await centre('label[for="show-hold-ring"]');
		await page.tap(centreCase);
		await sleep(300);
		expect(await page.evaluate<boolean>(dansLeTour(`document.querySelector('#show-hold-ring').checked`)), 'un toucher bref n’a pas basculé la case une seule fois').toBe(avant);
		// La croix.
		await appuiLongSur('#close-btn');
		await attendreLeMenu(page);
	});
}, TIMEOUT);

test('écrou ⚙ : en anglais, « Settings » et le nom anglais du tour', async () => {
	await withApp(async (page) => {
		await choisirLangue(page, 'en');
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
		expect(await page.evaluate(dansLeTour(`document.querySelector('.titre-reglages').textContent`))).toBe('Settings');
		expect(await page.evaluate(dansLeTour(`document.querySelector('.nom-du-tour').textContent`))).toBe('Heads or tails');
		expect(await page.evaluate(dansLeTour(`document.querySelector('#close-btn').getAttribute('aria-label')`))).toBe('Close');
	});
}, TIMEOUT);

test('les six dos de cartes sont symétriques, de haut en bas et de gauche à droite', async () => {
	// Chaque dos dessiné en grand, comparé à sa copie retournée : les pixels qui ne se recouvrent pas
	// sont comptés (en part des pixels dessinés).
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `document.querySelectorAll('#motif-choix .vignette svg').length === 6`, true);
		const ecarts = await page.evaluate<{ nom: string; hautBas: number; gaucheDroite: number }[]>(dansLeTour(`(async () => {
			const L = 200, H = 280, resultats = [];
			for (const bouton of document.querySelectorAll('#motif-choix button')) {
				const svg = bouton.querySelector('svg').cloneNode(true);
				svg.setAttribute('width', L); svg.setAttribute('height', H); svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('color', '#000');
				const image = new Image(); image.src = 'data:image/svg+xml,' + encodeURIComponent(svg.outerHTML); await image.decode();
				const pixels = (sx, sy) => { const c = document.createElement('canvas'); c.width = L; c.height = H; const g = c.getContext('2d'); g.translate(sx < 0 ? L : 0, sy < 0 ? H : 0); g.scale(sx, sy); g.drawImage(image, 0, 0); return g.getImageData(0, 0, L, H).data; };
				const [a, v, m] = [pixels(1, 1), pixels(1, -1), pixels(-1, 1)];
				let encre = 0, dv = 0, dm = 0;
				for (let k = 3; k < a.length; k += 4) { const A = a[k] > 100; if (A) encre++; if (A !== (v[k] > 100)) dv++; if (A !== (m[k] > 100)) dm++; }
				resultats.push({ nom: bouton.dataset.valeur, hautBas: dv / encre, gaucheDroite: dm / encre });
			}
			return resultats;
		})()`));
		expect(ecarts.length).toBe(6);
		for (const { nom, hautBas, gaucheDroite } of ecarts) {
			expect(hautBas < .01, `${nom} : ${(hautBas * 100).toFixed(1)} % du dessin ne se retrouve pas de haut en bas`).toBeTruthy();
			expect(gaucheDroite < .01, `${nom} : ${(gaucheDroite * 100).toFixed(1)} % du dessin ne se retrouve pas de gauche à droite`).toBeTruthy();
		}
	});
}, TIMEOUT);

test('le dessin des dos a la même marge en haut, en bas et sur les côtés, sur les vignettes comme en scène', async () => {
	// Le dessin prenait sa hauteur de sa largeur : il s'arrêtait avant le bas de la carte (4 px de
	// marge en haut, 7 en bas sur une vignette).
	const marges = `[...document.querySelectorAll('.vignette, .carte .dos')].map((carte) => {
		const c = carte.getBoundingClientRect(); const d = carte.querySelector('svg.dos-motif').getBoundingClientRect();
		return [d.top - c.top, c.bottom - d.bottom, d.left - c.left, c.right - d.right].map((v) => Math.round(v * 10) / 10);
	}).filter((m) => m.some((v) => Math.abs(v - m[0]) > .6))`;
	await withApp(async (page) => {
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#motif-choix .vignette svg').length > 6`, true);
		expect(await page.evaluate(dansLeTour(marges)), 'des vignettes ont des marges inégales').toStrictEqual([]);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
		for (const [dossier, pret] of [['six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`], ['pile-ou-face', `Boolean(document.querySelector('#table .carte'))`]] as const) {
			await ouvrir(page, dossier, pret);
			expect(await page.evaluate(dansLeTour(marges)), `${dossier} : des cartes ont des marges inégales`).toStrictEqual([]);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		}
	});
}, TIMEOUT);

/* ================= Le bouton FR / EN ================= */

test('FR / EN : le menu change de langue, et s’en souvient', async () => {
	await withApp(async (page) => {
		expect(await page.evaluate(`document.documentElement.lang`), 'téléphone en français : menu en français').toBe('fr');
		expect(await page.evaluate(`document.querySelector('#langues button[data-langue="fr"]').getAttribute('aria-checked')`)).toBe('true');
		await choisirLangue(page, 'en');
		const noms = await page.evaluate<string[]>(`[...document.querySelectorAll('#tours .tour-nom')].map((n) => n.textContent)`);
		expect(noms).toStrictEqual(TOURS.map((t) => t.nom.en));
		expect(await page.evaluate(`document.querySelector('.invite').textContent`)).toBe('Pick a trick');
		expect(await page.evaluate(`document.querySelector('.tour-reglages').getAttribute('aria-label')`)).toBe(`Settings: ${TOURS[0]!.nom.en}`);
		await page.reload();
		await page.waitFor(PRET, 'menu rechargé');
		expect(await page.evaluate(`document.documentElement.lang`), 'la langue choisie est gardée').toBe('en');
	});
}, TIMEOUT);

test('FR / EN : la langue du menu vaut pour les tours', async () => {
	await withApp(async (page) => {
		await choisirLangue(page, 'en');
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'carte retournée', 3000);
		expect(await page.evaluate(dansLeTour(`document.querySelector('#table .prediction').innerText.replace(/\\n+/g, ' ')`))).toBe('0.20 euro tails');
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);

		await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		expect(await page.evaluate(dansLeTour(`document.documentElement.lang`)), 'l’analyseur est en anglais').toBe('en');
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);

		// Retour au français : les tours suivent.
		await choisirLangue(page, 'fr');
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		expect(await page.evaluate(dansLeTour(`document.documentElement.lang`)), 'les six prédictions sont en français').toBe('fr');
	});
}, TIMEOUT);

test('FR / EN : plus aucun choix de langue dans les tours', async () => {
	await withApp(async (page) => {
		for (const dossier of ['pile-ou-face', 'six-predictions']) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
			expect(await page.evaluate(dansLeTour(`!document.querySelector('#langue-seg')`)), `${dossier} : choix de langue dans les réglages`).toBe(true);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
		}
		// L'analyseur choisissait sa langue sur sa première slide : plus de boutons FR / EN.
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		expect(await page.evaluate(dansLeTour(`document.querySelectorAll('.langues').length`)), 'boutons FR / EN sur la première slide').toBe(0);
	});
}, TIMEOUT);

/* ================= Marges de l'écran (caméra frontale) ================= */

test('chaque tour reçoit les marges de l’écran : rien sous la caméra frontale', async () => {
	// Dans l'ancien cadre, les marges valaient 0 et le tour passait sous la caméra. Sa page, elle,
	// reçoit les vraies marges de l'écran.
	await withApp(async (page) => {
		await page.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 40, topMax: 40, bottom: 20, bottomMax: 20 } });
		// Le haut et le bas de l'écran ; pour la carte de visite, pivotée en paysage (son haut à droite de
		// l'écran), ce sont la gauche et la droite de la scène.
		const marge = (haut: string, bas: string): string => `(() => { const s = document.createElement('div'); s.style.paddingTop = 'var(${haut})'; s.style.paddingBottom = 'var(${bas})'; document.querySelector('#app').appendChild(s); const c = getComputedStyle(s); const r = [c.paddingTop, c.paddingBottom]; s.remove(); return r; })()`;
		for (const [dossier, pret] of [
			['boule-de-cristal', `Boolean(document.querySelector('#number'))`],
			['carte-de-visite', `Boolean(document.querySelector('#number'))`],
			['pile-ou-face', `Boolean(document.querySelector('#table .carte'))`],
			['six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`],
			['analyseur-q', `Boolean(document.querySelector('.slide.current'))`],
		] as const) {
			await ouvrir(page, dossier, pret);
			const [haut, bas] = dossier === 'carte-de-visite' ? ['--safe-l', '--safe-r'] : ['--safe-t', '--safe-b'];
			expect(await page.evaluate(dansLeTour(marge(haut, bas))), `${dossier} : marges de l’écran`).toStrictEqual(['40px', '20px']);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		}
		await page.send('Emulation.setSafeAreaInsetsOverride', { insets: {} });
	});
}, TIMEOUT);

/* ================= Service worker et hors-ligne ================= */

test('le service worker ne renvoie le menu que pour l’adresse de l’app, jamais pour une autre page du site', async () => {
	await withApp(async (page) => {
		await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
		await page.goto(`${server.url}boule-de-cristal/`);
		expect(await page.evaluate<boolean>(`Boolean(document.querySelector('#tours'))`), 'une autre page du site a reçu la page du menu').toBe(false);
	});
}, TIMEOUT);

test('hors-ligne : le menu et les tours s’ouvrent serveur arrêté', async () => {
	const offlineServer = await startStaticServer('dist', 0);
	let closed = false;
	try {
		await withApp(async (page) => {
			await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
			await offlineServer.close();
			closed = true;
			await page.reload();
			await page.waitFor(PRET, 'menu rechargé hors-ligne', 10_000);
			// La police vient du cache, de façon asynchrone : on lui laisse le temps d'arriver.
			await attendre(page, `document.fonts.check('16px "Pixelify Sans"')`, 'police pixel absente hors-ligne', 3000);
			await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
			await page.tap(HAUT);
			await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'routine jouée hors-ligne', 3000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
			await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		}, offlineServer.url);
	} finally {
		if (!closed) await offlineServer.close();
	}
}, TIMEOUT);
