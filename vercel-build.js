const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to safely delete a file if it exists
function safeDelete(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`Removing conflicting file: ${filePath}`);
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error(`Error deleting ${filePath}:`, error.message);
  }
  return false;
}

// Define paths to check for conflicts
const conflictPaths = [
  path.resolve(__dirname, 'src/pages/index.tsx'),
  path.resolve(__dirname, 'src/pages/index.js'),
  path.resolve(__dirname, 'src/pages/index.jsx'),
];

// Delete conflicting files
let deletedCount = 0;
conflictPaths.forEach(filePath => {
  if (safeDelete(filePath)) {
    deletedCount++;
  }
});

console.log(`Deleted ${deletedCount} conflicting files`);

// Run Next.js build
try {
  console.log('Running Next.js build...');
  execSync('next build', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 