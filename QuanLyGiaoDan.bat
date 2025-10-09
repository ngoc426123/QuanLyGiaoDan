@echo off
    cd "D:\xampp\"
    start xampp_start.exe
    TIMEOUT 10
    cd "C:\Program Files\Google\Chrome\Application"
    start chrome.exe 127.0.0.1
    exit