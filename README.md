# Spectator-MCP

MCP Client for Spectator Context Tool. Give all of your LLMs your life context through your phone.

## Quick Start

### Option 1: Automatic Setup (Recommended)

Run this simple command to set up Spectator MCP for all your AI coding assistants:

```bash
npx spectator-mcp YOUR_API_KEY
```

This will automatically configure Claude Desktop, Cursor, Windsurf, VS Code, and Cline if they're installed.

### Option 2: Claude Custom Connector

For Claude Pro/Team/Enterprise users, simply add a custom connector:

1. Go to Settings → Connectors
2. Click "Add custom connector"
3. Enter:
   - **Name:** Spectator Voice Memory  
   - **URL:** `https://spectatorcontext.com/mcp-server/mcp/YOUR_API_KEY`

### Option 3: Manual Configuration

Add this to your platform's MCP configuration file:

```json
{
  "mcpServers": {
    "spectator-voice-memory": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://spectatorcontext.com/mcp-server/mcp/YOUR_API_KEY"
      ]
    }
  }
}
```

## Supported Platforms

- **Claude Desktop** - Anthropic's AI assistant
- **Cursor** - AI-powered code editor
- **Windsurf** - The Agentic IDE
- **VS Code** - With GitHub Copilot
- **Cline** - VS Code extension

## Features

- 🚀 **One-command setup** for all platforms
- 🔐 **Secure** API key handling
- 🌍 **Cross-platform** support (Windows, Mac, Linux)
- 🔄 **Auto-detection** of installed AI tools
- 📝 **Voice memory** from your Spectator app

## Documentation

For detailed setup instructions and troubleshooting, see the [client README](./client/README.md).

## License

MIT
