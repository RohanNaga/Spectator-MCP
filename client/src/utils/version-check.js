const chalk = require('chalk');
const { execSync } = require('child_process');

/**
 * Check if Node.js and npx versions meet minimum requirements
 * @returns {Object} { valid: boolean, nodeVersion: string, npxVersion: string, error?: string }
 */
function checkVersions() {
  try {
    // Check Node.js version FIRST (most important)
    const nodeVersion = process.version; // e.g., 'v16.19.0'
    const nodeMatch = nodeVersion.match(/^v(\d+)\.(\d+)\.(\d+)/);
    
    if (!nodeMatch) {
      return {
        valid: false,
        nodeVersion,
        error: 'Unable to parse Node.js version'
      };
    }
    
    const nodeMajor = parseInt(nodeMatch[1]);
    
    // mcp-remote requires Node 18+ for TransformStream API
    if (nodeMajor < 18) {
      return {
        valid: false,
        nodeVersion,
        error: `Node.js ${nodeVersion} is too old. Please update to Node.js 18.0.0 or higher (required for TransformStream API)`
      };
    }
    
    // Check npx version
    let npxVersion;
    try {
      npxVersion = execSync('npx --version', { encoding: 'utf-8' }).trim();
    } catch (error) {
      // Fallback to npm version
      const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
      npxVersion = `npm ${npmVersion} (includes npx)`;
    }
    
    const npxMatch = npxVersion.match(/^(\d+)\.(\d+)\.(\d+)/);
    
    if (npxMatch) {
      const npxMajor = parseInt(npxMatch[1]);
      
      // npx 7+ required for -y flag (comes with Node 15+, but we need Node 18+ anyway)
      if (npxMajor < 7) {
        return {
          valid: false,
          nodeVersion,
          npxVersion,
          error: `npx version ${npxVersion} is too old. Please update to npx 7.0.0 or higher`
        };
      }
    }
    
    return {
      valid: true,
      nodeVersion,
      npxVersion
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Unable to check versions. Please ensure Node.js and npm are properly installed'
    };
  }
}

/**
 * Display version warning if needed
 * @param {boolean} exitOnError - Whether to exit the process on error
 */
function ensureVersions(exitOnError = true) {
  const result = checkVersions();
  
  if (!result.valid) {
    console.error(chalk.red('⚠️  Version Error'));
    console.error(chalk.yellow(`   ${result.error}`));
    console.error(chalk.yellow('   To update Node.js, use nvm: nvm install 18 && nvm use 18'));
    console.error(chalk.yellow('   Or visit: https://nodejs.org/'));
    
    if (exitOnError) {
      process.exit(1);
    }
  }
  
  return result;
}

// Export both old and new function names for compatibility
module.exports = {
  checkVersions,
  ensureVersions,
  // Legacy exports for backward compatibility
  checkNpxVersion: checkVersions,
  ensureNpxVersion: ensureVersions
};