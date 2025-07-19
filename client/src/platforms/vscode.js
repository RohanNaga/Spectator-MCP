const BasePlatform = require('./base');
const chalk = require('chalk');
const fs = require('fs');

class VSCodePlatform extends BasePlatform {
  constructor(detector) {
    super(detector);
    this.name = 'vscode';
    this.displayName = 'VS Code';
  }

  async configure(apiKey, options = {}) {
    const scope = options.scope || 'project'; // 'global' or 'project'
    const configPath = this.detector.getConfigPath('vscode', scope);
    
    if (!configPath) {
      throw new Error('Could not determine VS Code configuration path');
    }

    console.log(chalk.blue(`Configuring ${this.displayName} (${scope})...`));

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
    console.log(chalk.green(`✓ ${this.displayName} configured successfully (${scope})`));

    return true;
  }

  async validate() {
    // Check both global and project configs
    const globalPath = this.detector.getConfigPath('vscode', 'global');
    const projectPath = this.detector.getConfigPath('vscode', 'project');
    
    const results = [];

    if (globalPath && fs.existsSync(globalPath)) {
      try {
        const config = await this.readConfig(globalPath);
        if (config.mcpServers && config.mcpServers['spectator-voice-memory']) {
          results.push({ scope: 'global', valid: true });
        }
      } catch (error) {
        results.push({ scope: 'global', valid: false, error: error.message });
      }
    }

    if (projectPath && fs.existsSync(projectPath)) {
      try {
        const config = await this.readConfig(projectPath);
        if (config.mcpServers && config.mcpServers['spectator-voice-memory']) {
          results.push({ scope: 'project', valid: true });
        }
      } catch (error) {
        results.push({ scope: 'project', valid: false, error: error.message });
      }
    }

    if (results.length === 0) {
      return { valid: false, error: 'No configuration found' };
    }

    const validConfig = results.find(r => r.valid);
    return validConfig || results[0];
  }

  async remove() {
    let removed = false;
    
    // Remove from both global and project configs
    for (const scope of ['global', 'project']) {
      const configPath = this.detector.getConfigPath('vscode', scope);
      if (!configPath || !fs.existsSync(configPath)) {
        continue;
      }

      const config = await this.readConfig(configPath);
      if (config && config.mcpServers && config.mcpServers['spectator-voice-memory']) {
        delete config.mcpServers['spectator-voice-memory'];
        await this.writeConfig(configPath, config);
        console.log(chalk.green(`✓ Removed Spectator from ${this.displayName} (${scope})`));
        removed = true;
      }
    }

    if (!removed) {
      console.log(chalk.yellow('Spectator was not configured in VS Code'));
    }

    return removed;
  }

  getManualInstructions(apiKey) {
    const globalPath = this.detector.getConfigPath('vscode', 'global');
    const projectPath = this.detector.getConfigPath('vscode', 'project');
    const config = JSON.stringify(this.getMcpServerConfig(apiKey), null, 2);

    return `
${chalk.bold('Manual Configuration for VS Code:')}

${chalk.underline('Option 1: Project Configuration (recommended):')}
1. Create/edit the file in your project:
   ${chalk.cyan(projectPath)}

2. Add the following to the "mcpServers" section:

${chalk.gray(config)}

${chalk.underline('Option 2: Global Configuration (all projects):')}
1. Create/edit the file:
   ${chalk.cyan(globalPath)}

2. Add the same configuration as above.

3. If the file doesn't exist, create it with:

${chalk.gray(JSON.stringify({ mcpServers: this.getMcpServerConfig(apiKey) }, null, 2))}

${chalk.underline('Alternative: Using Command Palette:')}
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Run: "MCP: Add Server"
3. Choose workspace or user settings
4. Configure the server with the details above

Note: VS Code MCP support requires GitHub Copilot to be installed and active.
`;
  }
}

module.exports = VSCodePlatform;