const path = require('path');
const { generateCliProject } = require('../lib/generate-cli');
const { resolveConfigInput } = require('../lib/resolve-config-input');

async function generate(flags) {
  if (!flags.output) {
    throw new Error('Missing required flag: --output <dir>');
  }

  const outputPath = path.resolve(process.cwd(), String(flags.output));
  const { config, source } = await resolveConfigInput(flags);

  generateCliProject({
    config,
    outputPath
  });

  console.log(
    JSON.stringify({
      ok: true,
      command: 'generate',
      outputPath,
      inputType: source.type,
      input: source.value,
      generatedCommands: config.commands.map((command) => command.name)
    })
  );
}

module.exports = {
  generate
};
