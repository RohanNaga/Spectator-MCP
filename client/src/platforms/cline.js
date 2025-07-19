const BasePlatform = require('./base');
const chalk = require('chalk');
const fs = require('fs');

class ClinePlatform extends BasePlatform {
  constructor(detector) {
    super(detector);
    this.name = 'cline';
    this.displayName = 'Cline (VS Code Extension)';
  }

  async configure(apiKey, options = {}) {
    const configPath = this.detector.getConfigPath('cline');
    if (!configPath) {
      throw new Error('Could not determine Cline configuration path. Make sure VS Code and Cline extension are installed.');
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
    const configPath = this.detector.getConfigPath('cline');
    if (!configPath || !fs.existsSync(configPath)) {
      return { valid: false, error: 'Configuration file not found. Cline extension may not be installed.' };
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
    const configPath = this.detector.getConfigPath('cline');
    if (!configPath) {
      throw new Error('Could not determine Cline configuration path');
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
    const configPath = this.detector.getConfigPath('cline');
    const config = JSON.stringify(this.getMcpServerConfig(apiKey), null, 2);

    return `
${chalk.bold('Manual Configuration for Cline:')}

${chalk.underline('Method 1: Through Cline UI (Recommended):')}
1. Open VS Code
2. Click the "MCP Servers" icon in the Cline extension panel
3. Add a new server with these details:
   - Name: ${chalk.cyan('spectator-voice-memory')}
   - Command: ${chalk.cyan('npx')}
   - Args: ${chalk.cyan(`-y, mcp-remote, https://api.spectatorcontext.com/mcp-server/mcp/${apiKey}`)}

${chalk.underline('Method 2: Direct File Edit:')}
1. Open the Cline MCP settings file:
   ${chalk.cyan(configPath)}

2. Add the following to the "mcpServers" section:

${chalk.gray(config)}

3. If the file doesn't exist, create it with:

${chalk.gray(JSON.stringify({ mcpServers: this.getMcpServerConfig(apiKey) }, null, 2))}

4. Restart VS Code for changes to take effect.

Note: Make sure the Cline extension is installed in VS Code first.
`;
  }
}

module.exports = ClinePlatform;