const { resolveConfigInput } = require('../lib/resolve-config-input');

async function validate(flags) {
  const { config, source } = await resolveConfigInput(flags);

  console.log(
    JSON.stringify({
      ok: true,
      command: 'validate',
      inputType: source.type,
      input: source.value,
      summary: {
        name: config.name,
        version: config.version,
        apiBase: config.apiBase,
        commandCount: config.commands.length,
        hasAuth: Boolean(config.auth && config.auth.credentials && config.auth.credentials.length),
        methods: [...new Set(config.commands.map((command) => command.method))]
      }
    })
  );
}

module.exports = {
  validate
};
