# PowerShell script to query the study-in-kazakhstan API
$API_BASE = "https://omni-cms-api.joseph-9a2.workers.dev"
$API_KEY = "omni_099c139e8f5dce0edfc59cc9926d0cd7"
$ORG_SLUG = "study-in-kazakhstan"

$headers = @{
    "Authorization" = "Bearer $API_KEY"
    "Content-Type" = "application/json"
}

Write-Host "🔍 Querying API Schema...`n" -ForegroundColor Cyan

# 1. Get organizations
Write-Host "1. Getting organizations..." -ForegroundColor Yellow
try {
    $orgsResponse = Invoke-RestMethod -Uri "$API_BASE/api/admin/v1/organizations" -Headers $headers -Method Get
    $org = $orgsResponse.data | Where-Object { $_.slug -eq $ORG_SLUG }
    if ($org) {
        $orgId = $org.id
        Write-Host "✅ Found organization: $($org.name) (ID: $orgId)`n" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error getting organizations: $_`n" -ForegroundColor Red
    $orgId = $null
}

# 2. Get full schema
if ($orgId) {
    Write-Host "2. Getting full schema..." -ForegroundColor Yellow
    try {
        $schemaResponse = Invoke-RestMethod -Uri "$API_BASE/api/admin/v1/organizations/$orgId/schema" -Headers $headers -Method Get
        $schema = $schemaResponse.data
        
        Write-Host "Post Types: $($schema.postTypes.Count)" -ForegroundColor Cyan
        Write-Host "Taxonomies: $($schema.taxonomies.Count)`n" -ForegroundColor Cyan
        
        Write-Host "📋 Post Types Found:" -ForegroundColor Cyan
        foreach ($pt in $schema.postTypes) {
            $fieldCount = if ($pt.availableFields) { $pt.availableFields.Count } else { 0 }
            Write-Host "  - $($pt.name) ($($pt.slug)) - $fieldCount custom fields"
        }
        
        $universitiesType = $schema.postTypes | Where-Object { 
            $_.slug -eq "universities" -or $_.slug -eq "university" -or $_.name -like "*university*" 
        }
        $programsType = $schema.postTypes | Where-Object { 
            $_.slug -eq "programs" -or $_.slug -eq "program" -or $_.name -like "*program*" 
        }
        
        if ($universitiesType) {
            Write-Host "`n✅ Universities Post Type: $($universitiesType.name) ($($universitiesType.slug))" -ForegroundColor Green
            Write-Host "   Custom Fields: $($universitiesType.availableFields.Count)" -ForegroundColor Green
        }
        
        if ($programsType) {
            Write-Host "✅ Programs Post Type: $($programsType.name) ($($programsType.slug))" -ForegroundColor Green
            Write-Host "   Custom Fields: $($programsType.availableFields.Count)" -ForegroundColor Green
        }
        
        # Save schema to file
        $schema | ConvertTo-Json -Depth 10 | Out-File -FilePath "docs/api/study-in-kazakhstan/schema-full.json" -Encoding utf8
        Write-Host "`n💾 Saved full schema to docs/api/study-in-kazakhstan/schema-full.json" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error getting schema: $_`n" -ForegroundColor Red
    }
}

# 3. Get universities
Write-Host "`n3. Getting universities from public API..." -ForegroundColor Yellow
try {
    $universitiesResponse = Invoke-RestMethod -Uri "$API_BASE/api/public/v1/$ORG_SLUG/posts?post_type=universities&per_page=5" -Headers $headers -Method Get
    Write-Host "Found $($universitiesResponse.meta.total) universities" -ForegroundColor Cyan
    if ($universitiesResponse.data.Count -gt 0) {
        $firstUni = $universitiesResponse.data[0]
        Write-Host "`nExample University: $($firstUni.title) ($($firstUni.slug))" -ForegroundColor Cyan
        Write-Host "Custom Fields: $($firstUni.customFields.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error getting universities: $_" -ForegroundColor Red
}

# 4. Find Coventry University
Write-Host "`n4. Searching for Coventry University..." -ForegroundColor Yellow
try {
    $coventryResponse = Invoke-RestMethod -Uri "$API_BASE/api/public/v1/$ORG_SLUG/posts?post_type=universities&search=coventry&per_page=10" -Headers $headers -Method Get
    $coventry = $coventryResponse.data | Where-Object { 
        $_.slug -like "*coventry*" -or $_.title -like "*coventry*" 
    } | Select-Object -First 1
    
    if ($coventry) {
        Write-Host "`n✅ Found: $($coventry.title) ($($coventry.slug))" -ForegroundColor Green
        Write-Host "All fields: $($coventry.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
        $coventry | ConvertTo-Json -Depth 10 | Out-File -FilePath "docs/api/study-in-kazakhstan/coventry-university-example.json" -Encoding utf8
        Write-Host "💾 Saved to docs/api/study-in-kazakhstan/coventry-university-example.json" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error searching for Coventry: $_" -ForegroundColor Red
    $coventry = $null
}

# 5. Get programs for Coventry
if ($coventry) {
    Write-Host "`n5. Getting programs for $($coventry.title)..." -ForegroundColor Yellow
    try {
        $programsResponse = Invoke-RestMethod -Uri "$API_BASE/api/public/v1/$ORG_SLUG/posts?post_type=programs&related_to_slug=$($coventry.slug)&relationship_type=university&per_page=5" -Headers $headers -Method Get
        Write-Host "Found $($programsResponse.meta.total) programs" -ForegroundColor Cyan
        if ($programsResponse.data.Count -gt 0) {
            $firstProgram = $programsResponse.data[0]
            Write-Host "`nExample Program: $($firstProgram.title)" -ForegroundColor Cyan
            Write-Host "Custom Fields: $($firstProgram.customFields.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
            $programsResponse | ConvertTo-Json -Depth 10 | Out-File -FilePath "docs/api/study-in-kazakhstan/coventry-programs-example.json" -Encoding utf8
            Write-Host "💾 Saved to docs/api/study-in-kazakhstan/coventry-programs-example.json" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Error getting programs: $_" -ForegroundColor Red
    }
}

# 6. Get taxonomies (try common slugs)
Write-Host "`n6. Getting taxonomies..." -ForegroundColor Yellow
$taxonomySlugs = @("disciplines", "program-disciplines", "categories", "program-categories")
foreach ($taxSlug in $taxonomySlugs) {
    try {
        $taxResponse = Invoke-RestMethod -Uri "$API_BASE/api/public/v1/$ORG_SLUG/taxonomies/$taxSlug" -Headers $headers -Method Get -ErrorAction SilentlyContinue
        if ($taxResponse) {
            Write-Host "✅ Found taxonomy: $taxSlug" -ForegroundColor Green
            Write-Host "   Terms: $($taxResponse.data.terms.Count)" -ForegroundColor Cyan
            $taxResponse | ConvertTo-Json -Depth 10 | Out-File -FilePath "docs/api/study-in-kazakhstan/taxonomy-$taxSlug.json" -Encoding utf8
            break
        }
    } catch {
        # Continue to next
    }
}

Write-Host "`n✅ Analysis complete!" -ForegroundColor Green

