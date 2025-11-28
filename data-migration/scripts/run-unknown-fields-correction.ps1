# Run Unknown Fields Correction Scripts
# This script executes the SQL files to correct unknown custom fields

$projectRoot = "c:\Users\Acer\OneDrive\Documents\Software Projects\SINCUNI\omni-cms-sinc"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Unknown Fields Correction" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Map unknown fields to correct fields
Write-Host "Step 1: Mapping unknown fields to correct custom fields..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
cd $projectRoot
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/map-unknown-fields-via-values.sql --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error mapping unknown fields!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Mapping completed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Check remaining unknown fields
Write-Host "Step 2: Checking for remaining unknown fields..." -ForegroundColor Yellow
cd $projectRoot
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/check-remaining-unknown-fields.sql --yes

Write-Host "✓ Check completed" -ForegroundColor Green
Write-Host ""

# Step 3: Cleanup unused unknown fields
Write-Host "Step 3: Cleaning up unused unknown fields..." -ForegroundColor Yellow
cd $projectRoot
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/cleanup-unknown-fields-direct.sql --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error cleaning up unknown fields!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Cleanup completed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Unknown Fields Correction Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
