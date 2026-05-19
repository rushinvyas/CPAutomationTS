@echo off
setlocal
call "%~dp0run-suite.bat" PROD CompliancePortalRegression
exit /b %errorlevel%
