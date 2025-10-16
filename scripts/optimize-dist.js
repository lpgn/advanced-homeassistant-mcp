#!/usr/bin/env node

/**
 * Post-build optimization script
 * Reduces built dist files size and improves performance
 */

import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

const distDir = './dist';

// Remove source maps in production
if (process.env.NODE_ENV === 'production') {
  const files = ['index.js.map', 'stdio-server.js.map'];
  files.forEach(file => {
    const path = join(distDir, file);
    if (existsSync(path)) {
      rmSync(path);
      console.log(`✓ Removed ${file}`);
    }
  });
}

// Add shebang to entry points for better CLI usage
const entryPoints = ['index.js', 'stdio-server.js'];
entryPoints.forEach(file => {
  const path = join(distDir, file);
  if (existsSync(path)) {
    let content = readFileSync(path, 'utf-8');
    if (!content.startsWith('#!/')) {
      content = '#!/usr/bin/env bun\n' + content;
      writeFileSync(path, content);
      console.log(`✓ Added shebang to ${file}`);
    }
  }
});

console.log('✓ Build optimization complete');
