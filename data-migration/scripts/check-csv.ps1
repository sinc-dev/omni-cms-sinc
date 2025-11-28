$csvPath = Join-Path $PSScriptRoot "db-28-11-2025\List of unknown field slugs still in use.csv"

Write-Host "Checking CSV file: $csvPath" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $csvPath)) {
    Write-Host "ERROR: CSV file not found at: $csvPath" -ForegroundColor Red
    exit 1
}

try {
    # Read CSV file
    $csvData = Import-Csv -Path $csvPath
    
    Write-Host "Header: $($csvData[0].PSObject.Properties.Name -join ' | ')" -ForegroundColor Green
    Write-Host ""
    
    # Expected columns
    $expectedColumns = @('unknown_field_slug', 'field_name', 'organization_slug', 'usage_count')
    $actualColumns = $csvData[0].PSObject.Properties.Name
    
    $hasValidHeader = $true
    foreach ($col in $expectedColumns) {
        if ($col -notin $actualColumns) {
            $hasValidHeader = $false
            break
        }
    }
    
    if (-not $hasValidHeader) {
        Write-Host "WARNING: Header may not match expected columns" -ForegroundColor Yellow
        Write-Host "   Expected: $($expectedColumns -join ', ')" -ForegroundColor Yellow
    } else {
        Write-Host "OK: Header is valid" -ForegroundColor Green
    }
    Write-Host ""
    
    # Statistics
    $totalRows = $csvData.Count
    $uniqueFieldSlugs = ($csvData | Select-Object -Unique unknown_field_slug).Count
    $uniqueOrganizations = ($csvData | Select-Object -Unique organization_slug).Count
    $totalUsageCount = ($csvData | Measure-Object -Property usage_count -Sum).Sum
    
    Write-Host "Statistics:" -ForegroundColor Cyan
    Write-Host "   Total rows (excluding header): $totalRows"
    Write-Host "   Unique field slugs: $uniqueFieldSlugs"
    Write-Host "   Unique organizations: $uniqueOrganizations"
    Write-Host "   Total usage count: $totalUsageCount"
    Write-Host ""
    
    # Check for duplicates
    $duplicates = $csvData | Group-Object -Property unknown_field_slug, organization_slug | Where-Object { $_.Count -gt 1 }
    
    if ($duplicates.Count -gt 0) {
        Write-Host "WARNING: Found duplicate entries: $($duplicates.Count)" -ForegroundColor Yellow
        $duplicates | Select-Object -First 5 | ForEach-Object {
            Write-Host "   $($_.Name): $($_.Count) occurrences" -ForegroundColor Yellow
        }
        if ($duplicates.Count -gt 5) {
            Write-Host "   ... and $($duplicates.Count - 5) more" -ForegroundColor Yellow
        }
    } else {
        Write-Host "OK: No duplicate entries found" -ForegroundColor Green
    }
    Write-Host ""
    
    # Organization breakdown
    $orgCounts = $csvData | Group-Object -Property organization_slug | Sort-Object Count -Descending
    
    Write-Host "Organization breakdown:" -ForegroundColor Cyan
    foreach ($org in $orgCounts) {
        Write-Host "   $($org.Name): $($org.Count) unknown fields"
    }
    Write-Host ""
    
    # Usage count statistics
    $usageCounts = $csvData | ForEach-Object { [int]$_.usage_count }
    $minUsage = ($usageCounts | Measure-Object -Minimum).Minimum
    $maxUsage = ($usageCounts | Measure-Object -Maximum).Maximum
    $avgUsage = [math]::Round(($usageCounts | Measure-Object -Average).Average, 2)
    
    Write-Host "Usage count statistics:" -ForegroundColor Cyan
    Write-Host "   Min: $minUsage"
    Write-Host "   Max: $maxUsage"
    Write-Host "   Average: $avgUsage"
    Write-Host ""
    
    Write-Host "SUCCESS: CSV file check completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: Error reading CSV file: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
