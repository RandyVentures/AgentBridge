const fs = require('fs');
const path = require('path');
const { loadConfigFromOpenApi } = require('../lib/openapi-to-config');

const COMMON_SPEC_PATHS = [
  '/openapi.json',
  '/openapi.yaml',
  '/openapi.yml',
  '/swagger.json',
  '/v1/openapi.json',
  '/v1/swagger.json',
  '/.well-known/openapi.json'
];

function normalizeBaseUrl(url) {
  return String(url).replace(/\/+$/, '');
}

function inferNameFromUrl(urlValue) {
  try {
    const host = new URL(urlValue).hostname;
    const label = host.split('.').filter(Boolean)[0] || 'myapi';
    return label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  } catch (_error) {
    return 'myapi';
  }
}

function buildSpecCandidates(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  const directLooksLikeSpec = /(openapi|swagger)\.(json|ya?ml)$/i.test(normalized);

  const candidates = [normalized];
  if (!directLooksLikeSpec) {
    COMMON_SPEC_PATHS.forEach((specPath) => {
      candidates.push(`${normalized}${specPath}`);
    });
  }

  return [...new Set(candidates)];
}

function renderConfig(config) {
  return `module.exports = ${JSON.stringify(config, null, 2)};\n`;
}

function renderStarterConfig({ name, version, apiBase }) {
  const starter = {
    name,
    version,
    apiBase,
    auth: {
      credentials: [
        {
          envVar: `${name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_API_KEY`,
          in: 'header',
          name: 'Authorization',
          prefix: 'Bearer '
        }
      ]
    },
    commands: [
      {
        name: 'health',
        description: 'Health check endpoint (edit path/method as needed)',
        method: 'GET',
        path: '/health',
        params: {}
      }
    ]
  };

  return renderConfig(starter);
}

async function tryOpenApiCandidates({ candidates, name, version }) {
  const failures = [];

  for (const candidate of candidates) {
    try {
      const config = await loadConfigFromOpenApi({
        specInput: candidate,
        name,
        version
      });

      return {
        config,
        discoveredSpec: candidate,
        failures
      };
    } catch (error) {
      failures.push({
        candidate,
        message: error.message
      });
    }
  }

  return {
    config: null,
    discoveredSpec: null,
    failures
  };
}

async function init(flags) {
  if (!flags.url) {
    throw new Error('Missing required flag: --url <api-base-url>');
  }

  const baseUrl = String(flags.url);
  const outputPath = path.resolve(process.cwd(), String(flags.output || './api-to-cli.config.js'));
  const name = String(flags.name || inferNameFromUrl(baseUrl));
  const version = String(flags.version || '1.0.0');

  const candidates = buildSpecCandidates(baseUrl);
  const result = await tryOpenApiCandidates({ candidates, name, version });

  let mode = 'starter';
  let discoveredSpec = null;
  let fileText = renderStarterConfig({
    name,
    version,
    apiBase: normalizeBaseUrl(baseUrl)
  });

  if (result.config) {
    mode = 'openapi';
    discoveredSpec = result.discoveredSpec;
    fileText = renderConfig(result.config);
  }

  fs.writeFileSync(outputPath, fileText, 'utf8');

  console.log(
    JSON.stringify({
      ok: true,
      command: 'init',
      mode,
      baseUrl: normalizeBaseUrl(baseUrl),
      outputPath,
      discoveredSpec,
      attemptedSpecCandidates: candidates,
      hint: mode === 'openapi'
        ? 'OpenAPI discovered. You can run: api-to-cli generate --config <outputPath> --output <dir>'
        : 'No OpenAPI discovered. Edit the generated config and then run generate.'
    })
  );
}

module.exports = {
  init
};
