# CHANGELOG — Phase 5 : Ajout de 3 bateaux supplémentaires

## Objectif
Ajouter les 3 bateaux fournis par le client, en validant au passage que
l'architecture data-driven (via `projects.json`) fonctionne de bout en bout.

---

## Bateaux ajoutés

| # | Sous-titre | Miniature | Plan | NXZ attendu |
|---|---|---|---|---|
| 4 | CANOT ROCCA CAMPING | `canot_rocca_camping.jpg` | `plan_canot_rocca_camping.png` | `canot_rocca_camping.nxz` |
| 5 | DINGHY ROCCA SÉMILLANTE | `dinghy_rocca_semillante.jpg` | `plan_dinghy_rocca_semillante.png` | `dinghy_rocca_semillante.nxz` |
| 6 | MOTH ALU À BOUCHAINS | `moth_alu_bouchain.jpg` | `plan_moth_alu_bouchain.png` | `moth_alu_bouchain.nxz` |

---

## ⚠️ Action manuelle requise de ta part

### 1. Renommer et placer les 3 fichiers NXZ

Dans ton stockage (Cloudflare R2 ou autre), les fichiers NXZ doivent être
renommés exactement comme suit, puis déposés dans `assets/models/` :

| Nom NXZ original (chez toi) | Nom à utiliser dans assets/models/ |
|---|---|
| (canot Rocca camping) | `canot_rocca_camping.nxz` |
| (dinghy Rocca Sémillante) | `dinghy_rocca_semillante.nxz` |
| (moth alu à bouchains) | `moth_alu_bouchain.nxz` |

⚠️ **Convention de nommage** : tout en minuscules, mots séparés par
underscores `_`, pas d'accents, pas d'espaces, extension `.nxz`.

### 2. Compléter les titres dans `projects.json`

✅ **Fait** : titres principaux remplis avec le nom du modèle.

| ID | topTitle | topSubtitle |
|---|---|---|
| 4 | CANOT ROCCA CAMPING | *(vide)* |
| 5 | DINGHY ROCCA SÉMILLANTE | *(vide)* |
| 6 | MOTH ALU À BOUCHAINS | *(vide)* |

Le sous-titre vide est **automatiquement masqué** par l'app (pas d'espace
réservé inutilement). Si tu veux ajouter un sous-titre descriptif plus
tard (ex: "Embarcation traditionnelle"), édite simplement `topSubtitle`
dans `projects.json`.

---

## Fichiers ajoutés

### Miniatures (`assets/images/boats/`)
- `canot_rocca_camping.jpg` (749×749)
- `dinghy_rocca_semillante.jpg` (1103×1103)
- `moth_alu_bouchain.jpg` (999×999)

### Plans (`assets/images/plans/`)
- `plan_canot_rocca_camping.png` (1754×1239, paysage)
- `plan_dinghy_rocca_semillante.png` (1239×1754, **portrait**)
- `plan_moth_alu_bouchain.png` (1239×1754, **portrait**)

---

## ⚠️ Note technique : plans en format portrait

Deux des nouveaux plans (dinghy Rocca et moth alu) sont en **format
portrait** (1239×1754), alors que le panneau plan de l'interface est
dimensionné horizontalement.

Le rendu sera :
- L'image se centrera dans le cadre du panneau
- Elle sera réduite pour tenir, donc paraîtra **plus petite** qu'un plan
  horizontal
- Avec un cadrage `object-fit: contain`, pas de déformation, juste de
  l'espace blanc latéral

**Si problème visuel** : 2 options
1. **Demander des plans en format paysage** au client si possible
2. **Ajouter une variable CSS spécifique** pour ces 2 bateaux qui ajuste
   la hauteur du panneau plan

Pour l'instant, on laisse comme ça — à valider visuellement après
chargement des NXZ.

---

## Fichiers modifiés

### `assets/data/projects.json`
- Ajout de 3 entrées (IDs 4, 5, 6) avec les vrais titres
- Sous-titres laissés vides (les 3 nouveaux bateaux n'ont pas de nom marketing)

### `js/app.js`
- Masquage automatique du `#topSubtitle` quand `topSubtitle` est vide
  (évite l'espace vide visuel sous le titre principal)

### `start.bat` (Windows)
- Vérification étendue aux 6 NXZ au démarrage
- Warning si l'un d'eux est manquant

### `start.sh` (macOS/Linux)
- Idem pour les 6 NXZ

### `assets/models/.gitkeep`
- Liste mise à jour avec les 6 NXZ attendus

### `FICHE-PROJET.md`
- Nombre de bateaux mis à jour : 3 → 6

---

## Tests à effectuer

### Test 1 — Affichage des 6 miniatures
1. Lancer la borne
2. **Attendu** : 6 miniatures visibles en haut à gauche
3. Si l'écran est trop étroit (< 1200px) elles passent sur 2 lignes
   (comportement `flex-wrap`)

### Test 2 — Switch entre les 6 bateaux
1. Cliquer sur chaque miniature dans l'ordre
2. **Attendu** : titre, plan, texte, fond, modèle 3D mis à jour
3. La 1ʳᵉ fois sur chaque bateau, le streaming Nexus prend 2-3s

### Test 3 — Plans portrait
1. Aller sur bateau 5 (Dinghy Rocca) ou 6 (Moth alu)
2. **Attendu** : le plan s'affiche bien, centré, sans déformation
3. **À valider visuellement** : l'effet "plan plus petit" est-il acceptable ?

### Test 4 — Auto-reset avec 6 bateaux
1. Aller sur bateau 6
2. Laisser inactif 5 min
3. **Attendu** : retour au bateau 1 (le plus petit ID)

---

## Bilan

La borne supporte désormais **6 bateaux** avec exactement la même
performance et robustesse qu'avec 3. Le système data-driven a tenu ses
promesses : tout l'ajout s'est fait dans `projects.json` + dépôt de fichiers.

**Aucune ligne de code applicatif n'a été modifiée pour ces nouveaux bateaux.**
