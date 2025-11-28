@echo off
cd /d "%~dp0"
node check-csv.js > check-csv-output.txt 2>&1
type check-csv-output.txt
if exist check-csv-result.txt (
    echo.
    echo ========================================
    echo Results also saved to: check-csv-result.txt
    type check-csv-result.txt
)
