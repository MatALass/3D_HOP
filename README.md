# Collection Petite Plaisance — Borne 3D

Visualiseur 3D des bateaux de la collection du Musée Maritime La Rochelle.
Basé sur **3DHOP 4.3.7** + **Nexus** (format NXZ multi-résolution).

## Démarrage

| Contexte | Plateforme | Commande |
|---|---|---|
| **PROD** (kiosque) | Windows | Double-cliquer sur `start.bat` |
| **PROD** (kiosque) | macOS / Linux | `./start.sh` |
| DEV (fenêtré) | Windows | Double-cliquer sur `start-dev.bat` |
| DEV (fenêtré) | macOS / Linux | `KIOSK=0 ./start.sh` |
| DEV (avec Node.js) | toutes | `npm install -g http-server` puis `http-server -p 8000 -c-1` |

Voir **[INSTALL.md](./INSTALL.md)** pour les instructions complètes
(installation du binaire serveur, mode kiosque, etc.).

## Documentation

| Fichier | Pour qui ? | Sujet |
|---|---|---|
| `INSTALL.md` | Installateur / technicien | Installation et déploiement |
| `README-EDITION.md` | Client musée | Édition des textes et bateaux |
| `CHANGELOG-PHASE-*.md` | Développeur | Historique technique des changements |

## Structure du projet

```
3DHOP-MUSEE/
├── start.bat / start.sh         ← lanceurs
├── stop.bat                     ← arrêt propre (Windows)
├── index.html
├── tools/                       ← serveur web embarqué (à télécharger)
│   └── static-web-server.exe
├── assets/
│   ├── data/
│   │   └── projects.json        ← configuration des bateaux (éditable)
│   ├── models/                  ← fichiers .nxz (non versionnés sur Git)
│   ├── images/                  ← miniatures, plans, fonds, icônes, logos
├── fonts/                       ← polices Inter en local
├── css/                         ← feuilles de style
└── js/
    ├── 3dhop/                   ← bibliothèque 3DHOP minimale
    └── app.js                   ← code applicatif
```

## Architecture technique

- **3DHOP** : framework de visualisation 3D Heritage Online Presenter (CNR-ISTI)
- **Nexus** : format de mesh multi-résolution avec streaming progressif
- **WebGL** : rendu 3D natif navigateur (pas de plugin requis)
- **Pas de backend** : pur statique, sert tout via un mini serveur HTTP
- **Pas de framework JS** : vanilla JS, dépendances 0
- **Offline-ready** : aucune requête Internet en runtime (Phase 2)

## License

Voir le code source 3DHOP (GPL v3) et Nexus (MIT) pour les dépendances.
Code applicatif (app.js, app.css, projects.json) : à définir avec le client.
