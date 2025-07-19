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

      // Skip validation for now - the MCP connection will validate the key
      logger.step('Using API key for MCP configuration...');

      // Detect installed platforms
      logger.step('Detecting installed AI platforms...');
      const installedPlatforms = detector.getInstalledPlatforms();
      
      if (installedPlatforms.length === 0) {
        logger.error('No supported platforms detected. Please install Claude Desktop, Cursor, Windsurf, VS Code, or Cline first.');
        process.exit(1);
      }

      console.log(`   Found: ${installedPlatforms.map(p => detector.getPlatformDisplayName(p)).join(', ')}`);

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
      logger.step('Configuring platforms...');
      const results = [];
      
      for (const platformName of platformsToConfig) {
        const PlatformClass = platforms[platformName];
        if (!PlatformClass) {
          logger.warning(`Unknown platform: ${platformName}`);
          continue;
        }

        const platform = new PlatformClass(detector);
        const displayName = detector.getPlatformDisplayName(platformName);
        
        try {
          process.stdout.write(`   Setting up ${displayName}... `);
          const result = await platform.configure(apiKey, { scope: options.scope });
          
          if (result && result.updated) {
            console.log(chalk.yellow('↻ (updated)'));
          } else {
            console.log(chalk.green('✓'));
          }
          
          results.push({ 
            platform: platformName, 
            success: true, 
            updated: result?.updated || false,
            hasOtherServers: result?.hasOtherServers || false
          });
        } catch (error) {
          console.log(chalk.red('✗'));
          logger.error(`   Error: ${error.message}`);
          results.push({ platform: platformName, success: false, error: error.message });
        }
      }

      // Show results
      console.log('');
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        // Big success message
        console.log(chalk.green.bold('✅ MCP Spectator Successfully Installed!'));
        console.log('');
        
        logger.section('📦 Configured Platforms:');
        successful.forEach(r => {
          const configPath = detector.getConfigPath(r.platform, options.scope);
          const status = r.updated ? chalk.yellow('↻ Updated') : chalk.green('✓ Added');
          logger.result(`  ${status}`, `${detector.getPlatformDisplayName(r.platform)}`);
          if (configPath) {
            logger.code(`    Config: ${configPath}`);
          }
          if (r.hasOtherServers) {
            logger.code(`    Note: Preserved existing MCP servers`);
          }
        });
      }
      
      if (failed.length > 0) {
        console.log('');
        logger.section('❌ Failed to Configure:');
        failed.forEach(r => {
          logger.result('  ✗', `${detector.getPlatformDisplayName(r.platform)}: ${r.error}`);
        });
      }

      // Show next steps
      if (successful.length > 0) {
        console.log('');
        logger.section('🚀 Next Steps:');
        logger.step('Restart the configured applications to activate MCP');
        
        if (successful.some(r => r.platform === 'claude')) {
          logger.step('For Claude Pro/Team/Enterprise, you can also use the custom connector:');
          logger.code(`   Name: Spectator Voice Memory`);
          logger.code(`   URL: ${apiValidator.formatApiUrl(apiKey)}`);
        }
        
        logger.section('🔍 To verify setup:');
        logger.code('   npx spectator-mcp validate');
        
        console.log('');
        console.log(chalk.green('🎉 You\'re all set! Your AI assistants now have access to your Spectator context.'));
      } else {
        logger.error('No platforms were successfully configured. Please check the errors above.');
        process.exit(1);
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

// Check for API key before parsing to avoid "unknown command" error
const args = process.argv.slice(2);
let inferredApiKey = null;

// If there's exactly one argument that doesn't start with '-' and isn't a known command, treat it as an API key
if (args.length === 1 && !args[0].startsWith('-') && !['setup', 'validate', 'config', 'remove', 'help'].includes(args[0])) {
  inferredApiKey = args[0];
  // Run setup directly with the inferred API key
  runSetup({
    apiKey: inferredApiKey,
    platforms: undefined,
    scope: 'global'
  });
  process.exit(0);
}

// Parse command line arguments
program.parse(process.argv);

// Run setup by default if no command provided or if global options are used
const globalOptions = program.opts();

if (!args.length || globalOptions.apiKey || globalOptions.platforms) {
  // Run setup with global options or interactive setup
  runSetup({
    apiKey: globalOptions.apiKey,
    platforms: globalOptions.platforms,
    scope: globalOptions.scope || 'global'
  });
}