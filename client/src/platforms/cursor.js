const BasePlatform = require('./base');
const chalk = require('chalk');
const fs = require('fs');

class CursorPlatform extends BasePlatform {
  constructor(detector) {
    super(detector);
    this.name = 'cursor';
    this.displayName = 'Cursor';
  }

  async configure(apiKey, options = {}) {
    const scope = options.scope || 'global'; // 'global' or 'project'
    const configPath = this.detector.getConfigPath('cursor', scope);
    
    if (!configPath) {
      throw new Error('Could not determine Cursor configuration path');
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

    // Add/Update Spectator MCP server
    const mcpConfig = this.getMcpServerConfig(apiKey);
    Object.assign(config.mcpServers, mcpConfig);

    // Write config
    await this.writeConfig(configPath, config);

    return { updated: isAlreadyConfigured, hasOtherServers: Object.keys(config.mcpServers).length > 1 };
  }

  async validate() {
    // Check both global and project configs
    const globalPath = this.detector.getConfigPath('cursor', 'global');
    const projectPath = this.detector.getConfigPath('cursor', 'project');
    
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
      const configPath = this.detector.getConfigPath('cursor', scope);
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
      console.log(chalk.yellow('Spectator was not configured in Cursor'));
    }

    return removed;
  }

  getManualInstructions(apiKey) {
    const globalPath = this.detector.getConfigPath('cursor', 'global');
    const projectPath = this.detector.getConfigPath('cursor', 'project');
    const config = JSON.stringify(this.getMcpServerConfig(apiKey), null, 2);

    return `
${chalk.bold('Manual Configuration for Cursor:')}

${chalk.underline('Option 1: Global Configuration (all projects):')}
1. Create/edit the file:
   ${chalk.cyan(globalPath)}

2. Add the following to the "mcpServers" section:

${chalk.gray(config)}

${chalk.underline('Option 2: Project Configuration (current project only):')}
1. Create/edit the file:
   ${chalk.cyan(projectPath)}

2. Add the same configuration as above.

3. If the file doesn't exist, create it with:

${chalk.gray(JSON.stringify({ mcpServers: this.getMcpServerConfig(apiKey) }, null, 2))}

4. Restart Cursor for changes to take effect.
`;
  }
}

module.exports = CursorPlatform;