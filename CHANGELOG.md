# Journal des versions

Toutes les versions de Mes tours, de la plus récente à la plus ancienne.

Les numéros suivent [semver](https://semver.org/lang/fr/) : `MAJEUR.MINEUR.CORRECTIF`. Chaque version correspond à un tag git et à une [Release GitHub](https://github.com/dezande/mes-tours/releases).

**Chaque changement s'écrit ici**, sous « Non publié », dans le même commit que le changement lui-même : la vérification du kit (`npm run check:changelog`) contrôle la forme du journal et refuse un changement qui ne s'explique pas, en pull request comme sur `main`. Publier une version, c'est renommer « Non publié » en numéro de version et poser le tag.

À ne pas confondre avec le **numéro de build** affiché en bas du menu : le nombre de commits, calculé au build. Le tableau ci-dessous donne la correspondance.

| Version | Commits | Date | En une phrase |
| --- | --- | --- | --- |
| [0.7.0] | 16 | 2026-10-03 | Chaque tour dans sa propre page : plus de toucher perdu, rien sous la caméra |
| [0.6.5] | 15 | 2026-10-03 | Dans les réglages des tours, un appui long agit aussi |
| [0.6.4] | 14 | 2026-10-03 | De retour d'un tour, les tuiles répondent, appui bref ou long |
| [0.6.3] | 13 | 2026-10-03 | Un appui long sur un bouton du menu agit aussi |
| [0.6.2] | 12 | 2026-10-03 | De retour au menu, les tuiles répondent tout de suite |
| [0.6.1] | 11 | 2026-10-03 | Le « 5 » et le « î » redessinés dans la police du menu |
| [0.6.0] | 10 | 2026-10-03 | Le menu principal façon console 16 bits, icônes redessinées |
| [0.5.0] | 9 | 2026-10-03 | Les réglages des tours : une même structure, le nom du tour, une croix pour fermer |
| [0.4.0] | 8 | 2026-10-03 | Un bouton FR / EN dans le menu, pour le menu et tous les tours |
| [0.3.0] | 7 | 2026-10-03 | Le menu principal en pixel art, façon console 8 bits |
| [0.2.0] | 6 | 2026-10-03 | Tous les tours dans une seule application, un écrou ⚙ par tour, à sa nouvelle adresse |
| [0.1.0] | 2 | 2026-10-02 | Première version : le menu de tous les tours, installé une seule fois |

---

## [0.7.0] — 2026-10-03

16 commits

- **Chaque tour s'ouvre maintenant dans sa propre page**, à la place du menu, au lieu d'un cadre posé par-dessus. C'est toujours une seule app installée, en plein écran et hors-ligne ; la fin de la routine, l'appui de 3 s, la croix des réglages et le geste retour d'Android ramènent au menu, qui réapparaît tel qu'on l'a laissé.
- **Corrige les tours qui ne répondaient plus quand on en recommençait un.** Le cadre était la vraie cause des problèmes de toucher : sur Android, le fermer privait ensuite le menu — puis le tour rouvert — des événements « pointer » du doigt, dont les tours se servent pour leurs gestes. Une page ouverte normalement les reçoit toujours.
- **Corrige le tour qui passait sous la caméra frontale** quand l'app se mettait en plein écran (la barre d'état disparaît, la page monte) : dans un cadre, les marges de sécurité de l'écran valaient 0. La page du tour reçoit les vraies marges.
- Les corrections des versions 0.6.x restent : boutons du menu et des réglages qui agissent au lever du doigt, appui bref ou long.
- Tests dans Chrome adaptés : chaque routine jouée en entier, de sa tuile au retour au menu, dans la page du tour ; les marges de l'écran reçues par chaque tour.

## [0.6.5] — 2026-10-03

15 commits

- **Dans les réglages des tours aussi, un appui long sur un bouton agit.** Comme dans le menu principal, un doigt posé longtemps sur un bouton n'envoyait pas de clic sur Android : un dos de carte, une case à cocher ou la croix s'enfonçaient sans agir. Un même module pour les quatre tours (`src/tours/boutons-tactiles.ts`) suit le doigt sur tout le panneau de réglages et donne au bouton touché son clic quand le doigt se relève — un seul, appui bref ou long. Le code de chaque tour n'a pas changé. Les curseurs (délai, fondu…) ne sont pas concernés, et un doigt qui fait défiler les réglages n'appuie sur rien.
- Test dans Chrome : sans clic après un appui long, comme sur Android, un dos de couleur, une case à cocher (basculée une seule fois, comme au toucher bref) et la croix agissent. Il échoue sans la correction.

## [0.6.4] — 2026-10-03

