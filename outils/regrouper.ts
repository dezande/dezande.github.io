/*
 * Regroupe le code de chaque page en un seul fichier JavaScript minifié (esbuild) : le menu
 * (dist/app.js) et chaque tour (dist/tours/<dossier>/app.js). Une page charge ainsi un fichier au
 * lieu d'une vingtaine, l'un après l'autre, et le code passe à environ un tiers.
 *
 * Une exception, pour le kit : son numéro de version (kit/web/build.ts) reste un fichier à part,
 * dist/kit/web/build.js, chargé par chaque page. C'est dans ce fichier que node/stamp-build.ts du kit
 * inscrit le numéro de build et le commit ; et node/check-dist.ts y attend aussi wake-lock.js et
 * updates.js, émis à côté (leur code, lui, est dans les fichiers regroupés).
 *
 * Usage : node outils/regrouper.ts   (lancé par « npm run build », après la copie de public/)
 */
import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const SRC = resolve('src');
const DIST = resolve('dist');
const VERSION_DU_KIT = resolve(SRC, 'kit/web/build.ts');

/** Les pages : le menu, et chaque tour (un dossier de src/tours/ avec son app.ts). */
const pages = [
	'app.ts',
	...readdirSync(resolve(SRC, 'tours'), { withFileTypes: true })
		.filter((entree) => entree.isDirectory())
		.map((entree) => `tours/${entree.name}/app.ts`),
];

for (const page of pages) {
	const sortie = resolve(DIST, page.replace(/\.ts$/, '.js'));
	await build({
		entryPoints: [resolve(SRC, page)],
		outfile: sortie,
		bundle: true,
		format: 'esm',
		target: 'es2022',
		minify: true,
		legalComments: 'none',
		logLevel: 'warning',
		plugins: [{
			// Le numéro de version du kit reste un fichier à part, à son adresse relative à la page.
			name: 'version-du-kit',
			setup(constructeur) {
				constructeur.onResolve({ filter: /kit\/web\/build\.ts$/ }, (args) => {
					if (resolve(args.resolveDir, args.path) !== VERSION_DU_KIT) return undefined;
					let chemin = relative(dirname(sortie), resolve(DIST, 'kit/web/build.js')).split('\\').join('/');
					if (!chemin.startsWith('.')) chemin = `./${chemin}`;
					return { path: chemin, external: true };
				});
			},
		}],
	});
}

// Les fichiers du kit que sa vérification du build attend (node/check-dist.ts).
await build({
	entryPoints: ['build', 'wake-lock', 'updates'].map((nom) => resolve(SRC, `kit/web/${nom}.ts`)),
	outdir: resolve(DIST, 'kit/web'),
	format: 'esm',
	target: 'es2022',
	minify: true,
	logLevel: 'warning',
	// build.js doit garder ses marques __APP_VERSION__ et __APP_COMMIT__ telles quelles.
	minifyIdentifiers: false,
});

console.log(`${pages.length} pages regroupées : ${pages.join(', ')}`);
