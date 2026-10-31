@echo off
chcp 65001 > nul
title 正在推送 Mimo_v1 到 GitHub...
echo ========================================================
echo   正在将 Mimo_v1 (包含完整代码、MD与PDF交付手册) 推送至 GitHub
echo   远程仓库: https://github.com/Gozoyo/Mimo_v1.git
echo ========================================================
echo.
cd /d "%~dp0"
if exist "Mimo_v1" cd Mimo_v1

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo [成功] 代码已成功推送到 GitHub 仓库 main 分支！
) else (
    echo.
    echo [提示] 如果弹出 GitHub 登录页面，请点击 Authorize 确认授权后再试。
)
echo.
pause
