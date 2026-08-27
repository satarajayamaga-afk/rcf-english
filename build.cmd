@echo off
REM =========================================================================
REM  Build the RCF English website.
REM  Double-click this file after you have changed anything in _src or data.
REM  It rewrites every page and checks that no internal link is broken.
REM =========================================================================
title RCF English - build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\build-site.ps1"
echo.
pause
