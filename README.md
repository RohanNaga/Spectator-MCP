# Spectator-MCP
MCP Client for Spectator Context Tool. Give all of your LLMs your life context through your phone.


"spectator-voice-memory": {
      "command": "npx",
      "args": [
        "-y", 
        "mcp-remote",
        "https://api.spectatorcontext.com/mcp-server/mcp",
        "--header",
        "Authorization: Bearer ${SPECTATOR_API_KEY}"
      ],
      "env": {
        "SPECTATOR_API_KEY": "YOUR-API-KEY-FROM-REGISTRATION"
      }
    }
