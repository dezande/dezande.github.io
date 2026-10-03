# Mes tours

Tous mes accessoires de scène dans **une seule application** : https://dezande.github.io/mes-tours/

| Tour | Fin de la routine (le tour se remet en place, on y reste) | Copie de |
| --- | --- | --- |
| Boule de cristal (3 boulettes : 6, 16, 26) | double toucher après le nombre : il s'efface, la boule est prête pour un nouveau nombre | [boule-de-cristal](https://github.com/dezande/boule-de-cristal) |
| Carte de visite (Arcane Système : 17, 19, 21, 23 aux 4 coins) | double toucher sur la carte retournée : elle revient sur son recto, prête pour un nouveau numéro | — (créé ici, d'après l'ancienne routine Arcane Système de la boule) |
| Pile ou face | double toucher après la carte retournée : elle revient face cachée | [pile-ou-face](https://github.com/dezande/pile-ou-face) |
| Les six prédictions | double toucher sur la table vide : le paquet revient, faces en bas | [six-predictions](https://github.com/dezande/six-predictions) |
| Analyseur Q | « suivante » après la dernière slide : rien, on reste sur la dernière slide | [analyseur-q](https://github.com/dezande/analyseur-q) |

## Utilisation

| Geste | Effet |
| --- | --- |
| **FR / EN**, sous le titre | La langue du menu **et de tous les tours** ; gardée d'une ouverture à l'autre |
| **Toucher une tuile** (bref ou long) | Le tour s'ouvre en plein écran, prêt pour une nouvelle routine ; les boutons du menu agissent au lever du doigt |
| **Toucher l'écrou ⚙** d'une tuile | Les réglages du tour, seuls ; la **croix** en haut à droite ramène au menu |
| **Fin de la routine** (voir le tableau) | Le tour se remet en place pour une nouvelle routine : **on reste dans le tour** |
| **Appui de 3 s** pendant un tour | **Le seul geste qui ramène au menu**, à tout moment de la routine |
| **Geste retour** d'Android | Retour au menu |
| Touche **R** (télécommande) | Remise en place du tour ; **Échap** ou **M** : retour au menu |

**Les réglages des cinq tours ont la même structure**, chacun dans ses couleurs : une barre d'en-tête qui reste en haut quand on fait défiler — « Réglages » et, dessous, le nom du tour, avec la croix qui ferme —, puis les réglages propres au tour, les aides à la répétition (le test des zones de la boule et de la carte de visite y est), et « Rétablir les réglages par défaut ». Plus de version, d'état de l'écran, d'aide des gestes ni d'informations techniques : la version de l'app est en bas du menu principal.

**La langue se choisit une fois, dans le menu principal** : les tours n'ont plus de choix de langue à eux (ni dans leurs réglages, ni sur la première slide de l'analyseur). En anglais, Pile ou face écrit « 0.20 euro / tails » et « heads ». La boule de cristal et la carte de visite n'ont qu'une interface en français ; ce qu'elles montrent au public, un nombre dans une boule ou au dos de la carte du Théâtre Robert-Houdin, n'a pas à changer de langue. À la toute première ouverture, l'app suit la langue du téléphone.

Les réglages de chaque tour (dos des cartes, délai, routine de la boule…) sont gardés d'une ouverture à l'autre ; le menu du tour ne s'ouvre plus pendant la routine, seulement par l'écrou ⚙. Le doigt de l'appui de 3 s, relevé sur le menu, ne relance pas la tuile placée dessous ; après la croix ou l'appui de 3 s, le menu répond au premier toucher.

### Installer sur le téléphone

1. Ouvrir https://dezande.github.io/mes-tours/ dans Chrome, puis ⋮ → *Installer et créer un raccourci* → **Installer**. Sur iPhone : Safari → Partager → *Sur l'écran d'accueil*.
2. L'ouvrir une fois avec du réseau : **toute l'app, tours compris**, est alors en cache, et fonctionne ensuite sans réseau.

Une seule app installée : Chrome sur Android ne gère bien qu'une app installée par site (`dezande.github.io`), et c'est pour cela que tous les tours sont dedans. N'installer aucun tour seul à côté.

Jusqu'à la version 0.1.0, l'app était à la racine du site (`https://dezande.github.io/`, dépôt `dezande.github.io`). Elle a été déplacée dans son dossier, dépôt `mes-tours`, quand elle a contenu ses propres copies des tours : une app installée depuis l'ancienne adresse est à désinstaller, puis à réinstaller depuis la nouvelle.

## Comment c'est fait

**Une app React classique**, construite par [Vite](https://vite.dev/) : TypeScript, React 19, React Router, Sass. Une seule page (`index.html`) ; chaque tour a son adresse après le « # » :

| Adresse | Page |
| --- | --- |
| `#/` | le menu principal |
| `#/tours/<dossier>` | le tour, prêt pour une nouvelle routine |
| `#/tours/<dossier>?reglages` | seulement ses réglages (écrou ⚙) |

L'adresse après le « # » ne change pas la page demandée au serveur : le service worker n'a qu'une page à servir, et chaque tour s'ouvre hors-ligne.

```
index.html              la page de l'app (React s'y monte dans #app)
vite.config.ts          le build
src/
  main.tsx              démarrage : verrou portrait, écran allumé, mises à jour, rendu de <App />
  App.tsx               les adresses (React Router)
  pages/                Menu.tsx (le menu 16 bits), PageTour.tsx (la page qui accueille un tour)
  components/           partagés : BoutonTactile, PanneauReglages, JaugeAppui, PixelArt,
                        cartes/ (dos de cartes et soulignement, partagés par deux tours)
  hooks/                useSurToucher, useBoutonsTactiles, useReglagesEnregistres
  langue/               la langue FR / EN, pour le menu et tous les tours (LangueContext)
  content/              LA LISTE DES TOURS (tours.ts), le texte du menu, les dessins en pixels
  tours/
    registre.ts         chaque tour : son composant (chargé à sa première ouverture), sa couleur
    pont.tsx            ce qu'un tour reçoit de l'app : langue, nom, réglages seuls, quitter()
    <dossier>/          un tour : index.tsx, components/, hooks/, content/ (textes),
                        logic/ (logique pure, sans DOM, testée sous Node)
  styles/               TOUT le Sass : main.scss, _base.scss, menu/, tours/<dossier>/
  assets/               polices (fonts/), images (images/<dossier>/), icône de l'app (icons/)
  kit/                  code commun des accessoires de scène (sous-module kit-scene)
  sw/                   compilation du service worker du kit
public/                 copié tel quel : manifeste, icônes, captures, licences des polices
tests/                  Jest : logic/ et tours/ (unitaires), composants/ (React), e2e/ (Chrome)
```

- **Chaque tour vient de son app d'origine** ([boule-de-cristal](https://github.com/dezande/boule-de-cristal), [pile-ou-face](https://github.com/dezande/pile-ou-face), [six-predictions](https://github.com/dezande/six-predictions), [analyseur-q](https://github.com/dezande/analyseur-q) ; la carte de visite est née ici, de l'ancienne routine Arcane Système de la boule) : sa logique (`logic/`) et ses textes (`content/`) sont repris tels quels, avec leurs tests ; son affichage est réécrit en composants React. Les dépôts d'origine ne sont pas touchés.
- **Les styles de chaque tour sont rangés sous sa classe** (`.scene-<dossier>`, posée par `PageTour`, avec `meta.load-css` dans `src/styles/tours/<dossier>/_index.scss`) : tous chargés ensemble dans une seule feuille, ils ne se marchent jamais dessus. Les `@keyframes`, qui valent pour toute la page, sont préfixés par tour (`boule-`, `cdv-`, `pof-`, `six-`, `aq-`). Le fond derrière l'app et la couleur de la barre du téléphone suivent le tour ouvert (`html[data-tour]`).
- **Le pont** ([`src/tours/pont.tsx`](src/tours/pont.tsx)) : à l'appui de 3 s, à Échap / M, ou quand ses réglages se ferment, le tour revient au menu (`quitter()`), par l'historique — le menu réapparaît, et l'historique ne grandit pas. La fin de la routine, elle, remet le tour en place sans le quitter. Ouvert par l'écrou, le tour n'affiche que son panneau de réglages (`enReglages`), dans la langue du menu.
- **Les boutons agissent au lever du doigt**, appui bref ou long (`useSurToucher` pour le menu, `useBoutonsTactiles` pour les réglages) : sur Android, un doigt qui reste posé sur un bouton devient un appui long, et le navigateur n'envoie pas de clic.
- **Un seul service worker** (celui du kit, v1.3.1 ou plus) met tout en cache, tours compris. Une nouvelle version ne s'installe jamais pendant un tour.

## Ajouter un tour

1. Son code dans `src/tours/<dossier>/` : un `index.tsx` dont l'export par défaut est le tour (voir Pile ou face, le plus simple), la logique pure dans `logic/`. Il lit `usePont()` : `quitter()` à l'appui de 3 s, `enReglages` pour n'afficher que ses réglages (`<PanneauReglages>`), `langue`.
2. Ses styles dans `src/styles/tours/<dossier>/`, rangés sous `.scene-<dossier>` par son `_index.scss`, et une ligne `@use` dans `src/styles/main.scss` ; ses images dans `src/assets/images/<dossier>/`, importées par le code.
3. Une ligne dans [`src/content/tours.ts`](src/content/tours.ts), une dans [`src/tours/registre.ts`](src/tours/registre.ts), son icône en pixels (32 × 32, ajoutée à `outils/icones-16-bits.py`) dans [`src/content/pixels.ts`](src/content/pixels.ts).
4. Ses tests unitaires dans `tests/tours/<dossier>/`, ses composants dans `tests/composants/`, et sa routine dans les tests dans Chrome.

## Publication et développement

Les mêmes règles que les autres apps, énoncées une fois dans le [kit](https://github.com/dezande/kit-scene#règles-de-la-branche-main) : `main` protégée, pull request, fusion en rebase, CI verte (« Types, tests, build et tests dans Chrome »), une ligne dans le [journal des versions](CHANGELOG.md) pour chaque changement. Chaque fusion sur `main` publie le site.

**Le build** (Vite) compile React et Sass en `dist/app.js` et `dist/style.css`, chaque tour dans son propre fichier (chargé à sa première ouverture), polices et images dans `dist/assets/`. La fin du build est celle du kit : le service worker, la vérification de `dist/` et le numéro de version (`dist/kit/web/build.js`, que Vite garde à part pour le kit). La Content-Security-Policy n'est ajoutée qu'au build : le serveur de développement de Vite injecte ses styles en ligne.

**Les tests, tous avec [Jest](https://jestjs.io/)** (compilés par SWC, configuration dans [`jest.config.js`](jest.config.js)) : la logique pure sous Node, les composants React dans jsdom avec [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), et l'app compilée dans un vrai Chrome sans interface. `expect(valeur, 'message')` dit ce qui a échoué ([jest-expect-message](https://github.com/mattphillips/jest-expect-message)).

**Le service worker** est celui du kit, à partir de la v1.3.1 : il ne renvoie la page de l'app que pour sa propre adresse, jamais pour une autre page du site — un test dans Chrome le vérifie.

```sh
git submodule update --init   # après un clone : récupère le kit
npm install
npm run dev         # serveur de développement (Vite), rechargement à chaud
npm run serve       # build puis serveur local sur http://localhost:8000
npm test            # tests unitaires et des composants (Jest), l'app et les cinq tours
npm run test:e2e    # tests dans Chrome (après npm run build)
npm run typecheck
npm run check:changelog
```

### Le menu, façon console 16 bits

Le menu principal a l'allure des menus de jeux de rôle des consoles 16 bits : fenêtres bleues en dégradé bordées de blanc, la main qui montre la tuile touchée, un ciel de nuit, la police pixel **[Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans)** embarquée avec l'app (`src/assets/fonts/`, 12 ko, licence [SIL OFL 1.1](public/fonts/OFL-pixelify-sans.txt)). Deux de ses glyphes sont retouchés par [`outils/pixelify-mes-tours.py`](outils/pixelify-mes-tours.py) : le « 5 », qui ressemblait à un « S », et le « î », dont l'accent ne se voyait pas (il faut fontTools : `pip install fonttools brotli`). Les tours eux-mêmes gardent leur allure : ce que voit le public ne change pas.

Les icônes des tours (32 × 32), l'écrou ⚙ (24 × 24) et la main sont des **grilles de caractères**, un par pixel, dans [`src/content/pixels.ts`](src/content/pixels.ts) ; le composant [`PixelArt`](src/components/PixelArt.tsx) en fait des SVG nets à toutes les tailles. Les icônes et l'écrou sont **engendrés** par [`outils/icones-16-bits.py`](outils/icones-16-bits.py) — éclairage des volumes, tramage des ombres — : pour en changer un, modifier le script, le lancer (`python3 outils/icones-16-bits.py` écrit `icones.json` et un aperçu `apercu.svg`), puis recopier les grilles et la palette dans `src/content/pixels.ts`. Les tests vérifient que l'écrou est symétrique dans tous les sens, son trou au centre exact.

### Icônes et captures

L'icône de l'app ([`src/assets/icons/icon.svg`](src/assets/icons/icon.svg)) réunit les icônes des quatre premiers tours (la carte de visite n'y est pas), chacune dans une fenêtre bleue bordée de blanc, comme le menu ; elle est engendrée depuis leurs grilles. Les PNG de `public/icons/` en sont rendus **pixel pour pixel** par [`outils/icones-png.py`](outils/icones-png.py) : le dessin de 80 × 80 agrandi un nombre entier de fois (× 6 pour 512, × 2 pour 192), sans lissage, en palette exacte — nets et légers (2 et 3 ko).

Les captures de la fiche d'installation (`public/captures/`, citées par `manifest.json`) sont prises dans Chrome sans interface par [`outils/captures.ts`](outils/captures.ts), après un build.

```sh
python3 outils/icones-png.py    # il faut Pillow : pip install pillow
npm run build && node outils/captures.ts
```
