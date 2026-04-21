const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'download.png');
const output192 = path.join(__dirname, '..', 'public', 'icon-192x192.png');
const output512 = path.join(__dirname, '..', 'public', 'icon-512x512.png');

if (!fs.existsSync(inputPath)) {
  console.error('Logo not found at:', inputPath);
  process.exit(1);
}

// Copy and rename the logo to create the icons
const logoBuffer = fs.readFileSync(inputPath);
fs.writeFileSync(output192, logoBuffer);
fs.writeFileSync(output512, logoBuffer);

console.log('Created icon-192x192.png');
console.log('Created icon-512x512.png');
console.log('Icons generated successfully from download.png');
