const BasePlatform = require('./base');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ClaudeCode extends BasePlatform {
  getConfigPath(options = {}) {
    // Claude Code uses ~/.claudecode/settings.json
    return path.join(os.homedir(), '.claudecode', 'settings.json');
  }

  async configure(apiKey, options = {}) {
    const configPath = this.getConfigPath(options);
    const configDir = path.dirname(configPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Read existing config or create new one
    let config = {};
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      if (content.trim()) {
        config = JSON.parse(content);
      }
    }

    // Initialize mcpServers if not present
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Check if already configured
    const hasOtherServers = Object.keys(config.mcpServers).filter(k => k !== 'spectator-voice-memory').length > 0;
    const isUpdated = !!config.mcpServers['spectator-voice-memory'];

    // Add Spectator MCP configuration
    config.mcpServers['spectator-voice-memory'] = {
      command: 'npx',
      args: [
        '-y',
        'mcp-remote',
        `https://spectatorcontext.com/mcp-server/mcp/${apiKey}`
      ]
    };

    // Write updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return { 
      updated: isUpdated, 
      hasOtherServers,
      configPath 
    };
  }

  async validate() {
    const configPath = this.getConfigPath();
    
    if (!fs.existsSync(configPath)) {
      return { valid: false, error: 'Configuration file not found' };
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (!config.mcpServers || !config.mcpServers['spectator-voice-memory']) {
        return { valid: false, error: 'Spectator MCP not configured' };
      }

      const spectatorConfig = config.mcpServers['spectator-voice-memory'];
      if (!spectatorConfig.command || !spectatorConfig.args) {
        return { valid: false, error: 'Invalid Spectator MCP configuration' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Configuration error: ${error.message}` };
    }
  }

  async remove(options = {}) {
    const configPath = this.getConfigPath(options);
    
    if (!fs.existsSync(configPath)) {
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (config.mcpServers && config.mcpServers['spectator-voice-memory']) {
        delete config.mcpServers['spectator-voice-memory'];
        
        // If no other servers, remove the mcpServers object
        if (Object.keys(config.mcpServers).length === 0) {
          delete config.mcpServers;
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      }
    } catch (error) {
      throw new Error(`Failed to remove configuration: ${error.message}`);
    }
  }

  getManualInstructions(apiKey) {
    const configPath = this.getConfigPath();
    
    return `
## Claude Code Configuration

### Automatic Setup (Recommended)

Claude Code should be automatically configured when you run:
\`\`\`bash
npx spectator-mcp ${apiKey}
\`\`\`

### Manual Setup

1. Open Claude Code settings:
   - Run: \`claude-code --settings\`
   - Or manually edit: \`${configPath}\`

2. Add the following to your settings:

\`\`\`json
{
  "mcpServers": {
    "spectator-voice-memory": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://spectatorcontext.com/mcp-server/mcp/${apiKey}"
      ]
    }
  }
}
\`\`\`

3. Restart Claude Code for changes to take effect

### Platform Installation

If Claude Code is not installed, you can install it:

**macOS/Linux:**
\`\`\`bash
npm install -g claude-code
\`\`\`

**Windows:**
\`\`\`powershell
npm install -g claude-code
\`\`\`

Or download from: https://github.com/anthropics/claude-code

### Configuration File Location

- All platforms: \`~/.claudecode/settings.json\`
`;
  }
}

module.exports = ClaudeCode;