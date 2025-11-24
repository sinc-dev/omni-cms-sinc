#!/bin/bash
# Run SQL fixes on Cloudflare D1
# Usage: ./run-sql-fixes.sh

# Get the database name from wrangler.toml
DATABASE_NAME="omni-cms"
SQL_FILE="sql-fixes.sql"

echo "Running SQL fixes on Cloudflare D1 database: $DATABASE_NAME"
echo "File: $SQL_FILE"
echo ""

# Run SQL file using wrangler
wrangler d1 execute $DATABASE_NAME --file=$SQL_FILE

echo ""
echo "✅ SQL fixes executed!"

