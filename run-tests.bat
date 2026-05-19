@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ENV_NAME=%~1"
set "CATEGORY=%~2"
set "SCENARIO_NAME=%~3"
set "TAG_FILTER=%~4"
set "BROWSER=%~5"

if "%ENV_NAME%"=="" set "ENV_NAME=UAT"
if "%CATEGORY%"=="" (
  call :usage
  exit /b 1
)

call :toupper ENV_NAME
call :normalize_category CATEGORY

if not defined CATEGORY_TAG (
  echo Unsupported category: %CATEGORY%
  call :usage
  exit /b 1
)

set "CP_RUN_TIMESTAMP="
for /f %%i in ('powershell -NoProfile -Command "(Get-Date).ToString(\"yyyyMMdd_HHmmss\")"') do set RUN_TIMESTAMP=%%i
set "CP_RUN_TIMESTAMP=%RUN_TIMESTAMP%"
set "CP_ENV=%ENV_NAME%"
set "CP_PORTAL=HOLT"
if not "%BROWSER%"=="" set "CP_BROWSER=%BROWSER%"

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

set "TAG_EXPRESSION=@!CATEGORY_TAG!"
if defined TAG_FILTER set "TAG_EXPRESSION=@!CATEGORY_TAG! and !TAG_FILTER!"

echo ==============================================
echo CPAutomationTS Runner
echo Environment : !CP_ENV!
echo Category    : !CATEGORY_TAG!
echo Portal      : !CP_PORTAL!
if defined CP_BROWSER echo Browser     : !CP_BROWSER!
if defined SCENARIO_NAME echo Scenario    : !SCENARIO_NAME!
if defined TAG_FILTER echo Extra Tags  : !TAG_FILTER!
echo Timestamp   : !RUN_TIMESTAMP!
echo ==============================================

call npm run build
if errorlevel 1 goto :fail

call powershell -NoProfile -Command "if (Test-Path 'artifacts') { Remove-Item -LiteralPath 'artifacts' -Recurse -Force -ErrorAction SilentlyContinue }; if (Test-Path 'allure-results') { Remove-Item -LiteralPath 'allure-results' -Recurse -Force -ErrorAction SilentlyContinue }; if (Test-Path 'allure-report') { Remove-Item -LiteralPath 'allure-report' -Recurse -Force -ErrorAction SilentlyContinue }"

if defined SCENARIO_NAME (
  call npx cucumber-js --config cucumber.json --tags "!TAG_EXPRESSION!" --name "!SCENARIO_NAME!"
) else (
  call npx cucumber-js --config cucumber.json --tags "!TAG_EXPRESSION!"
)
if errorlevel 1 set TEST_EXIT=1
if not defined TEST_EXIT set TEST_EXIT=0

call npm run summary
if errorlevel 1 goto :fail

call npm run report:html
if errorlevel 1 goto :fail

call npm run archive:report
if errorlevel 1 goto :fail

if exist report.html echo HTML Report : %ROOT_DIR%report.html
if exist reports\%RUN_TIMESTAMP%\report.html echo Archived HTML Report : %ROOT_DIR%reports\%RUN_TIMESTAMP%\report.html

if "%TEST_EXIT%"=="0" (
  echo Execution completed successfully.
  exit /b 0
)

echo Execution completed with test failures.
exit /b %TEST_EXIT%

:normalize_category
set "CATEGORY_TAG="
if /I "!%~1!"=="CompliancePortalRegression" set "CATEGORY_TAG=CompliancePortalRegression"
exit /b 0

:toupper
for /f %%i in ('powershell -NoProfile -Command "\"!%1!\".ToUpperInvariant()"') do set "%1=%%i"
exit /b 0

:usage
echo Usage:
echo   run-tests.bat [ENV] [CATEGORY] [SCENARIO_NAME] [EXTRA_TAG_FILTER] [BROWSER]
echo.
echo Examples:
echo   run-tests.bat UAT CompliancePortalRegression
echo   run-tests.bat PROD CompliancePortalRegression
echo   run-tests.bat UAT CompliancePortalRegression "15 Verify validation message with blank username and clicks on SEND EMAIL button for Forgot Password"
echo   run-tests.bat UAT CompliancePortalRegression "" "not @wip"
echo   run-tests.bat UAT CompliancePortalRegression "" "" chrome
echo   run-tests.bat UAT CompliancePortalRegression "" "" FIREFOX
exit /b 0

:fail
echo Runner failed before completion.
exit /b 1
