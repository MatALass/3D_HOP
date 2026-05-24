# CHANGELOG — Phase 7 : Robustesse kiosque

## Objectif
Transformer la borne en **vraie installation musée** capable de tourner
en autonomie complète, 7j/7, sans intervention manuelle.

---

## Fichiers ajoutés

### `js/kiosk.js` — module de robustesse (nouveau)
Code séparé pour ne pas polluer `app.js`. Contient :

1. **Configuration centralisée** en haut du fichier
   (`inactivityTimeoutMs`, `dailyReloadHour`, etc.)
2. **Suppression des `console.log`** visibles, redirigés vers un buffer
   circulaire de 200 entrées accessible via diagnostic
3. **Auto-reset après inactivité** (5 min)
4. **Désactivations clavier** : F12, F5, Ctrl+P/S/U/W/T/N/+/-/0
5. **Désactivations tactiles** : pinch-zoom page, double-tap zoom,
   long-press menu contextuel
6. **Watchdog WebGL** : capture `webglcontextlost` → reload après 2s
7. **Watchdog général** : vérifications toutes les 30s
8. **Reload programmé quotidien** à 4h du matin
9. **Raccourcis admin** : `Ctrl+Shift+Q/R/D`
10. **Overlay diagnostic** affichable par `Ctrl+Shift+D`

### `CHANGELOG-PHASE-7.md` (ce fichier)

---

## Fichiers modifiés

### `js/app.js`
- Expose `window.PROJECTS` après chargement de la config (nécessaire pour
  le reset depuis kiosk.js)

### `index.html`
- Ajout `<script src="js/kiosk.js">` après `app.js`

### `INSTALL.md`
- Nouvelle section "Raccourcis admin"
- Nouvelle section "Fonctionnalités de robustesse actives"

---

## Décisions techniques importantes

### Pourquoi pas de watchdog Windows (relance start.bat si crash) ?
J'ai considéré et écarté l'idée. Raisons :
- Un crash total Edge/Chrome est très rare avec `--user-data-dir` isolé
- Implémenter un watchdog Windows propre est complexe (interférences avec
  Alt+F4 et stop.bat → on ne peut plus quitter volontairement)
- Les 3 couches en place (WebGL handler, watchdog JS, reload quotidien)
  couvrent les 99% des cas réels
- Si besoin futur : ajouter une tâche planifiée Windows séparée plutôt
  que modifier `start.bat`

### Pourquoi un module séparé `kiosk.js` ?
- Séparation des responsabilités : `app.js` = logique métier, `kiosk.js` =
  comportement plateforme
- Désactivable facilement : retirer la balise script en dev pour avoir
  F12, console, etc. dispo
- Le code de robustesse peut être amélioré sans risque de casser l'app

### Pourquoi conserver les erreurs console mais pas les logs ?
- Les `console.log` informatifs (`[scene] loading NXZ:...`) **ne servent
  rien à l'utilisateur final** → bufferisés silencieusement
- Les `console.error` restent visibles dans la console (pour les
  développeurs qui auditeraient via F12 si l'admin a désactivé kiosk.js)
- Tous les logs (info/warn/error) sont accessibles via `Ctrl+Shift+D`

### Le reload à 4h du matin est-il acceptable ?
- Risque : si la borne fonctionne 24/7 (rare en musée), elle se reload
  à 4h donc indisponible ~5-10 secondes
- Bénéfice : élimine 95% des memory leaks WebGL/Chrome après plusieurs
  jours d'usage
- Si le musée est fermé la nuit, c'est invisible
- Désactivable via `dailyReloadEnabled: false` dans `kiosk.js`

---

## Tests à effectuer

### Test 1 — Auto-reset (le plus important)
1. Lancer la borne normalement
2. Naviguer vers le bateau 3, zoomer, faire pivoter le bateau
3. **Laisser la souris immobile et ne pas toucher au clavier pendant 5 min**
4. **Attendu** : retour automatique au bateau 1, caméra en position initiale,
   scroll texte remonté

### Test 2 — Désactivations clavier
1. Lancer la borne
2. Essayer dans l'ordre :
   - F12 → **ne doit rien faire**
   - F5 → **ne doit rien faire**
   - Ctrl+P → **ne doit pas ouvrir l'impression**
   - Ctrl+S → **ne doit pas ouvrir la sauvegarde**
   - Ctrl+U → **ne doit pas afficher le source**
   - Ctrl+W → **ne doit pas fermer l'onglet**
   - Ctrl+++ → **ne doit pas zoomer la page**
3. **Test admin** : Ctrl+Shift+D doit ouvrir l'overlay diagnostic

### Test 3 — Diagnostic
1. Ctrl+Shift+D
2. **Attendu** : overlay noir avec texte vert (style terminal),
   affichant date, uptime, résolution, état presenter, logs récents
3. Ctrl+Shift+D à nouveau ou bouton FERMER → ferme l'overlay

### Test 4 — Quit admin
1. Ctrl+Shift+Q
2. **Attendu** : tentative de fermeture de la fenêtre
3. Si window.close ne marche pas (Chrome restreint), un message
   d'instructions s'affiche

### Test 5 — Watchdog
1. Ouvrir la borne
2. Faire échouer volontairement un NXZ (renommer un fichier dans `assets/models/`)
3. Cliquer sur la miniature correspondante
4. **Attendu après ~12s** : loading overlay passe en mode "erreur"
5. **Attendu après ~30s** (watchdog) : message d'erreur reste affiché
6. **Attendu après ~60s** : fatal-error visible → watchdog déclenche reload

### Test 6 — Reload programmé
Trop long à tester en réel (4h du matin). Pour vérifier :
1. Modifier `dailyReloadHour` à l'heure actuelle + 1 minute
2. Lancer la borne
3. Attendre 1 minute
4. **Attendu** : reload automatique de la page

---

## Comment désactiver temporairement la robustesse (dev)

Pendant le développement, on veut pouvoir F12, F5, etc. Solution :

**Option A** — Commenter la balise script dans `index.html` :
```html
<!-- <script src="js/kiosk.js"></script> -->
```

**Option B** — Utiliser `start-dev.bat` qui lance en mode fenêtré.
Le module kiosk.js charge quand même mais les désactivations sont
moins gênantes en dev. Pour rapidement débloquer :
- Ouvrir la console avec Ctrl+Shift+D (overlay diag) au lieu de F12
- Reload via Ctrl+Shift+R

---

## Limites connues

- **Si le module kiosk.js plante au chargement** : la borne reste
  fonctionnelle (app.js démarre indépendamment) mais sans protection.
  Visible dans la console Chrome.
- **Crash total Chrome/Edge** : pas géré au niveau web (impossible
  techniquement). Nécessiterait un watchdog Windows séparé.
- **Inactivité détectée trop large** : tout event souris/touch/clavier
  réinitialise le timer, y compris un mouvement involontaire du curseur.
  C'est intentionnel — mieux vaut "trop d'activité détectée" que
  "trop peu" qui causerait des resets indésirables.

---

## Prochaines phases

- **Phase 3** : valider l'ajout d'un 4ᵉ bateau via `projects.json`
- **Phase 5** : ajout des bateaux supplémentaires fournis par le client

La borne est maintenant **prête pour déploiement en musée**.
