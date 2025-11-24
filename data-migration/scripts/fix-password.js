/**
 * Fix WordPress password file
 * PowerShell corrupts special characters, so use Node.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const password = 'X@$T06nzmZM%Xyz%l5p3IHSf';
const content = `WORDPRESS_USERNAME=scrape-assist
WORDPRESS_PASSWORD=${password}
`;

const envPath = path.join(__dirname, '../.env.wordpress-auth');
await fs.writeFile(envPath, content, 'utf8');

console.log('Password file updated');
console.log('Username: scrape-assist');
console.log('Password:', password);

