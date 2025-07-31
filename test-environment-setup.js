#!/usr/bin/env node

/**
 * Environment Setup Test Script
 * This script tests that all environment variables are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Environment Setup...\n');

// Test 1: Check if .env files exist
console.log('1. Checking .env files...');
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');

if (fs.existsSync(backendEnvPath)) {
  console.log('✅ Backend .env file exists');
} else {
  console.log('❌ Backend .env file missing - run: cd backend && copy env.example .env');
}

if (fs.existsSync(frontendEnvPath)) {
  console.log('✅ Frontend .env file exists');
} else {
  console.log('❌ Frontend .env file missing - run: cd frontend && copy env.example .env');
}

// Test 2: Check if .gitignore files are updated
console.log('\n2. Checking .gitignore files...');
const backendGitignorePath = path.join(__dirname, 'backend', '.gitignore');
const frontendGitignorePath = path.join(__dirname, 'frontend', '.gitignore');

if (fs.existsSync(backendGitignorePath)) {
  const backendGitignore = fs.readFileSync(backendGitignorePath, 'utf8');
  if (backendGitignore.includes('.env')) {
    console.log('✅ Backend .gitignore includes .env files');
  } else {
    console.log('❌ Backend .gitignore missing .env entries');
  }
} else {
  console.log('❌ Backend .gitignore file missing');
}

if (fs.existsSync(frontendGitignorePath)) {
  const frontendGitignore = fs.readFileSync(frontendGitignorePath, 'utf8');
  if (frontendGitignore.includes('.env')) {
    console.log('✅ Frontend .gitignore includes .env files');
  } else {
    console.log('❌ Frontend .gitignore missing .env entries');
  }
} else {
  console.log('❌ Frontend .gitignore file missing');
}

// Test 3: Check if dotenv is installed in backend
console.log('\n3. Checking backend dependencies...');
const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
if (fs.existsSync(backendPackagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
  if (packageJson.dependencies && packageJson.dependencies.dotenv) {
    console.log('✅ dotenv is installed in backend');
  } else {
    console.log('❌ dotenv not installed - run: cd backend && npm install dotenv');
  }
} else {
  console.log('❌ Backend package.json not found');
}

// Test 4: Check if environment configuration files exist
console.log('\n4. Checking configuration files...');
const frontendConfigPath = path.join(__dirname, 'frontend', 'src', 'config', 'environment.js');
if (fs.existsSync(frontendConfigPath)) {
  console.log('✅ Frontend environment config exists');
} else {
  console.log('❌ Frontend environment config missing');
}

// Test 5: Check if documentation files exist
console.log('\n5. Checking documentation...');
const docs = [
  'ENVIRONMENT_SETUP.md',
  'HARDCODE_REMOVAL_SUMMARY.md'
];

docs.forEach(doc => {
  if (fs.existsSync(path.join(__dirname, doc))) {
    console.log(`✅ ${doc} exists`);
  } else {
    console.log(`❌ ${doc} missing`);
  }
});

console.log('\n📋 Next Steps:');
console.log('1. Update your .env files with actual values:');
console.log('   - Backend: Update database credentials, JWT secret, email settings');
console.log('   - Frontend: Update API URL if needed');
console.log('');
console.log('2. Test the application:');
console.log('   - Backend: npm run dev (should start without errors)');
console.log('   - Frontend: npm run dev (should connect to backend)');
console.log('');
console.log('3. Verify no hardcoded values remain:');
console.log('   - Check browser network tab for hardcoded URLs');
console.log('   - Check backend console for hardcoded values');
console.log('');
console.log('✅ Environment setup test completed!'); 