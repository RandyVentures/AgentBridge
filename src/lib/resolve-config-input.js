const path = require('path');
const { loadConfig } = require('./load-config');
const { loadConfigFromOpenApi } = require('./openapi-to-config');

function hasFlag(flags, key) {
  return Object.prototype.hasOwnProperty.call(flags, key);
}

async function resolveConfigInput(flags) {
  const hasConfig = hasFlag(flags, 'config');
  const hasSpec = hasFlag(flags, 'spec');

  if (!hasConfig && !hasSpec) {
    throw new Error('Provide one input source: --config <path> or --spec <path-or-url>');
  }

  if (hasConfig && hasSpec) {
    throw new Error('Use either --config or --spec, not both');
  }

  if (hasConfig) {
    const configPath = path.resolve(process.cwd(), String(flags.config));
    const config = loadConfig(configPath);
    return {
      config,
      source: {
        type: 'config',
        value: configPath
      }
    };
  }

  const config = await loadConfigFromOpenApi({
    specInput: String(flags.spec),
    name: flags.name ? String(flags.name) : undefined,
    version: flags.version ? String(flags.version) : undefined
  });

  return {
    config,
    source: {
      type: 'spec',
      value: String(flags.spec)
    }
  };
}

module.exports = {
  resolveConfigInput
};
