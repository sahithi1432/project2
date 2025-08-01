// Debug script to test deployment issues
import fetch from 'node-fetch';

const BASE_URL = process.env.RENDER_URL || 'https://your-app-name.onrender.com';

async function testEndpoints() {
  console.log('🔍 Testing deployment endpoints...\n');
  
  const endpoints = [
    '/',
    '/api/health',
    '/api/auth/login',
    '/test-api.html'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${BASE_URL}${endpoint}`);
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (endpoint === '/api/health') {
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
      }
      
      console.log('---\n');
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
}

// Test database connection
async function testDatabase() {
  console.log('🗄️ Testing database connection...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    if (data.environment === 'production') {
      console.log('✅ Environment: Production');
    } else {
      console.log('⚠️ Environment: Development');
    }
    
    console.log(`Port: ${data.port}`);
    console.log(`CORS Origin: ${data.corsOrigin}`);
    console.log('---\n');
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}\n`);
  }
}

// Run tests
async function runTests() {
  await testEndpoints();
  await testDatabase();
}

runTests().catch(console.error); 