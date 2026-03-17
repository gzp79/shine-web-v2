@echo off
title HP-Note Server
cd /d %~dp0\..\..
start /min cmd /c "node tools/hp-note-server/server.mjs"
echo HP-Note server started in background.
echo You can close this window.
timeout /t 2 >nul
