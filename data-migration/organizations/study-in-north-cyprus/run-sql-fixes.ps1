# Run SQL fixes on Cloudflare D1
# Usage: .\run-sql-fixes.ps1

# Get the database name from wrangler.toml
$DATABASE_NAME = "omni-cms"
$SQL_FILE = "sql-fixes.sql"

Write-Host "Running SQL fixes on Cloudflare D1 database: $DATABASE_NAME" -ForegroundColor Cyan
Write-Host "File: $SQL_FILE"
Write-Host ""

# Run SQL file using wrangler
wrangler d1 execute $DATABASE_NAME --file=$SQL_FILE

Write-Host ""
Write-Host "✅ SQL fixes executed!" -ForegroundColor Green

