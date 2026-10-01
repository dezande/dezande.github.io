# Mes tours

Le menu principal de tous mes accessoires de scène, en **une seule app à installer** : https://dezande.github.io/

| Tour | Dépôt |
| --- | --- |
| Boule de cristal | [boule-de-cristal](https://github.com/dezande/boule-de-cristal) |
| Pile ou face | [pile-ou-face](https://github.com/dezande/pile-ou-face) |
| Les six prédictions | [six-predictions](https://github.com/dezande/six-predictions) |
| Analyseur Q | [analyseur-q](https://github.com/dezande/analyseur-q) |

## Pourquoi une seule app

Tous les tours sont publiés sur le même site, `dezande.github.io`, chacun dans son dossier. Or **Chrome sur Android ne gère bien qu'une app installée par site** : dès qu'un tour était installé, Chrome croyait les autres déjà installés — « Cette appli est déjà installée » — et refusait de les installer, ou échouait à les ouvrir (« Impossible d'ouvrir l'application »).

Mes tours est installée **à la racine du site**, si bien que son périmètre couvre tous les dossiers : un tour ouvert depuis le menu s'affiche **dans la même app, en plein écran**, sans barre de Chrome. On n'installe donc plus les tours un par un : seulement Mes tours.

## Utilisation

- **Toucher une tuile** ouvre le tour.
- **Revenir au menu principal** : dans le menu du tour (appui de 3 s), le bouton **« Mes tours »**.
- Chaque tour garde ses propres réglages et son propre cache hors-ligne : **ouvrez chaque tour une fois avec du réseau** pour qu'il fonctionne ensuite sans.

### Installer sur le téléphone

1. Si des tours sont déjà installés un par un, les désinstaller d'abord (sinon Chrome peut croire Mes tours déjà installée).
2. Ouvrir https://dezande.github.io/ dans Chrome, puis ⋮ → *Installer et créer un raccourci* → **Installer**. Sur iPhone : Safari → Partager → *Sur l'écran d'accueil*.
3. Ouvrir Mes tours, puis chaque tour une fois, avec du réseau.

## Ajouter un tour

Le tour est une app à part, publiée dans son dossier de `dezande.github.io` (son dépôt). Pour le faire apparaître ici :

1. une ligne dans [`src/content/tours.ts`](src/content/tours.ts) (dossier, nom, description) ;
2. son icône copiée en `public/tours/<dossier>.png` ;
3. dans le tour, un bouton « Mes tours » dans son menu, qui mène à `../` ;
4. dans le tour, un manifeste avec son propre `id` (`"id": "/<dossier>/"`).

## Publication et développement

Les mêmes règles que les autres apps, énoncées une fois dans le [kit](https://github.com/dezande/kit-scene#règles-de-la-branche-main) : `main` protégée, pull request, fusion en rebase, CI verte (« Types, tests, build et tests dans Chrome »), une ligne dans le [journal des versions](CHANGELOG.md) pour chaque changement. Chaque fusion sur `main` publie le site.

**Le service worker** est celui du kit, à partir de la v1.3.1 : à la racine du site, il contrôle aussi les dossiers des tours, et ne doit renvoyer sa propre page que pour sa propre adresse — un test dans Chrome le vérifie.

```sh
git submodule update --init   # après un clone : récupère le kit
npm install
npm run serve       # build puis serveur local sur http://localhost:8000
npm test            # tests unitaires
npm run test:e2e    # tests dans Chrome (après npm run build)
npm run typecheck
npm run check:changelog
```

### Icônes

L'icône ([`src/icon/icon.svg`](src/icon/icon.svg)) assemble les icônes des quatre tours, copiées dans `public/tours/`. Les PNG de `public/icons/` en sont rendus avec Chrome sans interface :

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --allow-file-access-from-files \
	--screenshot="public/icons/icon-512.png" --window-size=512,512 "file://$PWD/src/icon/icon.svg"
cp public/icons/icon-512.png public/icons/icon-192.png
sips -z 192 192 public/icons/icon-192.png
```
