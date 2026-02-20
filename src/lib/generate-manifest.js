const fs = require('fs');
const path = require('path');
const { toKebab, getAuthEnvVars } = require('./config-utils');

function buildManifest(config, cliProjectPath, skillPath) {
  const binName = toKebab(config.name);

  return {
    schemaVersion: '1.0',
    generatedBy: 'AgentBridge',
    generatedAt: new Date().toISOString(),
    project: {
      name: config.name,
      version: config.version
    },
    cli: {
      projectPath: cliProjectPath,
      packageName: `${binName}-cli`,
      binary: binName,
      install: ['npm install', 'npm link']
    },
    auth: {
      envVars: getAuthEnvVars(config)
    },
    commands: config.commands.map((command) => ({
      name: command.name,
      description: command.description,
      method: command.method,
      path: command.path,
      params: Object.entries(command.params || {}).map(([name, schema]) => ({
        name,
        required: Boolean(schema.required),
        description: schema.description || ''
      }))
    })),
    agent: {
      skillPath: skillPath || null
    }
  };
}

function writeManifest(outputPath, manifest) {
  const filePath = path.join(outputPath, 'agentbridge.manifest.json');
  fs.writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return filePath;
}

module.exports = {
  buildManifest,
  writeManifest
};
