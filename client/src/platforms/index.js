const ClaudePlatform = require('./claude');
const ClaudeCodePlatform = require('./claudecode');
const CursorPlatform = require('./cursor');
const WindsurfPlatform = require('./windsurf');
const VSCodePlatform = require('./vscode');
const ClinePlatform = require('./cline');

module.exports = {
  claude: ClaudePlatform,
  claudecode: ClaudeCodePlatform,
  cursor: CursorPlatform,
  windsurf: WindsurfPlatform,
  vscode: VSCodePlatform,
  cline: ClinePlatform
};