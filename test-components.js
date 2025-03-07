const fs = require('fs');
const path = require('path');

// Define the component structure to test
const componentsToTest = [
  {
    name: 'Launch Component',
    files: [
      'src/app/components/launch/launch.component.ts',
      'src/app/components/launch/launch.component.html',
      'src/app/components/launch/launch.component.scss'
    ],
    requiredContent: {
      ts: ['LaunchComponent', 'Router', 'navigate'],
      html: ['Get Started', 'button']
    }
  },
  {
    name: 'Signup Component',
    files: [
      'src/app/components/auth/signup.component.ts',
      'src/app/components/auth/signup.component.html'
    ],
    requiredContent: {
      ts: ['SignupComponent', 'FormBuilder', 'AuthService', 'Validators'],
      html: ['Sign Up', 'form', 'input', 'email', 'password']
    }
  },
  {
    name: 'Login Component',
    files: [
      'src/app/components/auth/login.component.ts',
      'src/app/components/auth/login.component.html'
    ],
    requiredContent: {
      ts: ['LoginComponent', 'FormBuilder', 'AuthService', 'Validators'],
      html: ['Log In', 'form', 'input', 'email', 'password']
    }
  },
  {
    name: 'Home Component',
    files: [
      'src/app/components/home/home.component.ts',
      'src/app/components/home/home.component.html'
    ],
    requiredContent: {
      ts: ['HomeComponent', 'FormsService', 'Router'],
      html: ['Home', 'Create New Form', 'Search']
    }
  },
  {
    name: 'Create Form Component',
    files: [
      'src/app/components/create-form/create-form.component.ts',
      'src/app/components/create-form/create-form.component.html'
    ],
    requiredContent: {
      ts: ['CreateFormComponent', 'FormBuilder', 'FormsService'],
      html: ['Create Form', 'form', 'button']
    }
  },
  {
    name: 'Form Submission Component',
    files: [
      'src/app/components/form-submission/form-submission.component.ts',
      'src/app/components/form-submission/form-submission.component.html',
      'src/app/components/form-submission/form-submission.component.scss'
    ],
    requiredContent: {
      ts: ['FormSubmissionComponent', 'FormBuilder', 'FormsService', 'ActivatedRoute'],
      html: ['form', 'submit', 'input']
    }
  },
  {
    name: 'Confirmation Component',
    files: [
      'src/app/components/confirmation/confirmation.component.ts',
      'src/app/components/confirmation/confirmation.component.html',
      'src/app/components/confirmation/confirmation.component.scss'
    ],
    requiredContent: {
      ts: ['ConfirmationComponent', 'FormsService', 'ActivatedRoute'],
      html: ['Successfully', 'Submission']
    }
  },
  {
    name: 'Header Component',
    files: [
      'src/app/components/shared/header/header.component.ts',
      'src/app/components/shared/header/header.component.html',
      'src/app/components/shared/header/header.component.scss'
    ],
    requiredContent: {
      ts: ['HeaderComponent', 'Router'],
      html: ['Form Builder', 'Log', 'Sign']
    }
  }
];

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Function to check if file contains required content
function fileContainsContent(filePath, requiredContent) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return requiredContent.every(item => content.includes(item));
  } catch (err) {
    return false;
  }
}

// Test each component
let allComponentsValid = true;
const results = [];

componentsToTest.forEach(component => {
  console.log(`\nTesting ${component.name}...`);
  
  const componentResult = {
    name: component.name,
    filesExist: true,
    contentValid: true,
    details: []
  };
  
  // Check if all files exist
  component.files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const exists = fileExists(fullPath);
    
    componentResult.details.push({
      file,
      exists,
      contentValid: null
    });
    
    if (!exists) {
      componentResult.filesExist = false;
      console.log(`  ❌ File not found: ${file}`);
    } else {
      console.log(`  ✅ File found: ${file}`);
      
      // Check content for .ts and .html files
      const ext = path.extname(file).substring(1);
      if (component.requiredContent && component.requiredContent[ext]) {
        const contentValid = fileContainsContent(fullPath, component.requiredContent[ext]);
        
        componentResult.details[componentResult.details.length - 1].contentValid = contentValid;
        
        if (!contentValid) {
          componentResult.contentValid = false;
          console.log(`  ❌ Required content not found in ${file}`);
        } else {
          console.log(`  ✅ Required content found in ${file}`);
        }
      }
    }
  });
  
  if (componentResult.filesExist && componentResult.contentValid) {
    console.log(`  ✅ ${component.name} is valid!`);
  } else {
    allComponentsValid = false;
    console.log(`  ❌ ${component.name} has issues!`);
  }
  
  results.push(componentResult);
});

console.log('\n==== SUMMARY ====');
if (allComponentsValid) {
  console.log('✅ All components are valid and ready for testing!');
} else {
  console.log('❌ Some components have issues that need to be fixed.');
  
  results.filter(r => !r.filesExist || !r.contentValid).forEach(result => {
    console.log(`\nIssues with ${result.name}:`);
    result.details.filter(d => !d.exists || d.contentValid === false).forEach(detail => {
      if (!detail.exists) {
        console.log(`  - File not found: ${detail.file}`);
      } else if (detail.contentValid === false) {
        console.log(`  - Required content not found in ${detail.file}`);
      }
    });
  });
}
