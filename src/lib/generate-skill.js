const fs = require('fs');
const path = require('path');
const { toKebab, getAuthEnvVars } = require('./config-utils');

function renderSkill(config, cliProjectPath) {
  const binName = toKebab(config.name);
  const envVars = getAuthEnvVars(config);
  const envSection = envVars.length
    ? envVars.map((envVar) => `- export ${envVar}=\"<value>\"`).join('\n')
    : '- No auth env vars required';

  const commandDocs = config.commands
    .map((command) => {
      const flags = Object.entries(command.params || {})
        .map(([name, schema]) => {
          const flag = `--${toKebab(name)} <value>`;
          const req = schema.required ? 'required' : 'optional';
          return `  - ${flag} (${req})`;
        })
        .join('\n');

      return [
        `- ${command.name}: ${command.description}`,
        flags || '  - no params',
        `  - example: ${binName} ${command.name}${flags ? ` ${Object.keys(command.params || {}).map((p) => `--${toKebab(p)} <value>`).join(' ')}` : ''}`
      ].join('\n');
    })
    .join('\n');

  return `# ${config.name} CLI Skill\n\n## Purpose\nUse the generated ${config.name} CLI from AgentBridge. Always prefer JSON output for machine parsing.\n\n## Location\n- CLI project: ${cliProjectPath}\n- Binary name: ${binName}\n\n## Setup\n1. cd ${cliProjectPath}\n2. npm install\n3. npm link\n\n## Auth\n${envSection}\n\n## Commands\n${commandDocs}\n\n## Rules\n- Do not echo or log auth secrets.\n- Do not pass credentials as command flags.\n- Parse command stdout as JSON.\n- Treat non-zero exits as failure and read stderr JSON envelope.\n`;
}

function writeSkillPackage(outputPath, config, cliProjectPath) {
  const skillDir = path.join(outputPath, 'skill');
  fs.mkdirSync(skillDir, { recursive: true });

  const skillContent = renderSkill(config, cliProjectPath);
  const skillPath = path.join(skillDir, 'SKILL.md');

  fs.writeFileSync(skillPath, skillContent, 'utf8');

  return {
    skillDir,
    skillPath
  };
}

module.exports = {
  writeSkillPackage
};
