const BasePlatform = require('./base');
const chalk = require('chalk');
const fs = require('fs');

class ClaudePlatform extends BasePlatform {
  constructor(detector) {
    super(detector);
    this.name = 'claude';
    this.displayName = 'Claude Desktop';
  }

  async configure(apiKey, options = {}) {
    const configPath = this.detector.getConfigPath('claude');
    if (!configPath) {
      throw new Error('Could not determine Claude configuration path for this platform');
    }

    console.log(chalk.blue(`Configuring ${this.displayName}...`));

    // Backup existing config
    const backupPath = await this.backupConfig(configPath);
    if (backupPath) {
      console.log(chalk.gray(`  Backed up existing config to: ${backupPath}`));
    }

    // Read existing config or create new
    let config = await this.readConfig(configPath) || {};
    
    // Ensure mcpServers object exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Add Spectator MCP server
    const mcpConfig = this.getMcpServerConfig(apiKey);
    Object.assign(config.mcpServers, mcpConfig);

    // Write config
    await this.writeConfig(configPath, config);
    console.log(chalk.green(`✓ ${this.displayName} configured successfully`));

    return true;
  }

  async validate() {
    const configPath = this.detector.getConfigPath('claude');
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
    const configPath = this.detector.getConfigPath('claude');
    if (!configPath) {
      throw new Error('Could not determine Claude configuration path');
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
    const configPath = this.detector.getConfigPath('claude');
    const config = JSON.stringify(this.getMcpServerConfig(apiKey), null, 2);

    return `
${chalk.bold('Manual Configuration for Claude Desktop:')}

1. Open your Claude Desktop configuration file:
   ${chalk.cyan(configPath)}

2. Add the following to the "mcpServers" section:

${chalk.gray(config)}

3. If the file doesn't exist, create it with:

${chalk.gray(JSON.stringify({ mcpServers: this.getMcpServerConfig(apiKey) }, null, 2))}

4. Restart Claude Desktop for changes to take effect.

${chalk.bold('Alternative: Custom Connector (Pro/Team/Enterprise only):')}
1. In Claude, go to Settings > Connectors
2. Click "Add custom connector"
3. Enter:
   - Name: ${chalk.cyan('Spectator Voice Memory')}
   - URL: ${chalk.cyan(`https://api.spectatorcontext.com/mcp-server/mcp/${apiKey}`)}
`;
  }
}

module.exports = ClaudePlatform;