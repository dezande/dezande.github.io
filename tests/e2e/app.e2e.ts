// Tests de bout en bout : l'app compilée (dist/) dans un vrai Chrome sans interface, sur un écran
// de téléphone, avec de vrais événements tactiles. Lancer : npm run build && npm run test:e2e
//
// Chaque tour est joué en entier, depuis sa tuile jusqu'au retour au menu principal. Le détail de
// chaque tour (gestes fins, réglages, rotation…) est testé dans son dépôt d'origine ; ici, on teste
// ce que l'app ajoute : le menu, l'écrou ⚙, la fin de routine, la sortie de secours, le retour
// d'Android et le hors-ligne de l'ensemble.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { Browser, SCREEN, type Page, type Point } from '../../src/kit/node/chrome.ts';
import { startStaticServer, type StaticServer } from '../../src/kit/node/static-server.ts';
import { TOURS } from '../../src/content/tours.ts';
import { APP_VERSION } from '../../src/version.ts';

const TIMEOUT = { timeout: 90_000 };
const PRET = `document.querySelectorAll('#tours .tour').length === ${TOURS.length}`;
/** Le menu principal est à l'écran : aucun tour ouvert. */
const AU_MENU = `document.querySelector('#scene').hidden && !document.querySelector('#scene iframe')`;
const HAUT: Point = { x: SCREEN.width / 2, y: SCREEN.height * .2 };
const CENTRE: Point = { x: SCREEN.width / 2, y: SCREEN.height / 2 };

let server: StaticServer;
let browser: Browser;

before(async () => {
	if (!existsSync('dist/index.html')) throw new Error('dist/ absent : lancez « npm run build » avant les tests dans Chrome.');
	server = await startStaticServer('dist', 0);
	browser = await Browser.launch();
});

after(async () => {
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
		assert.deepEqual(page.errors, [], 'erreurs JavaScript dans la page');
	} finally {
		await page.close();
	}
}

/** Expression évaluée dans le document du tour ouvert (même origine : accessible depuis l'app). */
const dansLeTour = (expression: string): string =>
	`(() => { const document = window.document.querySelector('#scene iframe')?.contentDocument; if (!document || document.readyState !== 'complete') return null; return (${expression}); })()`;

