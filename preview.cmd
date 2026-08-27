@echo off
REM =========================================================================
REM  Preview the RCF English website on this computer.
REM  Just double-click this file. Your browser opens automatically.
REM  Close this black window when you have finished looking.
REM =========================================================================
title RCF English - local preview
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\local-preview-server.ps1"
pause
