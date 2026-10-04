@echo off
title Push TRAVELISER to GitHub
echo ========================================================
echo   Pushing TRAVELISER to GitHub
echo   Repository: https://github.com/ajinkyadongre1/TRAVELISER.git
echo ========================================================
echo.
set "PATH=C:\Users\Lenovo\AppData\Local\Programs\MinGit\cmd;C:\Users\Lenovo\AppData\Local\Programs\MinGit\mingw64\bin;%PATH%"
cd /d "%~dp0"
git remote set-url origin https://github.com/ajinkyadongre1/TRAVELISER.git 2>nul || git remote add origin https://github.com/ajinkyadongre1/TRAVELISER.git
git branch -M main

echo.
echo Attempting to push to GitHub main branch...
echo If a GitHub sign-in window opens, authorize in your browser.
echo.
git push -u origin main
if errorlevel 1 goto failed
goto success

:failed
echo.
echo ========================================================
echo Push requires GitHub authorization.
echo You can enter a GitHub Personal Access Token with repo scope
echo below to push immediately, or press Enter to cancel.
echo ========================================================
set /p GITHUB_PAT="Enter GitHub Token (or press Enter to exit): "
if "%GITHUB_PAT%"=="" goto done
echo.
echo Pushing with Token...
git push -u "https://%GITHUB_PAT%@github.com/ajinkyadongre1/TRAVELISER.git" main
if errorlevel 1 goto token_failed
goto success

:token_failed
echo.
echo [ERROR] Push failed with provided token. Please verify token permissions.
goto done

:success
echo.
echo ========================================================
echo   SUCCESS! All files pushed to GitHub main branch.
echo ========================================================

:done
echo.
pause