/** Touche la tuile du tour (ou son écrou ⚙), puis attend que la page du tour soit prête. */
async function ouvrir(page: Page, dossier: string, pret: string, reglages = false): Promise<void> {
	const bouton = `#tours .tour[data-dossier="${dossier}"] ${reglages ? '.tour-reglages' : '.tour-lancer'}`;
	const centre = await page.evaluate<Point>(`(() => { const r = document.querySelector('${bouton}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
	await page.tap(centre);
	await page.waitFor(`!document.querySelector('#scene').hidden`, 'tour affiché');
	await page.waitFor(dansLeTour(pret), `${dossier} prêt`, 10_000);
	// Le temps que l'écran du tour se pose (premières transitions, police).
	await sleep(400);
}

async function attendreLeMenu(page: Page, timeoutMs = 5000): Promise<void> {
	await page.waitFor(AU_MENU, 'retour au menu principal', timeoutMs);
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

test('le menu 16 bits montre les quatre tours, chacun avec son icône et son écrou ⚙', TIMEOUT, async () => {
	await withApp(async (page) => {
		const tuiles = await page.evaluate<{ nom: string; icone: boolean; ecrou: string | null }[]>(`[...document.querySelectorAll('#tours .tour')].map((t) => ({
			nom: t.querySelector('.tour-nom').textContent,
			icone: t.querySelectorAll('svg.tour-icone rect').length > 10,
			ecrou: t.querySelector('.tour-reglages svg.ecrou rect') ? t.querySelector('.tour-reglages').getAttribute('aria-label') : null,
		}))`);
		assert.deepEqual(tuiles.map((t) => t.nom), TOURS.map((t) => t.nom.fr));
		assert.ok(tuiles.every((t) => t.icone), 'une icône ne s’affiche pas');
		assert.deepEqual(tuiles.map((t) => t.ecrou), TOURS.map((t) => `Réglages : ${t.nom.fr}`));
		assert.match(await page.evaluate<string>(`document.querySelector('#version').textContent`), new RegExp(APP_VERSION.replace(/\./g, '\\.')));
		// La police pixel, embarquée avec l'app, est bien chargée.
		assert.equal(await page.evaluate<boolean>(`document.fonts.check('16px "Pixelify Sans"')`), true, 'police pixel absente');
		// L'app a son propre identifiant, dans son dossier du site : pas celui de la racine.
		assert.deepEqual(
			await page.evaluate(`fetch('manifest.json').then((r) => r.json()).then((m) => [m.id, m.start_url, m.scope])`),
			['/mes-tours/', './', './'],
		);
		const bas = await page.evaluate<number>(`Math.round(document.querySelector('#tours').getBoundingClientRect().bottom)`);
		assert.ok(bas <= SCREEN.height, `les tuiles descendent jusqu’à ${bas} px pour un écran de ${SCREEN.height}`);
	});
});

/* ================= Chaque routine, jusqu'au retour au menu ================= */

test('Pile ou face : toucher le haut, puis le double toucher de fin ramène au menu', TIMEOUT, async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap(HAUT);
		await page.waitFor(dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'carte retournée', 3000);
		assert.equal(await page.evaluate(dansLeTour(`document.querySelector('#table .carte').dataset.cote`)), 'pile');
		await sleep(600);
		await page.doubleTap(CENTRE);
		await attendreLeMenu(page);
	});
});

test('Les six prédictions : les six cartes jouées, le double toucher sur la table vide ramène au menu', TIMEOUT, async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		for (let i = 0; i < 12; i++) {
			await page.tap(CENTRE);
			await sleep(750);
		}
		await page.waitFor(dansLeTour(`document.querySelector('#paquet').classList.contains('vide')`), 'paquet vide', 3000);
		await page.doubleTap(CENTRE);
		await attendreLeMenu(page);
	});
});

test('Boule de cristal : un nombre apparaît, le double toucher l’efface et ramène au menu', TIMEOUT, async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#number'))`);
		await page.tap(HAUT);
		await page.waitFor(dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nombre affiché', 8000);
		await sleep(500);
		await page.doubleTap(CENTRE);
		// Le nombre s'estompe d'abord (fondu), puis l'app revient au menu.
		await attendreLeMenu(page, 6000);
	});
});

test('Analyseur Q : après la dernière slide, « suivante » ramène au menu', TIMEOUT, async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		await pressKey(page, 'End');
		await page.waitFor(dansLeTour(`document.querySelector('.slide.current')?.dataset.index === String(document.querySelectorAll('.slide').length - 1)`), 'dernière slide', 3000);
		await sleep(600);
		await pressKey(page, 'ArrowRight');
		await attendreLeMenu(page);
	});
});

test('rouvrir un tour commence une nouvelle routine', TIMEOUT, async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		await pressKey(page, 'End');
		await sleep(600);
		await pressKey(page, 'ArrowRight');
		await attendreLeMenu(page);
		await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		assert.equal(await page.evaluate(dansLeTour(`document.querySelector('.slide.current').dataset.index`)), '0', 'l’analyseur reprend à la première slide');
	});
});

/* ================= Sortir d'un tour ================= */

test('appui de 3 s pendant un tour : sortie de secours, retour au menu', TIMEOUT, async () => {
	// Le doigt se relève au centre, sur la tuile des six prédictions : il ne doit pas la relancer
	// (src/scene.ts, la garde après la fermeture d'un tour).
	await withApp(async (page) => {
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		await page.tap(CENTRE);
		await sleep(750);
		await appuiLong(page);
		await attendreLeMenu(page);
		await sleep(800);
		assert.equal(await page.evaluate<boolean>(AU_MENU), true, 'le doigt relevé a relancé un tour');
	});
});

test('geste retour d’Android pendant un tour : retour au menu', TIMEOUT, async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte'))`);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
	});
});

/* ================= L'écrou ⚙ ================= */

