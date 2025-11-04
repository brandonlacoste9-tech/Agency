#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Find all JavaScript files recursively, excluding node_modules
 */
function findJavaScriptFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other excluded directories
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') {
          continue;
        }
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Check JavaScript syntax using node -c
 */
function checkSyntax(filePath) {
  try {
    execSync(`node -c "${filePath}"`, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.stderr || error.message 
    };
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Checking JavaScript syntax...');
  
  const jsFiles = findJavaScriptFiles('.');
  console.log(`📄 Found ${jsFiles.length} JavaScript files`);
  
  let errorCount = 0;
  
  for (const file of jsFiles) {
    const result = checkSyntax(file);
    
    if (result.success) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file}`);
      console.log(`   Error: ${result.error.trim()}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary: ${jsFiles.length - errorCount} passed, ${errorCount} failed`);
  
  if (errorCount > 0) {
    console.log('💡 Fix syntax errors before committing');
    process.exit(1);
  }
  
  console.log('🎉 All JavaScript files have valid syntax!');
}

main();
