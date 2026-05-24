# CHANGELOG — Phase 1 : Nettoyage et corrections

## Objectif
Retirer le code mort, corriger les bugs identifiés à l'audit, refactoriser la
génération des miniatures. **Aucun changement fonctionnel visible** par
l'utilisateur final.

## Fichiers supprimés

| Fichier | Taille | Raison |
|---|---|---|
| `js/3dhop/jquery.js` | 89 Ko | Aucune référence à jQuery dans tout le code (dead code complet). |
| `js/3dhop/helpers.js` | 4 Ko | Fonctions utilitaires jamais appelées. |
| `js/3dhop/nexus.monitor.js` | 6 Ko | Utilitaire de debug non chargé. |
| `js/3dhop/ply.js` | 29 Ko | Loader PLY, on n'utilise que du NXZ. |
| `js/3dhop/trackball_rail.js` | 17 Ko | Caméra non utilisée. |
| `js/3dhop/trackball_pantilt.js` | 13 Ko | Caméra non utilisée. |
| `js/3dhop/trackball_sphere.js` | 13 Ko | Caméra non utilisée. |
| `js/3dhop/trackball_turntable_pan.js` | 15 Ko | Caméra non utilisée (on utilise TurnTableTrackball sans pan). |
| `js/3dhop/init.js` | 27 Ko | Réécrit dans `app.js` (10% du code utile, 90% dead). |

**Total retiré : ~213 Ko** de JavaScript inutile.

## Fichiers ajoutés ou modifiés

### `index.html` — REMPLACÉ
- Suppression du `<link>` Google Fonts (préparation pour offline en phase 2).
- Suppression des 5 balises `<script>` vers les fichiers JS supprimés.
- Suppression des 3 boutons de miniatures en dur (générés dynamiquement maintenant).
- Footnote vidé (rempli dynamiquement par `loadProject()`).
- Plus d'attributs `aria-current` en dur (gérés dynamiquement).
- Ajout `role="tablist"` sur `#thumbs` pour l'accessibilité.

### `js/app.js` — REMPLACÉ
Nouveau fichier propre, organisé en sections numérotées :
1. Configuration PROJECTS (enrichie : `thumbnail` + `footnote` par projet)
2. Helpers canvas (`resizeCanvasToDisplaySize`, `kickRender`)
3. Layout & UI (`setToolbarLayout`, `buildThumbnails`, `updateActiveThumbnail`)
4. Chargement de scène Nexus (`setNXZScene`)
5. Chargement d'un projet (`loadProject`)
6. Toolbar actions (`actionsToolbar`, `bindToolbar`) — remplace l'ex-`init.js`
7. Initialisation (`initApp`)

**Bug fixes intégrés :**
- ❌ Supprimé : `fetch(nxzUrl, { cache: "no-store" })` qui re-downloadait le NXZ entier à chaque clic
- ❌ Supprimé : double instanciation potentielle de `Presenter` (`setup3dhop` mort dans init.js)
- ✅ Polling `_isSceneReady` passé de 100ms à 50ms (plus réactif)
- ✅ Garde `currentProjectId` pour éviter de recharger le même projet 2x
- ✅ Resize debouncé via `requestAnimationFrame` (plus fluide pendant un redimensionnement continu)
- ✅ Drag d'image désactivé (`img.draggable = false` + `dragstart` preventDefault)

### `.gitignore` — MODIFIÉ
Ajout de `assets/models/` (les NXZ ne doivent pas être commités sur GitHub).

## Bilan chiffré

| Métrique | Avant | Après | Δ |
|---|---|---|---|
| Fichiers dans `js/3dhop/` | 16 | 7 | -9 |
| Taille de `js/3dhop/` | 792 Ko | 552 Ko | -30% |
| Lignes JS totales | 12 785 | 8 627 | -32% |
| `<script>` chargés dans HTML | 9 | 4 | -56% |

## Tests de non-régression à effectuer

1. **Démarrage** : `npx http-server -p 8000` puis ouvrir `http://localhost:8000`.
2. **Premier bateau** : le canoë Sadoux doit s'afficher au démarrage avec son
   plan, son fond, son titre, sa miniature active.
3. **Switch entre bateaux** : cliquer sur chaque miniature, vérifier que :
   - Le titre change
   - Le plan change
   - Le fond change
   - Le modèle 3D se recharge correctement
   - La miniature active est mise à jour (style "active")
4. **Toolbar** :
   - Home → recentre la caméra
   - Zoom in (clic simple + clic maintenu pour répétition)
   - Zoom out (idem)
5. **Interactions canvas** :
   - Drag à la souris → rotation
   - Molette → zoom
   - Pas de menu contextuel au clic droit
6. **Resize fenêtre** : le canvas se redimensionne, le rendu reste correct.

## Ce qui n'a PAS encore été fait (à venir dans les phases suivantes)

- **Phase 2** : passage en local pur (NXZ locaux, fonts locales)
- **Phase 3** : ajout possibilité d'ajouter bateaux supplémentaires
- **Phase 4** : responsive multi-format
- **Phase 5** : ajout des nouveaux bateaux
- **Phase 6** : packaging clé USB avec serveur statique embarqué
- **Phase 7** : robustesse kiosque (gestion d'erreur visuelle, auto-reset, etc.)
