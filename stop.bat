@echo off
REM ============================================================================
REM  Collection Petite Plaisance - Arret de la borne
REM
REM  Ce script ferme proprement :
REM   - Le serveur web (static-web-server.exe)
REM   - Le navigateur en mode kiosque (Chrome / Edge)
REM
REM  Utile en mode kiosque ou Alt+F4 est desactive.
REM  Raccourci recommande : Ctrl+Alt+Q sur le bureau qui lance ce .bat
REM ============================================================================

echo Fermeture de la borne en cours...

REM Fermer Chrome / Edge (uniquement les instances ouvertes en mode --app ou --kiosk)
taskkill /F /IM chrome.exe >nul 2>&1
taskkill /F /IM msedge.exe >nul 2>&1

REM Fermer le serveur
taskkill /F /IM static-web-server.exe >nul 2>&1

echo Borne arretee.
timeout /t 2 /nobreak >nul
exit /b 0
