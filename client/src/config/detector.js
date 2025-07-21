const fs = require('fs');
const path = require('path');
const os = require('os');

class PlatformDetector {
  constructor() {
    this.platform = os.platform();
    this.homeDir = os.homedir();
  }

  // Get the correct config path based on the platform
  getConfigPath(platform, type = 'global') {
    const paths = {
      claude: {
        darwin: path.join(this.homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
        win32: path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'),
        linux: path.join(this.homeDir, '.config', 'Claude', 'claude_desktop_config.json')
      },
      claudecode: {
        darwin: path.join(this.homeDir, '.claudecode', 'settings.json'),
        win32: path.join(this.homeDir, '.claudecode', 'settings.json'),
        linux: path.join(this.homeDir, '.claudecode', 'settings.json')
      },
      cursor: {
        global: path.join(this.homeDir, '.cursor', 'mcp.json'),
        project: path.join(process.cwd(), '.cursor', 'mcp.json')
      },
      windsurf: {
        global: path.join(this.homeDir, '.codeium', 'windsurf', 'mcp_config.json')
      },
      vscode: {
        global: path.join(this.homeDir, '.mcp.json'),
        project: path.join(process.cwd(), '.vscode', 'mcp.json')
      },
      cline: {
        // Cline uses VSCode's global storage - path varies by OS
        darwin: path.join(this.homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'cline_mcp_settings.json'),
        win32: path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'cline_mcp_settings.json'),
        linux: path.join(this.homeDir, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'cline_mcp_settings.json')
      }
    };

    if (platform === 'claude' || platform === 'cline' || platform === 'claudecode') {
      return paths[platform][this.platform] || null;
    }

    return paths[platform]?.[type] || paths[platform]?.global || null;
  }

  // Check if a platform is installed
  isPlatformInstalled(platform) {
    const checks = {
      claude: () => {
        const configPath = this.getConfigPath('claude');
        const appPaths = {
          darwin: '/Applications/Claude.app',
          win32: path.join(process.env.ProgramFiles || '', 'Claude'),
          linux: '/usr/bin/claude'
        };
        return fs.existsSync(appPaths[this.platform] || '') || (configPath && fs.existsSync(path.dirname(configPath)));
      },
      claudecode: () => {
        // Check if claude CLI is installed globally
        const { execSync } = require('child_process');
        try {
          execSync('which claude', { stdio: 'ignore' });
          return true;
        } catch {
          try {
            execSync('where claude', { stdio: 'ignore' });
            return true;
          } catch {
            // Also check if settings directory exists
            const configDir = path.join(this.homeDir, '.claudecode');
            return fs.existsSync(configDir);
          }
        }
      },
      cursor: () => {
        const configDir = path.join(this.homeDir, '.cursor');
        const appPaths = {
          darwin: '/Applications/Cursor.app',
          win32: path.join(process.env.LOCALAPPDATA || '', 'Programs', 'cursor'),
          linux: '/usr/bin/cursor'
        };
        return fs.existsSync(configDir) || fs.existsSync(appPaths[this.platform] || '');
      },
      windsurf: () => {
        const configDir = path.join(this.homeDir, '.codeium', 'windsurf');
        return fs.existsSync(configDir);
      },
      vscode: () => {
        const appPaths = {
          darwin: '/Applications/Visual Studio Code.app',
          win32: path.join(process.env.ProgramFiles || '', 'Microsoft VS Code'),
          linux: '/usr/bin/code'
        };
        return fs.existsSync(appPaths[this.platform] || '');
      },
      cline: () => {
        // Check if Cline extension is installed by looking for its storage directory
        const configPath = this.getConfigPath('cline');
        return configPath && fs.existsSync(path.dirname(configPath));
      }
    };

    return checks[platform] ? checks[platform]() : false;
  }

  // Get all installed platforms
  getInstalledPlatforms() {
    const platforms = ['claude', 'claudecode', 'cursor', 'windsurf', 'vscode', 'cline'];
    return platforms.filter(platform => this.isPlatformInstalled(platform));
  }

  // Check if a configuration already exists
  hasExistingConfig(platform, type = 'global') {
    const configPath = this.getConfigPath(platform, type);
    if (!configPath || !fs.existsSync(configPath)) {
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.mcpServers && config.mcpServers['spectator-voice-memory'];
    } catch (error) {
      return false;
    }
  }

  // Get platform display name
  getPlatformDisplayName(platform) {
    const names = {
      claude: 'Claude Desktop',
      claudecode: 'Claude Code',
      cursor: 'Cursor',
      windsurf: 'Windsurf',
      vscode: 'VS Code',
      cline: 'Cline (VS Code Extension)'
    };
    return names[platform] || platform;
  }
}

module.exports = PlatformDetector;