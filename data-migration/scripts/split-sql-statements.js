/**
 * Split the large SQL file into individual statement files
 * This makes it easier to run statements one at a time if needed
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL_FILE = path.join(__dirname, 'fix-missing-field-attachments.sql');
const OUTPUT_DIR = path.join(__dirname, 'sql-statements');

async function splitSQLFile() {
  console.log('Reading SQL file...');
  const content = await fs.readFile(SQL_FILE, 'utf-8');
  
  // Split by INSERT statements (each ends with ); followed by blank lines)
  const statements = [];
  let currentStatement = '';
  let inStatement = false;
  let statementNumber = 0;
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith('INSERT INTO post_type_fields')) {
      // Start of new statement
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      currentStatement = line + '\n';
      inStatement = true;
      statementNumber++;
    } else if (inStatement) {
      currentStatement += line + '\n';
      
      // Check if this is the end of the statement (ends with );)
      if (line.trim() === ');') {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inStatement = false;
      }
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  console.log(`Found ${statements.length} INSERT statements`);
  
  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Extract metadata and write individual files
  const metadata = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Extract organization and post type from the statement
    const orgMatch = statement.match(/o\.slug = '([^']+)'/);
    const postTypeMatch = statement.match(/pt\.slug = '([^']+)'/);
    
    const org = orgMatch ? orgMatch[1] : 'unknown';
    const postType = postTypeMatch ? postTypeMatch[1] : 'unknown';
    
    const filename = `${i + 1}-${org}-${postType}.sql`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    // Add header comment
    const header = `-- Statement ${i + 1}/${statements.length}\n-- Organization: ${org}\n-- Post Type: ${postType}\n--\n\n`;
    const fullStatement = header + statement + '\n';
    
    await fs.writeFile(filepath, fullStatement, 'utf-8');
    
    metadata.push({
      number: i + 1,
      org,
      postType,
      filename,
      size: fullStatement.length
    });
    
    console.log(`  ✓ Created: ${filename}`);
  }
  
  // Create index file
  const indexContent = `# SQL Statements Index

Generated from: fix-missing-field-attachments.sql
Total statements: ${statements.length}

## Statements

${metadata.map(m => `### ${m.number}. ${m.org} → ${m.postType}\n- File: \`${m.filename}\`\n- Size: ${m.size.toLocaleString()} bytes\n- Run: \`npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/sql-statements/${m.filename}\`\n`).join('\n')}

## Run All Remaining (excluding already executed)

To run all statements except the one you already ran (paris-american-international-university programs):

\`\`\`bash
# Run statements 1-7 (skip #8 which is already done)
for i in {1..7}; do
  npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/sql-statements/$i-*.sql
done
\`\`\`

Or run the original file (it will skip duplicates automatically):
\`\`\`bash
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/fix-missing-field-attachments.sql
\`\`\`
`;
  
  await fs.writeFile(path.join(OUTPUT_DIR, 'README.md'), indexContent, 'utf-8');
  
  console.log(`\n✅ Split complete!`);
  console.log(`   Output directory: ${OUTPUT_DIR}`);
  console.log(`   Created ${statements.length} individual SQL files`);
  console.log(`   See ${path.join(OUTPUT_DIR, 'README.md')} for details`);
}

splitSQLFile().catch(console.error);
