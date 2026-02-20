const { doctor } = require('./commands/doctor');
const { generate } = require('./commands/generate');
const { init } = require('./commands/init');
const { validate } = require('./commands/validate');
const { scaffold } = require('./commands/scaffold');

function printUsage() {
  console.error(
    [
      'Usage:',
      '  api-to-cli doctor [--config <path>] [--spec <path-or-url>] [--url <api-base-url>]',
      '  api-to-cli init --url <api-base-url> [--output <path>] [--name <cli-name>] [--version <semver>]',
      '  api-to-cli generate (--config <path> | --spec <path-or-url>) --output <dir> [--name <cli-name>]',
      '  api-to-cli validate (--config <path> | --spec <path-or-url>) [--name <cli-name>]',
      '  api-to-cli scaffold (--config <path> | --spec <path-or-url>) --output <dir> [--name <cli-name>] [--with-skill] [--with-manifest]',
      '',
      'Commands:',
      '  doctor     Run environment and input diagnostics',
      '  init       Discover OpenAPI and generate starter config',
      '  generate   Generate a CLI from config/spec',
      '  validate   Validate config/spec only',
      '  scaffold   Generate CLI + optional skill/manifest bundle'
    ].join('\n')
  );
}

function parseFlags(args) {
  const flags = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (!arg.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const value = args[i + 1];

    if (!value || value.startsWith('--')) {
      flags[key] = true;
      continue;
    }

    flags[key] = value;
    i += 1;
  }

  return flags;
}

async function run(argv) {
  const [command, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  try {
    const flags = parseFlags(rest);

    if (command === 'doctor') {
      await doctor(flags);
      return;
    }

    if (command === 'init') {
      await init(flags);
      return;
    }

    if (command === 'generate') {
      await generate(flags);
      return;
    }

    if (command === 'validate') {
      await validate(flags);
      return;
    }

    if (command === 'scaffold') {
      await scaffold(flags);
      return;
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          error: true,
          code: 'GENERATOR_FAILED',
          message: error.message,
          details: {}
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

module.exports = {
  run
};
