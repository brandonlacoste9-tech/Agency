#!/usr/bin/env node
// scripts/check-corruption.js
const fs = require('fs');
const path = require('path');

const PATTERNS = {
  duplicateFunctions: /function\s+\w+.*function\s+\w+/g,
  unmatchedBraces: /\{\{+|\}\}+/g,
  longLines: /.{500,}/g,
  suspiciousRepeats: /(.{20,})\1{2,}/g,
  malformedJson: /"[^"]*"[^,}\]]/g
};

const EXCLUDE_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
const INCLUDE_EXTS = ['.js', '.ts', '.tsx', '.jsx', '.json'];

function shouldCheckFile(filePath) {
  // Skip excluded directories
  for (const dir of EXCLUDE_DIRS) {
    if (filePath.includes(path.sep + dir + path.sep) || filePath.startsWith(dir + path.sep)) {
      return false;
    }
  }
  
  // Only check included extensions
  const ext = path.extname(filePath);
  return INCLUDE_EXTS.includes(ext);
}

function checkBraceBalance(content, filePath) {
  const lines = content.split('\n');
  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  const issues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Skip comments and strings (basic)
    const cleanLine = line
      .replace(/\/\/.*$/, '')          // Remove // comments
      .replace(/\/\*.*?\*\//g, '')     // Remove /* */ comments (single line)
      .replace(/"([^"\\]|\\.)*"/g, '') // Remove double quoted strings
      .replace(/'([^'\\]|\\.)*'/g, ''); // Remove single quoted strings
    
    // Count braces
    for (const char of cleanLine) {
      switch (char) {
        case '{': braceCount++; break;
        case '}': braceCount--; break;
        case '(': parenCount++; break;
        case ')': parenCount--; break;
        case '[': bracketCount++; break;
        case ']': bracketCount--; break;
      }
      
      // Detect negative counts (more closes than opens)
      if (braceCount < 0) {
        issues.push(`Line ${lineNum}: Unmatched closing brace '}' (count: ${braceCount})`);
      }
      if (parenCount < 0) {
        issues.push(`Line ${lineNum}: Unmatched closing parenthesis ')' (count: ${parenCount})`);
      }
      if (bracketCount < 0) {
        issues.push(`Line ${lineNum}: Unmatched closing bracket ']' (count: ${bracketCount})`);
      }
    }
  }
  
  // Final balance check
  if (braceCount !== 0) {
    issues.push(`Unbalanced braces: ${braceCount > 0 ? braceCount + ' unclosed' : Math.abs(braceCount) + ' extra closing'}`);
  }
  if (parenCount !== 0) {
    issues.push(`Unbalanced parentheses: ${parenCount > 0 ? parenCount + ' unclosed' : Math.abs(parenCount) + ' extra closing'}`);
  }
  if (bracketCount !== 0) {
    issues.push(`Unbalanced brackets: ${bracketCount > 0 ? bracketCount + ' unclosed' : Math.abs(bracketCount) + ' extra closing'}`);
  }
  
  return issues;
}

function checkPatterns(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  // Check for long lines
  lines.forEach((line, index) => {
    if (line.length > 500) {
      issues.push(`Line ${index + 1}: Very long line (${line.length} chars) - potential corruption`);
    }
  });
  
  // Check for duplicate function declarations
  const functionMatches = content.match(/function\s+(\w+)/g);
  if (functionMatches) {
    const functionNames = functionMatches.map(match => match.replace('function ', ''));
    const duplicates = functionNames.filter((name, index) => functionNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      issues.push(`Duplicate function declarations: ${[...new Set(duplicates)].join(', ')}`);
    }
  }
  
  // Check for suspicious character repetition
  const suspiciousMatches = content.match(PATTERNS.suspiciousRepeats);
  if (suspiciousMatches) {
    issues.push(`Suspicious character repetition found (${suspiciousMatches.length} instances)`);
  }
  
  // JSON-specific checks
  if (path.extname(filePath) === '.json') {
    try {
      JSON.parse(content);
    } catch (error) {
      issues.push(`Invalid JSON: ${error.message}`);
    }
  }
  
  return issues;
}

function syntaxCheck(filePath) {
  const ext = path.extname(filePath);
  
  if (ext === '.js') {
    try {
      // Use Node.js to check syntax
      require('child_process').execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
      return [];
    } catch (error) {
      return [`Syntax error: ${error.message.replace(/\n/g, ' ')}`];
    }
  }
  
  return []; // Skip syntax check for other file types
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Brace balance check
    issues.push(...checkBraceBalance(content, filePath));
    
    // Pattern checks
    issues.push(...checkPatterns(content, filePath));
    
    // Syntax check
    issues.push(...syntaxCheck(filePath));
    
    return issues;
  } catch (error) {
    return [`Error reading file: ${error.message}`];
  }
}

function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        walkDirectory(filePath, callback);
      }
    } else if (shouldCheckFile(filePath)) {
      callback(filePath);
    }
  }
}

function main() {
  console.log('🔍 Checking for file corruption patterns...\n');
  
  const startTime = Date.now();
  let totalFiles = 0;
  let filesWithIssues = 0;
  const allIssues = {};
  
  walkDirectory('.', (filePath) => {
    totalFiles++;
    const issues = checkFile(filePath);
    
    if (issues.length > 0) {
      filesWithIssues++;
      allIssues[filePath] = issues;
    }
    
    // Progress indicator
    if (totalFiles % 50 === 0) {
      process.stdout.write('.');
    }
  });
  
  const duration = Date.now() - startTime;
  console.log(`\n\n📊 Scan completed in ${duration}ms`);
  console.log(`📁 Files checked: ${totalFiles}`);
  console.log(`⚠️  Files with issues: ${filesWithIssues}`);
  
  if (filesWithIssues === 0) {
    console.log('✅ No corruption patterns detected!');
    process.exit(0);
  }
  
  console.log('\n🚨 Issues found:\n');
  console.log('═'.repeat(80));
  
  for (const [filePath, issues] of Object.entries(allIssues)) {
    console.log(`\n📄 ${filePath}`);
    console.log('─'.repeat(filePath.length + 2));
    
    issues.forEach(issue => {
      console.log(`  ❌ ${issue}`);
    });
  }
  
  console.log('\n💡 Recommendations:');
  console.log('  • For syntax errors: run `node -c filename.js` to get detailed info');
  console.log('  • For unbalanced braces: use an editor with bracket matching');
  console.log('  • For very long lines: check for copy/paste corruption');
  console.log('  • For duplicate functions: use `git checkout filename` to restore');
  
  // Exit with error code to fail CI
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkFile,
  checkBraceBalance,
  checkPatterns,
  syntaxCheck
};
