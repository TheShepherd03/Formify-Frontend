const fs = require('fs');
const path = require('path');

// Define the expected structure
const expectedStructure = {
  'src/app': [
    'app.component.ts',
    'app.component.html',
    'app.component.scss',
    'app.routes.ts',
    'app.config.ts'
  ],
  'src/app/components': [
    'launch/launch.component.ts',
    'auth/signup.component.ts',
    'auth/login.component.ts',
    'home/home.component.ts',
    'create-form/create-form.component.ts',
    'form-submission/form-submission.component.ts',
    'confirmation/confirmation.component.ts',
    'shared/header/header.component.ts'
  ],
  'src/app/services': [
    'auth.service.ts',
    'forms.service.ts'
  ],
  'src/app/models': [
    'form.model.ts',
    'user.model.ts'
  ],
  'src/app/interceptors': [
    'auth.interceptor.ts'
  ],
  'src/app/guards': [
    'auth.guard.ts'
  ],
  'src/environments': [
    'environment.ts',
    'environment.development.ts'
  ]
};

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Check the structure
let allFilesExist = true;
const missingFiles = [];

Object.entries(expectedStructure).forEach(([dir, files]) => {
  files.forEach(file => {
    const fullPath = path.join(__dirname, dir, file);
    if (!fileExists(fullPath)) {
      allFilesExist = false;
      missingFiles.push(fullPath);
    }
  });
});

if (allFilesExist) {
  console.log('✅ All expected files exist in the project structure.');
} else {
  console.log('❌ Some expected files are missing:');
  missingFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
}

// Check for TypeScript errors
console.log('\nChecking for TypeScript errors...');
try {
  const { execSync } = require('child_process');
  const result = execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ No TypeScript errors found.');
} catch (error) {
  console.log('❌ TypeScript errors found:');
  console.log(error.stdout.toString());
}
