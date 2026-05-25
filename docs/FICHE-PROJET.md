# Borne 3D — Collection Petite Plaisance
## Fiche technique projet

**Client** : Les Amis du Musée Maritime de La Rochelle (AMMLR)
**Cadre** : Exposition du 40ᵉ anniversaire
**Périmètre** : Visualiseur 3D interactif pour borne d'exposition

---

## Ce que fait la borne

Une borne kiosque qui permet aux visiteurs du musée d'explorer en 3D
les bateaux de la collection "Petite Plaisance". Pour chaque bateau,
l'application affiche :

- Un modèle 3D manipulable (rotation, zoom)
- Un plan technique du bateau
- Un texte de présentation
- Un titre et sous-titre

Le visiteur navigue entre les bateaux via des miniatures cliquables.

---

## Caractéristiques techniques

### Côté visiteur
- **Interface tactile** : pleinement supportée (détection automatique)
- **Manipulation 3D** : drag (rotation) / molette ou pinch (zoom) /
  bouton "home" (reset position)
- **Réactivité** : modèle 3D affiché en 2-3 secondes (streaming
  progressif Nexus multi-résolution)
- **Multi-format** : s'adapte automatiquement à tous les écrans
  paysage (HD, Full HD, 2K, 4K, ultrawide 21:9 et 32:9)

### Côté installation
- **100 % local, sans internet** : tout sur disque dur ou clé USB
- **Démarrage en un double-clic** sur `start.bat`
- **Mode kiosque plein écran** sans barre Chrome/Edge visible
- **Multi-plateforme** : Windows, macOS, Linux

### Côté édition de contenu
- **Ajout d'un bateau** par le client : copier 3 fichiers (modèle .nxz,
  miniature .jpg, plan .png) et ajouter 1 bloc dans `projects.json`
- **Modification des textes** : éditeur de texte basique (Bloc-notes)
  suffit, syntaxe HTML simple
- **Aucune compétence développeur** requise pour la maintenance courante
- Guide complet fourni dans `README-EDITION.md`

### Côté robustesse (exposition continue)
- **Auto-reset** après 5 minutes sans interaction : retour au 1er bateau
- **Reload quotidien automatique** à 4h du matin (anti memory-leak)
- **Détection de crash 3D** : reload automatique si la scène plante
- **Blocage des touches dangereuses** : F12, F5, Ctrl+P/S/U/W/T...
- **Diagnostic admin** accessible via `Ctrl+Shift+D`
- **Profil navigateur isolé** : pas d'interférence avec une session Edge
  classique sur le poste

---

## Architecture logicielle

```
3DHOP-MUSEE/
├── start.bat / start.sh           Lanceurs (kiosque par défaut)
├── start-dev.bat                  Lanceur mode développeur
├── stop.bat                       Arrêt propre
│
├── index.html
├── tools/
│   └── static-web-server.exe      Mini-serveur web embarqué (4 Mo)
│
├── assets/
│   ├── data/projects.json         Configuration des bateaux (éditable)
│   ├── models/*.nxz               Modèles 3D (49-61 Mo chacun)
│   ├── images/                    Miniatures, plans, fonds, logos
│   └── ...
│
├── fonts/Inter-*.ttf              Police Inter en local
├── css/                           Feuilles de style
└── js/
    ├── 3dhop/                     Bibliothèque 3DHOP minimale
    ├── app.js                     Code applicatif
    └── kiosk.js                   Module de robustesse kiosque
```

### Technologies
- **3DHOP 4.3.7** (framework 3D Heritage Online Presenter, CNR-ISTI)
- **Nexus** (format multi-résolution avec streaming progressif)
- **WebGL** (rendu 3D natif navigateur, sans plugin)
- **Vanilla JavaScript** (zéro framework, zéro dépendance npm en runtime)
- **Static Web Server** (serveur statique Rust, mono-binaire 4 Mo)

### Aucune dépendance externe en runtime
- Pas de connexion internet requise
- Pas de Node.js, Python, ou Java installé sur le poste
- Pas de base de données
- Pas de cloud ni de CDN

---

## Documentation fournie

| Fichier | Pour qui ? | Sujet |
|---|---|---|
| `INSTALL.md` | Technicien installateur | Installation, déploiement, mode kiosque, sécurité |
| `README-EDITION.md` | Personnel du musée | Édition des textes et ajout de bateaux |
| `README.md` | Tout le monde | Vue d'ensemble du projet |
| `CHANGELOG-PHASE-*.md` | Développeur | Historique technique des changements |

---

## Améliorations apportées vs version initiale

- **-30 %** de poids de code JavaScript (suppression dead code)
- **-100 %** de dépendances Internet (Google Fonts retirés, modèles 3D
  rapatriés en local)
- **+5 sécurités** anti-crash en exposition continue
- **+1 niveau** de personnalisation client (édition sans toucher au code)
- Couverture multi-format pour tous les types d'écran paysage
- Démarrage instantané vs ~1-3 min de timeout sur l'ancienne config

---

## Limitations connues

- **Format portrait/totem** : hors périmètre actuel. Le code d'un layout
  vertical reste préparé dans le CSS pour activation ultérieure.
- **Modèles 3D non régénérés** : les fichiers .nxz actuels (161 Mo
  cumulés) sont utilisés tels quels. Une régénération avec compression
  optimisée pourrait diviser leur taille par 3 à 5, mais nécessite l'accès
  aux meshes sources, non disponibles.
- **Bateaux supplémentaires** : 6 bateaux livrés (3 d'origine + 3 ajoutés
  en phase 5). Le système est conçu pour en accueillir davantage sans
  modification de code.

---

## Pour le déploiement final

Voir `INSTALL.md`. Résumé :

1. Copier le dossier projet sur le poste musée
2. Télécharger `static-web-server.exe` depuis GitHub officiel,
   le placer dans `tools/`
3. Déposer les 3 fichiers `.nxz` dans `assets/models/`
4. Double-cliquer sur `start.bat`
5. Pour une installation kiosque définitive : configurer
   l'autologin Windows + lancement au démarrage via Planificateur de tâches

---

## Pour la maintenance

Voir `README-EDITION.md`. Le personnel du musée peut :
- Modifier les titres et sous-titres
- Réécrire les textes de présentation (HTML simple)
- Ajouter ou retirer des bateaux
- Le tout sans toucher au code JavaScript ni CSS

Pour les questions techniques (bugs, mises à jour de
fonctionnalités, etc.), contacter le développeur.
