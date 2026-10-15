@echo off
title Publicar funcoes do Escala Swipe no Supabase
set "PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;%PATH%"
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-functions.ps1"
echo.
echo Se apareceu algum erro acima, copie e mande para o Claude.
pause
