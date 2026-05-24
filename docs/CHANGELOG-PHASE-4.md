# CHANGELOG — Phase 4 : Responsive multi-format

## Objectif
Adapter automatiquement la borne à **tous les formats d'écran** sans
intervention manuelle.

---

## Décisions de design retenues

### Portrait / totem (1080×1920, etc.)
**Hors périmètre actuel.** Le client préfère se concentrer sur les formats
paysage pour l'instant. Si un poste musée se retrouve en portrait, le
rendu sera dégradé mais utilisable (le navigateur applique le layout par
défaut, juste mal proportionné).

Un layout empilé vertical reste **préparé en commentaire** dans
`css/app.css` (section 14.1) pour activation ultérieure si besoin —
décommenter et le portrait fonctionne immédiatement.

### Ultrawide (21:9, 32:9)
**Choix client : agrandir tout proportionnellement.** Aucune limitation
de largeur. Sur un 32:9, le viewer 3D devient très large et les titres
s'agrandissent en conséquence.

### Écrans tactiles
**Choix client : détection automatique via CSS.** `@media (hover: none)
and (pointer: coarse)` détecte précisément les tablettes et bornes
tactiles. Quand détecté :
- Miniatures plus grandes (80-120px au lieu de 56-96px)
- Boutons toolbar plus gros (44-64px au lieu de 28-44px)
- Effet hover désactivé (n'a pas de sens en tactile)
- Effet scale au tap pour feedback visuel

---

## Modifications détaillées

### `css/app.css` — réécrit
- Variables CSS étendues : `--tb-icon-size` (taille fluide des boutons)
- **Anti-scroll strict** : `overflow: hidden; overscroll-behavior: none`
  sur `html, body` (un kiosque ne doit jamais scroller la page)
- **Anti-sélection** : `user-select: none` sur `body`, débloqué uniquement
  sur `#projectText`
- Media queries par aspect-ratio (pas par width) pour gérer indifféremment
  les résolutions 1080p, 1440p, 4K
- 5 media queries actives + 1 commentée (portrait vertical, en réserve)

### `js/app.js` — patches
- **Désactivation drag & drop** sur tout le document (sécurité kiosque)
- **`orientationchange`** géré en plus de `resize` (rotation tablette)
- **`ResizeObserver` sur le canvas** : détecte les changements de taille
  même quand le `resize` window n'est pas déclenché

---

## Breakpoints actifs

| Critère CSS | Cas | Ce qui change |
|---|---|---|
| Par défaut | Desktop 16:9 / 16:10 | Layout actuel |
| `min-aspect-ratio: 2/1` | Ultrawide 21:9, 32:9 | Tout agrandi proportionnellement |
| `min-width: 2560px + standard ratio` | 4K paysage | Tailles agrandies pour lecture à distance |
| `hover: none + pointer: coarse` | Tactile | Miniatures + boutons agrandis, hover désactivé |
| HiDPI / Retina | Tous écrans haute densité | Antialiasing amélioré |

*Note : portrait/totem est hors périmètre. Code préparé en commentaire pour
activation ultérieure (section 14.1 du CSS).*

---

## Tests à effectuer

### Test 1 — Format desktop standard (16:9)
1. Lancer normalement → aucun changement visible
2. Redimensionner Chrome de 1920×1080 à 1280×720
3. **Attendu** : tout se réduit proportionnellement, pas de débordement

### Test 2 — Simulation ultrawide
1. F12 → "Device Mode" → custom 3440×1440 (21:9)
2. **Attendu** : tout est agrandi, viewer occupe plus d'espace, titres plus gros
3. Essayer aussi 5120×1440 (32:9) pour vérifier que rien ne casse

### Test 3 — Simulation 4K paysage
1. F12 → custom 3840×2160
2. **Attendu** : miniatures et titres notablement plus grands, lisibles à 2m

### Test 4 — Simulation tactile
1. F12 → mode tablette (iPad Pro)
2. **Attendu** :
   - Miniatures plus grandes
   - Icônes toolbar plus grandes
   - Pas d'effet hover (juste scale au tap)

### Test 5 — Switch entre bateaux
1. Switch entre les 3 bateaux dans chaque format testé
2. **Attendu** : le bateau 2 (Inti Huatana, toolbar verticale) déclenche
   un re-render correct grâce au `ResizeObserver`

---

## Limites connues

- **Portrait/totem** : hors périmètre actuel. Si un poste se retrouve en
  portrait, le layout par défaut s'applique mal — décommenter le bloc
  section 14.1 du CSS pour activer un layout vertical empilé.
- **Polices Inter à très haute résolution** : sur 4K HiDPI, le rendu peut
  paraître fin. Si problème, augmenter les `font-weight`.

---

## Prochaines phases

- **Phase 3** (court) : valider l'ajout d'un 4ᵉ bateau via `projects.json`
- **Phase 5** : ajout des bateaux supplémentaires fournis par le client
- **Phase 7** : robustesse kiosque (auto-reset après inactivité, etc.)
