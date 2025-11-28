# PowerShell script to test API endpoints
$API_BASE = "https://omni-cms-api.joseph-9a2.workers.dev"
$API_KEY = "omni_099c139e8f5dce0edfc59cc9926d0cd7"
$ORG_SLUG = "study-in-kazakhstan"

$headers = @{
    "Authorization" = "Bearer $API_KEY"
    "Content-Type" = "application/json"
}

$results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [hashtable]$Headers
    )
    
    Write-Host "`nTesting: $Name" -ForegroundColor Cyan
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Headers $Headers -Method Get -ErrorAction Stop
        $statusCode = $response.StatusCode
        $body = $response.Content | ConvertFrom-Json
        
        $result = @{
            Name = $Name
            Url = $Url
            Status = "✅ WORKING"
            StatusCode = $statusCode
            Success = $body.success
            HasData = $null -ne $body.data
            DataCount = if ($body.data -is [Array]) { $body.data.Count } else { if ($body.data) { 1 } else { 0 } }
            Error = $null
        }
        
        if ($body.success) {
            Write-Host "✅ Status: $statusCode - SUCCESS" -ForegroundColor Green
            if ($body.data -is [Array]) {
                Write-Host "   Data: $($body.data.Count) items" -ForegroundColor Green
            } else {
                Write-Host "   Data: Present" -ForegroundColor Green
            }
        } else {
            Write-Host "⚠️ Status: $statusCode - API returned success=false" -ForegroundColor Yellow
            $result.Status = "⚠️ PARTIAL"
            $result.Error = $body.error
        }
        
        return $result
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        $result = @{
            Name = $Name
            Url = $Url
            Status = "❌ FAILED"
            StatusCode = $statusCode
            Success = $false
            HasData = $false
            DataCount = 0
            Error = $errorMessage
        }
        
        Write-Host "❌ Status: $statusCode - ERROR" -ForegroundColor Red
        Write-Host "   Error: $errorMessage" -ForegroundColor Red
        
        return $result
    }
}

# Test endpoints
Write-Host "🔍 Testing Study in Kazakhstan API Endpoints..." -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Get all universities
$results += Test-Endpoint -Name "Get All Universities" `
    -Url "$API_BASE/api/public/v1/$ORG_SLUG/posts?post_type=universities&per_page=2" `
    -Headers $headers

# 2. Get all programs
$results += Test-Endpoint -Name "Get All Programs" `
    -Url "$API_BASE/api/public/v1/$ORG_SLUG/posts?post_type=programs&per_page=2" `
    -Headers $headers

# 3. Search universities
$results += Test-Endpoint -Name "Search Universities (Coventry)" `
    -Url "$API_BASE/api/public/v1/$ORG_SLUG/posts?post_type=universities&search=coventry&per_page=5" `
    -Headers $headers

# 4. Get single university (Coventry)
$results += Test-Endpoint -Name "Get Single University (Coventry)" `
    -Url "$API_BASE/api/public/v1/$ORG_SLUG/posts/coventry-university-kazakhstan" `
    -Headers $headers

# 5. Get programs by university
$results += Test-Endpoint -Name "Get Programs by University" `
    -Url "$API_BASE/api/public/v1/$ORG_SLUG/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5" `
    -Headers $headers

# 6. Get taxonomies (disciplines)
$results += Test-Endpoint -Name "Get Taxonomies (Disciplines)" `
    -Url "$API_BASE/api/public/v1/$ORG_SLUG/taxonomies/disciplines" `
    -Headers $headers

# 7. Get organizations (admin)
$results += Test-Endpoint -Name "Get Organizations (Admin)" `
    -Url "$API_BASE/api/admin/v1/organizations" `
    -Headers $headers

# 8. Field selection test
$results += Test-Endpoint -Name "Field Selection Test" `
    -Url "$API_BASE/api/public/v1/$ORG_SLUG/posts?post_type=universities&fields=id,title,slug,customFields&per_page=2" `
    -Headers $headers

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 60

$working = ($results | Where-Object { $_.Status -eq "✅ WORKING" }).Count
$partial = ($results | Where-Object { $_.Status -eq "⚠️ PARTIAL" }).Count
$failed = ($results | Where-Object { $_.Status -eq "❌ FAILED" }).Count

Write-Host "✅ Working: $working" -ForegroundColor Green
Write-Host "⚠️ Partial: $partial" -ForegroundColor Yellow
Write-Host "❌ Failed: $failed" -ForegroundColor Red

Write-Host "`n📋 DETAILED RESULTS:" -ForegroundColor Cyan
$results | Format-Table -AutoSize Name, Status, StatusCode, Success, DataCount, Error

# List failed endpoints
$failedEndpoints = $results | Where-Object { $_.Status -eq "❌ FAILED" }
if ($failedEndpoints.Count -gt 0) {
    Write-Host "`n❌ FAILED ENDPOINTS:" -ForegroundColor Red
    foreach ($endpoint in $failedEndpoints) {
        Write-Host "  - $($endpoint.Name)" -ForegroundColor Red
        Write-Host "    URL: $($endpoint.Url)" -ForegroundColor Gray
        Write-Host "    Error: $($endpoint.Error)" -ForegroundColor Gray
    }
}

# List partial endpoints
$partialEndpoints = $results | Where-Object { $_.Status -eq "⚠️ PARTIAL" }
if ($partialEndpoints.Count -gt 0) {
    Write-Host "`n⚠️ PARTIAL ENDPOINTS (API returned success=false):" -ForegroundColor Yellow
    foreach ($endpoint in $partialEndpoints) {
        Write-Host "  - $($endpoint.Name)" -ForegroundColor Yellow
        Write-Host "    URL: $($endpoint.Url)" -ForegroundColor Gray
    }
}

