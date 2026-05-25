# Guide d'installation et de déploiement

Ce document explique comment **installer et lancer** la borne 3D sur un poste
de musée (ou pour le développement).

> 📌 **Important** : par défaut, `start.bat` (Windows) et `start.sh` (macOS/Linux)
> lancent la borne **en mode kiosque plein écran**, prêt pour la prod.
> Pour le développement, voir la section [Mode développement](#-mode-développement-pour-toi-pendant-le-dev).

---

## 🚀 Installation rapide (Windows)

### 1. Copier le projet

Copier le dossier complet du projet à un emplacement définitif sur le poste
du musée (ex: `C:\Borne3D\` ou sur clé USB `D:\Borne3D\`).

### 2. Télécharger le serveur web (une seule fois)

1. Aller sur https://github.com/static-web-server/static-web-server/releases/latest
2. Télécharger l'archive **Windows** : `static-web-server-vX.Y.Z-x86_64-pc-windows-msvc.zip`
3. Décompresser l'archive
4. Copier le fichier **`static-web-server.exe`** dans le dossier **`tools/`** du projet

### 3. Placer les modèles 3D

Copier les 3 fichiers `.nxz` dans `assets/models/` :
- `canoe_sadoux.nxz`
- `inti_huatana.nxz`
- `dinghy_kirie.nxz`

### 4. Vérifier l'arborescence

```
3DHOP-MUSEE/
├── start.bat                          ← double-cliquer pour démarrer (PROD)
├── start-dev.bat                      ← démarrage mode développement
├── stop.bat                           ← arrêt propre
├── INSTALL.md
├── tools/
│   └── static-web-server.exe          ← 4 Mo, à télécharger
├── assets/models/
│   ├── canoe_sadoux.nxz               ← à placer
│   ├── inti_huatana.nxz               ← à placer
│   └── dinghy_kirie.nxz               ← à placer
└── ... (le reste du projet)
```

### 5. Lancer la borne

**Double-cliquer sur `start.bat`** → la borne s'ouvre en plein écran kiosque.

Pour **quitter** : double-cliquer sur `stop.bat` (ou Alt+F4 si autorisé).

---

## 🍎 Installation macOS / 🐧 Linux

### Téléchargement du serveur

- **macOS** : `static-web-server-v2.42.0-x86_64-apple-darwin.tar.gz`
  → décompresser, renommer en `static-web-server-macos`, placer dans `tools/`
- **Linux** : `static-web-server-v2.42.0-x86_64-unknown-linux-gnu.tar.gz`
  → décompresser, renommer en `static-web-server-linux`, placer dans `tools/`

### Permissions

```bash
chmod +x tools/static-web-server-macos    # ou static-web-server-linux
chmod +x start.sh
```

### Lancement

**Production** (mode kiosque) :
```bash
./start.sh
```

**Développement** (fenêtre normale) :
```bash
KIOSK=0 ./start.sh
```

---

## 💻 Mode développement (pour toi pendant le dev)

Le mode kiosque plein écran est utile pour la borne, mais pas pour développer
(on veut voir la console, redimensionner la fenêtre, etc.).

### Sur Windows

Utiliser **`start-dev.bat`** au lieu de `start.bat` :
- Ouvre Chrome en fenêtre `--app` normale (sans barre d'adresse mais avec
  bordures et possibilité de redimensionner)
- Pas de mode kiosque
- DevTools accessibles avec F12

### Sur macOS / Linux

```bash
KIOSK=0 ./start.sh
```

### Alternative : Node.js (si déjà installé)

Si tu as Node.js et préfères développer dans un onglet Chrome normal avec
hot-reload manuel (F5) :

```bash
# Première fois uniquement
npm install -g http-server

# Puis à chaque démarrage
http-server -p 8000 -c-1
```

Ouvrir http://localhost:8000 dans Chrome.

> ⚠️ **Ne PAS utiliser `npx http-server` sans internet** : `npx` essaie de
> contacter le registre npm pendant 30s-3min avant de timeout. Avec
> `http-server` installé globalement, démarrage instantané hors-ligne.

---

## 🖥 Configuration du mode kiosque

Le mode kiosque est **activé par défaut** dans `start.bat` et `start.sh`.

### Que fait le mode kiosque ?

- **Plein écran absolu** : pas de barre Chrome, pas de bordure de fenêtre
- **Pas de touche F11** : impossible de quitter le plein écran sans `stop.bat`
- **Pas de menu contextuel** sur la page (déjà géré par le code applicatif)
- **Pas d'historique** : navigation arrière désactivée
- **Pas de traduction automatique** Chrome

### Le désactiver temporairement (Windows)

Ouvrir `start.bat` avec Bloc-notes, trouver et commenter la ligne `set KIOSK=1` :
```bat
REM set KIOSK=1
```

### Le désactiver temporairement (macOS/Linux)

```bash
KIOSK=0 ./start.sh
```

---

## ❓ Résolution de problèmes

### "Le serveur tools\static-web-server.exe est introuvable"
→ Étape 2 oubliée. Télécharger le binaire et le placer dans `tools/`.

### "Ni Chrome ni Edge n'a été trouvé"
→ Installer Google Chrome : https://www.google.com/chrome/
→ Ou Microsoft Edge (déjà inclus dans Windows 10/11 récent normalement)

### La borne s'ouvre mais l'écran est gris (pas de modèle 3D)
- Vérifier que les fichiers `.nxz` sont bien dans `assets/models/`
- F12 dans Chrome → onglet Console → chercher l'erreur
- F12 → onglet Network → vérifier les requêtes vers les NXZ

### Le port 8000 est déjà utilisé
→ Modifier `set PORT=8000` dans `start.bat` (ex: 8001, 8080, etc.)

### Impossible de quitter le mode kiosque
→ Double-cliquer `stop.bat` (depuis l'explorateur de fichiers Windows, qu'il
  faudra ouvrir avec un raccourci clavier comme `Win+E`)
→ Ou créer un raccourci sur le bureau avec `Ctrl+Alt+Q` qui lance `stop.bat`
→ En dernier recours : `Ctrl+Alt+Suppr` → Gestionnaire de tâches → fermer
  `chrome.exe` et `static-web-server.exe`

### Comment redémarrer la borne automatiquement au boot ?
- Windows : Planificateur de tâches → tâche au démarrage de session
  → action : lancer `start.bat`
- Combiner avec **autologin Windows** sur un compte dédié pour avoir un
  kiosque qui démarre tout seul.

---

## 🔧 Raccourcis admin (en mode kiosque)

En mode kiosque, ces raccourcis clavier sont disponibles pour
l'administrateur de la borne (non visibles pour les visiteurs) :

| Raccourci | Action |
|---|---|
| `Ctrl+Shift+Q` | Quitter la borne (équivalent à stop.bat) |
| `Ctrl+Shift+R` | Recharger la page entière |
| `Ctrl+Shift+D` | Afficher l'overlay diagnostic (état, logs récents, mémoire) |
| `Alt+F4` | Fermeture forcée du navigateur (toujours disponible) |

L'overlay diagnostic affiche en temps réel :
- Date/heure et uptime de la borne
- Résolution et user-agent
- État du presenter et du canvas
- Consommation mémoire JS heap
- Configuration kiosque active
- 30 derniers logs (info, warn, error)

Refermer avec `Ctrl+Shift+D` ou le bouton FERMER.

## 🛡 Fonctionnalités de robustesse actives

La borne intègre les protections suivantes (module `js/kiosk.js`) :

- **Auto-reset après 5 minutes** d'inactivité : retour au 1er bateau,
  position caméra réinitialisée, scroll texte remonté
- **Reload automatique à 4h du matin** chaque jour (anti memory-leak
  pour les bornes qui tournent en continu)
- **Détection crash WebGL** : si le contexte 3D plante, reload auto
  après 2 secondes
- **Watchdog général** toutes les 30s : vérifie que le presenter,
  le canvas et les overlays sont en bon état
- **Désactivation touches dangereuses** : F12 (DevTools), F5 (reload
  visiteur), Ctrl+P (impression), Ctrl+W (fermer onglet), Ctrl+S
  (sauver), Ctrl+U (source), Ctrl+0/+/- (zoom navigateur)
- **Anti-gestures** : pinch-zoom de la page, double-tap zoom,
  long-press menu contextuel — tous bloqués (le viewer 3D garde ses
  propres gestures)
- **Capture d'erreurs JavaScript** : pas de popup native, log
  silencieux dans le buffer diagnostic

Pour ajuster les délais, éditer les constantes en haut de `js/kiosk.js` :
```js
const CONFIG = {
  inactivityTimeoutMs: 5 * 60 * 1000,    // 5 minutes
  dailyReloadEnabled: true,
  dailyReloadHour: 4,                    // 4h du matin
  ...
};
```

---

## 🔒 Sécurité kiosque (recommandations production)

Pour un poste de musée vraiment verrouillé :

1. **Compte Windows dédié** sans privilèges admin
2. **Autologin** sur ce compte (via `netplwiz` ou registre)
3. **`start.bat` au démarrage** (Planificateur de tâches ou `shell:startup`)
4. **Clavier physique simplifié** ou inexistant — l'idéal en kiosque est
   un écran tactile sans clavier accessible aux visiteurs
5. **Désactiver les raccourcis Windows** (Win+R, Win+E, etc.) via
   stratégies de groupe locales (`gpedit.msc`)
6. **Désactiver la touche Windows** sur le clavier physique si possible

Ces étapes dépassent le périmètre du projet mais sont des bonnes pratiques
classiques pour un kiosque public.

---

## 📞 Maintenance et dépannage

Avant tout dépannage technique, **redémarrer la borne** résout 80% des
problèmes (`stop.bat` puis `start.bat`).

Pour les problèmes persistants, consulter `js/app.js` (commentaires) et
les changelogs (`CHANGELOG-PHASE-*.md`).
