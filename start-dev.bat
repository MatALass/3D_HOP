@echo off
REM ============================================================================
REM  Collection Petite Plaisance - MODE DEVELOPPEMENT
REM
REM  Identique a start.bat mais ouvre le navigateur en fenetre normale
REM  (avec bordures et barre de titre), pour le developpement.
REM
REM  Pour la PROD : utiliser start.bat (mode kiosque plein ecran).
REM ============================================================================

set PORT=8000
set KIOSK=
REM ^ KIOSK vide = mode fenetre normale (dev)

cd /d "%~dp0"

echo.
echo ============================================================
echo  Collection Petite Plaisance - MODE DEV (fenetre normale)
echo ============================================================
echo.

REM Verifier binaire
if not exist "tools\static-web-server.exe" (
    echo [ERREUR] tools\static-web-server.exe introuvable.
    echo Telechargez depuis :
    echo   https://github.com/static-web-server/static-web-server/releases
    pause
    exit /b 1
)

REM Trouver navigateur (Chrome puis Edge)
set BROWSER=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    echo [INFO] Chrome introuvable, utilisation d'Edge.
) else (
    echo [ERREUR] Ni Chrome ni Edge n'a ete trouve.
    pause
    exit /b 1
)

echo [INFO] Demarrage du serveur sur le port %PORT%...
start "Serveur Borne 3D - DEV" /MIN "tools\static-web-server.exe" --port %PORT% --root . --host 127.0.0.1 --log-level info

timeout /t 2 /nobreak >nul

echo [INFO] Ouverture du navigateur en fenetre normale...
start "" "%BROWSER%" --app=http://127.0.0.1:%PORT%

echo.
echo [INFO] Mode dev actif. Console : ouvrir DevTools avec F12.
echo [INFO] Fermer le navigateur pour arreter le serveur.
echo.

:wait_loop
tasklist /FI "IMAGENAME eq static-web-server.exe" 2>nul | find /I "static-web-server.exe" >nul
if errorlevel 1 goto cleanup
timeout /t 5 /nobreak >nul
goto wait_loop

:cleanup
echo [INFO] Serveur arrete.
exit /b 0
