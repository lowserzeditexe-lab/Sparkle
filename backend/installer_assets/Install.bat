@echo off
title Vencord BdCompat + AutoQuest - Installeur
echo ============================================
echo   Vencord BdCompat + AutoQuest Installer
echo ============================================
echo.
echo Lancement de l'installeur...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install.ps1"
if %errorlevel% neq 0 (
  echo.
  echo Une erreur est survenue. Relance en tant qu'administrateur si le probleme persiste.
  pause
)
