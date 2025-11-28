$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Running CSV check script..." -ForegroundColor Cyan

# Run the script and capture all output
$output = node check-csv.js 2>&1 | Out-String

# Display the output
Write-Host $output

# Also check if result file was created
if (Test-Path "check-csv-result.txt") {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Results also saved to: check-csv-result.txt" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    Get-Content "check-csv-result.txt"
}
