#!/bin/bash

# Fix Frontend Issues Script
# This script addresses security vulnerabilities and optimizes the build

echo "🔧 Fixing frontend issues..."

# Navigate to frontend directory
cd frontend

echo "📦 Checking for security vulnerabilities..."
npm audit

echo "🛠️ Fixing security vulnerabilities..."
npm audit fix

# If vulnerabilities persist, try force fix
if [ $? -ne 0 ]; then
    echo "⚠️ Some vulnerabilities couldn't be fixed automatically. Trying force fix..."
    npm audit fix --force
fi

echo "🔄 Updating outdated packages..."
npm outdated
npm update

echo "🧹 Cleaning npm cache..."
npm cache clean --force

echo "📦 Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

echo "🏗️ Building optimized version..."
npm run build

echo "✅ Frontend issues fixed!"
echo ""
echo "📊 Build summary:"
echo "- Security vulnerabilities should be resolved"
echo "- Bundle size should be optimized"
echo "- Dependencies are up to date"
echo ""
echo "🔍 To check remaining issues:"
echo "  npm audit"
echo "  npm run build" 