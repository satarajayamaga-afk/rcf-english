@echo off
REM =========================================================================
REM  Check your data files for typing mistakes.
REM  Run this if build.cmd says a file could not be read.
REM  Nothing is changed - it only looks.
REM =========================================================================
title RCF English - check files
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\check-data.ps1"
echo.
pause
