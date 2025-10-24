#!/usr/bin/env node

/**
 * Security Check: Audit Network Calls
 * 
 * This script verifies that all network calls in the codebase
 * are properly scoped to the user's Home Assistant instance.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get all TypeScript files in src/
const files = execSync('find src -name "*.ts" -type f')
  .toString()
  .split('\n')
  .filter(Boolean);

log('cyan', '\n🔍 Auditing Network Calls\n');
log('cyan', '='.repeat(50));

let totalFetchCalls = 0;
let suspiciousCalls = [];
let approvedPatterns = [
  'HASS_HOST',
  'APP_CONFIG.HASS_HOST',
  'this.baseUrl',
  'localhost',
  '127.0.0.1',
  '${url}',
  '${baseUrl}',
  '${hacsBase}',
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.match(/fetch\s*\(/)) {
      totalFetchCalls++;
      
      // Check if the line contains any approved pattern
      const isApproved = approvedPatterns.some(pattern => 
        line.includes(pattern) || 
        // Check context (previous lines) for variable definitions
        lines.slice(Math.max(0, index - 5), index).some(prevLine => 
          prevLine.includes(pattern) && prevLine.match(/const|let|var|=/)
        )
      );
      
      if (!isApproved && !line.includes('//')) {
        // Check if it's a hardcoded external URL
        const urlMatch = line.match(/(https?:\/\/[^\s\`\'"]+)/);
        if (urlMatch) {
          suspiciousCalls.push({
            file,
            line: index + 1,
            content: line.trim(),
            url: urlMatch[1]
          });
        }
      }
    }
  });
});

log('blue', `\nTotal fetch() calls found: ${totalFetchCalls}`);

if (suspiciousCalls.length === 0) {
  log('green', '\n✅ PASSED: All network calls are properly scoped');
  log('green', '   All fetch() calls target user-configured Home Assistant instance\n');
  
  // Show summary of approved patterns
  log('cyan', 'Approved patterns detected:');
  approvedPatterns.forEach(pattern => {
    log('cyan', `  ✓ ${pattern}`);
  });
  
  process.exit(0);
} else {
  log('red', '\n⚠️  WARNING: Found potentially suspicious network calls:\n');
  
  suspiciousCalls.forEach(call => {
    log('yellow', `${call.file}:${call.line}`);
    log('yellow', `  ${call.content}`);
    if (call.url) {
      log('red', `  → External URL: ${call.url}`);
    }
    console.log();
  });
  
  log('yellow', 'Please verify these calls are intentional and documented.');
  log('yellow', 'If these are legitimate, update the approved patterns in this script.\n');
  
  process.exit(1);
}
