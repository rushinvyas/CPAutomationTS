@echo off
echo run-suite.bat is deprecated. Use run-tests.bat instead.
call "%~dp0run-tests.bat" %*
exit /b %errorlevel%
