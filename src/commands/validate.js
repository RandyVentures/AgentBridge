const path = require('path');
const { loadConfig } = require('../lib/load-config');

async function validate(flags) {
  if (!flags.config) {
    throw new Error('Missing required flag: --config <path>');
  }

  const configPath = path.resolve(process.cwd(), String(flags.config));
  const config = loadConfig(configPath);

  console.log(
    JSON.stringify({
      ok: true,
      command: 'validate',
      configPath,
      summary: {
        name: config.name,
        version: config.version,
        apiBase: config.apiBase,
        commandCount: config.commands.length,
        hasAuth: Boolean(config.auth && config.auth.credentials && config.auth.credentials.length)
      }
    })
  );
}

module.exports = {
  validate
};
