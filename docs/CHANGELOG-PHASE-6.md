# CHANGELOG — Phase 6 : Packaging clé USB

## Objectif
Permettre un démarrage **instantané, hors-ligne, sans dépendance Node.js**
de la borne via un simple double-clic sur `start.bat`.

---

## ⚠️ Action manuelle requise

**Télécharger le binaire serveur statique** (une seule fois) :

1. Aller sur https://github.com/static-web-server/static-web-server/releases/latest
2. Télécharger pour ta plateforme :
   - **Windows** : `static-web-server-v2.42.0-x86_64-pc-windows-msvc.zip`
   - macOS : `...-x86_64-apple-darwin.tar.gz`
   - Linux : `...-x86_64-unknown-linux-gnu.tar.gz`
3. Décompresser et copier le binaire :
   - **Windows** : `static-web-server.exe` → `tools/static-web-server.exe`
   - macOS : binaire → renommer `static-web-server-macos` → `tools/`
   - Linux : binaire → renommer `static-web-server-linux` → `tools/`
4. Sur macOS/Linux : `chmod +x tools/static-web-server-*`

**Pourquoi pas inclus dans le zip ?**
- Binaire de 4 Mo officiel, mieux que tu le télécharges depuis la source
- Te permet de mettre à jour facilement
- Tu peux vérifier le SHA256 publié sur https://static-web-server.net/download-and-install/

---

## Fichiers ajoutés

### `start.bat` (Windows — PROD)
- **Mode kiosque activé par défaut** (plein écran sans barre Chrome)
- Vérifie que `tools/static-web-server.exe` est présent
- Vérifie que les `.nxz` sont présents (warning si manquants)
- Détecte Chrome → Edge (fallback)
- Lance le serveur sur `127.0.0.1:8000` (localhost only, pas exposé réseau)
- Boucle d'attente : ferme le serveur quand le navigateur est fermé
- Pour passer en mode dev : commenter `set KIOSK=1` ou utiliser `start-dev.bat`

### `start-dev.bat` (Windows — DEV)
- Identique à `start.bat` mais **mode fenêtre normale** (avec bordures)
- Pour le développement uniquement
- DevTools accessibles avec F12

### `stop.bat` (Windows)
- Ferme proprement Chrome/Edge + serveur
- Essentiel en mode kiosque où Alt+F4 peut être bloqué
- À mettre en raccourci clavier sur le bureau (ex: Ctrl+Alt+Q)

### `start.sh` (macOS / Linux)
- **Mode kiosque activé par défaut**
- Multi-plateforme : détecte macOS vs Linux et choisit le bon binaire
  (`static-web-server-macos` vs `static-web-server-linux`)
- Détecte Chrome → Chromium → Edge
- Mode dev : `KIOSK=0 ./start.sh`
- Cleanup propre avec `trap`

### `INSTALL.md`
Guide complet d'installation pour le technicien :
- Téléchargement du binaire serveur
- Placement des NXZ
- Configuration mode kiosque
- Résolution de problèmes
- Recommandations sécurité kiosque (autologin, etc.)

### `tools/` (dossier vide)
À remplir avec le binaire téléchargé.

---

## Fichiers modifiés

### `README.md`
- Refondu en page d'accueil avec liens vers `INSTALL.md`, `README-EDITION.md`,
  changelogs
- Tableau récap démarrage par plateforme
- Structure projet documentée

---

## Comment ça marche en runtime

```
1. Utilisateur double-clique sur start.bat
   ↓
2. start.bat lance static-web-server.exe en arrière-plan (fenêtre minimisée)
   ↓
3. Le serveur écoute sur http://127.0.0.1:8000 (localhost only, sécurité)
   ↓
4. start.bat lance Chrome --app=http://127.0.0.1:8000
   ↓
5. Chrome ouvre la borne en fenêtre sans barre d'adresse
   ↓
6. Quand l'utilisateur ferme Chrome :
   ↓
7. start.bat détecte la fin du processus et ferme le serveur
   ↓
8. Fin propre, aucun processus orphelin
```

---

## Tests à effectuer

### Test 1 — Démarrage standard
1. Avoir téléchargé et placé `static-web-server.exe` dans `tools/`
2. Avoir placé les 3 NXZ dans `assets/models/`
3. **Couper internet**
4. Double-cliquer sur `start.bat`
5. **Attendu** :
   - Fenêtre console s'ouvre avec logs informatifs
   - Une 2ème fenêtre console minimisée apparaît (le serveur)
   - Chrome s'ouvre en fenêtre `--app`, sans barre d'adresse
   - La borne se charge en <1s (vs 1-3 min avec `npx`)
   - Le premier bateau s'affiche

### Test 2 — Fermeture
1. Fermer la fenêtre Chrome
2. **Attendu** :
   - La fenêtre console "Serveur Borne 3D" se ferme
   - La fenêtre console principale se ferme aussi
   - Aucun `static-web-server.exe` dans le Gestionnaire de tâches

### Test 3 — Mode kiosque
1. Éditer `start.bat` : décommenter `set KIOSK=1`
2. Lancer
3. **Attendu** :
   - Chrome s'ouvre en **plein écran absolu**, sans aucune barre
   - Pas de bordure de fenêtre
   - Touche Échap → ne quitte pas (kiosk mode)
4. Pour quitter : double-cliquer sur `stop.bat`

### Test 4 — NXZ manquants
1. Retirer temporairement un NXZ de `assets/models/`
2. Lancer `start.bat`
3. **Attendu** : warning "Certains modèles 3D sont absents", puis démarrage
   quand même, et l'overlay d'erreur (phase 2) s'affiche dans le navigateur
   pour le bateau manquant

### Test 5 — Binaire absent
1. Renommer temporairement `tools/static-web-server.exe`
2. Lancer `start.bat`
3. **Attendu** : message d'erreur clair avec lien de téléchargement,
   `pause` pour que tu puisses lire, exit 1

---

## Bilan : ce qui change concrètement pour toi

| Avant phase 6 | Après phase 6 |
|---|---|
| `npx http-server -p 8000 -c-1` | Double-clic `start.bat` |
| 1-3 min de timeout npm sans internet | Démarrage instantané |
| Besoin de Node.js | Binaire 4 Mo embarqué |
| Mode kiosque manuel | Activable en 1 ligne dans `start.bat` |
| Pas de gestion fermeture | Stop propre via `stop.bat` |

---

## Prochaines étapes

- **Phase 3** : ajout des nouveaux bateaux (config déjà prête via `projects.json`)
- **Phase 4** : responsive sérieux (multi-format)
- **Phase 5** : ajout des bateaux fournis par le client
- **Phase 7** : robustesse kiosque (auto-reset après inactivité, etc.)
