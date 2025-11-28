// Simple test runner script to check if Jest works
const { execSync } = require('child_process');

try {
  console.log('Running Jest tests...');
  const output = execSync('pnpm exec jest --listTests --config jest.config.js', {
    encoding: 'utf8',
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log(output);
} catch (error) {
  console.error('Error running tests:', error.message);
  process.exit(1);
}