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
/** Le menu principal est à l'écran : sa page, et non celle d'un tour. */
const AU_MENU = `!location.pathname.includes('/tours/') && document.querySelectorAll('#tours .tour').length === ${TOURS.length}`;
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

/** Expression évaluée dans la page du tour ouvert ; null tant qu'on n'y est pas. */
const dansLeTour = (expression: string): string =>
	`(() => { if (!location.pathname.includes('/tours/') || document.readyState !== 'complete') return null; return (${expression}); })()`;

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
	assert.ok(await page.evaluate<boolean>(`location.pathname.includes('/tours/${dossier}/')`), `${dossier} : ce n’est pas sa page qui s’est ouverte`);
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
		await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'carte retournée', 3000);
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
		await attendre(page, dansLeTour(`document.querySelector('#paquet').classList.contains('vide')`), 'paquet vide', 3000);
		await page.doubleTap(CENTRE);
		await attendreLeMenu(page);
	});
});

test('Boule de cristal : un nombre apparaît, le double toucher l’efface et ramène au menu', TIMEOUT, async () => {
	await withApp(async (page) => {
		await ouvrir(page, 'boule-de-cristal', `Boolean(document.querySelector('#number'))`);
		await page.tap(HAUT);
		await attendre(page, dansLeTour(`document.querySelector('#number').classList.contains('shown')`), 'nombre affiché', 8000);
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
		await attendre(page, dansLeTour(`document.querySelector('.slide.current')?.dataset.index === String(document.querySelectorAll('.slide').length - 1)`), 'dernière slide', 3000);
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

test('de retour au menu, une tuile répond au premier toucher, tout de suite', TIMEOUT, async () => {
	// Le bogue : de retour au menu, les tuiles ne répondaient pas tout de suite. On touche une autre
	// tuile dès le retour, sans attendre, après chaque façon de revenir.
	await withApp(async (page) => {
		const tuile = async (dossier: string) => page.evaluate<Point>(`(() => { const r = document.querySelector('#tours .tour[data-dossier="${dossier}"] .tour-lancer').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
		const autreTuileOuvre = async (comment: string) => {
			await attendreLeMenu(page);
			await page.tap(await tuile('six-predictions'));
			await attendre(page, `location.pathname.includes('/tours/six-predictions/')`, `tuile ouverte au premier toucher après ${comment}`, 2000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		};

		// La croix des réglages.
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
		const croix = await page.evaluate<Point>(dansLeTour(`(() => { const r = document.querySelector('#close-btn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`));
		await page.tap(croix);
		await autreTuileOuvre('la croix');

		// La fin d'une routine (double toucher).
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte .dos svg'))`);
		await page.tap(HAUT);
		await sleep(900);
		await page.doubleTap(CENTRE);
		await autreTuileOuvre('la fin de la routine');
	});
});

test('un appui long sur une tuile ou un écrou ⚙ agit aussi, au lever du doigt', TIMEOUT, async () => {
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
			await attendre(page, `location.pathname.includes('/tours/')`, `appui long sur ${selecteur}`, 2000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		}
		// Le choix de la langue aussi.
		await page.touchStart(await centre('#langues button[data-langue="en"]'));
		await sleep(1500);
		await page.touchEnd();
		await page.waitFor(`document.documentElement.lang === 'en'`, 'appui long sur EN', 2000);
	});
});

test('sans événements « pointer », comme sur Android au retour d’un tour, les tuiles répondent', TIMEOUT, async () => {
	// Observé sur le téléphone : de retour d'un tour, le menu ne reçoit plus de pointerdown ni de
	// pointerup pour le doigt, seulement les événements tactiles — et pas de clic après un appui long.
	await withApp(async (page) => {
		await page.evaluate(`for (const t of ['pointerdown', 'pointerup', 'pointermove']) window.addEventListener(t, (e) => { if (e.pointerType === 'touch') e.stopImmediatePropagation(); }, true);
			document.addEventListener('click', (e) => { if (e.detail > 0 && performance.now() - (window.__debut ?? 0) > 400) e.stopImmediatePropagation(); }, true);
			window.addEventListener('touchstart', () => { window.__debut = performance.now(); }, true);`);
		const centre = async (selecteur: string) => page.evaluate<Point>(`(() => { const r = document.querySelector('${selecteur}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
		// Un toucher bref.
		await page.tap(await centre('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer'));
		await attendre(page, `location.pathname.includes('/tours/')`, 'toucher bref sans pointer', 2000);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
		// Un appui long.
		await page.touchStart(await centre('#tours .tour[data-dossier="six-predictions"] .tour-lancer'));
		await sleep(1500);
		await page.touchEnd();
		await attendre(page, `location.pathname.includes('/tours/')`, 'appui long sans pointer ni clic', 2000);
	});
});

test('un doigt qui glisse hors du bouton ne déclenche rien', TIMEOUT, async () => {
	await withApp(async (page) => {
		const r = await page.evaluate<{ x: number; y: number; bas: number }>(`(() => { const r = document.querySelector('#tours .tour[data-dossier="pile-ou-face"] .tour-lancer').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, bas: r.bottom }; })()`);
		await page.touchStart({ x: r.x, y: r.y });
		await sleep(300);
		await page.touchMove({ x: r.x, y: r.bas + 60 });
		await sleep(200);
		await page.touchEnd();
		await sleep(600);
		assert.equal(await page.evaluate<boolean>(AU_MENU), true, 'le doigt glissé hors de la tuile a ouvert le tour');
	});
});

test('l’historique ne grandit pas d’un tour à l’autre', TIMEOUT, async () => {
	await withApp(async (page) => {
		const depart = await page.evaluate<number>(`history.length`);
		for (let i = 0; i < 3; i++) {
			await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#menu')) && !document.querySelector('#menu').hidden`, true);
			await page.evaluate(dansLeTour(`document.querySelector('#close-btn').click()`));
			await attendreLeMenu(page);
			// Une touche lève la garde, comme un toucher.
			await pressKey(page, 'Shift');
		}
		assert.ok(await page.evaluate<number>(`history.length`) <= depart + 1, 'trois tours ouverts et refermés ont allongé l’historique');
		// Le geste retour referme encore un tour ouvert ensuite.
		await ouvrir(page, 'pile-ou-face', `Boolean(document.querySelector('#table .carte'))`);
		await page.evaluate(`history.back()`);
		await attendreLeMenu(page);
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

test('écrou ⚙ : dans les réglages, un appui long agit aussi, une seule fois', TIMEOUT, async () => {
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
		assert.equal(await page.evaluate(dansLeTour(`JSON.parse(localStorage.getItem('pile-ou-face:settings:v1')).couleur`)), 'bleu');
		// Une case à cocher : basculée une seule fois.
		const avant = await page.evaluate<boolean>(dansLeTour(`document.querySelector('#show-hold-ring').checked`));
		await appuiLongSur('label[for="show-hold-ring"]');
		assert.equal(await page.evaluate<boolean>(dansLeTour(`document.querySelector('#show-hold-ring').checked`)), !avant, 'la case n’a pas basculé, ou deux fois');
		// Un toucher bref aussi, une seule fois.
		const centreCase = await centre('label[for="show-hold-ring"]');
		await page.tap(centreCase);
		await sleep(300);
		assert.equal(await page.evaluate<boolean>(dansLeTour(`document.querySelector('#show-hold-ring').checked`)), avant, 'un toucher bref n’a pas basculé la case une seule fois');
		// La croix.
		await appuiLongSur('#close-btn');
		await attendreLeMenu(page);
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
		await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'carte retournée', 3000);
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

/* ================= Marges de l'écran (caméra frontale) ================= */

test('chaque tour reçoit les marges de l’écran : rien sous la caméra frontale', TIMEOUT, async () => {
	// Dans l'ancien cadre, les marges valaient 0 et le tour passait sous la caméra. Sa page, elle,
	// reçoit les vraies marges de l'écran.
	await withApp(async (page) => {
		await page.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 40, topMax: 40, bottom: 20, bottomMax: 20 } });
		const marge = `(() => { const s = document.createElement('div'); s.style.paddingTop = 'var(--safe-t)'; s.style.paddingBottom = 'var(--safe-b)'; document.querySelector('#app').appendChild(s); const c = getComputedStyle(s); const r = [c.paddingTop, c.paddingBottom]; s.remove(); return r; })()`;
		for (const [dossier, pret] of [
			['boule-de-cristal', `Boolean(document.querySelector('#number'))`],
			['pile-ou-face', `Boolean(document.querySelector('#table .carte'))`],
			['six-predictions', `document.querySelectorAll('#paquet .carte').length === 6`],
			['analyseur-q', `Boolean(document.querySelector('.slide.current'))`],
		] as const) {
			await ouvrir(page, dossier, pret);
			assert.deepEqual(await page.evaluate(dansLeTour(marge)), ['40px', '20px'], `${dossier} : marges de l’écran`);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
		}
		await page.send('Emulation.setSafeAreaInsetsOverride', { insets: {} });
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
			await attendre(page, dansLeTour(`document.querySelector('#table .carte').classList.contains('retournee')`), 'routine jouée hors-ligne', 3000);
			await page.evaluate(`history.back()`);
			await attendreLeMenu(page);
			await ouvrir(page, 'analyseur-q', `Boolean(document.querySelector('.slide.current'))`);
		}, offlineServer.url);
	} finally {
		if (!closed) await offlineServer.close();
	}
});
