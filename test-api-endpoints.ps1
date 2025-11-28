# Test Study in Kazakhstan API Endpoints
# Run this script manually in PowerShell to see the results

$baseUrl = "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan"
$apiKey = "omni_099c139e8f5dce0edfc59cc9926d0cd7"
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

Write-Host "`n=== Testing Study in Kazakhstan API Endpoints ===`n" -ForegroundColor Cyan

# Test 1: Get All Universities
Write-Host "1. Testing: Get All Universities" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?post_type=universities&page=1&per_page=2" -Headers $headers -Method GET
    Write-Host "   ✓ Success: $($response.success)" -ForegroundColor Green
    Write-Host "   ✓ Count: $($response.data.Count)" -ForegroundColor Green
    Write-Host "   ✓ Total: $($response.meta.total)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get Single University
Write-Host "`n2. Testing: Get Single University (Coventry)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts/coventry-university-kazakhstan" -Headers $headers -Method GET
    Write-Host "   ✓ Success: $($response.success)" -ForegroundColor Green
    Write-Host "   ✓ Title: $($response.data.title)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get All Programs
Write-Host "`n3. Testing: Get All Programs" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?post_type=programs&per_page=2" -Headers $headers -Method GET
    Write-Host "   ✓ Success: $($response.success)" -ForegroundColor Green
    Write-Host "   ✓ Count: $($response.data.Count)" -ForegroundColor Green
    Write-Host "   ✓ Total: $($response.meta.total)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Programs by University
Write-Host "`n4. Testing: Get Programs by University (Coventry)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=2" -Headers $headers -Method GET
    Write-Host "   ✓ Success: $($response.success)" -ForegroundColor Green
    Write-Host "   ✓ Count: $($response.data.Count)" -ForegroundColor Green
    Write-Host "   ✓ Total: $($response.meta.total)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get Taxonomies
Write-Host "`n5. Testing: Get Taxonomies (program-disciplines)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/taxonomies/program-disciplines" -Headers $headers -Method GET
    Write-Host "   ✓ Success: $($response.success)" -ForegroundColor Green
    Write-Host "   ✓ Terms Count: $($response.data.terms.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===`n" -ForegroundColor Cyan