14 commits

- **De retour d'un tour, les tuiles répondent enfin, appui bref ou long.** Observé sur le téléphone (Nothing Phone, Chrome, débogage sans fil) : après la fermeture d'un tour, le menu ne reçoit plus, pendant un moment, les événements « pointer » du doigt — seulement les événements tactiles et le clic, et pas de clic après un appui long. La version 0.6.3 s'appuyait justement sur les événements « pointer » et ignorait le clic : la tuile s'enfonçait sans rien ouvrir. Les boutons du menu suivent maintenant le doigt par les événements tactiles, qui arrivent toujours, et agissent quand il se relève ; le clic reste un secours, pour un appui commencé sur le bouton. La souris, le clavier et la télécommande fonctionnent comme avant.
- Le doigt de l'appui de 3 s qui quitte un tour ne relance toujours rien en se relevant sur le menu : il ne s'est pas posé sur le bouton.
- Test dans Chrome : sans aucun événement « pointer » et sans clic après un appui long, comme sur le téléphone, un toucher bref et un appui long ouvrent la tuile. Il échoue avec la version 0.6.3.

## [0.6.3] — 2026-10-03

13 commits

- **Un appui long sur un bouton du menu agit aussi.** Sur Android, un doigt qui reste posé sur un bouton devient un « appui long », et le navigateur n'envoie pas le clic attendu : la tuile, l'écrou ⚙ ou le bouton FR / EN s'enfonçaient sans que rien ne se passe. C'était la vraie cause des boutons qui « ne répondaient pas tout de suite » au retour d'un tour : en scène, on appuie posément. Les boutons du menu agissent maintenant quand le doigt se relève, appui bref ou long, pourvu qu'il se soit posé sur le bouton et n'en ait pas glissé. Le clavier et la télécommande passent toujours par le clic.
- Du même coup, la garde contre le doigt de l'appui de 3 s devient naturelle : un doigt qui ne s'est pas posé sur le menu — celui qui vient de quitter un tour — ne déclenche rien en se relevant. L'ancienne garde, et le signal « doigt posé » du tour, disparaissent.
- Tests dans Chrome : un appui long d'une seconde et demie sur une tuile, un écrou et le bouton EN agit, avec les clics supprimés comme sur Android ; un doigt qui glisse hors du bouton ne déclenche rien.

## [0.6.2] — 2026-10-03

12 commits

- **De retour au menu, les tuiles répondent tout de suite.** Sur le téléphone, après un tour, une tuile touchée aussitôt ne réagissait pas. Deux causes, corrigées :
  - le retour au menu passait par l'historique (un « retour » d'Android), qui prend du temps sur le téléphone : le menu revient maintenant aussitôt, sans attendre l'historique. Le geste retour d'Android referme toujours un tour, et l'historique ne grandit plus d'un tour à l'autre ;
  - la garde contre le doigt de l'appui de 3 s (qui empêche ce doigt, en se relevant, de relancer la tuile placée dessous) s'armait à chaque retour, même sans doigt posé. Le tour dit maintenant si un doigt est encore sur l'écran : la garde ne s'arme que dans ce cas.
- Tests dans Chrome : une autre tuile touchée dès le retour s'ouvre au premier toucher, après la croix comme après la fin d'une routine ; l'historique ne grandit pas.

## [0.6.1] — 2026-10-03

11 commits

- **Le « 5 » ne ressemble plus à un « S »**, et **l'accent du « î » se voit** : dans la police Pixelify Sans, le 5 est dessiné presque comme un S (« AQ‑52 » se lisait « AQ‑S2 »), et le chevron de « î » n'est qu'un demi-pixel collé à la lettre (« apparaît » se lisait « apparait »). Les deux glyphes sont redessinés sur la grille de pixels de la police : un 5 classique, barre du haut droite et ventre en bas, et un chevron de trois pixels au-dessus de la lettre.
- La police retouchée s'appelle `pixelify-sans-mes-tours.woff2` ; elle est produite par `outils/pixelify-mes-tours.py` à partir de l'originale, rangée dans `outils/`. Pixelify Sans est sous licence SIL OFL 1.1, sans nom réservé : la retoucher est permis, et sa version le signale.

## [0.6.0] — 2026-10-03

10 commits

Le menu principal passe de la console 8 bits à la console 16 bits, dans l'esprit des menus de jeux de rôle. Les tours eux-mêmes ne changent pas.