/** Touche le bouton de langue du menu principal. */
async function choisirLangue(page: Page, lang: 'fr' | 'en'): Promise<void> {
	const centre = await page.evaluate<Point>(`(() => { const r = document.querySelector('#langues button[data-langue="${lang}"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
	await page.tap(centre);
	await page.waitFor(`document.documentElement.lang === '${lang}'`, `menu en ${lang}`);
}

test('écrou ⚙ : les réglages du tour s’ouvrent seuls, « Fermer » ramène au menu', TIMEOUT, async () => {
	await withApp(async (page) => {
		for (const [dossier, panneau] of [
			['boule-de-cristal', '#settings'],
			['pile-ou-face', '#menu'],
			['six-predictions', '#menu'],
			['analyseur-q', '#menu'],
		] as const) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('${panneau}')) && !document.querySelector('${panneau}').hidden`, true);
			// Rien du déroulé du tour dans ses réglages : ni « aller à », ni « remettre ».
			assert.equal(await page.evaluate(dansLeTour(`[...document.querySelectorAll('${panneau} button')].some((b) => !b.closest('[hidden]') && b.id === 'reset-btn')`)), false, `${dossier} : bouton de remise visible`);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
		}
	});
});

test('écrou ⚙ : un réglage changé vaut pour la routine suivante', TIMEOUT, async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#couleur-choix button'))`, true);
		await page.evaluate(dansLeTour(`document.querySelector('#couleur-choix button[data-valeur="rouge"]').click()`));
		await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
		await attendreLeMenu(page);
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte'))`);
		assert.equal(await page.evaluate(dansLeTour(`document.querySelector('#table .carte').dataset.couleur`)), 'rouge');
	});
});

