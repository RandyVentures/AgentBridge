const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../lib/load-config');
const { generateCliProject } = require('../lib/generate-cli');
const { writeSkillPackage } = require('../lib/generate-skill');
const { buildManifest, writeManifest } = require('../lib/generate-manifest');

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function resolveArtifactFlags(flags) {
  const hasSkill = hasOwn(flags, 'with-skill');
  const hasManifest = hasOwn(flags, 'with-manifest');

  if (!hasSkill && !hasManifest) {
    return {
      withSkill: true,
      withManifest: true
    };
  }

  return {
    withSkill: Boolean(flags['with-skill']),
    withManifest: Boolean(flags['with-manifest'])
  };
}

function writeScaffoldReadme(outputPath, data) {
  const lines = [
    '# AgentBridge Scaffold Output',
    '',
    '## Contents',
    `- CLI project: ${data.cliProjectPath}`
  ];

  if (data.skillPath) {
    lines.push(`- Skill file: ${data.skillPath}`);
  }

  if (data.manifestPath) {
    lines.push(`- Manifest: ${data.manifestPath}`);
  }

  lines.push('', '## Next Steps', '1. cd ./cli', '2. npm install', '3. npm link');

  fs.writeFileSync(path.join(outputPath, 'README.md'), `${lines.join('\n')}\n`, 'utf8');
}

async function scaffold(flags) {
  if (!flags.config) {
    throw new Error('Missing required flag: --config <path>');
  }

  if (!flags.output) {
    throw new Error('Missing required flag: --output <dir>');
  }

  const { withSkill, withManifest } = resolveArtifactFlags(flags);
  const cliRelativePath = './cli';
  const skillRelativePath = './skill/SKILL.md';
  const manifestRelativePath = './agentbridge.manifest.json';

  const configPath = path.resolve(process.cwd(), String(flags.config));
  const outputPath = path.resolve(process.cwd(), String(flags.output));
  const cliProjectPath = path.join(outputPath, 'cli');

  const config = loadConfig(configPath);
  fs.mkdirSync(outputPath, { recursive: true });

  generateCliProject({
    config,
    outputPath: cliProjectPath
  });

  let skillPath = null;
  if (withSkill) {
    writeSkillPackage(outputPath, config, cliRelativePath);
    skillPath = skillRelativePath;
  }

  let manifestPath = null;
  if (withManifest) {
    const manifest = buildManifest(config, cliRelativePath, skillPath);
    writeManifest(outputPath, manifest);
    manifestPath = manifestRelativePath;
  }

  writeScaffoldReadme(outputPath, {
    cliProjectPath: cliRelativePath,
    skillPath,
    manifestPath
  });

  console.log(
    JSON.stringify({
      ok: true,
      command: 'scaffold',
      outputPath,
      cliProjectPath: cliRelativePath,
      skillPath,
      manifestPath,
      generatedCommands: config.commands.map((command) => command.name)
    })
  );
}

module.exports = {
  scaffold
};
