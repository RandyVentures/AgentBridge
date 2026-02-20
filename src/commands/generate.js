const path = require('path');
const { loadConfig } = require('../lib/load-config');
const { generateCliProject } = require('../lib/generate-cli');

async function generate(flags) {
  if (!flags.config) {
    throw new Error('Missing required flag: --config <path>');
  }

  if (!flags.output) {
    throw new Error('Missing required flag: --output <dir>');
  }

  const configPath = path.resolve(process.cwd(), String(flags.config));
  const outputPath = path.resolve(process.cwd(), String(flags.output));

  const config = loadConfig(configPath);

  generateCliProject({
    config,
    outputPath
  });

  console.log(
    JSON.stringify({
      ok: true,
      command: 'generate',
      outputPath,
      generatedCommands: config.commands.map((command) => command.name)
    })
  );
}

module.exports = {
  generate
};