- **Des fenêtres bleues en dégradé, bordées de blanc**, aux coins arrondis, avec une ombre portée ; touchée, la fenêtre s'illumine et s'enfonce.
- **La main des jeux de rôle** apparaît à gauche de la tuile touchée.
- **Des icônes redessinées, quatre fois plus fines** (32 × 32 au lieu de 16 × 16), avec lumière, ombres tramées et reflets : la boule de cristal violette, sa brume et son reflet sur un pied doré ; une vraie pièce de 20 centimes en relief, avec « 20 » et ses encoches ; l'éventail de dos rouges et la carte écrite ; le pique blanc de l'analyseur dans son orbite orange. Elles sont engendrées par `outils/icones-16-bits.py`.
- **L'écrou ⚙ en relief doré**, toujours symétrique, son trou au centre exact.
- **La police Pixelify Sans**, plus fine et plus lisible que celle des 8 bits, embarquée avec l'app (12 ko, licence SIL OFL 1.1) ; Press Start 2P est retirée. Le titre est en lettres d'or sur un contour sombre.
- **Un ciel de nuit** qui s'éclaircit vers le bas, semé d'étoiles.
- **L'icône de l'app** reprend les quatre nouvelles icônes, chacune dans une fenêtre bleue.
- **Plus de bloc « Écran : verrou actif » ni « Gestes et touches »** dans les réglages des tours : ils ne gardent que leurs réglages, les aides à la répétition et « Rétablir les réglages par défaut ». L'écran reste allumé pendant les tours comme avant ; les gestes sont décrits dans le README.

## [0.5.0] — 2026-10-03

9 commits

