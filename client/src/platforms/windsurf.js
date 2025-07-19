const BasePlatform = require('./base');
const chalk = require('chalk');
const fs = require('fs');

class WindsurfPlatform extends BasePlatform {
  constructor(detector) {
    super(detector);
    this.name = 'windsurf';
    this.displayName = 'Windsurf';
  }

  async configure(apiKey, options = {}) {
    const configPath = this.detector.getConfigPath('windsurf');
    if (!configPath) {
      throw new Error('Could not determine Windsurf configuration path');
    }



    // Read existing config or create new
    let config = await this.readConfig(configPath) || {};
    
    // Ensure mcpServers object exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Check if Spectator is already configured
    const isAlreadyConfigured = config.mcpServers['spectator-voice-memory'];
    
    // Backup existing config if it exists
    if (isAlreadyConfigured) {
      const backupPath = await this.backupConfig(configPath);
    }

    // Add Spectator MCP server
    const mcpConfig = this.getMcpServerConfig(apiKey);
    Object.assign(config.mcpServers, mcpConfig);

    // Write config
    await this.writeConfig(configPath, config);

    return { updated: isAlreadyConfigured, hasOtherServers: Object.keys(config.mcpServers).length > 1 };
  }

  async validate() {
    const configPath = this.detector.getConfigPath('windsurf');
    if (!configPath || !fs.existsSync(configPath)) {
      return { valid: false, error: 'Configuration file not found' };
    }

    try {
      const config = await this.readConfig(configPath);
      if (!config.mcpServers || !config.mcpServers['spectator-voice-memory']) {
        return { valid: false, error: 'Spectator MCP server not configured' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async remove() {
    const configPath = this.detector.getConfigPath('windsurf');
    if (!configPath) {
      throw new Error('Could not determine Windsurf configuration path');
    }

    const config = await this.readConfig(configPath);
    if (!config || !config.mcpServers) {
      console.log(chalk.yellow('No configuration found'));
      return false;
    }

    if (config.mcpServers['spectator-voice-memory']) {
      delete config.mcpServers['spectator-voice-memory'];
      await this.writeConfig(configPath, config);
      console.log(chalk.green(`✓ Removed Spectator from ${this.displayName}`));
      return true;
    }

    console.log(chalk.yellow('Spectator was not configured'));
    return false;
  }

  getManualInstructions(apiKey) {
    const configPath = this.detector.getConfigPath('windsurf');
    const config = JSON.stringify(this.getMcpServerConfig(apiKey), null, 2);

    return `
${chalk.bold('Manual Configuration for Windsurf:')}

1. Open your Windsurf MCP configuration file:
   ${chalk.cyan(configPath)}

2. Add the following to the "mcpServers" section:

${chalk.gray(config)}

3. If the file doesn't exist, create it with:

${chalk.gray(JSON.stringify({ mcpServers: this.getMcpServerConfig(apiKey) }, null, 2))}

4. Alternatively, you can configure through Windsurf:
   - Go to Settings > Cascade > Plugins
   - Click on the Hammer Icon on the Cascade Tool bar
   - Select "Configure" to open the configuration file

5. Restart Windsurf for changes to take effect.
`;
  }
}

module.exports = WindsurfPlatform;