const fs = require('fs');
const path = require('path');

// Force unbuffered output
process.stdout.setEncoding('utf8');
if (process.stdout.isTTY) {
  process.stdout.setRawMode && process.stdout.setRawMode(false);
}

const csvPath = path.join(__dirname, 'db-28-11-2025', 'List of unknown field slugs still in use.csv');
const outputPath = path.join(__dirname, 'check-csv-result.txt');

let output = '';

function log(message) {
  const msg = message + '\n';
  process.stdout.write(msg);
  process.stdout.flush && process.stdout.flush();
  output += msg;
}

log('Checking CSV file: ' + csvPath);
log('============================================================');

try {
  // Read the CSV file
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    log('ERROR: CSV file is empty');
    fs.writeFileSync(outputPath, output, 'utf-8');
    process.exit(1);
  }
  
  // Parse header
  const header = lines[0].split(',');
  log('Header: ' + header.join(' | '));
  log('');
  
  // Expected columns
  const expectedColumns = ['unknown_field_slug', 'field_name', 'organization_slug', 'usage_count'];
  const hasValidHeader = expectedColumns.every(col => header.includes(col));
  
  if (!hasValidHeader) {
    log('WARNING: Header may not match expected columns');
    log('   Expected: ' + expectedColumns.join(', '));
  } else {
    log('OK: Header is valid');
  }
  log('');
  
  // Parse data rows
  const data = [];
  const fieldSlugs = new Set();
  const organizations = new Set();
  const duplicates = new Map();
  let totalUsageCount = 0;
  let invalidRows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    
    if (columns.length !== header.length) {
      invalidRows.push({ line: i + 1, content: line.substring(0, 50) + '...' });
      continue;
    }
    
    const row = {
      unknown_field_slug: columns[0],
      field_name: columns[1],
      organization_slug: columns[2],
      usage_count: parseInt(columns[3]) || 0
    };
    
    data.push(row);
    fieldSlugs.add(row.unknown_field_slug);
    organizations.add(row.organization_slug);
    totalUsageCount += row.usage_count;
    
    // Check for duplicates
    const key = `${row.unknown_field_slug}-${row.organization_slug}`;
    if (duplicates.has(key)) {
      duplicates.set(key, duplicates.get(key) + 1);
    } else {
      duplicates.set(key, 1);
    }
  }
  
  // Statistics
  log('Statistics:');
  log('   Total rows (excluding header): ' + data.length);
  log('   Unique field slugs: ' + fieldSlugs.size);
  log('   Unique organizations: ' + organizations.size);
  log('   Total usage count: ' + totalUsageCount);
  log('');
  
  // Check for duplicates
  const duplicateEntries = Array.from(duplicates.entries()).filter(([_, count]) => count > 1);
  if (duplicateEntries.length > 0) {
    log('WARNING: Found duplicate entries: ' + duplicateEntries.length);
    duplicateEntries.slice(0, 5).forEach(([key, count]) => {
      log('   ' + key + ': ' + count + ' occurrences');
    });
    if (duplicateEntries.length > 5) {
      log('   ... and ' + (duplicateEntries.length - 5) + ' more');
    }
  } else {
    log('OK: No duplicate entries found');
  }
  log('');
  
  // Invalid rows
  if (invalidRows.length > 0) {
    log('ERROR: Invalid rows (column count mismatch): ' + invalidRows.length);
    invalidRows.slice(0, 5).forEach(row => {
      log('   Line ' + row.line + ': ' + row.content);
    });
  } else {
    log('OK: All rows have valid column count');
  }
  log('');
  
  // Organization breakdown
  const orgCounts = new Map();
  data.forEach(row => {
    const count = orgCounts.get(row.organization_slug) || 0;
    orgCounts.set(row.organization_slug, count + 1);
  });
  
  log('Organization breakdown:');
  Array.from(orgCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([org, count]) => {
      log('   ' + org + ': ' + count + ' unknown fields');
    });
  log('');
  
  // Usage count statistics
  const usageCounts = data.map(row => row.usage_count);
  const minUsage = Math.min(...usageCounts);
  const maxUsage = Math.max(...usageCounts);
  const avgUsage = (totalUsageCount / data.length).toFixed(2);
  
  log('Usage count statistics:');
  log('   Min: ' + minUsage);
  log('   Max: ' + maxUsage);
  log('   Average: ' + avgUsage);
  log('');
  
  log('SUCCESS: CSV file check completed successfully!');
  
  // Write output to file immediately
  fs.writeFileSync(outputPath, output, 'utf-8');
  process.stdout.write('\nResults also saved to: ' + outputPath + '\n');
  process.stdout.flush && process.stdout.flush();
  
} catch (error) {
  const errorMsg = 'ERROR: Error reading CSV file: ' + error.message;
  console.error(errorMsg);
  output += errorMsg + '\n';
  fs.writeFileSync(outputPath, output, 'utf-8');
  process.exit(1);
}
