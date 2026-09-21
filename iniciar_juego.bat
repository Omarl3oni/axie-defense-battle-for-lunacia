@echo off
title Axie Defense: Battle for Lunacia - Servidor Local
echo ========================================================
echo   Iniciando Axie Defense: Battle for Lunacia...
echo ========================================================
echo.

:: 1. Ir a la carpeta donde se encuentra este archivo .bat
cd /d "%~dp0"

:: 2. Verificar que Node.js este instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se ha detectado Node.js en el sistema.
    echo Por favor, instala Node.js desde https://nodejs.org/ para jugar.
    echo.
    pause
    exit /b 1
)

:: 3. Verificar que npm este disponible
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se ha detectado el comando npm en el sistema.
    echo.
    pause
    exit /b 1
)

:: 4. Comprobar e instalar dependencias si faltan
if not exist "node_modules\" (
    echo [INFO] Primera ejecucion detectada: instalando dependencias necesarias...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Hubo un problema al instalar las dependencias con npm install.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas correctamente.
    echo.
)

:: 5. Liberar puerto 3000 si habia un proceso colgado de una sesion anterior
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: 6. Iniciar servidor Vite (Vite abre automaticamente el navegador en el puerto configurado 3000)
echo ========================================================
echo   Arrancando el servidor de desarrollo Vite...
echo   El juego se abrira automaticamente en tu navegador.
echo ========================================================
echo   URL: http://127.0.0.1:3000
echo   (Para detener el juego, pulsa Ctrl + C o cierra esta ventana)
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [AVISO] El servidor se ha detenido.
)
pause
