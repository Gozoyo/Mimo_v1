@echo off
chcp 65001 >nul
title MicroMove Mimo_v1 极速启动器
echo ========================================================
echo   🚀 MicroMove (Mimo_v1) 本地服务启动中...
echo   📱 正在为你打开浏览器: http://localhost:5173/
echo ========================================================
cd /d "%~dp0"
start http://localhost:5173/
npm run dev
