const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../lib/load-config');
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

function compareVersions(a, b) {
  const pa = a.split('.').map((n) => Number(n));
  const pb = b.split('.').map((n) => Number(n));
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i += 1) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) {
      return 1;
    }
    if (da < db) {
      return -1;
    }
  }

  return 0;
}

function makeCheck(name, ok, details, fix) {
  return {
    name,
    ok,
    details,
    fix: fix || null
  };
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value));
}

function normalizeBaseUrl(url) {
  return String(url).replace(/\/+$/, '');
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

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function doctor(flags) {
  const checks = [];

  const nodeVersion = process.versions.node;
  const nodeOk = compareVersions(nodeVersion, '18.0.0') >= 0;
  checks.push(
    makeCheck(
      'node-version',
      nodeOk,
      `Detected Node.js ${nodeVersion}`,
      nodeOk ? null : 'Upgrade Node.js to v18 or newer.'
    )
  );

  const fetchOk = typeof fetch === 'function';
  checks.push(
    makeCheck(
      'fetch-availability',
      fetchOk,
      fetchOk ? 'Global fetch is available.' : 'Global fetch is not available.',
      fetchOk ? null : 'Use Node.js v18+ where fetch is built in.'
    )
  );

  const cwd = process.cwd();
  const cwdWritable = (() => {
    try {
      fs.accessSync(cwd, fs.constants.W_OK);
      return true;
    } catch (_error) {
      return false;
    }
  })();
  checks.push(
    makeCheck(
      'cwd-writable',
      cwdWritable,
      `Working directory: ${cwd}`,
      cwdWritable ? null : 'Use a directory where you have write permissions.'
    )
  );

  if (flags.config) {
    const configPath = path.resolve(process.cwd(), String(flags.config));
    try {
      const config = loadConfig(configPath);
      checks.push(
        makeCheck(
          'config-validation',
          true,
          `Config valid: ${configPath} (${config.commands.length} commands)`,
          null
        )
      );
    } catch (error) {
      checks.push(
        makeCheck(
          'config-validation',
          false,
          `Config invalid: ${configPath} (${error.message})`,
          'Fix the config schema and re-run doctor.'
        )
      );
    }
  }

  if (flags.spec) {
    const specInput = String(flags.spec);
    try {
      const config = await loadConfigFromOpenApi({
        specInput,
        name: flags.name ? String(flags.name) : undefined,
        version: flags.version ? String(flags.version) : undefined
      });
      checks.push(
        makeCheck(
          'spec-parse',
          true,
          `Spec parsed: ${specInput} (${config.commands.length} commands)`
        )
      );
    } catch (error) {
      checks.push(
        makeCheck(
          'spec-parse',
          false,
          `Spec parse failed: ${specInput} (${error.message})`,
          'Ensure spec is valid OpenAPI 3.x JSON/YAML and accessible.'
        )
      );
    }
  }

  if (flags.url) {
    const baseUrl = String(flags.url);
    const isUrl = isHttpUrl(baseUrl);

    if (!isUrl) {
      checks.push(
        makeCheck(
          'url-format',
          false,
          `URL is not HTTP(S): ${baseUrl}`,
          'Pass a full base URL like https://api.example.com'
        )
      );
    } else {
      checks.push(makeCheck('url-format', true, `Valid HTTP(S) URL: ${baseUrl}`));
      const candidates = buildSpecCandidates(baseUrl);
      let discovered = null;

      for (const candidate of candidates) {
        try {
          const response = await fetchWithTimeout(candidate, 4000);
          if (!response.ok) {
            continue;
          }

          const text = await response.text();
          if (/("openapi"\s*:|^openapi\s*:)/m.test(text)) {
            discovered = candidate;
            break;
          }
        } catch (_error) {
          // continue checking candidates
        }
      }

      checks.push(
        makeCheck(
          'openapi-discovery',
          Boolean(discovered),
          discovered
            ? `Discovered OpenAPI candidate: ${discovered}`
            : `No OpenAPI discovered from ${baseUrl}`,
          discovered ? null : 'Run init anyway to generate starter config, then edit endpoints manually.'
        )
      );
    }
  }

  const ok = checks.every((check) => check.ok);

  console.log(
    JSON.stringify({
      ok,
      command: 'doctor',
      checks,
      next: ok
        ? 'Environment looks good. Run generate or scaffold.'
        : 'Address failed checks and rerun doctor.'
    })
  );
}

module.exports = {
  doctor
};
