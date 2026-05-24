# Dossier `tools/`

Ce dossier doit contenir le **binaire du serveur web statique** qui sert le
site en local sur le poste de la borne.

## Quel binaire ?

**Static Web Server (SWS)** v2.42.0 ou plus récent, à télécharger depuis :
https://github.com/static-web-server/static-web-server/releases/latest

## Quel fichier pour quelle plateforme ?

| Plateforme | Archive à télécharger | Renommer en |
|---|---|---|
| Windows 10/11 64-bit | `...-x86_64-pc-windows-msvc.zip` | `static-web-server.exe` |
| macOS Intel/Apple Silicon | `...-x86_64-apple-darwin.tar.gz` | `static-web-server-macos` |
| Linux 64-bit | `...-x86_64-unknown-linux-gnu.tar.gz` | `static-web-server-linux` |

## Pourquoi pas inclus dans le zip du projet ?

1. Source officielle vérifiable (SHA256 publié sur le site)
2. Mise à jour facile (nouvelle release = remplacer le binaire)
3. Garde le repo Git léger
4. License Apache-2.0 du projet d'origine respectée (chacun télécharge)

## Vérification d'intégrité (optionnel mais recommandé)

Les SHA256 officiels sont publiés sur :
https://static-web-server.net/download-and-install/

Pour vérifier sur Windows PowerShell :
```powershell
Get-FileHash static-web-server.exe -Algorithm SHA256
```

Sur macOS/Linux :
```bash
shasum -a 256 static-web-server-macos
```
