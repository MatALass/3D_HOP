@echo off
REM ============================================================================
REM  Collection Petite Plaisance - Borne 3D
REM  Lanceur Windows - MODE PRODUCTION (kiosque plein ecran)
REM
REM  Pour le DEV (fenetre normale) : utiliser start-dev.bat
REM
REM  NOTE IMPORTANTE pour Edge :
REM  Le kiosque Edge necessite des flags specifiques (--edge-kiosk-type) et
REM  un profil utilisateur isole (--user-data-dir) pour eviter les conflits
REM  avec un Edge deja ouvert sur le poste.
REM ============================================================================

setlocal EnableDelayedExpansion

REM === Configuration ===
set PORT=8000
set URL=http://127.0.0.1:%PORT%/
set "BORNE_PROFILE=%~dp0.borne-profile"

REM Se placer dans le dossier du .bat
cd /d "%~dp0"

echo.
echo ============================================================
echo  Collection Petite Plaisance - Demarrage de la borne
echo  Mode : KIOSQUE plein ecran
echo ============================================================
echo.

REM === 1. Verifier le binaire serveur ===
if not exist "tools\static-web-server.exe" (
    echo [ERREUR] Le serveur tools\static-web-server.exe est introuvable.
    echo.
    echo Telechargez-le depuis :
    echo   https://github.com/static-web-server/static-web-server/releases/latest
    echo Choisir : static-web-server-vX.Y.Z-x86_64-pc-windows-msvc.zip
    echo.
    echo Decompressez et placez static-web-server.exe dans le dossier 'tools'.
    echo.
    pause
    exit /b 1
)

REM === 2. Verifier les modeles 3D ===
set NXZ_MISSING=0
for %%F in (canoe_sadoux.nxz inti_huatana.nxz dinghy_kirie.nxz) do (
    if not exist "assets\models\%%F" set NXZ_MISSING=1
)
if "!NXZ_MISSING!"=="1" (
    echo [AVERTISSEMENT] Certains modeles 3D sont absents dans assets\models\
    echo La borne demarrera mais les modeles concernes ne s'afficheront pas.
    echo.
    timeout /t 3 /nobreak >nul
)

REM === 3. Trouver Chrome puis Edge en fallback ===
set "BROWSER="
set "BROWSER_NAME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    set "BROWSER_NAME=Chrome"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    set "BROWSER_NAME=Chrome"
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    set "BROWSER_NAME=Edge"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
    set "BROWSER_NAME=Edge"
)

if not defined BROWSER (
    echo [ERREUR] Ni Chrome ni Edge n'a ete trouve sur ce poste.
    echo Installez Google Chrome ou Microsoft Edge avant de lancer la borne.
    pause
    exit /b 1
)

echo [INFO] Navigateur detecte : !BROWSER_NAME!

REM === 4. Demarrer le serveur en arriere-plan (fenetre minimisee) ===
echo [INFO] Demarrage du serveur sur le port %PORT%...
start "Serveur Borne 3D" /MIN "tools\static-web-server.exe" --port %PORT% --root . --host 127.0.0.1 --log-level error

REM === 5. Attendre que le serveur soit pret ===
timeout /t 2 /nobreak >nul

REM === 6. Lancer le navigateur en MODE KIOSQUE ===
echo [INFO] Ouverture du navigateur en MODE KIOSQUE plein ecran...
echo [INFO] Pour quitter : Alt+F4, ou lancer stop.bat depuis l'explorateur.
echo.

REM Flags communs aux deux navigateurs
set "COMMON_FLAGS=--kiosk --start-fullscreen --noerrdialogs --disable-pinch --overscroll-history-navigation=0 --disable-features=TranslateUI --no-first-run --no-default-browser-check"

REM Profil isole pour la borne (evite les conflits avec une session navigateur existante)
set "PROFILE_FLAG=--user-data-dir=!BORNE_PROFILE!"

if "!BROWSER_NAME!"=="Edge" (
    REM Edge necessite --edge-kiosk-type=fullscreen pour vraiment activer le kiosque
    REM Sans ce flag, --kiosk seul ne fonctionne pas correctement sur Edge.
    start "" "!BROWSER!" !COMMON_FLAGS! !PROFILE_FLAG! --edge-kiosk-type=fullscreen "%URL%"
) else (
    REM Chrome : --kiosk suffit
    start "" "!BROWSER!" !COMMON_FLAGS! !PROFILE_FLAG! "%URL%"
)

REM === 7. Boucle d'attente jusqu'a fermeture du navigateur ===
echo [INFO] Borne en cours d'utilisation.
echo [INFO] Cette fenetre se fermera quand le serveur sera arrete.
echo.

:wait_loop
tasklist /FI "IMAGENAME eq static-web-server.exe" 2>nul | find /I "static-web-server.exe" >nul
if errorlevel 1 goto cleanup
timeout /t 5 /nobreak >nul
goto wait_loop

:cleanup
echo [INFO] Serveur arrete.
endlocal
exit /b 0
