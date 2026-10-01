// Tests de bout en bout : l'app compilée (dist/) dans un vrai Chrome sans interface, sur un écran
// de téléphone. Lancer : npm run build && npm run test:e2e
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { Browser, SCREEN, type Page } from '../../src/kit/node/chrome.ts';
import { startStaticServer, type StaticServer } from '../../src/kit/node/static-server.ts';
import { TOURS } from '../../src/content/tours.ts';
import { APP_VERSION } from '../../src/version.ts';

const TIMEOUT = { timeout: 60_000 };
const PRET = `document.querySelectorAll('#tours a.tour').length === ${TOURS.length}`;

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
		await page.goto(url);
		await page.waitFor(PRET, 'menu construit');
		await run(page);
		assert.deepEqual(page.errors, [], 'erreurs JavaScript dans la page');
	} finally {
		await page.close();
	}
}

test('le menu montre les quatre tours, avec leur nom et leur icône', TIMEOUT, async () => {
	await withApp(async (page) => {
		const tuiles = await page.evaluate<{ nom: string; href: string; icone: boolean }[]>(`[...document.querySelectorAll('#tours a.tour')].map((a) => ({
			nom: a.querySelector('.tour-nom').textContent,
			href: new URL(a.href).pathname,
			icone: a.querySelector('img').complete && a.querySelector('img').naturalWidth > 0,
		}))`);
		assert.deepEqual(tuiles.map((t) => t.nom), TOURS.map((t) => t.nom));
		assert.deepEqual(tuiles.map((t) => t.href), TOURS.map((t) => `/${t.dossier}/`), 'chaque tuile ouvre le dossier du tour, à la racine du site');
		assert.ok(tuiles.every((t) => t.icone), 'une icône ne s’affiche pas');
		assert.match(await page.evaluate<string>(`document.querySelector('#version').textContent`), new RegExp(APP_VERSION.replace(/\./g, '\\.')));
	});
});

test('les tuiles tiennent dans l’écran d’un téléphone', TIMEOUT, async () => {
	await withApp(async (page) => {
		const bas = await page.evaluate<number>(`Math.round(document.querySelector('#tours').getBoundingClientRect().bottom)`);
		assert.ok(bas <= SCREEN.height, `les tuiles descendent jusqu’à ${bas} px pour un écran de ${SCREEN.height}`);
	});
});

test('toucher une tuile ouvre le tour', TIMEOUT, async () => {
	await withApp(async (page) => {
		const centre = await page.evaluate<{ x: number; y: number }>(`(() => { const r = document.querySelector('#tours a[data-dossier="pile-ou-face"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
		await page.tap(centre);
		await page.waitFor(`location.pathname === '/pile-ou-face/'`, 'navigation vers le tour');
	});
});

test('le service worker de la racine ne prend pas la place des tours', TIMEOUT, async () => {
	// Le lanceur est à la racine du site : son service worker contrôle aussi les dossiers des tours.
	// Il ne doit renvoyer sa propre page que pour sa propre adresse (kit-scene v1.3.1).
	await withApp(async (page) => {
		await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
		await page.goto(`${server.url}boule-de-cristal/`);
		assert.equal(await page.evaluate<boolean>(`Boolean(document.querySelector('#tours'))`), false, 'le dossier d’un tour a reçu la page du lanceur');
	});
});

test('hors-ligne : une fois ouvert, le menu redémarre serveur arrêté', TIMEOUT, async () => {
	const offlineServer = await startStaticServer('dist', 0);
	let closed = false;
	try {
		await withApp(async (page) => {
			await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
			await offlineServer.close();
			closed = true;
			await page.reload();
			await page.waitFor(PRET, 'menu rechargé hors-ligne', 10_000);
			assert.equal(await page.evaluate<boolean>(`[...document.querySelectorAll('#tours img')].every((i) => i.naturalWidth > 0)`), true, 'icônes hors-ligne');
		}, offlineServer.url);
	} finally {
		if (!closed) await offlineServer.close();
	}
});
