@echo off
echo ====================================
echo   Study Abroad App - Startup
echo ====================================
echo.
echo Starting Backend Server on port 3001...
start cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend Server on port 8080...
start cmd /k "node serve-frontend.js"
timeout /t 2 /nobreak > nul
echo.
echo ====================================
echo   Both servers are starting!
echo ====================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:8080
echo.
echo Opening browser...
timeout /t 3 /nobreak > nul
start http://localhost:8080
echo.
echo Press any key to exit (servers will keep running)...
pause > nul
