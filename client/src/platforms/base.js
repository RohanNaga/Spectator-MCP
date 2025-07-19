const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class BasePlatform {
  constructor(detector) {
    this.detector = detector;
    this.name = '';
    this.displayName = '';
  }

  // Get the MCP server configuration
  getMcpServerConfig(apiKey) {
    return {
      "spectator-voice-memory": {
        "command": "npx",
        "args": [
          "-y",
          "mcp-remote",
          `https://spectatorcontext.com/mcp-server/mcp/${apiKey}`
        ]
      }
    };
  }

  // Read existing configuration
  async readConfig(configPath) {
    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read config from ${configPath}: ${error.message}`);
    }
  }

  // Write configuration
  async writeConfig(configPath, config) {
    try {
      const dir = path.dirname(configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to write config to ${configPath}: ${error.message}`);
    }
  }

  // Backup existing configuration
  async backupConfig(configPath) {
    if (!fs.existsSync(configPath)) {
      return null;
    }

    const backupPath = `${configPath}.backup.${Date.now()}`;
    fs.copyFileSync(configPath, backupPath);
    return backupPath;
  }

  // Configure the platform
  async configure(apiKey, options = {}) {
    throw new Error('configure method must be implemented by subclass');
  }

  // Validate configuration
  async validate() {
    throw new Error('validate method must be implemented by subclass');
  }

  // Remove configuration
  async remove() {
    throw new Error('remove method must be implemented by subclass');
  }

  // Get manual configuration instructions
  getManualInstructions(apiKey) {
    throw new Error('getManualInstructions method must be implemented by subclass');
  }
}

module.exports = BasePlatform;