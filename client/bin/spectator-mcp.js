#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const PlatformDetector = require('../src/config/detector');
const platforms = require('../src/platforms');
const ApiValidator = require('../src/utils/api');
const logger = require('../src/utils/logger');
const packageJson = require('../package.json');

const program = new Command();
const detector = new PlatformDetector();
const apiValidator = new ApiValidator();

program
  .name('spectator-mcp')
  .description('MCP Client for Spectator Context Tool')
  .version(packageJson.version)
  .option('-k, --api-key <key>', 'Your Spectator API key (runs setup)')
  .option('-p, --platforms <platforms>', 'Comma-separated list of platforms to configure (default: all detected)')
  .option('-s, --scope <scope>', 'Configuration scope for platforms that support it (global/project)', 'global');

// Setup function
async function runSetup(options) {
    try {
      logger.header('Spectator MCP Setup');

      // Get API key
      let apiKey = options.apiKey;
      if (!apiKey) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'apiKey',
            message: 'Enter your Spectator API key:',
            validate: (input) => input.trim() !== '' || 'API key is required'
          }
        ]);
        apiKey = answers.apiKey;
      }

      // Validate API key
      logger.startSpinner('Validating API key...');
      const validation = await apiValidator.validateApiKey(apiKey);
      if (!validation.valid) {
        logger.failSpinner(`Invalid API key: ${validation.error}`);
        process.exit(1);
      }
      logger.succeedSpinner('API key validated successfully');

      // Detect installed platforms
      logger.info('Detecting installed platforms...');
      const installedPlatforms = detector.getInstalledPlatforms();
      
      if (installedPlatforms.length === 0) {
        logger.error('No supported platforms detected. Please install Claude, Cursor, Windsurf, VS Code, or Cline first.');
        process.exit(1);
      }

      logger.success(`Found ${installedPlatforms.length} platform(s): ${installedPlatforms.map(p => detector.getPlatformDisplayName(p)).join(', ')}`);

      // Determine which platforms to configure
      let platformsToConfig = installedPlatforms;
      if (options.platforms && options.platforms !== 'all') {
        platformsToConfig = options.platforms.split(',').map(p => p.trim().toLowerCase());
        // Validate platforms
        const invalidPlatforms = platformsToConfig.filter(p => !installedPlatforms.includes(p));
        if (invalidPlatforms.length > 0) {
          logger.error(`Platform(s) not installed: ${invalidPlatforms.join(', ')}`);
          process.exit(1);
        }
      }

      // Configure each platform
      logger.section('Configuring platforms...');
      const results = [];
      
      for (const platformName of platformsToConfig) {
        const PlatformClass = platforms[platformName];
        if (!PlatformClass) {
          logger.warning(`Unknown platform: ${platformName}`);
          continue;
        }

        const platform = new PlatformClass(detector);
        
        try {
          await platform.configure(apiKey, { scope: options.scope });
          results.push({ platform: platformName, success: true });
        } catch (error) {
          logger.error(`Failed to configure ${detector.getPlatformDisplayName(platformName)}: ${error.message}`);
          results.push({ platform: platformName, success: false, error: error.message });
        }
      }

      // Summary
      logger.section('Setup Summary:');
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        logger.success(`Successfully configured: ${successful.map(r => detector.getPlatformDisplayName(r.platform)).join(', ')}`);
      }
      
      if (failed.length > 0) {
        logger.error(`Failed to configure: ${failed.map(r => detector.getPlatformDisplayName(r.platform)).join(', ')}`);
      }

      // Show next steps
      if (successful.length > 0) {
        logger.section('Next Steps:');
        logger.info('1. Restart the configured applications');
        logger.info('2. In Claude (Pro/Team/Enterprise), you can also use the custom connector:');
        logger.info(`   - Name: Spectator Voice Memory`);
        logger.info(`   - URL: ${apiValidator.formatApiUrl(apiKey)}`);
      }

    } catch (error) {
      logger.error(`Setup failed: ${error.message}`);
      process.exit(1);
    }
}

// Setup command
program
  .command('setup')
  .description('Set up Spectator MCP for your AI platforms')
  .option('-k, --api-key <key>', 'Your Spectator API key')
  .option('-p, --platforms <platforms>', 'Comma-separated list of platforms to configure (default: all detected)')
  .option('-s, --scope <scope>', 'Configuration scope for platforms that support it (global/project)', 'global')
  .action(runSetup);

