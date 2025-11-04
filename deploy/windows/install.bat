@echo off
echo Installing GitHub CLI to %USERPROFILE%\bin\
if not exist "%USERPROFILE%\bin" mkdir "%USERPROFILE%\bin"
copy gh.exe "%USERPROFILE%\bin\gh-custom.exe"
echo.
echo GitHub CLI installed to %USERPROFILE%\bin\gh-custom.exe
echo Add %USERPROFILE%\bin to your PATH to use gh-custom command
pause
