const fs = require('fs');
const path = require('path');

// Define the services structure to test
const servicesToTest = [
  {
    name: 'Auth Service',
    files: [
      'src/app/services/auth.service.ts'
    ],
    requiredContent: {
      ts: ['AuthService', 'login', 'signup', 'logout', 'isAuthenticated', 'HttpClient']
    }
  },
  {
    name: 'Forms Service',
    files: [
      'src/app/services/forms.service.ts'
    ],
    requiredContent: {
      ts: ['FormsService', 'createForm', 'getForms', 'getFormById', 'updateForm', 'deleteForm', 'HttpClient']
    }
  },
  {
    name: 'Auth Interceptor',
    files: [
      'src/app/interceptors/auth.interceptor.ts'
    ],
    requiredContent: {
      ts: ['HttpInterceptorFn', 'HttpHandlerFn', 'HttpRequest', 'next.handle']
    }
  },
  {
    name: 'Auth Guard',
    files: [
      'src/app/guards/auth.guard.ts'
    ],
    requiredContent: {
      ts: ['authGuard', 'CanActivateFn', 'Router', 'inject']
    }
  },
  {
    name: 'Form Model',
    files: [
      'src/app/models/form.model.ts'
    ],
    requiredContent: {
      ts: ['Form', 'FormField', 'FormSubmission', 'interface']
    }
  },
  {
    name: 'App Routes',
    files: [
      'src/app/app.routes.ts'
    ],
    requiredContent: {
      ts: ['Routes', 'LaunchComponent', 'SignupComponent', 'LoginComponent', 'HomeComponent', 'CreateFormComponent', 'FormSubmissionComponent', 'ConfirmationComponent', 'authGuard']
    }
  },
  {
    name: 'App Config',
    files: [
      'src/app/app.config.ts'
    ],
    requiredContent: {
      ts: ['ApplicationConfig', 'provideRouter', 'provideHttpClient', 'withInterceptors']
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

// Test each service
let allServicesValid = true;
const results = [];

servicesToTest.forEach(service => {
  console.log(`\nTesting ${service.name}...`);
  
  const serviceResult = {
    name: service.name,
    filesExist: true,
    contentValid: true,
    details: []
  };
  
  // Check if all files exist
  service.files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const exists = fileExists(fullPath);
    
    serviceResult.details.push({
      file,
      exists,
      contentValid: null
    });
    
    if (!exists) {
      serviceResult.filesExist = false;
      console.log(`  ❌ File not found: ${file}`);
    } else {
      console.log(`  ✅ File found: ${file}`);
      
      // Check content for .ts and .html files
      const ext = path.extname(file).substring(1);
      if (service.requiredContent && service.requiredContent[ext]) {
        const contentValid = fileContainsContent(fullPath, service.requiredContent[ext]);
        
        serviceResult.details[serviceResult.details.length - 1].contentValid = contentValid;
        
        if (!contentValid) {
          serviceResult.contentValid = false;
          console.log(`  ❌ Required content not found in ${file}`);
        } else {
          console.log(`  ✅ Required content found in ${file}`);
        }
      }
    }
  });
  
  if (serviceResult.filesExist && serviceResult.contentValid) {
    console.log(`  ✅ ${service.name} is valid!`);
  } else {
    allServicesValid = false;
    console.log(`  ❌ ${service.name} has issues!`);
  }
  
  results.push(serviceResult);
});

console.log('\n==== SUMMARY ====');
if (allServicesValid) {
  console.log('✅ All services are valid and ready for testing!');
} else {
  console.log('❌ Some services have issues that need to be fixed.');
  
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
