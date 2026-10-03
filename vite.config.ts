/*
 * Build de l'app avec Vite : Preact, Sass, et les fichiers de src/assets/ (polices, images), copiés
 * dans dist/assets/ sous un nom qui change avec leur contenu. public/ est recopié tel quel (manifeste,
 * icônes, captures, licences des polices).
 *
 * La suite du build est celle du kit (package.json, script « build ») : service worker, vérification
 * de dist/ (node/check-dist.ts), puis numéro de version et liste des fichiers en cache
 * (node/stamp-build.ts). D'où quelques noms fixes :
 *   dist/app.js                 le point d'entrée ;
 *   dist/style.css              toutes les feuilles de style, en une seule ;
 *   dist/kit/web/build.js       le numéro de version du kit, que stamp-build.ts inscrit au build ;
 *   dist/kit/web/wake-lock.js   et updates.js, que check-dist.ts attend.
 */
import preact from '@preact/preset-vite';
import { defineConfig, type Plugin } from 'vite';

/** Les modules du kit qui gardent leur propre fichier, à leur nom. */
const KIT = ['build', 'wake-lock', 'updates'];

/** Seuls les fichiers de l'app sont autorisés : rien ne se charge d'ailleurs, l'app est hors-ligne. */
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' data:; connect-src 'self'; font-src 'self'; manifest-src 'self'; worker-src 'self'";

/** Ajoute la Content-Security-Policy à la page compilée (pas en développement, voir index.html). */
const contentSecurityPolicy = (): Plugin => ({
	name: 'content-security-policy',
	apply: 'build',
	transformIndexHtml: (html) => html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n\t<meta http-equiv="Content-Security-Policy" content="${CSP}">`),
});

export default defineConfig({
	// Adresses relatives : l'app est publiée dans un dossier du site (dezande.github.io/mes-tours/).
	base: './',
	plugins: [preact(), contentSecurityPolicy()],
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		target: 'es2022',
		cssCodeSplit: false,
		modulePreload: { polyfill: false },
		rollupOptions: {
			output: {
				entryFileNames: 'app.js',
				chunkFileNames: (chunk) => (chunk.name.startsWith('kit/') ? '[name].js' : 'assets/[name]-[hash].js'),
				assetFileNames: (asset) => (asset.names.some((name) => name.endsWith('.css')) ? 'style.css' : 'assets/[name]-[hash][extname]'),
				manualChunks: (id) => {
					const nom = KIT.find((module) => id.endsWith(`/src/kit/web/${module}.ts`));
					return nom ? `kit/web/${nom}` : undefined;
				},
			},
		},
	},
});
