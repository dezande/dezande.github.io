# Journal des versions

Toutes les versions de Mes tours, de la plus récente à la plus ancienne.

Les numéros suivent [semver](https://semver.org/lang/fr/) : `MAJEUR.MINEUR.CORRECTIF`. Chaque version correspond à un tag git et à une [Release GitHub](https://github.com/dezande/dezande.github.io/releases).

**Chaque changement s'écrit ici**, sous « Non publié », dans le même commit que le changement lui-même : la vérification du kit (`npm run check:changelog`) contrôle la forme du journal et refuse un changement qui ne s'explique pas, en pull request comme sur `main`. Publier une version, c'est renommer « Non publié » en numéro de version et poser le tag.

À ne pas confondre avec le **numéro de build** affiché en bas du menu : le nombre de commits, calculé au build. Le tableau ci-dessous donne la correspondance.

| Version | Commits | Date | En une phrase |
| --- | --- | --- | --- |
| [0.1.0] | 2 | 2026-10-02 | Première version : le menu de tous les tours, installé une seule fois |

---

## [Non publié]

- **Tous les tours dans une seule application.** Mes tours ne se contente plus d'ouvrir les apps des tours : elle contient sa propre copie de chacun (Boule de cristal, Pile ou face, Les six prédictions, Analyseur Q), dans `src/tours/` et `public/tours/`, et les affiche en plein écran dans un cadre qui isole leurs styles et leurs gestes. Les dépôts d'origine ne sont pas touchés : leurs adresses continuent de fonctionner seules.
- **Un écrou ⚙ sur chaque tuile** ouvre les réglages du tour, et seulement eux (dos des cartes, délai, routine, langue…) ; « Fermer » ramène au menu. Le menu du tour ne s'ouvre plus pendant la routine.
- **La fin de la routine ramène au menu** : le double toucher après la révélation (boule de cristal, pile ou face), le double toucher sur la table vide (six prédictions), « suivante » après la dernière slide (analyseur). La touche R d'une télécommande fait de même.
- **L'appui de 3 s pendant un tour est une sortie de secours** : retour au menu, sans finir la routine. Le doigt qui se relève sur le menu ne relance pas la tuile placée dessous. Le geste retour d'Android referme aussi le tour.
- Chaque ouverture d'un tour commence une nouvelle routine (l'analyseur reprend à la première slide). Les réglages de chaque tour sont gardés d'une ouverture à l'autre.
- Un seul service worker met toute l'application en cache, tours compris : tout fonctionne hors-ligne dès la première ouverture avec du réseau. Une nouvelle version ne s'affiche jamais en plein tour.
- Tests : les tests unitaires des quatre tours sont repris (178 en tout), et 12 tests dans Chrome jouent chaque routine en entier jusqu'au retour au menu, l'écrou ⚙, la sortie de secours, le geste retour et le hors-ligne.
- **L'écrou ⚙ redessiné** : sa roue dentée, tracée à la main, n'était pas symétrique, et le trou ne tombait pas au milieu. Ses huit dents sont maintenant calculées autour du même centre que le trou.

## [0.1.0] — 2026-10-02

2 commits

Première version : une seule app à installer pour tous les accessoires de scène.

- **Le menu principal de tous les tours** : Boule de cristal, Pile ou face, Les six prédictions et Analyseur Q, chacun avec son icône et une ligne de description. Toucher une tuile ouvre le tour.
- **Une seule app installée, à la racine de `dezande.github.io`.** Chrome sur Android ne gère bien qu'une app installée par site : quand un tour était installé, Chrome croyait les autres déjà installés et refusait de les installer (« Cette appli est déjà installée »), ou échouait à les ouvrir. Installée à la racine, Mes tours couvre tout le site : chaque tour s'ouvre dedans, en plein écran, sans barre de Chrome.
- Chaque tour reste une app à part, dans son propre dépôt ; le bouton « Mes tours » du menu de chaque tour ramène ici.
- PWA 100 % hors-ligne, toujours en portrait, avec le kit commun [kit-scene](https://github.com/dezande/kit-scene) v1.3.1 — la version dont le service worker ne renvoie sa page que pour l'adresse de l'app, et laisse se charger les dossiers des tours.
- Tests unitaires de la liste des tours, et tests dans Chrome : le menu, les liens, la navigation vers un tour, le service worker de la racine qui laisse passer les tours, le fonctionnement hors-ligne.

---

### Publier une nouvelle version

À chaque changement, décrivez-le sous **« Non publié »**, dans le commit qui le porte. Le déploiement est automatique : **chaque fusion sur `main` met l'app à jour**. Le tag et la Release sont un geste à part, quand le contenu de « Non publié » mérite d'être nommé.

```sh
git switch -c version-0.2.0
# dans CHANGELOG.md : renommer « ## [Non publié] » en « ## [0.2.0] — 2026-10-15 »,
# ajouter la ligne au tableau du haut (nombre de commits : git rev-list --count HEAD,
# le commit de version compris) et le lien « [0.2.0]: …/releases/tag/v0.2.0 » en bas
# du fichier, mettre src/version.ts au même numéro, puis :
git commit -am "Version 0.2.0"
git push -u origin version-0.2.0 && gh pr create --fill
gh pr merge --auto --rebase

git switch main && git pull
git tag -a v0.2.0 -m "Titre de la version" && git push origin v0.2.0
gh release create v0.2.0 --title "v0.2.0 — Titre" --notes-file notes.md
```



[0.1.0]: https://github.com/dezande/dezande.github.io/releases/tag/v0.1.0
