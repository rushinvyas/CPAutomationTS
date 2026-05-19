@echo off
setlocal
call "%~dp0run-suite.bat" UAT CompliancePortalRegression
exit /b %errorlevel%
