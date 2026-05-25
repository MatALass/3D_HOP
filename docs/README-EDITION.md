# Guide d'édition — Collection Petite Plaisance

Ce document explique comment modifier les textes et les bateaux affichés
dans la borne interactive **sans toucher au code**.

---

## 1. Modifier le texte d'un bateau

1. Ouvrir le fichier `assets/data/projects.json` avec **Bloc-notes** (Windows)
   ou n'importe quel éditeur de texte.
2. Repérer le bateau à modifier (chaque bateau commence par `"id": 1`, `"id": 2`…).
3. Modifier la valeur entre guillemets de la clé `"text"`.

**Exemple :**

```
"text": "<h3>Le Pingoin — Canoë Sadoux</h3><p>Ce canoë a été construit en 1948…</p>"
```

### Règles importantes

- **Garder les guillemets** `"` au début et à la fin du texte.
- **Échapper les guillemets internes** : si vous voulez utiliser un guillemet
  dans le texte, mettez `\"`. Exemple : `<p>Surnommé \"Le Roc\"</p>`.
- Préférer les apostrophes courbes `’` aux apostrophes droites `'` (la
  configuration JSON les tolère mais c'est plus joli).

### Balises HTML utilisables

| Balise | Effet |
|--------|-------|
| `<h3>Titre</h3>` | Titre du paragraphe |
| `<p>Texte</p>` | Paragraphe normal |
| `<strong>Texte</strong>` | Texte en **gras** |
| `<em>Texte</em>` | Texte en *italique* |
| `<br/>` | Saut de ligne |
| `<ul><li>item</li></ul>` | Liste à puces |

---

## 2. Modifier le titre d'un bateau

Dans le même fichier `projects.json`, modifier :

- `"topTitle"` : grand titre (ex: "LE PINGOIN")
- `"topSubtitle"` : sous-titre (ex: "CANOË SADOUX")

---

## 3. Ajouter un nouveau bateau

1. **Déposer les fichiers** suivants dans les dossiers indiqués :

   - Modèle 3D : `assets/models/mon_bateau.nxz`
   - Miniature : `assets/images/boats/mon_bateau.jpg` (taille recommandée : 200×200 px)
   - Plan : `assets/images/plans/plan_mon_bateau.png`

2. **Ouvrir `projects.json`** et **ajouter un bloc à la fin** (avant `]`) :

```json
,
{
  "id": 4,
  "nxz": "assets/models/mon_bateau.nxz",
  "thumbnail": "assets/images/boats/mon_bateau.jpg",
  "topTitle": "NOM DU BATEAU",
  "topSubtitle": "TYPE DE BATEAU",
  "plan": "assets/images/plans/plan_mon_bateau.png",
  "bg": "assets/images/backgrounds/fond_CC_2b.png",
  "toolbar": "bottom-right",
  "footnote": "Modèle CC_EA / powered by 3DHOP",
  "text": "<h3>Titre</h3><p>Description du bateau.</p>"
}
```

> ⚠️ Attention à la **virgule avant le bloc** : chaque bateau doit être
> séparé du précédent par une virgule, sauf le dernier.

3. **Vérifier** : ouvrir la borne, le nouveau bateau apparaît dans les
   miniatures du haut.

---

## 4. Tester sans casser

Avant de fermer le fichier, **vérifier la validité JSON** :

- Si la borne affiche une page vide ou ne change pas de bateau, c'est
  probablement une erreur de syntaxe (virgule manquante, guillemet oublié).
- Garder une **copie de sauvegarde** du `projects.json` avant chaque
  modification importante.
- Outil utile : copier-coller le contenu sur https://jsonlint.com pour
  valider la syntaxe.

---

## 5. Que faire en cas de problème ?

- Restaurer la copie de sauvegarde du `projects.json`.
- Contacter le développeur si le problème persiste.
