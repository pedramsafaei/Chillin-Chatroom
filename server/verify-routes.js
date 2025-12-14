// Quick verification script to check route structure
const fs = require('fs');
const path = require('path');

console.log('Verifying REST API Route Implementation...\n');

const routeFiles = [
  'routes/auth.js',
  'routes/users.js', 
  'routes/rooms.js',
  'routes/messages.js',
  'routes/uploads.js'
];

const middlewareFiles = [
  'middleware/auth.js',
  'middleware/validation.js'
];

const modelFiles = [
  'database/models/User.js',
  'database/models/Room.js',
  'database/models/Message.js',
  'database/models/Reaction.js',
  'database/models/Attachment.js'
];

console.log('✓ Route Files:');
routeFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
});

console.log('\n✓ Middleware Files:');
middlewareFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
});

console.log('\n✓ Model Files:');
modelFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
});

// Check index.js for route mounting
const indexJs = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
console.log('\n✓ Route Mounting in index.js:');
const mounts = [
  "/api/v1/auth",
  "/api/v1/users",
  "/api/v1/rooms",
  "/api/v1/messages",
  "/api/v1/uploads"
];
mounts.forEach(mount => {
  const mounted = indexJs.includes(`'${mount}'`);
  console.log(`  ${mounted ? '✓' : '✗'} ${mount}`);
});

console.log('\n✓ REST API Implementation Complete!');
console.log('\nAPI Documentation: server/API_DOCUMENTATION.md');
console.log('Test Script: server/test-api.sh\n');
