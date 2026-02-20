const fs = require('fs');
const path = require('path');
const { generateCliProject } = require('../lib/generate-cli');
const { writeSkillPackage } = require('../lib/generate-skill');
const { buildManifest, writeManifest } = require('../lib/generate-manifest');
const { resolveConfigInput } = require('../lib/resolve-config-input');

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
    `- CLI project: ${data.cliProjectPath}`,
    `- Input source: ${data.inputType} (${data.inputValue})`
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
  if (!flags.output) {
    throw new Error('Missing required flag: --output <dir>');
  }

  const { withSkill, withManifest } = resolveArtifactFlags(flags);
  const cliRelativePath = './cli';
  const skillRelativePath = './skill/SKILL.md';
  const manifestRelativePath = './agentbridge.manifest.json';

  const outputPath = path.resolve(process.cwd(), String(flags.output));
  const cliProjectPath = path.join(outputPath, 'cli');
  const { config, source } = await resolveConfigInput(flags);

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
    manifestPath,
    inputType: source.type,
    inputValue: source.value
  });

  console.log(
    JSON.stringify({
      ok: true,
      command: 'scaffold',
      outputPath,
      inputType: source.type,
      input: source.value,
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
