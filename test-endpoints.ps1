# Test Study in Kazakhstan API Endpoints
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
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?post_type=universities&per_page=2" -Method Get -Headers $headers
    Write-Host "   Status: SUCCESS" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 3 -Compress)"
    Write-Host ""
} catch {
    Write-Host "   Status: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 2: Get Single University (Coventry)
Write-Host "2. Testing: Get Single University (Coventry)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts/coventry-university-kazakhstan" -Method Get -Headers $headers
    Write-Host "   Status: SUCCESS" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 3 -Compress)"
    Write-Host ""
} catch {
    Write-Host "   Status: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 3: Get All Programs
Write-Host "3. Testing: Get All Programs" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?post_type=programs&per_page=2" -Method Get -Headers $headers
    Write-Host "   Status: SUCCESS" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 3 -Compress)"
    Write-Host ""
} catch {
    Write-Host "   Status: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 4: Get Programs by University
Write-Host "4. Testing: Get Programs by University" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=5" -Method Get -Headers $headers
    Write-Host "   Status: SUCCESS" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 3 -Compress)"
    Write-Host ""
} catch {
    Write-Host "   Status: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 5: Get Taxonomies (disciplines)
Write-Host "5. Testing: Get Taxonomies (disciplines)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/taxonomies/disciplines" -Method Get -Headers $headers
    Write-Host "   Status: SUCCESS" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 3 -Compress)"
    Write-Host ""
} catch {
    Write-Host "   Status: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 6: Get Taxonomies (program-disciplines)
Write-Host "6. Testing: Get Taxonomies (program-disciplines)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/taxonomies/program-disciplines" -Method Get -Headers $headers
    Write-Host "   Status: SUCCESS" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 3 -Compress)"
    Write-Host ""
} catch {
    Write-Host "   Status: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 7: Get Programs by Discipline
Write-Host "7. Testing: Get Programs by Discipline" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/taxonomies/disciplines/engineering/posts?post_type=programs&per_page=5" -Method Get -Headers $headers
    Write-Host "   Status: SUCCESS" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 3 -Compress)"
    Write-Host ""
} catch {
    Write-Host "   Status: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host ""
}

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
