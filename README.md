# Mes tours

Tous mes accessoires de scène dans **une seule application** : https://dezande.github.io/mes-tours/

| Tour | Fin de la routine (retour au menu) | Copie de |
| --- | --- | --- |
| Boule de cristal | double toucher après le nombre (une fois le fondu fini) | [boule-de-cristal](https://github.com/dezande/boule-de-cristal) |
| Pile ou face | double toucher après la carte retournée | [pile-ou-face](https://github.com/dezande/pile-ou-face) |
| Les six prédictions | double toucher sur la table vide | [six-predictions](https://github.com/dezande/six-predictions) |
| Analyseur Q | « suivante » après la dernière slide | [analyseur-q](https://github.com/dezande/analyseur-q) |

## Utilisation

| Geste | Effet |
| --- | --- |
| **FR / EN**, sous le titre | La langue du menu **et de tous les tours** ; gardée d'une ouverture à l'autre |
| **Toucher une tuile** | Le tour s'ouvre en plein écran, prêt pour une nouvelle routine |
| **Toucher l'écrou ⚙** d'une tuile | Les réglages du tour, seuls ; la **croix** en haut à droite ramène au menu |
| **Fin de la routine** (voir le tableau) | Retour au menu principal |
| **Appui de 3 s** pendant un tour | Sortie de secours : retour au menu sans finir la routine |
| **Geste retour** d'Android | Retour au menu |
| Touche **R** (télécommande) | Fin de la routine ; **Échap** ou **M** : quitter le tour |

**Les réglages des quatre tours ont la même structure**, chacun dans ses couleurs : une barre d'en-tête qui reste en haut quand on fait défiler — « Réglages » et, dessous, le nom du tour, avec la croix qui ferme —, puis les réglages propres au tour, les aides à la répétition (le test des zones de la boule y est), et « Rétablir les réglages par défaut ». Plus de version, d'état de l'écran, d'aide des gestes ni d'informations techniques : la version de l'app est en bas du menu principal.

**La langue se choisit une fois, dans le menu principal** : les tours n'ont plus de choix de langue à eux (ni dans leurs réglages, ni sur la première slide de l'analyseur). En anglais, Pile ou face écrit « 0.20 euro / tails » et « heads ». La boule de cristal n'a qu'une interface en français ; ce qu'elle montre au public, un nombre, n'a pas de langue. À la toute première ouverture, l'app suit la langue du téléphone.

Les réglages de chaque tour (dos des cartes, délai, routine de la boule…) sont gardés d'une ouverture à l'autre ; le menu du tour ne s'ouvre plus pendant la routine, seulement par l'écrou ⚙. Le doigt de l'appui de 3 s, relevé sur le menu, ne relance pas la tuile placée dessous ; après la croix ou la fin d'une routine, le menu répond au premier toucher.

### Installer sur le téléphone

1. Ouvrir https://dezande.github.io/mes-tours/ dans Chrome, puis ⋮ → *Installer et créer un raccourci* → **Installer**. Sur iPhone : Safari → Partager → *Sur l'écran d'accueil*.
2. L'ouvrir une fois avec du réseau : **toute l'app, tours compris**, est alors en cache, et fonctionne ensuite sans réseau.

Une seule app installée : Chrome sur Android ne gère bien qu'une app installée par site (`dezande.github.io`), et c'est pour cela que tous les tours sont dedans. N'installer aucun tour seul à côté.

Jusqu'à la version 0.1.0, l'app était à la racine du site (`https://dezande.github.io/`, dépôt `dezande.github.io`). Elle a été déplacée dans son dossier, dépôt `mes-tours`, quand elle a contenu ses propres copies des tours : une app installée depuis l'ancienne adresse est à désinstaller, puis à réinstaller depuis la nouvelle.

## Comment c'est fait

- **Chaque tour est une copie de son app** : son code dans `src/tours/<dossier>/`, sa page et ses images dans `public/tours/<dossier>/`, compilés dans `dist/tours/<dossier>/`. Les dépôts d'origine ne sont pas touchés, et leurs adresses (`dezande.github.io/<dossier>/`) continuent de fonctionner seules. Une correction faite dans un dépôt d'origine est à recopier ici.
- **Le tour s'affiche dans un cadre** (iframe) par-dessus le menu ([`src/scene.ts`](src/scene.ts)) : ses styles, ses identifiants et ses gestes restent les siens, sans rien renommer.
- **Le pont** ([`src/tours/pont.ts`](src/tours/pont.ts)) : le tour dit à l'app « fin » (fin de routine) ou « quitter » (appui de 3 s, réglages fermés). Ouvert par l'écrou, il reçoit `?reglages` et n'affiche que son panneau de réglages ; il reçoit toujours `?lang=fr` ou `?lang=en`, la langue du menu, qui remplace la sienne.
- Ce qui a changé dans les copies : le geste de fin de routine et l'appui de 3 s passent par le pont ; le menu du tour n'a plus que ses réglages (plus d'« aller à », de « remettre », de version, ni de bouton « Mes tours »), avec l'en-tête commun que remplit le pont (`remplirEntete()`, d'après `?nom=`) ; ce qui ne sert qu'au tour ouvert seul reste dans un bloc caché, pour son code ; le tour n'enregistre plus de service worker ni de manifeste à lui ; l'analyseur commence toujours à la première slide.
- **Un seul service worker** (celui du kit, v1.3.1 ou plus) met tout en cache, tours compris. Une nouvelle version ne s'affiche jamais pendant un tour.

## Ajouter un tour

1. Copier son `src/` (sans `kit`, `sw`, `icon`) dans `src/tours/<dossier>/` et son `public/` (sans manifeste, icônes ni polices) dans `public/tours/<dossier>/` ; faire pointer ses imports du kit vers `src/kit`.
2. Brancher le pont : `finDeRoutine()` au geste de fin, `quitter()` à l'appui de 3 s et à la fermeture des réglages, `enReglages` pour n'ouvrir que les réglages.
3. Une ligne dans [`src/content/tours.ts`](src/content/tours.ts), son icône en pixels (32 × 32, ajoutée à `outils/icones-16-bits.py`) dans [`src/content/pixels.ts`](src/content/pixels.ts), sa feuille de style dans le script `build` de `package.json`.
4. Ses tests unitaires dans `tests/tours/<dossier>/`, et sa routine dans les tests dans Chrome.

## Publication et développement

Les mêmes règles que les autres apps, énoncées une fois dans le [kit](https://github.com/dezande/kit-scene#règles-de-la-branche-main) : `main` protégée, pull request, fusion en rebase, CI verte (« Types, tests, build et tests dans Chrome »), une ligne dans le [journal des versions](CHANGELOG.md) pour chaque changement. Chaque fusion sur `main` publie le site.

**Le service worker** est celui du kit, à partir de la v1.3.1 : il ne renvoie la page de l'app que pour sa propre adresse, jamais pour une autre page du site — un test dans Chrome le vérifie.

```sh
git submodule update --init   # après un clone : récupère le kit
npm install
npm run serve       # build puis serveur local sur http://localhost:8000
npm test            # tests unitaires (l'app et les quatre tours)
npm run test:e2e    # tests dans Chrome (après npm run build)
npm run typecheck
npm run check:changelog
```

### Le menu, façon console 16 bits

Le menu principal a l'allure des menus de jeux de rôle des consoles 16 bits : fenêtres bleues en dégradé bordées de blanc, la main qui montre la tuile touchée, un ciel de nuit, la police pixel **[Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans)** embarquée avec l'app (`public/fonts/`, 12 ko, licence [SIL OFL 1.1](public/fonts/OFL-pixelify-sans.txt)). Deux de ses glyphes sont retouchés par [`outils/pixelify-mes-tours.py`](outils/pixelify-mes-tours.py) : le « 5 », qui ressemblait à un « S », et le « î », dont l'accent ne se voyait pas (il faut fontTools : `pip install fonttools brotli`). Les tours eux-mêmes gardent leur allure : ce que voit le public ne change pas.

Les icônes des tours (32 × 32), l'écrou ⚙ (24 × 24) et la main sont des **grilles de caractères**, un par pixel, dans [`src/content/pixels.ts`](src/content/pixels.ts) ; [`src/pixel.ts`](src/pixel.ts) en fait des SVG nets à toutes les tailles. Les icônes et l'écrou sont **engendrés** par [`outils/icones-16-bits.py`](outils/icones-16-bits.py) — éclairage des volumes, tramage des ombres — : pour en changer un, modifier le script, le lancer (`python3 outils/icones-16-bits.py` écrit `icones.json` et un aperçu `apercu.svg`), puis recopier les grilles et la palette dans `src/content/pixels.ts`. Les tests vérifient que l'écrou est symétrique dans tous les sens, son trou au centre exact.

### Icônes

L'icône de l'app ([`src/icon/icon.svg`](src/icon/icon.svg)) réunit les icônes des quatre tours, chacune dans une fenêtre bleue bordée de blanc, comme le menu ; elle est engendrée depuis leurs grilles. Les PNG de `public/icons/` en sont rendus avec Chrome sans interface :

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
	--screenshot="public/icons/icon-512.png" --window-size=512,512 "file://$PWD/src/icon/icon.svg"
cp public/icons/icon-512.png public/icons/icon-192.png
sips -z 192 192 public/icons/icon-192.png
```