test('écrou ⚙ : une croix en haut à droite ferme les réglages, plus de bouton « Fermer »', TIMEOUT, async () => {
	await withApp(async (page) => {
		for (const [dossier, panneau] of [
			['boule-de-cristal', '#settings'],
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
			assert.ok(croix, `${dossier} : pas de croix`);
			assert.ok(croix.haut < 80 && croix.droite < 40, `${dossier} : la croix n’est pas en haut à droite (haut ${croix.haut}, droite ${croix.droite})`);
			assert.equal(croix.texte, '', `${dossier} : la croix porte du texte`);
			assert.equal(croix.etiquette, 'Fermer', `${dossier} : la croix n’est pas annoncée « Fermer »`);
			// Aucun autre bouton visible ne s'appelle « Fermer ».
			assert.equal(await page.evaluate(dansLeTour(`[...document.querySelectorAll('${panneau} button')].filter((b) => !b.closest('[hidden]') && b.textContent.trim() === 'Fermer').length`)), 0, `${dossier} : un bouton « Fermer » reste`);
			// La croix reste dans son coin quand les réglages défilent.
			await page.evaluate(dansLeTour(`document.querySelector('${panneau} .sheet').scrollTop = 400`));
			assert.equal(Math.round(await page.evaluate<number>(dansLeTour(`document.querySelector('#close-btn').getBoundingClientRect().top`))), Math.round(croix.haut), `${dossier} : la croix défile avec les réglages`);
			// Un vrai toucher sur la croix ramène au menu.
			await page.tap({ x: croix.x, y: croix.y });
			await attendreLeMenu(page);
		}
	});
});

test('écrou ⚙ : tous les réglages ont la même structure, le nom du tour en tête, sans version', TIMEOUT, async () => {
	await withApp(async (page) => {
		const structures: string[][] = [];
		for (const [dossier, panneau] of [
			['boule-de-cristal', '#settings'],
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
			assert.equal(lu.titre, 'Réglages', `${dossier} : titre`);
			assert.equal(lu.nom, TOURS.find((t) => t.dossier === dossier)!.nom.fr, `${dossier} : nom du tour sous le titre`);
			assert.equal(lu.version, false, `${dossier} : une version est encore affichée`);
			structures.push(lu.blocs.filter((b, i, liste) => b !== 'réglage' || liste[i - 1] !== 'réglage'));
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
		}
		// Le même ordre partout : l'en-tête, les réglages propres au tour, puis les blocs communs.
		// Ni l'état de l'écran allumé (il reste allumé sans qu'on ait à le voir), ni l'aide des gestes.
		for (const structure of structures) assert.deepEqual(structure, ['en-tête', 'réglage', 'aides', 'défauts']);
	});
});

test('écrou ⚙ : en anglais, « Settings » et le nom anglais du tour', TIMEOUT, async () => {
	await withApp(async (page) => {
		await choisirLangue(page, 'en');
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
		assert.equal(await page.evaluate(dansLeTour(`document.querySelector('.titre-reglages').textContent`)), 'Settings');
		assert.equal(await page.evaluate(dansLeTour(`document.querySelector('.nom-du-tour').textContent`)), 'Heads or tails');
		assert.equal(await page.evaluate(dansLeTour(`document.querySelector('#close-btn').getAttribute('aria-label')`)), 'Close');
	});
});

/* ================= Le bouton FR / EN ================= */

test('FR / EN : le menu change de langue, et s’en souvient', TIMEOUT, async () => {
	await withApp(async (page) => {
		assert.equal(await page.evaluate(`document.documentElement.lang`), 'fr', 'téléphone en français : menu en français');
		assert.equal(await page.evaluate(`document.querySelector('#langues button[data-langue="fr"]').getAttribute('aria-checked')`), 'true');
		await choisirLangue(page, 'en');
		const noms = await page.evaluate<string[]>(`[...document.querySelectorAll('#tours .tour-nom')].map((n) => n.textContent)`);
		assert.deepEqual(noms, TOURS.map((t) => t.nom.en));
		assert.equal(await page.evaluate(`document.querySelector('.invite').textContent`), 'Pick a trick');
		assert.equal(await page.evaluate(`document.querySelector('.tour-reglages').getAttribute('aria-label')`), `Settings: ${TOURS[0]!.nom.en}`);
		await page.reload();
		await page.waitFor(PRET, 'menu rechargé');
		assert.equal(await page.evaluate(`document.documentElement.lang`), 'en', 'la langue choisie est gardée');
	});
});

test('FR / EN : la langue du menu vaut pour les tours', TIMEOUT, async () => {
	await withApp(async (page) => {
		await choisirLangue(page, 'en');
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap(HAUT);
		await page.waitFor(dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'carte retournée', 3000);
		assert.equal(await page.evaluate(dansLeTour(`document.querySelector('#table .prediction').innerText.replace(/\\n+/g, ' ')`)), '0.20 euro tails');
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);

		await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		assert.equal(await page.evaluate(dansLeTour(`document.documentElement.lang`)), 'en', 'l’analyseur est en anglais');
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);

		// Retour au français : les tours suivent.
		await choisirLangue(page, 'fr');
		await ouvrir(page, 'six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`);
		assert.equal(await page.evaluate(dansLeTour(`document.documentElement.lang`)), 'fr', 'les six prédictions sont en français');
	});
});

test('FR / EN : plus aucun choix de langue dans les tours', TIMEOUT, async () => {
	await withApp(async (page) => {
		for (const dossier of ['pile-ou-face', 'six-predictions']) {
			await ouvrir(page, dossier, `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
			assert.equal(await page.evaluate(dansLeTour(`Boolean(document.querySelector('#langue-seg').closest('[hidden]'))`)), true, `${dossier} : choix de langue visible dans les réglages`);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
		}
		// L'analyseur choisissait sa langue sur sa première slide : plus de boutons FR / EN.
		await ouvrir(page, 'analyseur-q', `document.querySelector('.slide.current')?.dataset.index === '0'`);
		assert.equal(await page.evaluate(dansLeTour(`document.querySelectorAll('.langues').length`)), 0, 'boutons FR / EN sur la première slide');
	});
});

/* ================= Service worker et hors-ligne ================= */

test('le service worker ne renvoie le menu que pour l’adresse de l’app, jamais pour une autre page du site', TIMEOUT, async () => {
	await withApp(async (page) => {
		await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
		await page.goto(`${server.url}boule-de-cristal/`);
		assert.equal(await page.evaluate<boolean>(`Boolean(document.querySelector('#tours'))`), false, 'une autre page du site a reçu la page du menu');
	});
});

test('hors-ligne : le menu et les tours s’ouvrent serveur arrêté', TIMEOUT, async () => {
	const offlineServer = await startStaticServer('dist', 0);
	let closed = false;
	try {
		await withApp(async (page) => {
			await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
			await offlineServer.close();
			closed = true;
			await page.reload();
			await page.waitFor(PRET, 'menu rechargé hors-ligne', 10_000);
			assert.equal(await page.evaluate<boolean>(`document.fonts.check('16px "Pixelify Sans"')`), true, 'police pixel absente hors-ligne');
			await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
			await page.tap(HAUT);
			await page.waitFor(dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'routine jouée hors-ligne', 3000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
			await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		}, offlineServer.url);
	} finally {
		if (!closed) await offlineServer.close();
	}
});
