# Test API Endpoints
$baseUrl = "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan"
$apiKey = "omni_099c139e8f5dce0edfc59cc9926d0cd7"
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

Write-Host "`n=== Testing API Endpoints ===`n" -ForegroundColor Cyan

# Test 1: Get Programs
Write-Host "1. Testing: GET /posts?post_type=programs&per_page=2" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?post_type=programs&per_page=2" -Headers $headers -Method Get
    Write-Host "   ✓ Success" -ForegroundColor Green
    Write-Host "   Status: $($response.success)"
    Write-Host "   Total: $($response.meta.total)"
    Write-Host "   Items returned: $($response.data.Count)"
    if ($response.data.Count -gt 0) {
        Write-Host "   First item: $($response.data[0].title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test 2: Get Universities
Write-Host "`n2. Testing: GET /posts?post_type=universities&per_page=2" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?post_type=universities&per_page=2" -Headers $headers -Method Get
    Write-Host "   ✓ Success" -ForegroundColor Green
    Write-Host "   Status: $($response.success)"
    Write-Host "   Total: $($response.meta.total)"
    Write-Host "   Items returned: $($response.data.Count)"
    if ($response.data.Count -gt 0) {
        Write-Host "   First item: $($response.data[0].title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test 3: Get Single University
Write-Host "`n3. Testing: GET /posts/coventry-university-kazakhstan" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts/coventry-university-kazakhstan" -Headers $headers -Method Get
    Write-Host "   ✓ Success" -ForegroundColor Green
    Write-Host "   Title: $($response.data.title)"
    Write-Host "   Slug: $($response.data.slug)"
    if ($response.data.customFields) {
        Write-Host "   Custom Fields: $($response.data.customFields.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test 4: Get Programs by University
Write-Host "`n4. Testing: GET /posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=2" -Headers $headers -Method Get
    Write-Host "   ✓ Success" -ForegroundColor Green
    Write-Host "   Total programs: $($response.meta.total)"
    Write-Host "   Items returned: $($response.data.Count)"
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test 5: Get Taxonomies
Write-Host "`n5. Testing: GET /taxonomies/disciplines" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/taxonomies/disciplines" -Headers $headers -Method Get
    Write-Host "   ✓ Success" -ForegroundColor Green
    Write-Host "   Taxonomy: $($response.data.taxonomy.name)"
    Write-Host "   Terms count: $($response.data.terms.Count)"
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===`n" -ForegroundColor Cyan
