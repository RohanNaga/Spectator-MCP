# Spectator MCP Client

Universal MCP (Model Context Protocol) client for connecting AI coding assistants to your Spectator context.

## Quick Start

### Automatic Setup (Recommended)

Run this simple command in your terminal:

```bash
npx spectator-mcp YOUR_API_KEY
```

Or with the flag:

```bash
npx spectator-mcp --api-key YOUR_API_KEY
```

Or for interactive setup:

```bash
npx spectator-mcp
```

This will automatically detect and configure all supported AI platforms installed on your system.

### Manual Setup for Claude Web Custom Connector

For Claude Pro/Max/Team/Enterprise users:

1. Go to Settings → Connectors
2. Click "Add custom connector"
3. Enter:
   - **Name:** Spectator Voice Memory
   - **URL:** `https://spectatorcontext.com/mcp-server/mcp/YOUR_API_KEY`
4. Click Save

## Supported Platforms

- **Claude Desktop** - Anthropic's AI assistant
- **Cursor** - AI-powered code editor
- **Windsurf** - The Agentic IDE
- **VS Code** - With GitHub Copilot
- **Cline** - VS Code extension for AI assistance

## Installation & Usage

### Setup Options

Configure Spectator MCP for all detected platforms:

```bash
# Interactive setup
npx spectator-mcp

# Simplest - just pass your API key
npx spectator-mcp YOUR_API_KEY

# Or with flag
npx spectator-mcp --api-key YOUR_KEY

# Configure specific platforms only  
npx spectator-mcp --api-key YOUR_KEY --platforms claude,cursor

# Use project-specific config (for Cursor/VS Code)
npx spectator-mcp --api-key YOUR_KEY --scope project

# You can also use the explicit setup command
npx spectator-mcp setup --api-key YOUR_KEY
```

### Validate Configuration

Check if Spectator MCP is properly configured:

```bash
npx spectator-mcp validate
```

### Show Manual Configuration

Display manual setup instructions:

```bash
# Show for all platforms
npx spectator-mcp config --api-key YOUR_KEY

# Show for specific platform
npx spectator-mcp config --platform cursor
```

### Remove Configuration

Remove Spectator MCP from configured platforms:

```bash
npx spectator-mcp remove
```

## Platform-Specific Notes

### Claude Desktop

- Configuration file location:
  - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`
- Requires restart after configuration
- Pro/Team/Enterprise users can use the custom connector method instead

### Cursor

- Supports both global and project-specific configurations
- Global: `~/.cursor/mcp.json`
- Project: `.cursor/mcp.json`
- Use `--scope project` for project-specific setup

### Windsurf

- Configuration: `~/.codeium/windsurf/mcp_config.json`
- Can also configure through Settings → Cascade → Plugins

### VS Code

- Requires GitHub Copilot to be installed
- Global: `~/.mcp.json`
- Project: `.vscode/mcp.json`
- Can also use Command Palette: "MCP: Add Server"

### Cline

- VS Code extension that stores config in VS Code's global storage
- Must have VS Code and Cline extension installed
- Can configure through Cline's MCP Servers UI

## Configuration Format

All platforms use a similar configuration format:

```json
{
  "mcpServers": {
    "spectator-voice-memory": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.spectatorcontext.com/mcp-server/mcp/YOUR_API_KEY"
      ]
    }
  }
}
```

## Troubleshooting

### "No supported platforms detected"

Make sure you have at least one supported AI platform installed before running the setup.

### "Invalid API key"

Verify your API key is correct and has not expired. You can get your API key from the Spectator app.

### Configuration not taking effect

Most platforms require a restart after configuration. Make sure to:
1. Close the application completely
2. Start it again
3. Check if the MCP server is listed in the platform's MCP settings

### Connection issues

If you're behind a corporate proxy or firewall, you may need to configure your network settings to allow connections to `api.spectatorcontext.com`.

## Security

- Your API key is stored locally in each platform's configuration file
- The API key is included in the URL for simplicity and security (HTTPS encrypted)
- Never share your configuration files or API key publicly
- You can revoke and regenerate your API key in the Spectator app at any time

## Support

For issues or questions:
- GitHub Issues: [https://github.com/Spectator/spectator-mcp/issues](https://github.com/Spectator/spectator-mcp/issues)
- Documentation: [https://spectatorcontext.com/docs](https://spectatorcontext.com/docs)

## License

MIT