Les réglages des tours (ouverts par l'écrou ⚙) se ressemblent tous, et se ferment par une croix.

- **Une croix en haut à droite** remplace le bouton « Fermer », dans les réglages des quatre tours. Elle est annoncée « Fermer » (ou « Close ») aux lecteurs d'écran.
- **Une barre d'en-tête qui reste en haut** quand on fait défiler les réglages, sur le fond du tour : la croix y est toujours visible, et le contenu passe dessous, jamais par-dessus.
- **Le nom du tour sous « Réglages »**, à la place du numéro de version, pour savoir d'un coup d'œil ce que l'on règle. Il suit la langue du menu : « Settings » et « Heads or tails » en anglais.
- **La même structure pour les quatre tours**, chacun dans ses couleurs : l'en-tête, les réglages propres au tour, les aides à la répétition, l'état de l'écran, les gestes et touches, puis « Rétablir les réglages par défaut ». Le « Test des zones » de la boule de cristal rejoint les aides à la répétition, et son état de l'écran passe après elles, comme ailleurs.
- **Plus de bloc « version »** (version, commit, cache hors-ligne, stockage, affichage) dans les réglages des tours : la version de l'app reste en bas du menu principal.
- Un rechargement de l'app ne laisse plus d'entrée d'historique d'un tour fermé, qui coûtait un « retour » pour rien.
- Tests dans Chrome : la croix (en haut à droite, toujours visible en faisant défiler, un vrai toucher ramène au menu), la même structure dans les quatre réglages, le nom du tour et l'absence de version, en français et en anglais.

## [0.4.0] — 2026-10-03

8 commits

- **Un bouton FR / EN dans le menu principal**, sous le titre, en pixel art comme le reste. Il change aussitôt la langue du menu — noms et descriptions des tours, « Choisis un tour » / « Pick a trick », étiquettes des écrous — et elle est gardée d'une ouverture à l'autre. À la toute première ouverture, l'app suit la langue du téléphone.
- **La langue du menu vaut pour tous les tours.** Chaque tour s'ouvre dans la langue choisie : Pile ou face écrit « 0.20 euro / tails » en anglais, les six prédictions et l'analyseur passent en anglais avec leurs menus.
- **Plus de choix de langue dans les tours** : il disparaît des réglages de Pile ou face et des six prédictions, et les petits boutons FR / EN de la première slide de l'analyseur aussi. On ne choisit la langue qu'à un endroit.
- La boule de cristal n'a qu'une interface en français ; ce qu'elle montre au public, un nombre, ne dépend pas de la langue.
- Tests dans Chrome : le menu qui change de langue et s'en souvient, les tours qui suivent (en anglais puis de retour en français), et l'absence de tout autre choix de langue.

## [0.3.0] — 2026-10-03

7 commits

Le menu principal passe en pixel art, façon console 8 bits. Les tours eux-mêmes ne changent pas : ce que voit le public reste identique.

- **Une palette réduite** de console (« Sweetie 16 ») sur un ciel de nuit à étoiles carrées, avec de légères lignes de balayage.
- **Une police pixel, Press Start 2P**, embarquée avec l'app comme Caveat : 5 ko, lettres accentuées comprises, sous licence SIL OFL 1.1 ; elle fonctionne hors-ligne.
- **Des cadres aux coins crénelés** et des ombres sans flou ; un bouton touché s'enfonce d'un pixel et passe en bleu et or.
- **« Choisis un tour » clignote** sous le titre, comme l'écran titre d'un jeu (immobile si le téléphone demande de réduire les animations).
- **Les icônes des tours redessinées en pixels** : la boule sur son pied doré, la carte et sa pièce de 20 centimes, l'éventail de cartes, le pique de l'analyseur dans son orbite. Chacune est une grille de 16 × 16 dans `src/content/pixels.ts` ; les copies PNG des icônes des tours disparaissent.
- **L'écrou ⚙ en pixels**, calculé et non dessiné à la main : symétrique dans tous les sens, son trou de 4 × 4 pixels au centre exact — les tests le vérifient.
- **L'icône de l'app** reprend les quatre icônes en pixels, chacune dans son cadre.

## [0.2.0] — 2026-10-03

6 commits

- **Tous les tours dans une seule application.** Mes tours ne se contente plus d'ouvrir les apps des tours : elle contient sa propre copie de chacun (Boule de cristal, Pile ou face, Les six prédictions, Analyseur Q), dans `src/tours/` et `public/tours/`, et les affiche en plein écran dans un cadre qui isole leurs styles et leurs gestes. Les dépôts d'origine ne sont pas touchés : leurs adresses continuent de fonctionner seules.
- **Un écrou ⚙ sur chaque tuile** ouvre les réglages du tour, et seulement eux (dos des cartes, délai, routine, langue…) ; « Fermer » ramène au menu. Le menu du tour ne s'ouvre plus pendant la routine.
- **La fin de la routine ramène au menu** : le double toucher après la révélation (boule de cristal, pile ou face), le double toucher sur la table vide (six prédictions), « suivante » après la dernière slide (analyseur). La touche R d'une télécommande fait de même.
- **L'appui de 3 s pendant un tour est une sortie de secours** : retour au menu, sans finir la routine. Le doigt qui se relève sur le menu ne relance pas la tuile placée dessous. Le geste retour d'Android referme aussi le tour.
- Chaque ouverture d'un tour commence une nouvelle routine (l'analyseur reprend à la première slide). Les réglages de chaque tour sont gardés d'une ouverture à l'autre.
- Un seul service worker met toute l'application en cache, tours compris : tout fonctionne hors-ligne dès la première ouverture avec du réseau. Une nouvelle version ne s'affiche jamais en plein tour.
- Tests : les tests unitaires des quatre tours sont repris (178 en tout), et 12 tests dans Chrome jouent chaque routine en entier jusqu'au retour au menu, l'écrou ⚙, la sortie de secours, le geste retour et le hors-ligne.
- **L'écrou ⚙ redessiné** : sa roue dentée, tracée à la main, n'était pas symétrique, et le trou ne tombait pas au milieu. Ses huit dents sont maintenant calculées autour du même centre que le trou.
- **Le dépôt s'appelle désormais `mes-tours`, et l'app a une nouvelle adresse : https://dezande.github.io/mes-tours/.** Elle était à la racine du site pour couvrir les dossiers des autres tours ; maintenant qu'elle contient sa propre copie de chacun, elle n'en a plus besoin. Son identifiant devient `/mes-tours/`, son périmètre son propre dossier. La racine `https://dezande.github.io/` ne montre plus rien : l'app installée depuis l'ancienne adresse est à désinstaller, puis à réinstaller depuis la nouvelle. Les réglages des tours sont gardés (même site).

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



[0.7.0]: https://github.com/dezande/mes-tours/releases/tag/v0.7.0
[0.6.5]: https://github.com/dezande/mes-tours/releases/tag/v0.6.5
[0.6.4]: https://github.com/dezande/mes-tours/releases/tag/v0.6.4
[0.6.3]: https://github.com/dezande/mes-tours/releases/tag/v0.6.3
[0.6.2]: https://github.com/dezande/mes-tours/releases/tag/v0.6.2
[0.6.1]: https://github.com/dezande/mes-tours/releases/tag/v0.6.1
[0.6.0]: https://github.com/dezande/mes-tours/releases/tag/v0.6.0
[0.5.0]: https://github.com/dezande/mes-tours/releases/tag/v0.5.0
[0.4.0]: https://github.com/dezande/mes-tours/releases/tag/v0.4.0
[0.3.0]: https://github.com/dezande/mes-tours/releases/tag/v0.3.0
[0.2.0]: https://github.com/dezande/mes-tours/releases/tag/v0.2.0
[0.1.0]: https://github.com/dezande/mes-tours/releases/tag/v0.1.0
