const axios = require('axios');
const chalk = require('chalk');

class ApiValidator {
  constructor() {
    this.baseUrl = 'https://api.spectatorcontext.com';
  }

  async validateApiKey(apiKey) {
    if (!apiKey || !apiKey.trim()) {
      return { valid: false, error: 'API key is required' };
    }

    try {
      // Attempt to validate the API key by making a request to the MCP endpoint
      const response = await axios.get(`${this.baseUrl}/mcp-server/mcp/${apiKey}`, {
        timeout: 10000,
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });

      if (response.status === 200) {
        return { valid: true };
      } else if (response.status === 401 || response.status === 403) {
        return { valid: false, error: 'Invalid API key, please get a new one at spectatorcontext.com' };
      } else {
        return { valid: false, error: `Unexpected response: ${response.status}` };
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return { valid: false, error: 'Cannot connect to Spectator API. Please check your internet connection.' };
      }
      return { valid: false, error: error.message };
    }
  }

  extractApiKeyFromUrl(url) {
    // Extract API key from URL format: https://api.spectatorcontext.com/mcp-server/mcp/YOUR_API_KEY
    const match = url.match(/\/mcp-server\/mcp\/([^\/\s]+)$/);
    return match ? match[1] : null;
  }

  formatApiUrl(apiKey) {
    return `${this.baseUrl}/mcp-server/mcp/${apiKey}`;
  }
}

module.exports = ApiValidator;