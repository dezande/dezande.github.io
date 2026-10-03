/*
 * Les captures d'écran de la fiche d'installation (manifest.json, « screenshots ») : Android les
 * montre au moment d'installer l'app. Prises dans Chrome sans interface, sur un écran de téléphone
 * (390 × 844, densité 2), à partir de l'app compilée : le menu, une routine, des réglages.
 *
 * Usage : npm run build && node outils/captures.ts   (écrit public/captures/*.webp)
 */
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { Browser, SCREEN } from '../src/kit/node/chrome.ts';
import { startStaticServer } from '../src/kit/node/static-server.ts';

const serveur = await startStaticServer('dist', 0);
const navigateur = await Browser.launch();
const page = await navigateur.newPage();
await page.send('Emulation.setDeviceMetricsOverride', { width: SCREEN.width, height: SCREEN.height, deviceScaleFactor: 2, mobile: true });

async function capture(nom: string): Promise<void> {
	await sleep(800);
	const { data } = await page.send('Page.captureScreenshot', { format: 'webp', quality: 82 }) as { data: string };
	writeFileSync(`public/captures/${nom}.webp`, Buffer.from(data, 'base64'));
	console.log(`public/captures/${nom}.webp`);
}

try {
	await page.goto(serveur.url);
	await page.evaluate(`localStorage.setItem('mes-tours:langue', '"fr"')`);
	await page.reload();
	await page.waitFor(`document.querySelectorAll('#tours .tour').length === 4 && document.fonts.check('16px "Pixelify Sans"')`, 'menu');
	await capture('menu');

	await page.goto(`${serveur.url}#/tours/pile-ou-face`);
	await page.waitFor(`Boolean(document.querySelector('#table .carte .dos svg'))`, 'pile ou face');
	await sleep(600);
	await page.tap({ x: SCREEN.width / 2, y: SCREEN.height * .2 });
	await sleep(1200);
	await capture('pile-ou-face');

	await page.goto(`${serveur.url}#/tours/six-predictions?reglages`);
	await page.waitFor(`Boolean(document.querySelector('#menu .sheet'))`, 'réglages');
	await capture('reglages');
} finally {
	await navigateur.close();
	await serveur.close();
}