// Validate command
program
  .command('validate')
  .description('Validate existing Spectator MCP configurations')
  .action(async () => {
    try {
      logger.header('Validating Spectator MCP Configurations');

      const installedPlatforms = detector.getInstalledPlatforms();
      if (installedPlatforms.length === 0) {
        logger.warning('No supported platforms detected.');
        return;
      }

      const results = [];
      
      for (const platformName of installedPlatforms) {
        const PlatformClass = platforms[platformName];
        if (!PlatformClass) continue;

        const platform = new PlatformClass(detector);
        const validation = await platform.validate();
        
        results.push({
          platform: platformName,
          ...validation
        });
      }

      // Display results
      logger.section('Validation Results:');
      results.forEach(result => {
        const displayName = detector.getPlatformDisplayName(result.platform);
        if (result.valid) {
          logger.success(`${displayName}: Configured correctly`);
        } else {
          logger.error(`${displayName}: ${result.error || 'Not configured'}`);
        }
      });

    } catch (error) {
      logger.error(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show manual configuration instructions')
  .option('-p, --platform <platform>', 'Show instructions for specific platform')
  .option('-k, --api-key <key>', 'API key to use in instructions')
  .action(async (options) => {
    try {
      logger.header('Manual Configuration Instructions');

      let apiKey = options.apiKey;
      if (!apiKey) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'apiKey',
            message: 'Enter your Spectator API key (or press enter to use YOUR_API_KEY):',
            default: 'YOUR_API_KEY'
          }
        ]);
        apiKey = answers.apiKey;
      }

      let platformsToShow = [];
      
      if (options.platform) {
        platformsToShow = [options.platform.toLowerCase()];
      } else {
        // Show all installed platforms
        platformsToShow = detector.getInstalledPlatforms();
        if (platformsToShow.length === 0) {
          // If none installed, show all
          platformsToShow = Object.keys(platforms);
        }
      }

      for (const platformName of platformsToShow) {
        const PlatformClass = platforms[platformName];
        if (!PlatformClass) {
          logger.warning(`Unknown platform: ${platformName}`);
          continue;
        }

        const platform = new PlatformClass(detector);
        console.log(platform.getManualInstructions(apiKey));
      }

    } catch (error) {
      logger.error(`Failed to show config: ${error.message}`);
      process.exit(1);
    }
  });

// Remove command
program
  .command('remove')
  .description('Remove Spectator MCP from configured platforms')
  .option('-p, --platforms <platforms>', 'Comma-separated list of platforms to remove from (default: all)')
  .action(async (options) => {
    try {
      logger.header('Remove Spectator MCP');

      const installedPlatforms = detector.getInstalledPlatforms();
      let platformsToRemove = installedPlatforms;
      
      if (options.platforms && options.platforms !== 'all') {
        platformsToRemove = options.platforms.split(',').map(p => p.trim().toLowerCase());
      }

      // Confirm removal
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Remove Spectator MCP from ${platformsToRemove.map(p => detector.getPlatformDisplayName(p)).join(', ')}?`,
          default: false
        }
      ]);

      if (!confirm) {
        logger.info('Removal cancelled');
        return;
      }

      // Remove from each platform
      for (const platformName of platformsToRemove) {
        const PlatformClass = platforms[platformName];
        if (!PlatformClass) continue;

        const platform = new PlatformClass(detector);
        
        try {
          await platform.remove();
        } catch (error) {
          logger.error(`Failed to remove from ${detector.getPlatformDisplayName(platformName)}: ${error.message}`);
        }
      }

      logger.success('Removal complete');

    } catch (error) {
      logger.error(`Removal failed: ${error.message}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Run setup by default if no command provided or if global options are used
const args = process.argv.slice(2);
const globalOptions = program.opts();

// Check if first argument is an API key (not a command or flag)
let inferredApiKey = null;
if (args.length === 1 && !args[0].startsWith('-') && !['setup', 'validate', 'config', 'remove', 'help'].includes(args[0])) {
  inferredApiKey = args[0];
}

if (!args.length || globalOptions.apiKey || globalOptions.platforms || inferredApiKey) {
  // Run setup with global options, inferred API key, or interactive setup
  runSetup({
    apiKey: globalOptions.apiKey || inferredApiKey,
    platforms: globalOptions.platforms,
    scope: globalOptions.scope || 'global'
  });
}