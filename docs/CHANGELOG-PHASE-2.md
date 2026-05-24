# CHANGELOG — Phase 2 : Passage en local pur

## Objectif
Faire fonctionner l'application **sans aucune dépendance Internet** :
- Modèles 3D (NXZ) chargés depuis le disque local
- Polices Inter en local (suppression du `<link>` Google Fonts)
- Configuration externalisée dans `projects.json` (éditable par le client)
- Ajout d'overlays de chargement et de gestion d'erreur visibles

---

## ⚠️ Action manuelle requise de ta part

### 1. Récupérer les 3 NXZ depuis Cloudflare R2

Télécharge les 3 fichiers suivants depuis ton bucket R2 :

| Fichier source (R2) | Destination locale |
|---|---|
| `canoe_sadoux.nxz` (49 Mo) | `assets/models/canoe_sadoux.nxz` |
| `inti_huatana.nxz` (61 Mo) | `assets/models/inti_huatana.nxz` |
| `dinghy_kirie.nxz` (51 Mo) | `assets/models/dinghy_kirie.nxz` |

**Note** : le dossier `assets/models/` est déjà créé. Et il est dans le
`.gitignore`, donc les NXZ ne seront jamais commités sur GitHub.

### 2. (Optionnel mais recommandé) Convertir les fonts en WOFF2

Les .ttf actuels font 874 + 904 = **1.78 Mo**. Conversion en WOFF2 :
**~600 Ko** total (-65 %).

**Méthode simple (en ligne)** : https://transfonter.org → upload des .ttf →
cocher "WOFF2" uniquement → télécharger → remplacer les .ttf dans `fonts/`.

Si tu fais la conversion, **modifier `css/app.css`** lignes 9–17 :
```css
@font-face {
  font-family: 'Inter';
  src: url('../fonts/Inter-VariableFont.woff2') format('woff2');
  ...
}
```
Et adapter pareil pour la version italic.

**Skip OK** si tu veux pas t'embêter. C'est un nice-to-have, pas un bloquant.

---

## Fichiers ajoutés

### `assets/data/projects.json`
Configuration externalisée. Le client peut éditer titres, textes,
et même ajouter de nouveaux bateaux sans toucher au code JS.

### `README-EDITION.md`
Guide pour le client : comment éditer les textes, ajouter un bateau,
quelle syntaxe HTML utiliser, etc.

### `assets/models/` (vide)
Dossier où déposer les NXZ. Dans le `.gitignore`.

---

## Fichiers modifiés

### `js/app.js`
- ➕ `loadConfig()` : charge `projects.json` au démarrage
- ➕ Loading overlay visible pendant le streaming Nexus
- ➕ Gestion d'erreur fatale (overlay rouge, config manquante, WebGL absent)
- ➕ Message d'erreur si le NXZ ne se charge pas en 12s
- ➕ `aria-label` sur les boutons miniatures (accessibilité)
- ✏️ NXZ chargés depuis chemins relatifs locaux (plus de R2)

### `index.html`
- ➕ `<div id="loading-overlay">` : spinner + message pendant chargement
- ➕ `<div id="fatal-error">` : modale d'erreur fatale (config manquante etc.)
- ✏️ Pas de `<link>` Google Fonts (offline ready)

### `css/app.css` — **réécrit complètement**
- ➕ `@font-face` pour Inter en local (Regular + Italic)
- ➕ Variables CSS fluides avec `clamp()` (prépa responsive phase 4)
- ➕ **Miniature active : option A (cadre bleu marine 3px + halo)**
- ➕ **Miniature inactive au hover : élévation translateY(-3px) + ombre**
- ➕ Styles loading overlay (spinner CSS animé)
- ➕ Styles fatal error overlay
- ➕ Focus visible (`:focus-visible`) pour navigation clavier
- ✏️ Toolbar icons en taille fluide (28–44px selon écran)

### `fonts/`
- ✏️ Renommé `Inter-VariableFont_opsz,wght.ttf` → `Inter-VariableFont.ttf`
- ✏️ Renommé `Inter-Italic-VariableFont_opsz,wght.ttf` → `Inter-Italic-VariableFont.ttf`
  (suppression de la virgule dans le nom qui pose problème dans certains chemins)

---

## Tests à effectuer

### Test 1 — Phase 2 en mode dev (avec serveur)
1. Lancer `npx http-server -p 8000 -c-1` à la racine du projet
2. Ouvrir `http://localhost:8000`
3. **Vérifications :**
   - [ ] Le premier bateau (canoë Sadoux) s'affiche avec son plan
   - [ ] Le spinner de chargement apparaît pendant le streaming Nexus
   - [ ] Le spinner disparaît une fois le modèle prêt
   - [ ] La miniature active a un **cadre bleu marine** (option A)
   - [ ] Au survol d'une miniature **inactive**, elle se soulève légèrement
   - [ ] Switch entre bateaux fonctionne
   - [ ] La police Inter est appliquée (titres en gras lourd, pas en Arial)

### Test 2 — Offline strict (vrai test "local")
1. **Couper le wifi / déconnecter Internet**
2. Relancer le serveur, recharger la page
3. **Tout doit fonctionner exactement pareil**
4. Onglet Network des DevTools : aucune requête vers `fonts.googleapis.com`,
   aucune requête vers `pub-2429006b138e41bca67d697e016d13b3.r2.dev`

### Test 3 — Gestion d'erreurs
1. **Test config manquante** : renommer temporairement `projects.json`
   en `projects.json.bak`. Recharger : overlay rouge "Impossible de charger
   la configuration" doit apparaître.
2. **Test NXZ manquant** : renommer un des `.nxz` (ex: `canoe_sadoux.nxz.bak`).
   Cliquer sur sa miniature : après 12s, message "Modèle 3D indisponible.
   Essayez un autre bateau."

### Test 4 — Édition par le client (simulation)
1. Ouvrir `projects.json` dans Bloc-notes
2. Modifier le texte du bateau 1 : remplacer la valeur de `"text"` par
   `"<h3>Test</h3><p>Ceci est un test d'édition.</p>"`
3. Sauvegarder, recharger la page : le texte doit avoir changé.

---

## Bilan chiffré phase 2

| Métrique | Avant phase 2 | Après phase 2 |
|---|---|---|
| Requêtes externes (Google Fonts) | 2 (CSS + WOFF) | 0 |
| Requêtes vers R2 (NXZ) | 1 par bateau | 0 |
| Total requêtes au chargement initial | ~10 | ~6 (toutes locales) |
| **Application 100% offline ?** | ❌ | ✅ |

---

## Prochaines étapes (à venir)

- **Phase 3** : refactor architecture pour ajout facile de bateaux (déjà
  partiellement fait via projects.json — il reste à valider l'ajout d'un
  4ᵉ bateau de bout en bout).
- **Phase 4** : responsive avancé (portrait, ultrawide, tactile).
- **Phase 5** : ajout des nouveaux bateaux fournis par le client.
- **Phase 6** : packaging clé USB (start.bat + serveur statique embarqué).
- **Phase 7** : robustesse kiosque (auto-reset, mode kiosque, etc.).
